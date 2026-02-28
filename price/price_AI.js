/**
 * html 조각 로드 (탑 배너용)
 */
async function includeHTML(targetSelector, filePath) {
    const target = document.querySelector(targetSelector);
    if (!target) return;
  
    try {
        const res = await fetch(filePath);
        if (!res.ok) return;
        const html = await res.text();
        target.innerHTML = html; // 기존 내용을 비우고 삽입
    } catch (err) {
        console.error("배너 로드 실패:", err);
    }
}
  
/** 슬라이더 지점 라벨 */
const SLIDER_LABELS = ["옵션 1", "옵션 2", "옵션 3", "옵션 4", "옵션 5", "옵션 6"];
  
/** 샘플 카드 데이터 */
const TOOL_CARDS = [
  { toolName: "Chat GPT", price: "$35/월", url: "#" },
  { toolName: "Claude", price: "$40/월", url: "#" },
  { toolName: "Flexclip", price: "$45/월", url: "#" },
  { toolName: "Adobe Firefly", price: "$50/월", url: "#" },
  { toolName: "Descript", price: "$55/월", url: "#" }
];
  
/**
 * 가격 카드 렌더링
 */
function renderToolCards() {
    const grid = document.querySelector("#toolCardGrid");
    if (!grid) return;
  
    grid.innerHTML = "";
  
    TOOL_CARDS.forEach((tool, index) => {
      const card = document.createElement("article");
      card.className = "tool-price-card";
  
      // 1. 아이콘 영역 (여기서 외부 함수가 이름까지 같이 그려줄 거야)
      const iconWrap = document.createElement("div");
      iconWrap.className = "tool-price-card__icon";
      const iconMount = document.createElement("div");
      iconMount.id = `toolPriceIconMount${index + 1}`;
      iconWrap.appendChild(iconMount);
  
      // ❌ [삭제] const name = document.createElement("h3"); 로직은 이제 필요 없어!
      // 외부 함수 loadToolIconCard가 이름을 대신 넣어주니까 중복 방지를 위해 지워버리자.
  
      // 2. 하단 영역 (가격과 더보기)
      const bottom = document.createElement("div");
      bottom.className = "tool-price-card__bottom";
  
      const price = document.createElement("div");
      price.className = "tool-price-card__price";
      price.textContent = tool.price;
  
      const more = document.createElement("a");
      more.className = "tool-price-card__more";
      more.href = tool.url || "#";
      more.textContent = "더보기 >";
  
      bottom.append(price, more);
  
      // 3. 조립 (name을 빼고 조립해!)
      card.append(iconWrap, bottom);
      grid.appendChild(card);
  
      // 4. 아이콘과 이름을 그려주는 외부 함수 호출
      if (typeof window.loadToolIconCard === "function") {
        window.loadToolIconCard(`#${iconMount.id}`, {
          toolName: tool.toolName,
          url: tool.url || "#"
        });
      }
    });
  }
  
/**
 * 슬라이더 초기화
 */
function initStepSlider() {
  const sliderRoot = document.querySelector("#stepSlider");
  const thumb = document.querySelector("#sliderThumb");
  const fill = document.querySelector("#sliderFill");
  const hint = document.querySelector("#sliderHint");
  const dots = document.querySelectorAll(".price-filter__dot");
  const labels = document.querySelectorAll(".price-filter__step-label");

  if (!sliderRoot || !thumb) return;

  const maxStep = 5;
  let isDragging = false;

  function render(step) {
    const currentStep = Math.max(0, Math.min(maxStep, step));
    const percent = (currentStep / maxStep) * 100;

    thumb.style.left = `${percent}%`;
    fill.style.width = `${percent}%`;
    hint.textContent = `현재 선택: ${SLIDER_LABELS[currentStep]}`;

    dots.forEach((dot, idx) => {
      dot.classList.toggle("is-passed", idx <= currentStep);
    });
    labels.forEach((label, idx) => {
      label.classList.toggle("is-active", idx === currentStep);
    });
  }

  function getStepFromX(clientX) {
    const rect = sliderRoot.getBoundingClientRect();
    const x = Math.max(rect.left, Math.min(rect.right, clientX));
    return Math.round(((x - rect.left) / rect.width) * maxStep);
  }

  thumb.addEventListener("pointerdown", (e) => {
    isDragging = true;
    thumb.setPointerCapture(e.pointerId);
  });

  window.addEventListener("pointermove", (e) => {
    if (!isDragging) return;
    render(getStepFromX(e.clientX));
  });

  window.addEventListener("pointerup", () => { isDragging = false; });

  sliderRoot.addEventListener("click", (e) => {
    if (e.target.closest(".price-filter__thumb")) return;
    render(getStepFromX(e.clientX));
  });

  dots.forEach((dot, idx) => {
    dot.addEventListener("click", (e) => {
      e.stopPropagation();
      render(idx);
    });
  });

  render(0);
}
  
/**
 * 페이지 초기화
 */
document.addEventListener("DOMContentLoaded", async () => {
    // 1. 탑 배너 호출 (경로 확인해줘!)
    await includeHTML("#top-banner", "/common/top-banner/top-banner.html");

    // 2. 슬라이더 초기화
    initStepSlider();

    // 3. 카드 렌더링
    renderToolCards();
});