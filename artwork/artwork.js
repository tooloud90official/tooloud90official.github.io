import { loadNativeSelect } from "/_common/select/select.js";
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

let ALL_WORKS = [];
let currentUser = null;
let currentSort = "like";
let currentTab = "이미지·오디오·영상";

/* =========================
   2) 로그인 필수 체크
========================= */
async function requireLogin() {
  const supabase = window._supabase;

  if (!supabase) {
    window.location.href = "/login1/login1.html";
    return false;
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.user) {
    window.location.href = "/login1/login1.html";
    return false;
  }

  return true;
}

/* =========================
   3) 현재 유저 정보 로드
========================= */
async function loadUser() {
  const supabase = window._supabase;

  if (!supabase) {
    currentUser = null;
    return;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user) {
    currentUser = { id: session.user.id };
  } else {
    currentUser = null;
  }
}

/* =========================
   4) 섹션 텍스트 갱신
========================= */
function updateSectionText(tabKey) {
  const sectionTitle = document.querySelector(".artwork-section__title");
  const sectionDesc = document.querySelector(".artwork-section__desc");
  const searchArea = document.getElementById("search-area");

  if (sectionTitle) {
    sectionTitle.textContent =
      tabKey === "내 라이브러리"
        ? "📁 내 라이브러리"
        : tabKey === "AI 추천 작업물"
        ? "🤖 AI 추천 작업물"
        : `📂 ${tabKey}`;
  }

  if (sectionDesc) {
    sectionDesc.textContent =
      tabKey === "내 라이브러리"
        ? "내가 저장한 작업물들을 확인해보세요."
        : tabKey === "AI 추천 작업물"
        ? "AI가 추천하는 작업물을 감상해보세요."
        : `${tabKey} 관련 작업물들을 감상해보세요.`;
  }

  if (searchArea) {
    searchArea.style.display = tabKey === "내 라이브러리" ? "none" : "";
  }
}

/* =========================
   5) 탭 변경
========================= */
function setTab(tabKey, options = {}) {
  if (!tabKey) return;

  const { updateUrl = false } = options;

  if (tabKey === "작업물 올리기") {
    window.location.href = "/artwork/artwork_upload/artwork_upload.html";
    return;
  }

  currentTab = tabKey;
  updateSectionText(tabKey);

  if (updateUrl) {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tabKey);
    history.pushState({ tab: tabKey }, "", url.pathname + url.search);
  }

  renderWorks();
}

/* =========================
   6) 정렬 + 필터
========================= */
function getSortedWorks() {
  let filtered = [...ALL_WORKS];

  if (currentTab === "내 라이브러리") {
    filtered = filtered.filter((w) => w.user_id === currentUser?.id);
  } else if (CATEGORY_MAP[currentTab]) {
    const targetCat = CATEGORY_MAP[currentTab];
    filtered = filtered.filter((w) => w.tool_cat === targetCat);
  }

  if (currentSort === "like") {
    filtered.sort((a, b) => (b.like_count ?? 0) - (a.like_count ?? 0));
  } else if (currentSort === "new") {
    filtered.sort(
      (a, b) => new Date(b.updated_at ?? 0) - new Date(a.updated_at ?? 0)
    );
  }

  return filtered;
}

/* =========================
   7) 카드 렌더
========================= */
function renderWorks() {
  const works = getSortedWorks();
  const grid = document.querySelector("#artworkGrid");

  if (!grid) return;

  if (!works.length) {
    grid.innerHTML = `<div class="empty-msg">표시할 작업물이 없습니다.</div>`;
    return;
  }

  renderArtworkCards(
    "#artworkGrid",
    works.map((w) => ({
      id: w.work_id,
      work_id: w.work_id,
      work_title: w.work_title,

      previewSrc: w.previewSrc
        ? w.previewSrc
        : w.work_path
        ? `${window._supabaseUrl}/storage/v1/object/public/works/${w.work_path}`
        : null,

      user_name: w.user_name,
      user_img: w.user_img,

      tool_name: w.tool_name,
      tool_id: w.tool_id,
      icon: w.tool_icon,

      dateText: w.updated_at
        ? new Date(w.updated_at).toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })
        : "",

      like_count: w.like_count ?? 0,
      comment_count: w.comment_count ?? 0,
    }))
  );
}

/* =========================
   8) URL에서 탭 읽기
========================= */
function initFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get("tab") || "이미지·오디오·영상";
  setTab(tab);
}

/* =========================
   9) 상단 배너 링크 클릭 처리
========================= */
function bindTopBannerArtworkLinks() {
  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href*="/artwork/artwork.html"]');
    if (!link) return;

    const href = link.getAttribute("href");
    if (!href) return;

    const url = new URL(href, window.location.origin);
    const tab = url.searchParams.get("tab");
    if (!tab) return;

    const isArtworkPage =
      window.location.pathname === "/artwork/artwork.html" ||
      window.location.pathname.endsWith("/artwork/artwork.html");

    if (isArtworkPage) {
      e.preventDefault();
      setTab(tab, { updateUrl: true });
    }
  });
}

/* =========================
   10) 브라우저 뒤로가기/앞으로가기
========================= */
function bindPopState() {
  window.addEventListener("popstate", () => {
    initFromUrl();
  });
}

/* =========================
   11) 정렬 select
========================= */
function initSortSelect() {
  const selectRoot = document.getElementById("select-root");
  if (!selectRoot || typeof loadNativeSelect !== "function") return;

  loadNativeSelect({
    mountEl: selectRoot,
    name: "artwork-sort",
    options: [
      { value: "like", label: "좋아요순" },
      { value: "new", label: "최신순" },
    ],
    value: currentSort,
    onChange: (value) => {
      currentSort = value;
      renderWorks();
    },
  });
}

/* =========================
   12) 시작
========================= */
document.addEventListener("DOMContentLoaded", async () => {
  const ok = await requireLogin();
  if (!ok) return;

  await loadUser();
  await mountArtworkCardTemplate();

  bindTopBannerArtworkLinks();
  bindPopState();
  initSortSelect();

  /* ⭐ 테스트용 샘플 데이터 */
  ALL_WORKS = [
    {
      work_id: "sample_pdf",
      work_title: "PDF 미리보기 테스트",
      previewSrc: "/media/sample3.pdf",

      user_id: "test_user_1",
      user_name: "테스트유저",
      user_img: "/media/profil.png",

      tool_name: "Test Tool",
      tool_id: "tool_001",
      tool_icon: "/media/tool-default.png",

      tool_cat: "media",

      like_count: 4,
      comment_count: 2,

      updated_at: new Date().toISOString(),
    },
    {
      work_id: "sample_img_1",
      work_title: "리서치 작업물 테스트",
      previewSrc: "/media/sample.jpg",

      user_id: "test_user_2",
      user_name: "초코",
      user_img: "/media/profil.png",

      tool_name: "Research Tool",
      tool_id: "tool_002",
      tool_icon: "/media/tool-default.png",

      tool_cat: "res",

      like_count: 8,
      comment_count: 1,

      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
      work_id: "sample_img_2",
      work_title: "개발 작업물 테스트",
      previewSrc: "/media/sample2.jpg",

      user_id: currentUser?.id ?? "test_user_3",
      user_name: "나",
      user_img: "/media/profil.png",

      tool_name: "Dev Tool",
      tool_id: "tool_003",
      tool_icon: "/media/tool-default.png",

      tool_cat: "dev",

      like_count: 2,
      comment_count: 0,

      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
  ];

  initFromUrl();
});