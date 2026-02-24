/**
 * 아이콘 카드 클릭 동작 연결
 * - data-url 이 있으면 이동
 * - 없으면 알림
 */
function bindToolIconCard(cardEl, options = {}) {
    if (!cardEl) return;
  
    const titleEl = cardEl.querySelector(".tool-icon-card__title");
    const title =
      options.toolName ||
      cardEl.dataset.toolName ||
      (titleEl && titleEl.textContent.trim()) ||
      "툴";
  
    const url = options.url || cardEl.dataset.url || "#";
    const onClick = options.onClick;
  
    // 텍스트 교체 옵션
    if (options.toolName && titleEl) {
      titleEl.textContent = options.toolName;
      cardEl.dataset.toolName = options.toolName;
    }
  
    if (options.url) {
      cardEl.dataset.url = options.url;
    }
  
    // 중복 바인딩 방지
    if (cardEl.dataset.bound === "true") return;
    cardEl.dataset.bound = "true";
  
    cardEl.addEventListener("click", () => {
      if (typeof onClick === "function") {
        onClick({ title, url, element: cardEl });
        return;
      }
  
      if (url && url !== "#") {
        window.location.href = url;
      } else {
        alert(`${title} 페이지로 이동합니다.`);
      }
    });
  }
  
  /**
   * 현재 페이지에 이미 존재하는 아이콘 카드 초기화
   */
  function initToolIconCards(root = document) {
    const cards = root.querySelectorAll(".tool-icon-card");
    cards.forEach((el) => bindToolIconCard(el));
  }
  
  /**
   * 외부 HTML partial(icon.html) 불러와서 특정 영역에 삽입
   * @param {string} mountSelector - 삽입할 요소 선택자
   * @param {object} options - toolName, url, onClick
   */
  async function loadToolIconCard(mountSelector, options = {}) {
    const mount = document.querySelector(mountSelector);
    if (!mount) {
      console.warn(`마운트 대상 없음: ${mountSelector}`);
      return null;
    }
  
    try {
      const res = await fetch("/common/icon/icon.html");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
  
      const html = await res.text();
      mount.innerHTML = html;
  
      const cardEl = mount.querySelector(".tool-icon-card");
      bindToolIconCard(cardEl, options);
  
      return cardEl;
    } catch (err) {
      console.error("icon.html 불러오기 실패:", err);
      mount.innerHTML = `<p style="color:red;">아이콘 컴포넌트 로드 실패</p>`;
      return null;
    }
  }
  
  /* 전역 노출 */
  window.bindToolIconCard = bindToolIconCard;
  window.initToolIconCards = initToolIconCards;
  window.loadToolIconCard = loadToolIconCard;
  
  /* 자동 초기화 */
  document.addEventListener("DOMContentLoaded", () => {
    initToolIconCards();
  });