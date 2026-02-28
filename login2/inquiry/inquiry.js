import { initFaqItems } from "/_common/drop_down/drop_down.js";

/**
 * html 조각 로드 (상단 배너 / 공용 드롭다운 html 삽입용)
 */
async function includeHTML(targetSelector, filePath) {
  const target = document.querySelector(targetSelector);
  if (!target) throw new Error(`[includeHTML] target not found: ${targetSelector}`);

  const res = await fetch(filePath);
  if (!res.ok) throw new Error(`[includeHTML] failed to load: ${filePath} (${res.status})`);

  const html = await res.text();
  target.insertAdjacentHTML("beforeend", html);
}

/**
 * 드롭다운 컴포넌트 여러 개 삽입 (내용은 컴포넌트 기본값 그대로 사용)
 */
async function appendDropdownItems(targetSelector, count) {
  const target = document.querySelector(targetSelector);
  if (!target) return; // 컨테이너 없으면 스킵

  for (let i = 0; i < count; i++) {
    await includeHTML(targetSelector, "/_common/drop_down/drop_down.html");
  }
}

/**
 * drop_down.html 안의 panel id 중복 방지
 */
function fixPanelIdsIn(containerSelector, prefix) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const items = [...container.querySelectorAll("[data-drop_down], .drop_down")];

  items.forEach((item, index) => {
    const trigger = item.querySelector("[data-faq-trigger]");
    const panel = item.querySelector("[data-faq-panel]");

    if (!trigger || !panel) return;

    const panelId = `${prefix}-panel-${index + 1}`;
    panel.id = panelId;
    trigger.setAttribute("aria-controls", panelId);
  });
}

/**
 * 공용 버튼 컴포넌트 사용
 */
function renderSubmitButton() {
  if (typeof window.loadButton !== "function") {
    console.warn("loadButton not found. /_common/button/button.js 확인");
    return;
  }

  window.loadButton({
    target: "#submitBtn",
    text: "등록하기",
    variant: "primary",
    onClick: () => {
      const message = document.querySelector("#contactMessage")?.value?.trim() ?? "";
      console.log("문의 내용:", message);
      alert("등록하기 버튼 클릭");
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // 1) 상단 배너 불러오기 (inquiry.html과 같은 폴더에 top-banner.html이 있을 때)
    await includeHTML("#top-banner", "/_common/top-banner/top-banner.html");

    // 2) FAQ 섹션 드롭다운 삽입
    await appendDropdownItems("#faqList", 5);

    // 3) 문의한 내용 섹션 드롭다운 삽입
    await appendDropdownItems("#myInquiryList", 2);

    // 4) 패널 id 중복 방지
    fixPanelIdsIn("#faqList", "faq");
    fixPanelIdsIn("#myInquiryList", "myinquiry");

    // 5) 공용 드롭다운 초기화 (네 컴포넌트 함수)
    initFaqItems();

    // 6) 공용 버튼 렌더링
    renderSubmitButton();
  } catch (err) {
    console.error("[inquiry] 초기화 실패:", err);
  }
});