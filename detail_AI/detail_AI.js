import { JeonubSelect } from "/common/select/select.js"; 

document.addEventListener("DOMContentLoaded", async () => {
    // 1) 아이콘: /common/icon/icon.html 불러와 mount에 삽입
    //    네 icon.js 방식 그대로: loadToolIconCard(selector, options)
    await window.loadToolIconCard("#toolIconMount", {
      toolName: "Midjourney",
      url: "https://www.midjourney.com/" // 필요 없으면 지워도 됨
    });
  
    // 2) 버튼: /common/button/button.html 불러와 target에 삽입
    //    네 button.js 방식 그대로: loadButton({ target, text, variant, onClick })
    await window.loadButton({
      target: "#visitSiteBtn",
      text: "사이트 바로가기",
      variant: "primary",
      onClick: () => {
        window.open("https://www.midjourney.com/", "_blank");
      }
    });
  
    await window.loadButton({
      target: "#wishlistBtn",
      text: "관심 목록에 추가",
      variant: "outline",
      onClick: () => {
        alert("관심 목록에 추가!");
      }
    });
  });

  // ===== 사이트 미리보기 섹션 값 세팅(선택) =====
function setSitePreview({ name, url } = {}) {
    const nameEl = document.getElementById("sitePreviewName");
    const urlEl = document.getElementById("sitePreviewUrl");
  
    if (nameEl && name) nameEl.textContent = name;
  
    if (urlEl && url) {
      urlEl.textContent = url;
      urlEl.href = url;
    }
  }
  
  // 예시: 페이지 로드시 세팅
  document.addEventListener("DOMContentLoaded", () => {
    setSitePreview({
      name: "Midjourney",
      url: "https://www.midjourney.com/"
    });
  });

  document.addEventListener("DOMContentLoaded", async () => {
    // 플랜 버튼들
    await window.loadButton({
      target: "#planBtn1",
      text: "사이트 바로가기",
      variant: "outline",
      onClick: () => window.open("https://www.midjourney.com/", "_blank")
    });
  
    await window.loadButton({
      target: "#planBtn2",
      text: "사이트 바로가기",
      variant: "primary",
      onClick: () => window.open("https://www.midjourney.com/", "_blank")
    });
  
    await window.loadButton({
      target: "#planBtn3",
      text: "사이트 바로가기",
      variant: "primary",
      onClick: () => window.open("https://www.midjourney.com/", "_blank")
    });
  
    // 프로모션 버튼
    await window.loadButton({
      target: "#promoBtn",
      text: "사이트 바로가기",
      variant: "outline",
      onClick: () => window.open("https://www.midjourney.com/", "_blank")
    });

    await window.loadButton({
        target: "#reviewSubmitBtn",
        text: "등록",
        variant: "primary", // 파란 버튼
        onClick: () => {
          alert("로그인 후 작성하실 수 있습니다.");
        }
      });

    // 최신순 셀렉트 HTML 삽입
const mount = document.querySelector("#reviewSortSelect");
if (mount) {
  mount.innerHTML = `
    <div class="select" data-review-sort-select>
      <button
        type="button"
        class="select__trigger"
        data-select-trigger
        aria-haspopup="listbox"
        aria-expanded="false"
        aria-controls="select-list-review-sort"
      >
        <span class="select__value" data-select-value>최신순</span>
        <span class="select__icon" aria-hidden="true">
          <svg class="select__chevron" viewBox="0 0 24 24">
            <path d="M6 9l6 6 6-6Z" fill="currentColor"></path>
          </svg>
        </span>
      </button>

      <div class="select__menu-wrap" data-select-menu-wrap>
        <ul
          id="select-list-review-sort"
          class="select__menu"
          data-select-menu
          role="listbox"
          tabindex="-1"
          aria-hidden="true"
        ></ul>
      </div>
    </div>
  `;

  // 초기화
  const sortSelect = new JeonubSelect("[data-review-sort-select]", {
    placeholder: "최신순",
    items: [
      { label: "최신순", value: "new" },
      { label: "평점 높은순", value: "high" },
      { label: "평점 낮은순", value: "low" }
    ],
    onChange: (item) => {
      console.log("정렬 선택:", item);
      // TODO: 여기서 리뷰 정렬 로직 연결하면 됨
    }
  });
}
  });

  document.addEventListener("DOMContentLoaded", async () => {
    // 유사 툴 4개 (원하는대로 바꿔)
    await window.loadToolIconCard("#simTool1", {
      toolName: "Pitch",
      url: "https://pitch.com/"
    });
  
    await window.loadToolIconCard("#simTool2", {
      toolName: "Canva",
      url: "https://www.canva.com/"
    });
  
    await window.loadToolIconCard("#simTool3", {
      toolName: "Gemini",
      url: "https://gemini.google.com/"
    });
  
    await window.loadToolIconCard("#simTool4", {
      toolName: "Gamma AI",
      url: "https://gamma.app/"
    });
  });
  

  