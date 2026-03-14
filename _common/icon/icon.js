/**
 * 제목을 무조건 1줄로 유지하면서
 * 넘치면 폰트 크기를 자동 축소
 * - 기본 14px
 * - 최소 8px
 * - 그래도 넘치면 ellipsis(...)
 */
function fitToolIconTitle(titleEl, options = {}) {
  if (!titleEl) return;

  const maxFontSize = options.maxFontSize ?? 14;
  const minFontSize = options.minFontSize ?? 8;
  const step = options.step ?? 0.5;

  let currentSize = maxFontSize;

  titleEl.style.fontSize = `${currentSize}px`;
  titleEl.style.whiteSpace = "nowrap";
  titleEl.style.overflow = "hidden";
  titleEl.style.textOverflow = "ellipsis";

  while (titleEl.scrollWidth > titleEl.clientWidth && currentSize > minFontSize) {
    currentSize -= step;
    titleEl.style.fontSize = `${currentSize}px`;
  }
}

/**
 * 특정 루트 안의 모든 아이콘 제목 자동 맞춤
 */
function fitAllToolIconTitles(root = document) {
  const titles = root.querySelectorAll(".tool-icon-card__title");
  titles.forEach((titleEl) => fitToolIconTitle(titleEl));
}

/**
 * 특정 카드에 아이콘 이미지 반영
 */
function applyToolIconImage(cardEl, iconUrl) {
  if (!cardEl) return;

  const iconEl = cardEl.querySelector(".tool-icon-card__icon");
  if (!iconEl) return;

  if (iconUrl && typeof iconUrl === "string" && iconUrl.trim()) {
    iconEl.style.backgroundImage = `url("${iconUrl}")`;
  }
}

/**
 * 아이콘 카드 클릭 동작 연결
 */
function bindToolIconCard(cardEl, options = {}) {
  if (!cardEl) return;

  const titleEl = cardEl.querySelector(".tool-icon-card__title");

  if (options.toolName && titleEl) {
    titleEl.textContent = options.toolName;
    cardEl.dataset.toolName = options.toolName;
  }

  if (options.url) {
    cardEl.dataset.url = options.url;
  }

  if (options.iconUrl) {
    cardEl.dataset.iconUrl = options.iconUrl;
    applyToolIconImage(cardEl, options.iconUrl);
  }

  const title =
    options.toolName ||
    cardEl.dataset.toolName ||
    (titleEl && titleEl.textContent.trim()) ||
    "툴";

  const url = options.url || cardEl.dataset.url || "#";
  const onClick = options.onClick;

  fitToolIconTitle(titleEl);

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
  fitAllToolIconTitles(root);
}

/**
 * 외부 HTML partial(icon.html) 불러와서 특정 영역에 삽입
 * @param {string} mountSelector
 * @param {object} options - toolName, url, iconUrl, onClick
 */
async function loadToolIconCard(mountSelector, options = {}) {
  const mount = document.querySelector(mountSelector);
  if (!mount) {
    console.warn(`마운트 대상 없음: ${mountSelector}`);
    return null;
  }

  try {
    const res = await fetch("/_common/icon/icon.html");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();
    mount.innerHTML = html;

    const cardEl = mount.querySelector(".tool-icon-card");
    bindToolIconCard(cardEl, options);

    requestAnimationFrame(() => {
      const titleEl = cardEl?.querySelector(".tool-icon-card__title");
      fitToolIconTitle(titleEl);
    });

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
window.fitToolIconTitle = fitToolIconTitle;
window.fitAllToolIconTitles = fitAllToolIconTitles;

/* 자동 초기화 */
document.addEventListener("DOMContentLoaded", () => {
  initToolIconCards();
});

/* 화면 크기 변경 시 다시 맞춤 */
window.addEventListener("resize", () => {
  fitAllToolIconTitles();
});