/** 카테고리 한글 → tool_cat 매핑 */
const CATEGORY_MAP = {
  "이미지·오디오·영상": "media",
  "리서치": "res",
  "문서 생성·요약·편집": "doc",
  "개발·코딩": "dev",
  "학습·교육": "edu",
  "챗봇·어시스턴트": "ast",
};

/** 슬라이더 가격 구간 */
const SLIDER_LABELS = ["₩0", "₩1–29,999", "₩30,000–59,999", "₩60,000–89,999", "₩90,000+"];

const PRICE_RANGES = [
  { min: 0, max: 0 },
  { min: 1, max: 29999 },
  { min: 30000, max: 59999 },
  { min: 60000, max: 89999 },
  { min: 90000, max: Infinity },
];

let ALL_TOOLS = [];
let currentStep = 0;
let currentCatKey = "";

/** 숫자 변환 */
function toPrice(value) {
  const num = parseInt(value, 10);
  return Number.isNaN(num) ? null : num;
}

/** 플랜 배열 추출 */
function getToolPlans(tool) {
  return [
    {
      name: (tool.tool_plan1_name || "").trim(),
      price: toPrice(tool.tool_plan1_price_krw),
      desc: (tool.tool_plan1_des || "").trim(),
    },
    {
      name: (tool.tool_plan2name || "").trim(),
      price: toPrice(tool.tool_plan2_price_krw),
      desc: (tool.tool_plan2_des || "").trim(),
    },
    {
      name: (tool.tool_plan3_name || "").trim(),
      price: toPrice(tool.tool_plan3_price_krw),
      desc: (tool.tool_plan3_des || "").trim(),
    },
  ].filter(plan => {
    if (!plan.name) return false;
    if (plan.price === null) return false;
    if (plan.price < 0) return false; // 문의(-1) 제외
    return true;
  });
}

/** 가격 포맷 */
function formatPrice(price) {
  if (price === 0) return "무료";
  return `₩${price.toLocaleString()}/월`;
}

/** 현재 step에 맞는 플랜만 뽑아서
 *  툴 단위가 아니라 "플랜 카드용 데이터" 배열로 변환
 */
function getPlanCardsByStep(step) {
  const range = PRICE_RANGES[step];

  return ALL_TOOLS
    .filter(tool => tool.tool_cat === currentCatKey)
    .flatMap(tool => {
      const plans = getToolPlans(tool);

      return plans
        .filter(plan => plan.price >= range.min && plan.price <= range.max)
        .map(plan => ({
          tool_ID: tool.tool_ID,
          tool_name: tool.tool_name,
          icon: tool.icon,
          tool_link: tool.tool_link,
          plan_name: plan.name,
          plan_price: plan.price,
          plan_desc: plan.desc,
        }));
    });
}

/** 아이콘 클릭 시 tool_link 이동 */
function bindToolLink(iconWrap, toolLink) {
  if (!toolLink) return;

  iconWrap.style.cursor = "pointer";
  iconWrap.setAttribute("role", "link");
  iconWrap.setAttribute("tabindex", "0");

  const go = () => {
    window.location.href = toolLink;
  };

  iconWrap.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    go();
  });

  iconWrap.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      go();
    }
  });

  // 내부 a 태그가 생기는 경우도 가로채기
  setTimeout(() => {
    const a = iconWrap.querySelector("a");
    if (a) {
      a.href = toolLink;
      a.target = "_self";
      a.rel = "";
    }
  }, 0);
}

/** 카드 렌더링 */
function renderToolCards(planCards) {
  const grid = document.querySelector("#toolCardGrid");
  if (!grid) return;

  grid.innerHTML = "";

  if (!planCards.length) {
    grid.innerHTML = `
      <p style="grid-column:1/-1;text-align:center;color:#aaa;padding:40px 0;">
        해당 가격대의 플랜이 없습니다.
      </p>
    `;
    return;
  }

  planCards.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "tool-price-card";

    const iconWrap = document.createElement("div");
    iconWrap.className = "tool-price-card__icon";

    const iconMount = document.createElement("div");
    iconMount.id = `toolPriceIconMount${index + 1}`;
    iconWrap.appendChild(iconMount);

    const bottom = document.createElement("div");
    bottom.className = "tool-price-card__bottom";

    const priceLine = document.createElement("div");
    priceLine.className = "tool-price-card__price-line";
    priceLine.innerHTML = `
      <span class="tool-price-card__price-main">${formatPrice(item.plan_price)}</span>
      <span class="tool-price-card__price-plan">${item.plan_name}</span>
    `;

    const more = document.createElement("a");
    more.className = "tool-price-card__more";
    more.href = `/detail_AI/detail_AI.html?tool_ID=${item.tool_ID}`;
    more.textContent = "더보기 >";

    bottom.append(priceLine, more);
    card.append(iconWrap, bottom);
    grid.appendChild(card);

    if (typeof window.loadToolIconCard === "function") {
      window.loadToolIconCard(`#${iconMount.id}`, {
        toolName: item.tool_name,
        url: "javascript:void(0)",
        iconUrl: item.icon,
      });
    }

    bindToolLink(iconWrap, item.tool_link);
  });
}

/** 필터 적용 */
function applyFilter(step) {
  const planCards = getPlanCardsByStep(step);
  renderToolCards(planCards);
}

/** 슬라이더 초기화 */
function initStepSlider() {
  const sliderRoot = document.querySelector("#stepSlider");
  const labelsWrap = document.querySelector(".price-filter__labels");
  const track = document.querySelector(".price-filter__track");
  const fill = document.querySelector("#sliderFill");
  const thumb = document.querySelector("#sliderThumb");

  if (!sliderRoot || !thumb || !track || !fill || !labelsWrap) return;

  const maxStep = SLIDER_LABELS.length - 1;
  const extend = 10;
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
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      render(i);
    });
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
    const last = stepPositions[stepPositions.length - 1];

    track.style.left = (first - extend) + "px";
    track.style.width = (last - first + extend * 2) + "px";
    fill.style.left = (first - extend) + "px";

    dotEls.forEach((d, i) => {
      d.style.left = stepPositions[i] + "px";
    });
  }

  function render(step) {
    currentStep = Math.max(0, Math.min(maxStep, step));

    const px = stepPositions[currentStep];
    const first = stepPositions[0];

    thumb.style.left = px + "px";
    fill.style.width = Math.max(0, px - (first - extend)) + "px";

    dotEls.forEach((d, i) => {
      d.classList.toggle("is-right", i > currentStep);
    });

    labelsWrap.querySelectorAll(".price-filter__step-label").forEach((l, i) => {
      l.classList.toggle("is-active", i === currentStep);
    });

    applyFilter(currentStep);
  }

  function clientXToStep(clientX) {
    const rect = sliderRoot.getBoundingClientRect();
    const x = clientX - rect.left;

    let closest = 0;
    let minDist = Infinity;

    stepPositions.forEach((pos, i) => {
      const d = Math.abs(pos - x);
      if (d < minDist) {
        minDist = d;
        closest = i;
      }
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

  window.addEventListener("pointerup", () => {
    isDragging = false;
  });

  sliderRoot.addEventListener("click", (e) => {
    if (e.target.closest(".price-filter__thumb")) return;
    render(clientXToStep(e.clientX));
  });

  layoutTrack();
  render(0);

  window.addEventListener("resize", () => {
    layoutTrack();
    render(currentStep);
  });
}

/** 초기 로드 */
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const category = params.get("category") || params.get("tab") || "이미지·오디오·영상";
  currentCatKey = CATEGORY_MAP[category] || "";

  const descEl = document.querySelector(".category-hero__desc--accent");
  if (descEl && category) descEl.textContent = category;

  const supabase = window._supabase;
  const { data, error } = await supabase
    .from("tools")
    .select(`
      tool_ID,
      tool_cat,
      tool_name,
      icon,
      tool_link,
      tool_plan1_name,
      tool_plan1_price_krw,
      tool_plan1_des,
      tool_plan2name,
      tool_plan2_price_krw,
      tool_plan2_des,
      tool_plan3_name,
      tool_plan3_price_krw,
      tool_plan3_des
    `)
    .eq("tool_cat", currentCatKey);

  if (error) {
    console.error("Supabase 로드 실패:", error);
    ALL_TOOLS = [];
  } else {
    ALL_TOOLS = data || [];
  }

  initStepSlider();
});