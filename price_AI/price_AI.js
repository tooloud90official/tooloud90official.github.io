/** 카테고리 한글 → tool_cat 매핑 */
const CATEGORY_MAP = {
  "이미지·오디오·영상": "media",
  "리서치": "res",
  "문서 생성·요약·편집": "doc",
  "개발·코딩": "dev",
  "학습·교육": "edu",
  "챗봇·어시스턴트": "ast",
};

/** 환율 상수 (슬라이더 필터용 내부 기준) */
const KRW_PER_USD = 1500;

/** 슬라이더 가격 구간 (USD 기준) */
const SLIDER_LABELS = ["$0", "$1–19.99", "$20–39.99", "$40–59.99", "$60+"];

const PRICE_RANGES = [
  { min: 0, max: 0 },
  { min: 0.01, max: 19.99 },
  { min: 20, max: 39.99 },
  { min: 40, max: 59.99 },
  { min: 60, max: Infinity },
];

let ALL_TOOLS = [];
let currentStep = 0;
let currentCatKey = "";

/**
 * 문자열 가격을 USD 숫자로 통일
 * 예)
 *  - "0" / "무료"           -> 0
 *  - "$30"                  -> 30
 *  - "₩15200" / "15200"     -> 10.13
 *  - "-1" / "별도 문의"      -> null
 */
function toPriceUSD(value) {
  if (value == null) return null;

  const raw = String(value).trim();
  if (!raw) return null;

  // 문의형 / 비정형 값 제외
  const lowered = raw.toLowerCase();
  if (
    raw === "-1" ||
    lowered.includes("별도 문의") ||
    lowered.includes("contact") ||
    lowered.includes("enterprise") ||
    lowered.includes("custom")
  ) {
    return null;
  }

  // 무료 처리
  if (raw === "0" || raw === "무료") return 0;

  // 숫자 추출 (소수점 허용)
  const normalized = raw.replace(/,/g, "");
  const num = parseFloat(normalized.replace(/[^0-9.]/g, ""));
  if (Number.isNaN(num)) return null;

  // 달러 표기면 그대로 USD
  if (normalized.includes("$") || lowered.includes("usd")) {
    return Number(num.toFixed(2));
  }

  // 달러 아니면 무조건 KRW로 간주해서 환산
  return Number((num / KRW_PER_USD).toFixed(2));
}

/**
 * 화면 표시용 가격 포맷
 * - 달러는 달러 그대로
 * - 원화는 원화 그대로
 * - 무료는 무료
 * - 문의형은 별도 문의
 */
function formatDisplayPrice(rawValue) {
  if (rawValue == null) return "";

  const raw = String(rawValue).trim();
  if (!raw) return "";

  const lowered = raw.toLowerCase();

  if (
    raw === "-1" ||
    lowered.includes("별도 문의") ||
    lowered.includes("contact") ||
    lowered.includes("enterprise") ||
    lowered.includes("custom")
  ) {
    return "별도 문의";
  }

  if (raw === "0" || raw === "무료" || raw === "$0" || raw.toLowerCase() === "usd 0") {
    return "무료";
  }

  const normalized = raw.replace(/,/g, "");
  const num = parseFloat(normalized.replace(/[^0-9.]/g, ""));
  if (Number.isNaN(num)) return raw;

  // 달러 표기면 달러 그대로
  if (normalized.includes("$") || lowered.includes("usd")) {
    const hasDecimal = !Number.isInteger(num);
    return `$${num.toLocaleString("en-US", {
      minimumFractionDigits: hasDecimal ? 2 : 0,
      maximumFractionDigits: 2,
    })}/월`;
  }

  // 그 외는 원화 그대로
  return `₩${Math.round(num).toLocaleString("ko-KR")}/월`;
}

function getToolPlans(tool) {
  return [
    {
      name: (tool.tool_plan1_name || "").trim(),
      rawPrice: tool.tool_plan1_price_krw,
      price: toPriceUSD(tool.tool_plan1_price_krw),
      desc: (tool.tool_plan1_des || "").trim(),
    },
    {
      name: (tool.tool_plan2name || "").trim(),
      rawPrice: tool.tool_plan2_price_krw,
      price: toPriceUSD(tool.tool_plan2_price_krw),
      desc: (tool.tool_plan2_des || "").trim(),
    },
    {
      name: (tool.tool_plan3_name || "").trim(),
      rawPrice: tool.tool_plan3_price_krw,
      price: toPriceUSD(tool.tool_plan3_price_krw),
      desc: (tool.tool_plan3_des || "").trim(),
    },
  ].filter((plan) => {
    if (!plan.name) return false;
    if (plan.price === null) return false;
    if (plan.price < 0) return false;
    return true;
  });
}

function getPlanCardsByStep(step) {
  const range = PRICE_RANGES[step];

  return ALL_TOOLS
    .filter((tool) => tool.tool_cat === currentCatKey)
    .flatMap((tool) => {
      const plans = getToolPlans(tool);

      return plans
        .filter((plan) => {
          if (step === 0) return plan.price === 0;
          return plan.price >= range.min && plan.price <= range.max;
        })
        .map((plan) => ({
          tool_ID: tool.tool_ID,
          tool_name: tool.tool_name,
          icon: tool.icon,
          tool_link: tool.tool_link,
          plan_name: plan.name,
          plan_price: plan.price,
          plan_raw_price: plan.rawPrice,
          plan_desc: plan.desc,
        }));
    });
}

function bindToolLink(iconWrap, toolLink, toolId) {
  if (!toolLink) return;

  iconWrap.style.cursor = "pointer";
  iconWrap.setAttribute("role", "link");
  iconWrap.setAttribute("tabindex", "0");

  const go = async () => {
    try {
      const supabase = window._supabase;
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && toolId) {
        const { data: userData } = await supabase
          .from("users")
          .select("recent_tools")
          .eq("user_id", user.id)
          .single();

        const current = userData?.recent_tools ?? [];
        const updated = [toolId, ...current.filter((id) => id !== toolId)].slice(0, 8);

        await supabase.from("users").update({ recent_tools: updated }).eq("user_id", user.id);
      }
    } catch (e) {
      console.warn("recent_tools 저장 실패:", e);
    }

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

  setTimeout(() => {
    const a = iconWrap.querySelector("a");
    if (a) {
      a.href = toolLink;
      a.target = "_self";
      a.rel = "";
    }
  }, 0);
}

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
      <span class="tool-price-card__price-main">${formatDisplayPrice(item.plan_raw_price)}</span>
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

    bindToolLink(iconWrap, item.tool_link, item.tool_ID);
  });
}

function applyFilter(step) {
  const planCards = getPlanCardsByStep(step);
  renderToolCards(planCards);
}

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

  sliderRoot.querySelectorAll(".price-filter__dot").forEach((d) => d.remove());

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

    stepPositions = Array.from(labelNodes).map((el) => {
      const r = el.getBoundingClientRect();
      return r.left + r.width / 2 - sliderRect.left;
    });
  }

  function layoutTrack() {
    calcStepPositions();
    if (stepPositions.length < 2) return;

    const first = stepPositions[0];
    const last = stepPositions[stepPositions.length - 1];

    track.style.left = first - extend + "px";
    track.style.width = last - first + extend * 2 + "px";
    fill.style.left = first - extend + "px";

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