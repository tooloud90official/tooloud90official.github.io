import { loadNativeSelect } from "/_common/select/select.js";
import { mountArtworkCardTemplate, renderArtworkCards } from "/artwork/artwork_card/artwork-card.js";

// 1. 매핑 테이블 (DB의 영어 값과 화면의 한글 이름 연결)
const CATEGORY_MAP = {
  "이미지·오디오·영상": "media",
  "리서치":             "res",
  "문서 생성·요약·편집": "doc",
  "개발·코딩":          "dev",
  "학습·교육":          "edu",
  "챗봇·어시스턴트":    "ast",
};

let ALL_WORKS = [];
let currentUser = null; 
let currentSort = "like";
let currentTab  = "이미지·오디오·영상";

/* =========================
   1) 현재 유저 정보 로드
========================= */
async function loadUser() {
  const supabase = window._supabase;
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    currentUser = { id: session.user.id };
  }
}

/* =========================
   2) 탭 전환 로직
========================= */
function setTab(tabKey) {
  if (!tabKey) return;

  if (tabKey === "작업물 올리기") {
    window.location.href = "/artwork/artwork_upload/artwork_upload.html"; 
    return;
  }

  currentTab = tabKey;
  
  // UI 텍스트 변경
  const sectionTitle = document.querySelector(".artwork-section__title");
  const sectionDesc  = document.querySelector(".artwork-section__desc");
  const searchArea   = document.getElementById("search-area");

  if (sectionTitle) {
    sectionTitle.textContent =
      tabKey === "내 라이브러리"       ? "📁 내 라이브러리" :
      tabKey === "AI 추천 작업물"      ? "🤖 AI 추천 작업물" :
      `📂 ${tabKey}`;
  }

  if (sectionDesc) {
    sectionDesc.textContent =
      tabKey === "내 라이브러리"       ? "내가 저장한 작업물들을 확인해보세요." :
      tabKey === "AI 추천 작업물"      ? "AI가 추천하는 작업물을 감상해보세요." :
      `${tabKey} 관련 작업물들을 감상해보세요.`;
  }

  if (searchArea) {
    searchArea.style.display = tabKey === "내 라이브러리" ? "none" : "";
  }

  renderWorks(); 
}

/* =========================
   3) 필터링 및 렌더링
========================= */
function getSortedWorks() {
  let filtered = [...ALL_WORKS];

  if (currentTab === "내 라이브러리") {
    filtered = filtered.filter(w => w.user_id === currentUser?.id);
  } 
  else if (CATEGORY_MAP[currentTab]) {
    const targetCat = CATEGORY_MAP[currentTab];
    filtered = filtered.filter(w => w.tool_cat === targetCat);
  }

  if (currentSort === "like") {
    filtered.sort((a, b) => (b.like_count ?? 0) - (a.like_count ?? 0));
  } else if (currentSort === "new") {
    filtered.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }

  return filtered;
}

function renderWorks() {
  const works = getSortedWorks();
  const grid = document.querySelector("#artworkGrid");
  
  if (!grid) return;
  if (!works.length) {
    grid.innerHTML = `<div class="empty-msg">표시할 작업물이 없습니다.</div>`;
    return;
  }

  renderArtworkCards("#artworkGrid", works.map(w => ({
    id:           w.work_id,
    work_id:      w.work_id,
    work_title:   w.work_title,
    previewSrc:   w.work_path
      ? `${window._supabaseUrl}/storage/v1/object/public/works/${w.work_path}`
      : null,
    user_name:    w.user_name,
    user_img:     w.user_img,
    tool_name:    w.tool_name,
    tool_id:      w.tool_id,
    icon:         w.tool_icon,
    dateText:     w.updated_at
      ? new Date(w.updated_at).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })
      : "",
    like_count:    w.like_count    ?? 0,
    comment_count: w.comment_count ?? 0,
  })));
}

async function loadWorks() {
  const supabase = window._supabase;
  const { data: works, error } = await supabase.from("works").select("*");

  if (error || !works) return;

  const userIds = [...new Set(works.map(w => w.user_id).filter(Boolean))];
  const toolIds = [...new Set(works.map(w => w.tool_id).filter(Boolean))];

  const [{ data: users }, { data: tools }] = await Promise.all([
    supabase.from("users").select("user_id, user_name, user_img").in("user_id", userIds),
    supabase.from("tools").select("tool_ID, tool_name, icon").in("tool_ID", toolIds),
  ]);

  const userMap = Object.fromEntries((users || []).map(u => [u.user_id, u]));
  const toolMap = Object.fromEntries((tools || []).map(t => [t.tool_ID, t]));

  ALL_WORKS = works.map(w => ({
    ...w,
    user_name: userMap[w.user_id]?.user_name ?? "unknown",
    user_img:  userMap[w.user_id]?.user_img  ?? "/media/profil.png",
    tool_name: toolMap[w.tool_id]?.tool_name ?? "",
    tool_icon: toolMap[w.tool_id]?.icon      ?? "",
  }));

  renderWorks();
}

/* =========================
   4) 실시간 URL 감지 및 초기화 (핵심!)
========================= */
function initFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get("tab") || "이미지·오디오·영상";
  setTab(tab);
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadUser();
  await mountArtworkCardTemplate();
  await loadWorks();

  // 1. 처음 들어왔을 때 URL 확인
  initFromUrl();

  // ✅ 2. 주소창의 파라미터가 바뀔 때 화면 갱신 (뒤로가기 포함)
  window.addEventListener("popstate", initFromUrl);

  // 사이드바 클릭 이벤트
  document.querySelectorAll(".sidebar-menu-item").forEach(item => {
    item.addEventListener("click", () => setTab(item.textContent.trim()));
  });

  await loadNativeSelect({
    target: "#select-root",
    placeholder: "정렬",
    value: "like",
    options: [{ value: "like", label: "좋아요 순" }, { value: "new", label: "최신 순" }],
    onChange(item) { currentSort = item.value; renderWorks(); },
  });
});