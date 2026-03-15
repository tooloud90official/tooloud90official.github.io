import { loadNativeSelect } from "/_common/select/select.js";
import { mountArtworkCardTemplate, renderArtworkCards } from "/artwork/artwork_card/artwork-card.js";

/* =========================
   1) 탭 전환 (타이틀·설명·검색창만)
========================= */
function setTab(tabKey) {
  const searchArea   = document.getElementById("search-area");
  const sectionTitle = document.querySelector(".artwork-section__title");
  const sectionDesc  = document.querySelector(".artwork-section__desc");

  if (searchArea) {
    searchArea.style.display = tabKey === "내 라이브러리" ? "none" : "";
  }

  if (sectionTitle) {
    sectionTitle.textContent =
      tabKey === "내 라이브러리"       ? "📁 내 라이브러리" :
      tabKey === "AI 추천 작업물 보기" ? "🤖 AI 추천 작업물" :
      `📂 ${tabKey}`;
  }

  if (sectionDesc) {
    sectionDesc.textContent =
      tabKey === "내 라이브러리"       ? "내가 저장한 작업물들을 확인해보세요." :
      tabKey === "AI 추천 작업물 보기" ? "AI가 추천하는 작업물을 감상해보세요." :
      `${tabKey} 관련 작업물들을 감상해보세요.`;
  }
}

/* =========================
   2) 초기화
========================= */
document.addEventListener("DOMContentLoaded", async () => {

  // 셀렉트 로드
  await loadNativeSelect({
    target: "#select-root",
    placeholder: "정렬",
    value: "like",
    options: [
      { value: "like", label: "좋아요 순" },
      { value: "new",  label: "최신 순" },
      { value: "view", label: "조회수 순" },
    ],
    onChange(item) {
      console.log("정렬 변경:", item);
    },
  });

  // 검색창 로드
  if (typeof loadSearchBar === "function") {
    loadSearchBar({
      target: "#search-area",
      placeholder: "검색어를 입력하세요",
      onSearch: (keyword) => console.log("검색:", keyword),
    });
  } else {
    console.warn("loadSearchBar가 없습니다. /_common/searchBar/searchBar.js 경로 확인!");
  }

  // 카드 템플릿 마운트
  await mountArtworkCardTemplate();

  // 카드 렌더링
  renderArtworkCards("#artworkGrid", [
    {
      previewSrc: "/media/sample3.pdf",
      avatarSrc:  "/media/profil.png",
      toolIcon:   "https://cdn.brandfetch.io/ideA07K8J2/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1766207012399",
      toolName:   "Adobe Firefly",
      stars:      "★★★★☆",
      toolBrand:  "@AdobeFirefly",
      userName:   "yoon",
      dateText:   "2026년 01월 30일",
      text:       "신년을 맞아 비즈니스 계획을 세워보았습니다. 좋은 레퍼런스가 될 것 같아 여러분께 공유드립니다. 새해 복 많이 받으세요. ^^",
      likeCount:  0,
      commentCount: 0,
      onLike:     (item) => console.log("like", item),
      onComment:  (item) => console.log("comment", item),
      onSave:     (item) => console.log("save", item),
    },
    {
      previewSrc: "/media/sample3.pdf",
      avatarSrc:  "/media/profil.png",
      toolIcon:   "https://cdn.brandfetch.io/ideA07K8J2/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1766207012399",
      toolName:   "Adobe Firefly",
      stars:      "★★★★☆",
      toolBrand:  "@AdobeFirefly",
      userName:   "yoon",
      dateText:   "2026년 01월 30일",
      text:       "신년을 맞아 비즈니스 계획을 세워보았습니다. 좋은 레퍼런스가 될 것 같아 여러분께 공유드립니다. 새해 복 많이 받으세요. ^^",
      likeCount:  0,
      commentCount: 0,
      onLike:     (item) => console.log("like", item),
      onComment:  (item) => console.log("comment", item),
      onSave:     (item) => console.log("save", item),
    },
  ]);
});