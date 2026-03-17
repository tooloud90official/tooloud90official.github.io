/** 카테고리 한글 → tool_cat 매핑 */
const CATEGORY_MAP = {
  "이미지·오디오·영상": "media",
  "리서치":             "res",
  "문서 생성·요약·편집": "doc",
  "개발·코딩":          "dev",
  "학습·교육":          "edu",
  "챗봇·어시스턴트":    "ast",
};

/** 슬라이더 가격 구간 */
const SLIDER_LABELS = ["₩0", "₩1–29,999", "₩30,000–59,999", "₩60,000–89,999", "₩90,000+"];

const PRICE_RANGES = [
  { min: 0,     max: 0       },
  { min: 1,     max: 29999   },
  { min: 30000, max: 59999   },
  { min: 60000, max: 89999   },
  { min: 90000, max: Infinity },
];

/** 전체 툴 데이터 */
let ALL_TOOLS = [];
let currentStep = 0;
let currentCatKey = "";

/** 툴의 최저 가격 반환 */
function getMinPrice(tool) {
  const prices = [
    tool.tool_plan1_price_krw,
    tool.tool_plan2_price_krw,
    tool.tool_plan3_price_krw,
  ]
    .map(p => parseInt(p, 10))
    .filter(p => !isNaN(p) && p >= 0);
  return prices.length ? Math.min(...prices) : Infinity;
}

/** 카드 렌더링 */
function renderToolCards(tools) {
  const grid = document.querySelector("#toolCardGrid");
  if (!grid) return;
  grid.innerHTML = "";

  if (tools.length === 0) {
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#aaa;padding:40px 0;">해당 조건의 툴이 없습니다.</p>`;
    return;
  }

  tools.forEach((tool, index) => {
    const card = document.createElement("article");
    card.className = "tool-price-card";

    const iconWrap = document.createElement("div");
    iconWrap.className = "tool-price-card__icon";
    const iconMount = document.createElement("div");
    iconMount.id = `toolPriceIconMount${index + 1}`;
    iconWrap.appendChild(iconMount);

    const bottom = document.createElement("div");
    bottom.className = "tool-price-card__bottom";

    const minPrice = getMinPrice(tool);
    const priceText = minPrice === 0
      ? "무료"
      : minPrice === Infinity
        ? "문의"
        : `₩${minPrice.toLocaleString()}/월`;

    const price = document.createElement("div");
    price.className = "tool-price-card__price";
    price.textContent = priceText;

    const more = document.createElement("a");
    more.className = "tool-price-card__more";
    more.href = `/detail_AI/detail_AI.html?tool_ID=${tool.tool_ID}`;
    more.textContent = "더보기 >";

    bottom.append(price, more);
    card.append(iconWrap, bottom);
    grid.appendChild(card);

    if (typeof window.loadToolIconCard === "function") {
      window.loadToolIconCard(`#${iconMount.id}`, {
        toolName: tool.tool_name,
        url: `/detail_AI/detail_AI.html?tool_ID=${tool.tool_ID}`,
        iconUrl: tool.icon,
      });
    }
  });
}

/** 필터링 실행 */
function applyFilter(step) {
  let filtered = ALL_TOOLS.filter(t => t.tool_cat === currentCatKey);

  if (step > 0) {
    const range = PRICE_RANGES[step];
    filtered = filtered.filter(t => {
      const min = getMinPrice(t);
      return min >= range.min && min <= range.max;
    });
  }

  renderToolCards(filtered);
}

/** 슬라이더 초기화 */
function initStepSlider() {
  const sliderRoot = document.querySelector("#stepSlider");
  const labelsWrap = document.querySelector(".price-filter__labels");
  const track      = document.querySelector(".price-filter__track");
  const fill       = document.querySelector("#sliderFill");
  const thumb      = document.querySelector("#sliderThumb");

  if (!sliderRoot || !thumb || !track || !fill || !labelsWrap) return;

  const maxStep = SLIDER_LABELS.length - 1;
  const extend  = 10;
  let isDragging = false;
  let stepPositions = [];
  currentStep = 0;

  labelsWrap.innerHTML = "";
  SLIDER_LABELS.forEach((label, i) => {
    const el = document.createElement("div");
    el.className = "price-filter__step-label";
    el.innerHTML = `<span>${label}</span>`;
    el.addEventListener("click", () => render(i));
    labelsWrap.appendChild(el);
  });

  sliderRoot.querySelectorAll(".price-filter__dot").forEach(d => d.remove());
  const dotEls = SLIDER_LABELS.map((_, i) => {
    const el = document.createElement("div");
    el.className = "price-filter__dot";
    el.addEventListener("click", (e) => { e.stopPropagation(); render(i); });
    sliderRoot.appendChild(el);
    return el;
  });

  function calcStepPositions() {
    const sliderRect = sliderRoot.getBoundingClientRect();
    const labelNodes = labelsWrap.querySelectorAll(".price-filter__step-label");
    stepPositions = Array.from(labelNodes).map(el => {
      const r = el.getBoundingClientRect();
      return (r.left + r.width / 2) - sliderRect.left;
    });
  }

  function layoutTrack() {
    calcStepPositions();
    if (stepPositions.length < 2) return;
    const first = stepPositions[0];
    const last  = stepPositions[stepPositions.length - 1];
    track.style.left  = (first - extend) + "px";
    track.style.width = (last - first + extend * 2) + "px";
    fill.style.left   = (first - extend) + "px";
    dotEls.forEach((d, i) => { d.style.left = stepPositions[i] + "px"; });
  }

  function render(step) {
    currentStep = Math.max(0, Math.min(maxStep, step));
    const px    = stepPositions[currentStep];
    const first = stepPositions[0];
    thumb.style.left = px + "px";
    fill.style.width = Math.max(0, px - (first - extend)) + "px";
    dotEls.forEach((d, i) => { d.classList.toggle("is-right", i > currentStep); });
    labelsWrap.querySelectorAll(".price-filter__step-label").forEach((l, i) => {
      l.classList.toggle("is-active", i === currentStep);
    });
    applyFilter(currentStep);
  }

  function clientXToStep(clientX) {
    const rect = sliderRoot.getBoundingClientRect();
    const x = clientX - rect.left;
    let closest = 0, minDist = Infinity;
    stepPositions.forEach((pos, i) => {
      const d = Math.abs(pos - x);
      if (d < minDist) { minDist = d; closest = i; }
    });
    return closest;
  }

  thumb.addEventListener("pointerdown", (e) => {
    isDragging = true;
    thumb.setPointerCapture(e.pointerId);
  });
  window.addEventListener("pointermove", (e) => {
    if (!isDragging) return;
    render(clientXToStep(e.clientX));
  });
  window.addEventListener("pointerup", () => { isDragging = false; });
  sliderRoot.addEventListener("click", (e) => {
    if (e.target.closest(".price-filter__thumb")) return;
    render(clientXToStep(e.clientX));
  });

  layoutTrack();
  render(0);
  window.addEventListener("resize", () => { layoutTrack(); render(currentStep); });
}

// ✅ DOMContentLoaded
document.addEventListener("DOMContentLoaded", async () => {
  const params   = new URLSearchParams(window.location.search);
  const category = params.get("category") || params.get("tab") || "이미지·오디오·영상"; // ← 이 줄만 수정
  currentCatKey  = CATEGORY_MAP[category] || "";

  // 헤더 텍스트 교체
  const descEl = document.querySelector(".category-hero__desc--accent");
  if (descEl && category) descEl.textContent = category;

  // ✅ Supabase에서 데이터 로드
  const supabase = window._supabase;
  const { data, error } = await supabase
    .from("tools")
    .select("tool_ID, tool_cat, tool_name, icon, tool_link, tool_plan1_price_krw, tool_plan2_price_krw, tool_plan3_price_krw")
    .eq("tool_cat", currentCatKey);

  if (error) {
    console.error("Supabase 로드 실패:", error);
  } else {
    ALL_TOOLS = data || [];
  }

  initStepSlider();
});