import { loadNativeSelect } from "/_common/select/select.js";
import { searchCategories } from "/_ignore/groq.js"; // ✅ Groq
import {
  mountArtworkCardTemplate,
  renderArtworkCards,
} from "/artwork/artwork_card/artwork-card.js";

/* =========================
   1) 카테고리 매핑
========================= */
const CATEGORY_MAP = {
  "이미지·오디오·영상": "media",
  "리서치": "res",
  "문서 생성·요약·편집": "doc",
  "개발·코딩": "dev",
  "학습·교육": "edu",
  "챗봇·어시스턴트": "ast",
};

const CATEGORY_OPTIONS = [
  { value: "좋아요 많은 작업물", label: "전체" },
  { value: "이미지·오디오·영상", label: "이미지·오디오·영상" },
  { value: "리서치",              label: "리서치" },
  { value: "문서 생성·요약·편집", label: "문서 생성·요약·편집" },
  { value: "개발·코딩",           label: "개발·코딩" },
  { value: "학습·교육",           label: "학습·교육" },
  { value: "챗봇·어시스턴트",     label: "챗봇·어시스턴트" },
];

let ALL_WORKS = [];
let currentUser = null;
let currentSort = "like";
let currentTab = "좋아요 많은 작업물";
let currentKeyword = ""; // ✅ 검색어 상태

// ✅ 검색 필터 상태
let searchFilter = {
  cats: [],
  subcats: [],
  keywords: [],
  active: false,
};

/* =========================
   2) 로그인 필수 체크
========================= */
async function requireLogin() {
  const supabase = window._supabase;
  if (!supabase) { window.location.href = "/login1/login1.html"; return false; }
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.user) { window.location.href = "/login1/login1.html"; return false; }
  return true;
}

/* =========================
   3) 현재 유저 정보 로드
========================= */
async function loadUser() {
  const supabase = window._supabase;
  if (!supabase) { currentUser = null; return; }
  const { data: { session } } = await supabase.auth.getSession();
  currentUser = session?.user ? { id: session.user.id } : null;
}

/* =========================
   4) works + users + tools + tool_reviews 조회
========================= */
async function loadWorks() {
  const supabase = window._supabase;
  if (!supabase) { ALL_WORKS = []; return; }

  const { data: worksData, error: worksError } = await supabase
    .from("works")
    .select(`work_id, work_title, work_path, work_link, user_id, tool_id, tool_cat, like_count, comment_count, updated_at`);

  if (worksError) { console.error("works 불러오기 실패:", worksError); ALL_WORKS = []; return; }

  const works   = Array.isArray(worksData) ? worksData : [];
  const userIds = [...new Set(works.map((w) => w.user_id).filter(Boolean))];
  const toolIds = [...new Set(works.map((w) => w.tool_id).filter(Boolean))];

  let usersMap = {}, toolsMap = {}, ratingsMap = {};

  if (userIds.length) {
    const { data: usersData } = await supabase.from("users").select("user_id, user_name, user_img").in("user_id", userIds);
    usersMap = Object.fromEntries((usersData || []).map((u) => [String(u.user_id), u]));
  }

  if (toolIds.length) {
    // ✅ tool_subcat 추가
    const { data: toolsData } = await supabase
      .from("tools")
      .select("tool_ID, tool_name, tool_company, tool_cat, tool_subcat, icon")
      .in("tool_ID", toolIds);
    toolsMap = Object.fromEntries((toolsData || []).map((t) => [String(t.tool_ID), t]));
  }

  if (toolIds.length) {
    const { data: reviewsData } = await supabase.from("tool_reviews").select("tool_id, rating").in("tool_id", toolIds);
    const grouped = {};
    (reviewsData || []).forEach((row) => {
      const key    = String(row.tool_id);
      const rating = Number(row.rating);
      if (!grouped[key]) grouped[key] = { sum: 0, count: 0 };
      if (!Number.isNaN(rating)) { grouped[key].sum += rating; grouped[key].count += 1; }
    });
    ratingsMap = Object.fromEntries(
      Object.entries(grouped).map(([toolId, info]) => [toolId, info.count ? Number((info.sum / info.count).toFixed(1)) : 0])
    );
  }

  ALL_WORKS = works.map((w) => {
    const tool      = toolsMap[String(w.tool_id)] || null;
    const avgRating = ratingsMap[String(w.tool_id)] ?? 0;
    return {
      ...w,
      users: usersMap[String(w.user_id)] || null,
      tools: tool ? { ...tool, avg_rating: avgRating } : null,
    };
  });
}

/* =========================
   5) 섹션 텍스트 갱신
========================= */
function updateSectionText(tabKey, keyword = "") {
  const sectionTitle = document.querySelector(".artwork-section__title");
  const sectionDesc  = document.querySelector(".artwork-section__desc");
  const searchArea   = document.getElementById("search-area");

  // ✅ 검색 중이면 검색 결과 텍스트로
  if (keyword) {
    if (sectionTitle) sectionTitle.textContent = `🔍 "${keyword}" 검색 결과`;
    if (sectionDesc)  sectionDesc.textContent  = `"${keyword}" 와 관련된 작업물들을 감상해보세요.`;
    if (searchArea)   searchArea.style.display  = "";
    return;
  }

  if (sectionTitle) {
    sectionTitle.textContent =
      tabKey === "좋아요 많은 작업물" ? "💙 좋아요 많은 작업물"
      : tabKey === "내 라이브러리"    ? "📁 내 라이브러리"
      : tabKey === "AI 추천 작업물"   ? "🤖 AI 추천 작업물"
      : `📂 ${tabKey}`;
  }

  if (sectionDesc) {
    sectionDesc.textContent =
      tabKey === "좋아요 많은 작업물" ? "지금 인기있는 전체 작업물들을 감상해보세요."
      : tabKey === "내 라이브러리"    ? "내가 저장한 작업물들을 확인해보세요."
      : tabKey === "AI 추천 작업물"   ? "AI가 추천하는 작업물을 감상해보세요."
      : `${tabKey} 관련 작업물들을 감상해보세요.`;
  }

  if (searchArea) searchArea.style.display = tabKey === "내 라이브러리" ? "none" : "";
}

/* =========================
   6) 탭 변경
========================= */
function setTab(tabKey, options = {}) {
  if (!tabKey) return;
  const { updateUrl = false } = options;

  if (tabKey === "작업물 올리기") {
    window.location.href = "/artwork/artwork_upload/artwork_upload.html";
    return;
  }

  currentTab     = tabKey;
  currentKeyword = "";

  // ✅ 탭 바꾸면 검색 필터 초기화
  searchFilter = { cats: [], subcats: [], keywords: [], active: false };

  updateSectionText(tabKey, "");

  if (updateUrl) {
    const url = new URL(window.location.href);
    if (tabKey === "좋아요 많은 작업물") url.searchParams.delete("tab");
    else url.searchParams.set("tab", tabKey);
    history.pushState({ tab: tabKey }, "", url.pathname + url.search);
  }

  renderWorks();
}

/* =========================
   7) 정렬 + 필터
========================= */
function getSortedWorks() {
  let filtered = [...ALL_WORKS];

  // 탭 필터 (검색 중이 아닐 때만)
  if (!searchFilter.active) {
    if (currentTab === "내 라이브러리") {
      filtered = filtered.filter((w) => String(w.user_id) === String(currentUser?.id));
    } else if (CATEGORY_MAP[currentTab]) {
      filtered = filtered.filter((w) => w.tool_cat === CATEGORY_MAP[currentTab]);
    }
  }

  // ✅ Groq 검색 필터
  if (searchFilter.active) {
    filtered = filtered.filter((w) => {
      const toolCat    = w.tools?.tool_cat    ?? w.tool_cat ?? "";
      const toolSubcat = w.tools?.tool_subcat ?? "";
      const title      = (w.work_title ?? "").toLowerCase();

      const catMatch    = searchFilter.cats.includes(toolCat);
      const subcatMatch = searchFilter.subcats.includes(toolSubcat);
      const keyMatch    = searchFilter.keywords.some((kw) => title.includes(kw.toLowerCase()));

      return catMatch || subcatMatch || keyMatch;
    });
  }

  // 정렬
  if (currentSort === "like") {
    filtered.sort((a, b) => (b.like_count ?? 0) - (a.like_count ?? 0));
  } else if (currentSort === "new") {
    filtered.sort((a, b) => new Date(b.updated_at ?? 0) - new Date(a.updated_at ?? 0));
  }

  return filtered;
}

/* =========================
   8) 카드 렌더
========================= */
function renderWorks() {
  const works = getSortedWorks();
  const grid  = document.querySelector("#artworkGrid");
  if (!grid) return;

  if (!works.length) {
    grid.innerHTML = `<div class="empty-msg">${
      searchFilter.active ? `"${currentKeyword}" 검색 결과가 없습니다.` : "표시할 작업물이 없습니다."
    }</div>`;
    return;
  }

  renderArtworkCards(
    "#artworkGrid",
    works.map((w) => ({
      id:           w.work_id,
      work_id:      w.work_id,
      work_title:   w.work_title,
      previewSrc:   w.work_link || null,
      user_name:    w.users?.user_name    ?? "작성자",
      user_img:     w.users?.user_img     ?? "/media/profil.png",
      tool_name:    w.tools?.tool_name    ?? "툴 정보 없음",
      tool_brand:   w.tools?.tool_company ?? "",
      tool_stars:   w.tools?.avg_rating   ?? 0,
      tool_id:      w.tool_id,
      icon:         w.tools?.icon         ?? "/media/tool-default.png",
      dateText:     w.updated_at
        ? new Date(w.updated_at).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })
        : "",
      like_count:    w.like_count    ?? 0,
      comment_count: w.comment_count ?? 0,
    }))
  );
}

/* =========================
   9) URL에서 탭 읽기
========================= */
function initFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get("tab") || "좋아요 많은 작업물";
  setTab(tab);
}

/* =========================
   10) 상단 배너 링크 클릭 처리
========================= */
function bindTopBannerArtworkLinks() {
  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href*="/artwork/artwork.html"]');
    if (!link) return;
    const href = link.getAttribute("href");
    if (!href) return;
    const url = new URL(href, window.location.origin);
    const tab = url.searchParams.get("tab");
    const isArtworkPage = window.location.pathname === "/artwork/artwork.html" || window.location.pathname.endsWith("/artwork/artwork.html");
    if (isArtworkPage) {
      e.preventDefault();
      setTab(tab || "좋아요 많은 작업물", { updateUrl: true });
    }
  });
}

/* =========================
   11) 브라우저 뒤로가기/앞으로가기
========================= */
function bindPopState() {
  window.addEventListener("popstate", () => { initFromUrl(); });
}

/* =========================
   12) 정렬 select
========================= */
function initSortSelect() {
  const selectRoot = document.getElementById("select-root");
  if (!selectRoot || typeof loadNativeSelect !== "function") return;

  loadNativeSelect({
    target: "#select-root",
    options: [
      { value: "like", label: "좋아요순" },
      { value: "new",  label: "최신순"   },
    ],
    value: currentSort,
    onChange: (item) => {
      currentSort = item?.value ?? "like";
      renderWorks();
    },
  });
}

/* =========================
   13) 카테고리 select
========================= */
function initCategorySelect() {
  const mountEl = document.getElementById("category-select");
  if (!mountEl || typeof loadNativeSelect !== "function") return;

  loadNativeSelect({
    target: "#category-select",
    options: CATEGORY_OPTIONS,
    value: currentTab,
    placeholder: "카테고리 선택",
    onChange: (item) => {
      setTab(item?.value ?? "좋아요 많은 작업물", { updateUrl: true });
    },
  });
}

/* =========================
   ✅ 14) 검색바 — Groq 자연어 처리
========================= */
function initSearchBar() {
  if (typeof loadSearchBar !== "function") {
    console.warn("[searchBar] loadSearchBar 함수 없음");
    return;
  }

  loadSearchBar({
    target: "#search-area",
    placeholder: "작업물을 자연어로 검색해보세요",
    onSearch: async (value) => {
      const keyword = value?.trim() ?? "";

      // 검색어 없으면 초기화
      if (!keyword) {
        currentKeyword = "";
        searchFilter   = { cats: [], subcats: [], keywords: [], active: false };
        updateSectionText(currentTab, "");
        renderWorks();
        return;
      }

      currentKeyword = keyword;

      // ✅ 로딩 표시
      const grid = document.querySelector("#artworkGrid");
      if (grid) grid.innerHTML = `<div class="empty-msg">🤖 AI가 검색 결과를 분석 중입니다...</div>`;
      updateSectionText(currentTab, keyword);

      // ✅ Groq 호출
      const groqResult = await searchCategories(keyword);
      console.log("[groq] 검색 결과:", groqResult);

      searchFilter = {
        cats:     groqResult?.recommended_cats    ?? [],
        subcats:  groqResult?.recommended_subcats ?? [],
        keywords: groqResult?.keywords            ?? [],
        active:   true,
      };

      renderWorks();
    },
  });
}

/* =========================
   15) 시작
========================= */
document.addEventListener("DOMContentLoaded", async () => {
  const ok = await requireLogin();
  if (!ok) return;

  await loadUser();
  await mountArtworkCardTemplate();
  await loadWorks();

  bindTopBannerArtworkLinks();
  bindPopState();
  initSortSelect();
  initCategorySelect();
  initSearchBar(); // ✅ Groq 검색바
  initFromUrl();
});