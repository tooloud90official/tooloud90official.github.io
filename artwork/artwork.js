import { JeonubSelect } from "/common/select/select.js";
import { mountArtworkCardTemplate, renderArtworkCards } from "/yujin/js/artwork-card.js";
/* =========================
   1) 사이드바 토글
========================= */
console.count("renderArtworkCards called");
const fab = document.getElementById("artworkFab");
const sidebar = document.getElementById("artworkSidebar");
const shell = document.getElementById("artworkShell");
const dim = document.getElementById("artworkDim");

function openSidebar(){
  sidebar.classList.add("is-open");
  shell.classList.add("is-shift");
  dim.classList.add("is-on");

  sidebar.setAttribute("aria-hidden", "false");
  fab.setAttribute("aria-expanded", "true");
  fab.classList.add("is-hidden");   // ✅ 추가
}

function closeSidebar(){
  sidebar.classList.remove("is-open");
  shell.classList.remove("is-shift");
  dim.classList.remove("is-on");

  sidebar.setAttribute("aria-hidden", "true");
  fab.setAttribute("aria-expanded", "false");

  fab.classList.remove("is-hidden"); // ✅ 추가
}

function toggleSidebar(){
  const isOpen = sidebar.classList.contains("is-open");
  if (isOpen) closeSidebar();
  else openSidebar();
}

fab.addEventListener("click", toggleSidebar);
dim.addEventListener("click", closeSidebar);

/* ESC로 닫기 */
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeSidebar();
});

/* =========================
   2) Select 컴포넌트 (샘플 방식 그대로)
========================= */
document.querySelector("#select-root").innerHTML = `
  <div class="select" data-select>
    <button
      type="button"
      class="select__trigger"
      data-select-trigger
      aria-haspopup="listbox"
      aria-expanded="false"
      aria-controls="select-list-artwork"
    >
      <span class="select__value" data-select-value>좋아요 순</span>
      <span class="select__icon" aria-hidden="true">
        <svg class="select__chevron" viewBox="0 0 24 24">
          <path d="M6 9l6 6 6-6Z" fill="currentColor"></path>
        </svg>
      </span>
    </button>

    <div class="select__menu-wrap" data-select-menu-wrap>
      <ul
        id="select-list-artwork"
        class="select__menu"
        data-select-menu
        role="listbox"
        tabindex="-1"
        aria-hidden="true"
      ></ul>
    </div>
  </div>
`;

/* 초기화 */
const select = new JeonubSelect("[data-select]", {
  placeholder: "좋아요 순",
  items: [
    { label: "좋아요 순", value: "like" },
    { label: "최신 순", value: "new" },
    { label: "조회수 순", value: "view" },
  ],
  onChange: (item) => {
    console.log("정렬 변경:", item);
    // TODO: 여기서 정렬 로직/Firestore 쿼리 등 붙이면 됨
  }
});

/* 필요시 옵션 교체 예시
select.setOptions([
  { label: "좋아요 순", value: "like" },
  { label: "최신 순", value: "new" },
  { label: "조회수 순", value: "view" },
]);
*/

// ✅ 공용 SearchBar 마운트
if (typeof loadSearchBar === "function") {
    loadSearchBar({
      target: "#search-area",
      placeholder: "검색어를 입력하세요",
      onSearch: (keyword) => {
        console.log("검색:", keyword);
        // TODO: 여기서 작업물 필터링/Firestore 쿼리 연결하면 됨
      },
    });
  } else {
    console.warn("loadSearchBar가 없습니다. /common/searchBar/searchBar.js 경로 확인!");
  }

  await mountArtworkCardTemplate();

renderArtworkCards("#artworkGrid", [
  {
    imageSrc: "/yujin/img/sample-work.jpg",
    avatarSrc: "/yujin/img/sample-avatar.jpg",
    toolName: "Adobe Firefly",
    stars: "★★★★☆",
    userName: "yoon",
    dateText: "2026년 01월 30일",
    text: "신년을 맞아 비즈니스 계획을 세워보았습니다. 좋은 레퍼런스가 될 것 같아 여러분께 공유드립니다. 새해 복 많이 받으세요. ^^",
    onLike: (item) => console.log("like", item),
    onComment: (item) => console.log("comment", item),
    onSave: (item) => console.log("save", item),
  },
  // 필요한 만큼 추가
]);