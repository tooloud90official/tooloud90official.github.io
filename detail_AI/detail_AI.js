import { loadNativeSelect } from "/_common/select/select.js";
import { supabase } from "/_ignore/supabase.js";

/* ============================================================
   ✅ 툴 ID 설정
   - 이전 페이지에서 링크에 ?tool=tool_002 파라미터를 붙여서 전달
     예) <a href="/detail_AI/?tool=tool_002">
   - 파라미터가 없으면 임시 기본값 "tool_001" 사용
   - 나중에 이전 페이지 연결 준비되면 이 fallback 값만 제거하면 됨
============================================================ */
const TOOL_ID = new URLSearchParams(location.search).get("tool") ?? "tool_001";

/* ============================================================
   Auth — supabase.auth.getUser() 로 현재 로그인 유저 확인
============================================================ */
let currentUser = null; // { id, name, avatar } | null

async function loadCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { currentUser = null; return; }
  currentUser = {
    id:     user.id,
    name:   user.user_metadata?.user_name ?? user.email ?? "나",
    avatar: user.user_metadata?.avatar_url ?? "/media/profil.png",
  };
}

/* ============================================================
   ✅ 아이콘 카드에 Brandfetch CDN 이미지 적용
   - loadToolIconCard() 호출 후 DB icon 컬럼 URL을 배경에 주입
============================================================ */
function applyToolIcon(mountSelector, iconUrl) {
  if (!iconUrl) return;
  const iconEl = document.querySelector(`${mountSelector} .tool-icon-card__icon`);
  if (iconEl) iconEl.style.backgroundImage = `url("${iconUrl}")`;
}

/* ============================================================
   전역 상태
============================================================ */
let reviewData    = [];
let selectedScore = 0;
let editingId     = null;
let currentSort   = "none";

/* ============================================================
   DOMContentLoaded
============================================================ */
document.addEventListener("DOMContentLoaded", async () => {
  // 로그인 유저 먼저 확인
  await loadCurrentUser();

  // ✅ 평점 초기값 0으로 즉시 세팅 (HTML 하드코딩 값 덮어쓰기)
  updateAvgScore();
  updateCardStars(0);

  // 버튼 마운트 (URL은 툴 로드 후 업데이트)
  await Promise.all([
    window.loadButton({
      target: "#visitSiteBtn", text: "사이트 바로가기", variant: "primary", onClick: () => {},
    }),
    window.loadButton({
      target: "#wishlistBtn", text: "관심 목록에 추가", variant: "outline", onClick: () => {},
    }).then(() => {
      const btn = document.querySelector("#wishlistBtn .btn");
      btn.innerHTML = `<img src="/media/pin.png"
        style="width:1em;height:1em;object-fit:contain;vertical-align:middle;margin-right:6px;">
        관심 목록에 추가`;
      let pinned = false;
      btn.addEventListener("click", () => {
        // 비로그인 → 로그인 페이지로 이동
        if (!currentUser) {
          window.location.href = "/login1/login.html";
          return;
        }
        pinned = !pinned;
        btn.querySelector("img").src = pinned ? "/media/pin_fill.png" : "/media/pin.png";
      });
    }),
    window.loadButton({ target: "#planBtn1", text: "사이트 바로가기", variant: "outline", onClick: () => {} }),
    window.loadButton({ target: "#planBtn2", text: "사이트 바로가기", variant: "primary", onClick: () => {} }),
    window.loadButton({ target: "#planBtn3", text: "사이트 바로가기", variant: "primary", onClick: () => {} }),
    window.loadButton({ target: "#promoBtn", text: "사이트 바로가기", variant: "outline", onClick: () => {} }),
  ]);

  // DB 병렬 로드
  const [toolRow] = await Promise.all([
    loadToolInfo(),
    loadWorks(),
    loadReviews(),
  ]);

  // 툴 URL로 버튼 클릭 핸들러 교체
  const toolUrl = toolRow?.tool_link ?? "#";
  ["#visitSiteBtn", "#planBtn1", "#planBtn2", "#planBtn3", "#promoBtn"].forEach((sel) => {
    document.querySelector(`${sel} .btn`)
      ?.addEventListener("click", () => window.open(toolUrl, "_blank"));
  });

  initReviewSort();
  initSectionTabs();
  initReviewSystem();
});

/* ============================================================
   툴 정보 로드 (tools 테이블)
============================================================ */
async function loadToolInfo() {
  try {
    const { data, error } = await supabase
      .from("tools")
      .select("*")
      .eq("tool_ID", TOOL_ID)
      .limit(1)
      .single();

    if (error || !data) throw error ?? new Error("툴 없음");

    // 아이콘 카드 마운트 → DB icon 컬럼(Brandfetch CDN URL)으로 이미지 교체
    await window.loadToolIconCard("#toolIconMount", {
      toolName: data.tool_name ?? TOOL_ID,
      url:      data.tool_link ?? "#",
    });
    applyToolIcon("#toolIconMount", data.icon);

    // 메타 텍스트
    setTextEl("toolBrand", `@ ${data.tool_company ?? ""}`);
    setTextEl("toolDesc",  data.tool_des ?? "");

    // 사이트 미리보기 (icon CDN URL도 함께 전달 → iframe=false면 로고로 표시)
    setSitePreview({
      name:          data.tool_name,
      url:           data.tool_link,
      icon:          data.icon,
      iframeEnabled: data.iframe ?? false,
    });

    // 플랜 카드
    renderPlanCards(data);

    // 프로모션 — tool_name을 타이틀에, tool_prom을 내용에
    renderPromo(data.tool_name, data.tool_prom);

    // 유사 툴 — tool_cat 동일 항목 로드 (현재 툴 제외)
    await loadSimilarTools(data.tool_cat, data.tool_ID);

    return data;

  } catch (e) {
    console.error("툴 정보 로드 실패:", e);
    // 폴백: 빈 아이콘 카드라도 마운트
    await window.loadToolIconCard("#toolIconMount", { toolName: TOOL_ID, url: "#" });
    const dotsEl = document.querySelector(".similar-tools__dots");
    if (dotsEl) { dotsEl.innerHTML = ""; dotsEl.style.display = "none"; }
    return null;
  }
}

/* 플랜 카드 렌더링
   - tool_plan_des 내용을 줄바꿈(\n) 기준으로 분리
   - 각 항목에 적절한 이모지 자동 부여
   - 가격 정보가 있으면 상단에 표시 */
function renderPlanCards(tool) {
  // 항목별 이모지 매핑 (키워드 포함 시 해당 이모지 사용)
  function getEmoji(text) {
    if (/무제한|unlimited/i.test(text))   return "♾️";
    if (/무료|free/i.test(text))          return "🆓";
    if (/API/i.test(text))               return "🔌";
    if (/팀|인원|계정|멤버/i.test(text))  return "👥";
    if (/분석|리포트|통계/i.test(text))   return "📊";
    if (/지원|서포트|support/i.test(text))return "🛟";
    if (/보안|privacy|SSL/i.test(text))  return "🔒";
    if (/속도|빠른|fast/i.test(text))     return "⚡";
    if (/이미지|생성|create/i.test(text)) return "🎨";
    if (/비디오|영상|video/i.test(text))  return "🎬";
    if (/클라우드|저장|storage/i.test(text)) return "☁️";
    if (/크레딧|credit/i.test(text))     return "💳";
    return "✅";
  }

  const plans = [
    { nameKey: "tool_plan1_name", priceKey: "tool_plan1_price_krw", desKey: "tool_plan1_des" },
    { nameKey: "tool_plan2name",  priceKey: "tool_plan2_price_krw", desKey: "tool_plan2_des" },
    { nameKey: "tool_plan3_name", priceKey: "tool_plan3_price_krw", desKey: "tool_plan3_des" },
  ];

  plans.forEach(({ nameKey, priceKey, desKey }, i) => {
    const card   = document.querySelectorAll(".plan-card")[i];
    if (!card) return;

    const nameEl  = card.querySelector(".plan-card__name");
    const listEl  = card.querySelector(".plan-card__list");
    const topEl   = card.querySelector(".plan-card__top");

    if (nameEl && tool[nameKey]) nameEl.textContent = tool[nameKey];

    // 가격 표시 (있을 때만)
    const price = tool[priceKey];
    if (topEl && price !== undefined && price !== null) {
      let priceEl = topEl.querySelector(".plan-card__price");
      if (!priceEl) {
        priceEl = document.createElement("div");
        priceEl.className = "plan-card__price";
        topEl.appendChild(priceEl);
      }
      priceEl.textContent = price === 0 ? "무료" : `₩${Number(price).toLocaleString()} / 월`;
    }

    // 설명 항목 — 줄바꿈으로 분리, 이모지 자동 부여
    if (listEl && tool[desKey]) {
      const lines = tool[desKey].split(/[,\n]/).map(s => s.trim()).filter(Boolean);
      listEl.innerHTML = lines.map((line) =>
        `<li><span class="plan-item-emoji">${getEmoji(line)}</span>${line}</li>`
      ).join("");
    }
  });
}

/* ============================================================
   프로모션 렌더
   - 타이틀: "{tool_name} 에서 진행 중인 프로모션" (DB tool_name)
   - 내용: tool_prom 값을 , 또는 \n 기준으로 단락 분리
   - tool_prom 없으면 프로모션 섹션 전체 숨김
============================================================ */
function renderPromo(toolName, toolProm) {
  const section    = document.getElementById("promoSection");
  const titleEl    = document.querySelector(".promo__title");
  const headlineEl = document.querySelector(".promo-banner__headline");
  const subEl      = document.querySelector(".promo-banner__sub");
  const dateEl     = document.querySelector(".promo-banner__date");

  // 툴 이름 교체
  if (titleEl && toolName) {
    titleEl.textContent = `${toolName} 에서 진행 중인 프로모션`;
  }

  // tool_prom 없으면 섹션 전체 숨김
  if (!toolProm) {
    if (section) section.style.display = "none";
    return;
  }

  // /, \n, , 기준으로 분리
  const lines = toolProm.split(/[\/,\n]/).map(s => s.trim()).filter(Boolean);

  // 이모지 매핑
  function getPromoEmoji(text) {
    if (/할인|%|dc/i.test(text))         return "🎉";
    if (/무료|free/i.test(text))          return "🆓";
    if (/기간|기한|만료/i.test(text))     return "📅";
    if (/크레딧|credit/i.test(text))      return "💳";
    if (/상시|언제든/i.test(text))        return "♾️";
    if (/Pro|프로/i.test(text))           return "⭐";
    if (/가입|신규/i.test(text))          return "🙋";
    if (/확인|자세|상세/i.test(text))     return "🔍";
    return "✨";
  }

  // 첫 항목 → headline (이모지 포함)
  if (headlineEl && lines[0]) {
    headlineEl.textContent = `${getPromoEmoji(lines[0])} ${lines[0]}`;
  }

  // 나머지 항목 → sub (줄바꿈으로 구분)
  if (subEl) {
    if (lines.length > 1) {
      subEl.innerHTML = lines.slice(1)
        .map(l => `<span>${getPromoEmoji(l)} ${l}</span>`)
        .join("<br>");
    } else {
      subEl.style.display = "none";
    }
  }

  // 기간 숨김 (DB에 기간 컬럼 없으면)
  if (dateEl) dateEl.style.display = "none";
}

/* ============================================================
   유사 툴 (tool_cat 기반)
   - 4개 이하 → dots 숨김
   - 5개 이상 → 페이지당 4개, dots 동적 생성
============================================================ */
async function loadSimilarTools(toolCat, currentToolId) {
  const rowEl  = document.getElementById("similarToolsRow");
  const dotsEl = document.querySelector(".similar-tools__dots");

  // HTML에 하드코딩된 dots 즉시 제거
  if (dotsEl) { dotsEl.innerHTML = ""; dotsEl.style.display = "none"; }
  if (!rowEl || !toolCat) { if (rowEl) renderSimEmpty(rowEl); return; }

  try {
    const { data, error } = await supabase
      .from("tools")
      .select("tool_ID, tool_name, tool_link, icon")
      .eq("tool_cat", toolCat)
      .neq("tool_ID", currentToolId)
      .limit(8);

    if (error) throw error;
    if (!data?.length) { renderSimEmpty(rowEl); return; }

    const PAGE       = 4;
    const totalPages = Math.ceil(data.length / PAGE);

    // 5개 이상일 때만 dots 생성
    if (dotsEl && totalPages >= 2) {
      dotsEl.style.display = "flex";
      dotsEl.innerHTML = Array.from({ length: totalPages })
        .map((_, i) => `<span class="sdot${i === 0 ? " is-active" : ""}"></span>`)
        .join("");
      dotsEl.querySelectorAll(".sdot").forEach((dot, i) => {
        dot.addEventListener("click", async () => {
          dotsEl.querySelectorAll(".sdot").forEach((d) => d.classList.remove("is-active"));
          dot.classList.add("is-active");
          await renderSimPage(data, i, PAGE, rowEl);
        });
      });
    }

    await renderSimPage(data, 0, PAGE, rowEl);

  } catch (e) {
    console.error("유사 툴 로드 실패:", e);
    renderSimEmpty(rowEl);
  }
}

function renderSimEmpty(rowEl) {
  rowEl.innerHTML = `<p class="simtools-empty">유사한 AI 툴이 없습니다.</p>`;
}

async function renderSimPage(rows, pageIndex, pageSize, rowEl) {
  const pageTools = rows.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize);
  rowEl.innerHTML = pageTools.map((_, i) => `
    <div class="similar-tools__item">
      <div class="similar-tools__mount" id="simTool${i + 1}"></div>
    </div>`
  ).join("");

  await Promise.all(pageTools.map(async (tool, i) => {
    await window.loadToolIconCard(`#simTool${i + 1}`, {
      toolName: tool.tool_name,
      url:      tool.tool_link ?? "#",
    });
    applyToolIcon(`#simTool${i + 1}`, tool.icon);
  }));
}

/* ============================================================
   작업물 로드 (works 테이블)
============================================================ */
async function loadWorks() {
  try {
    const { data, error } = await supabase
      .from("works")
      .select("work_id, work_path, like_count, user_id")
      .eq("tool_id", TOOL_ID)
      .order("updated_at", { ascending: false })
      .limit(10);

    if (error) throw error;
    data?.length ? renderWorksCarousel(data) : renderEmptyWorks();

  } catch (e) {
    console.error("작업물 로드 실패:", e);
    renderEmptyWorks();
  }
}

/* ✅ 작업물 없을 때
   - showcase 카드 스타일(배경·그림자·패딩) 완전히 유지
   - 프로필 컬럼만 숨기고 캐러셀이 전체 너비 차지
   - carousel-wrapper → 중앙 회색 텍스트만 */
function renderEmptyWorks() {
  const profile  = document.querySelector(".detail_AI__profile");
  const showcase = document.querySelector(".detail_AI__showcase");
  const carousel = document.querySelector(".detail_AI__carousel");

  if (profile)  profile.style.display = "none";
  if (showcase) showcase.style.gridTemplateColumns = "1fr";
  // carousel의 grid-column 리셋 — 기존 CSS에서 grid-column:2 로 지정돼 있어 오른쪽으로 밀림
  if (carousel) carousel.style.gridColumn = "1";

  if (!carousel) return;
  const wrapper = carousel.querySelector(".detail_AI__carousel-wrapper");
  const dots    = carousel.querySelector(".detail_AI__dots");
  if (wrapper) wrapper.outerHTML = `<div class="works-empty-text">아직 등록된 작업물이 없습니다.</div>`;
  if (dots)    dots.style.display = "none";
}

function renderWorksCarousel(works) {
  const frame  = document.querySelector(".detail_AI__carousel-frame img");
  const likeEl = document.querySelector(".detail_AI__like-count");
  const dotsEl = document.querySelector(".detail_AI__dots");
  const nameEl = document.querySelector(".detail_AI__profile-name");

  if (frame)  frame.src = works[0].work_path ?? "/media/work.png";
  if (likeEl) likeEl.textContent = works[0].like_count ?? 0;
  if (nameEl && works[0].user_id) nameEl.textContent = `by. ${works[0].user_id}`;

  if (dotsEl) {
    dotsEl.innerHTML = works.slice(0, 5).map((_, i) =>
      `<button class="dot${i === 0 ? " is-active" : ""}" type="button" aria-label="${i + 1}"></button>`
    ).join("");
    dotsEl.querySelectorAll(".dot").forEach((dot, i) => {
      dot.addEventListener("click", () => {
        dotsEl.querySelectorAll(".dot").forEach((d) => d.classList.remove("is-active"));
        dot.classList.add("is-active");
        if (frame)  frame.src = works[i].work_path ?? "/media/work.png";
        if (likeEl) likeEl.textContent = works[i].like_count ?? 0;
      });
    });
  }
}

/* ============================================================
   리뷰 로드 (reviews 테이블)
============================================================ */
async function loadReviews() {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("review_id, user_id, rating, review_content, created_at")
      .eq("tool_id", TOOL_ID)
      .order("created_at", { ascending: false });

    if (error) throw error;

    reviewData = (data ?? []).map((r) => ({
      id:     r.review_id,
      name:   r.user_id,
      avatar: "/media/profil.png",
      date:   r.created_at?.slice(0, 10).replace(/-/g, ".") ?? "",
      score:  r.rating ?? 0,
      text:   r.review_content ?? "",
      isMine: currentUser ? r.user_id === currentUser.id : false,
    }));
    updateAvgScore();
    updateCardStars(); // 좌측 툴 카드 별점도 동기화

  } catch (e) {
    console.error("리뷰 로드 실패:", e);
    reviewData = [];
  }
}

/* ============================================================
   리뷰 시스템
============================================================ */
function initReviewSystem() {
  initWriteStars();
  renderReviewList();
  renderMyReviewArea();
}

function getSortedOtherReviews() {
  const others = reviewData.filter((r) => !r.isMine);
  if (currentSort === "high") return [...others].sort((a, b) => b.score - a.score);
  if (currentSort === "low")  return [...others].sort((a, b) => a.score - b.score);
  if (currentSort === "new")  return [...others].sort((a, b) => (b.date > a.date ? 1 : -1));
  return others;
}

/* ✅ 리뷰 없을 때 빈 상태 */
function renderReviewList() {
  const container = document.getElementById("reviewCards");
  const countEl   = document.getElementById("reviewCount");
  if (!container) return;

  if (countEl) countEl.textContent = `전체 리뷰 (${reviewData.length})`;

  const items = getSortedOtherReviews();
  if (!items.length) {
    container.innerHTML = `
      <div class="review-empty">
        <div class="review-empty__icon">💬</div>
        <p class="review-empty__text">아직 등록된 리뷰가 없습니다.<br>첫 번째 리뷰를 남겨보세요!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map((r) => `
    <article class="review-card">
      <div class="review-card__date">${r.date}</div>
      <div class="review-card__stars">
        ${[1,2,3,4,5].map((n) =>
          `<span class="rstar ${n <= r.score ? "is-on" : "is-off"}">★</span>`
        ).join("")}
        <span class="review-card__rate">(${r.score}점)</span>
      </div>
      <div class="review-card__text">${r.text}</div>
      <div class="review-card__user">
        <div class="review-card__avatar"><img src="${r.avatar}" alt="${r.name}" /></div>
        <div class="review-card__name">${r.name}</div>
      </div>
    </article>
  `).join("");
}

/* -------- 리뷰 쓰기 영역 (로그인 상태 분기) -------- */
function renderMyReviewArea() {
  const writeArea = document.querySelector(".review-write");
  if (!writeArea) return;

  /* ① 비로그인 → 잠금 오버레이 */
  if (!currentUser) {
    writeArea.innerHTML = `
      <div class="review-write__head">
        <div class="review-write__title">리뷰 쓰기</div>
      </div>
      <div class="review-write__locked">
        <div class="review-write__box review-write__box--disabled" aria-hidden="true">
          <div class="review-write__stars">
            ${[1,2,3,4,5].map(() => `<span class="rstar-input">★</span>`).join("")}
            <span class="review-write__hint">(0점)</span>
          </div>
          <textarea class="review-write__textarea"
            placeholder="리뷰를 작성해주세요." disabled></textarea>
        </div>
        <div class="review-write__overlay">
          <div class="review-write__overlay-inner">
            <span class="review-write__lock-icon">🔒</span>
            <p class="review-write__lock-msg">로그인 후 리뷰를 남길 수 있어요</p>
            <a class="review-write__login-btn" href="/login">로그인하기</a>
          </div>
        </div>
      </div>
    `;
    return;
  }

  /* ② 내 리뷰 있음 */
  const myReview = reviewData.find((r) => r.isMine);
  if (myReview) {
    writeArea.innerHTML = `
      <div class="review-write__head">
        <div class="review-write__title">내 리뷰</div>
      </div>
      <article class="review-card review-card--mine">
        <div class="review-card__date">${myReview.date}</div>
        <div class="review-card__stars">
          ${[1,2,3,4,5].map((n) =>
            `<span class="rstar ${n <= myReview.score ? "is-on" : "is-off"}">★</span>`
          ).join("")}
          <span class="review-card__rate">(${myReview.score}점)</span>
        </div>
        <div class="review-card__text">${myReview.text}</div>
        <div class="review-card__user">
          <div class="review-card__avatar"><img src="${myReview.avatar}" alt="${myReview.name}" /></div>
          <div class="review-card__name">${myReview.name}</div>
          <div class="review-card__actions">
            <button class="review-card__action-btn" onclick="startEditMyReview()">수정</button>
            <button class="review-card__action-btn review-card__action-btn--delete"
              onclick="deleteMyReview('${myReview.id}')">삭제</button>
          </div>
        </div>
      </article>
    `;
    return;
  }

  /* ③ 로그인 O, 내 리뷰 없음 → 작성 폼 */
  writeArea.innerHTML = `
    <div class="review-write__head">
      <div class="review-write__title">리뷰 쓰기</div>
    </div>
    <div class="review-write__box">
      <div class="review-write__stars" id="writeStars">
        ${[1,2,3,4,5].map((n) =>
          `<span class="rstar-input" data-val="${n}">★</span>`
        ).join("")}
        <span class="review-write__hint" id="writeStarHint">(0점)</span>
      </div>
      <textarea class="review-write__textarea" id="reviewTextarea"
        placeholder="리뷰를 작성해주세요." maxlength="300"></textarea>
    </div>
    <div class="review-write__submit" id="reviewSubmitBtn"></div>
  `;
  window.loadButton({
    target: "#reviewSubmitBtn", text: "등록", variant: "primary",
    onClick: () => submitReview(),
  });
  selectedScore = 0;
  initWriteStars();
}

function initWriteStars() {
  const stars = Array.from(document.querySelectorAll(".rstar-input"));
  const hint  = document.getElementById("writeStarHint");
  stars.forEach((star) => {
    star.addEventListener("mouseenter", () =>
      stars.forEach((s) => s.classList.toggle("is-on", +s.dataset.val <= +star.dataset.val))
    );
    star.addEventListener("mouseleave", () =>
      stars.forEach((s) => s.classList.toggle("is-on", +s.dataset.val <= selectedScore))
    );
    star.addEventListener("click", () => {
      selectedScore = +star.dataset.val;
      stars.forEach((s) => s.classList.toggle("is-on", +s.dataset.val <= selectedScore));
      if (hint) hint.textContent = `(${selectedScore}점)`;
    });
  });
}

/* -------- 리뷰 CRUD -------- */
async function submitReview() {
  const textarea = document.getElementById("reviewTextarea");
  const text     = textarea?.value.trim();
  if (!selectedScore) return alert("별점을 선택해주세요.");
  if (!text)          return alert("리뷰 내용을 입력해주세요.");

  try {
    if (editingId !== null) {
      // UPDATE
      const { error } = await supabase
        .from("reviews")
        .update({ rating: selectedScore, review_content: text })
        .eq("review_id", editingId);
      if (error) throw error;

      const target = reviewData.find((r) => r.id === editingId);
      if (target) { target.score = selectedScore; target.text = text; }
      editingId = null;

    } else {
      // INSERT
      const today   = new Date();
      const dateStr = `${today.getFullYear()}.${String(today.getMonth()+1).padStart(2,"0")}.${String(today.getDate()).padStart(2,"0")}`;

      const { data: inserted, error } = await supabase
        .from("reviews")
        .insert({
          tool_id:        TOOL_ID,
          user_id:        currentUser.id,
          rating:         selectedScore,
          review_content: text,
        })
        .select("review_id")
        .single();
      if (error) throw error;

      reviewData.unshift({
        id:     inserted?.review_id ?? Date.now(),
        name:   currentUser.name,
        avatar: currentUser.avatar,
        date:   dateStr,
        score:  selectedScore,
        text,
        isMine: true,
      });
    }
  } catch (e) {
    console.error("리뷰 저장 실패:", e);
    alert("리뷰 저장 중 오류가 발생했습니다.");
    return;
  }

  selectedScore = 0;
  renderMyReviewArea();
  renderReviewList();
  updateAvgScore();
}

function startEditMyReview() {
  const myReview = reviewData.find((r) => r.isMine);
  if (!myReview) return;
  editingId     = myReview.id;
  selectedScore = myReview.score;

  const writeArea = document.querySelector(".review-write");
  writeArea.innerHTML = `
    <div class="review-write__head">
      <div class="review-write__title">리뷰 수정</div>
    </div>
    <div class="review-write__box">
      <div class="review-write__stars" id="writeStars">
        ${[1,2,3,4,5].map((n) =>
          `<span class="rstar-input" data-val="${n}">★</span>`
        ).join("")}
        <span class="review-write__hint" id="writeStarHint">(${selectedScore}점)</span>
      </div>
      <textarea class="review-write__textarea" id="reviewTextarea"
        placeholder="리뷰를 작성해주세요." maxlength="300">${myReview.text}</textarea>
    </div>
    <div class="review-write__submit" id="reviewSubmitBtn"></div>
  `;
  window.loadButton({
    target: "#reviewSubmitBtn", text: "수정 완료", variant: "primary",
    onClick: () => submitReview(),
  });
  initWriteStars();
  document.querySelectorAll(".rstar-input").forEach((s) =>
    s.classList.toggle("is-on", +s.dataset.val <= selectedScore)
  );
}

async function deleteMyReview(id) {
  if (!confirm("리뷰를 삭제할까요?")) return;
  try {
    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("review_id", id);
    if (error) throw error;

    const idx = reviewData.findIndex((r) => r.id === id);
    if (idx !== -1) reviewData.splice(idx, 1);

  } catch (e) {
    console.error("리뷰 삭제 실패:", e);
    alert("삭제 중 오류가 발생했습니다.");
    return;
  }
  renderMyReviewArea();
  renderReviewList();
  updateAvgScore();
}

function updateAvgScore() {
  const numEl   = document.getElementById("avgScoreNum");
  const starsEl = document.getElementById("avgScoreStars");

  if (!reviewData.length) {
    if (numEl)   numEl.textContent = "0 점";
    if (starsEl) starsEl.innerHTML = [1,2,3,4,5].map(() =>
      `<span class="rstar is-off">★</span>`
    ).join("");
    updateCardStars(0);
    return;
  }

  const avg     = reviewData.reduce((s, r) => s + r.score, 0) / reviewData.length;
  const rounded = Math.round(avg * 10) / 10;
  if (numEl)   numEl.textContent = `${rounded} 점`;
  if (starsEl) starsEl.innerHTML = [1,2,3,4,5].map((n) =>
    `<span class="rstar ${n <= Math.round(avg) ? "is-on" : "is-off"}">★</span>`
  ).join("");
  updateCardStars(Math.round(avg));
}

/* 좌측 툴 카드 별점 동기화 */
function updateCardStars(roundedAvg) {
  const cardStarsEl = document.querySelector(".detail_AI__stars");
  if (!cardStarsEl) return;
  cardStarsEl.innerHTML = [1,2,3,4,5].map((n) =>
    `<span class="star ${n <= roundedAvg ? "is-on" : "is-off"}">★</span>`
  ).join("");
}

window.startEditMyReview = startEditMyReview;
window.deleteMyReview    = deleteMyReview;

/* ============================================================
   리뷰 정렬 셀렉트
============================================================ */
function initReviewSort() {
  if (!document.querySelector("#reviewSortSelect")) return;
  loadNativeSelect({
    target:      "#reviewSortSelect",
    options: [
      { label: "최신순",      value: "new"  },
      { label: "평점 높은순", value: "high" },
      { label: "평점 낮은순", value: "low"  },
    ],
    placeholder: "선택",
    onChange: (item) => {
      currentSort = item?.value ?? "none";
      renderReviewList();
    },
  });
}

/* ============================================================
   사이트 미리보기
   iframe=false → 그라데이션 배경 + 로고(icon) 카드
   iframe=true  → iframe 임베드 카드
============================================================ */
function setSitePreview({ name, url, icon, iframeEnabled = false } = {}) {
  // 텍스트 정보
  const nameEl = document.getElementById("sitePreviewName");
  const urlEl  = document.getElementById("sitePreviewUrl");
  if (nameEl && name) nameEl.textContent = name;
  if (urlEl  && url)  { urlEl.textContent = url; urlEl.href = url; }

  const mediaEl = document.querySelector(".site-preview__media");
  const cardEl  = document.querySelector(".site-preview__card");
  if (!mediaEl) return;

  // 기존 iframe 제거 (재호출 방지)
  mediaEl.querySelectorAll("iframe").forEach(el => el.remove());
  cardEl?.classList.remove("has-iframe");
  mediaEl.classList.remove("has-iframe");

  if (iframeEnabled && url) {
    // ── iframe 모드 ──
    cardEl?.classList.add("has-iframe");
    mediaEl.classList.add("has-iframe");
    const iframe = document.createElement("iframe");
    iframe.src   = url;
    iframe.title = name || "사이트 미리보기";
    iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
    mediaEl.appendChild(iframe);
    // 로고 숨김
    const logo = mediaEl.querySelector(".site-preview__fallback-logo, img");
    if (logo) logo.style.display = "none";

  } else {
    // ── 로고 카드 모드 (iframe=false) ──
    // 그라데이션 배경은 CSS .site-preview__media 기본 스타일이 담당
    // icon CDN URL이 있으면 img src 교체
    const imgEl = mediaEl.querySelector("img");
    if (imgEl) {
      imgEl.style.display = "";
      if (icon) imgEl.src = icon;
    }
    // fallback-logo 래퍼로 감싸기 (아직 안 돼 있으면)
    if (imgEl && !imgEl.closest(".site-preview__fallback-logo")) {
      const wrapper = document.createElement("div");
      wrapper.className = "site-preview__fallback-logo";
      imgEl.replaceWith(wrapper);
      wrapper.appendChild(imgEl);
    }
  }
}

/* ============================================================
   섹션 탭
============================================================ */
function initSectionTabs() {
  const tabsRoot = document.getElementById("sectionTabs");
  if (!tabsRoot) return;

  const tabs       = Array.from(tabsRoot.querySelectorAll(".section-tab"));
  const sectionEls = tabs.map((t) => document.getElementById(t.dataset.target)).filter(Boolean);

  function getOffset() {
    const bh = document.querySelector(".detail_AI-banner-root")?.getBoundingClientRect().height ?? 0;
    const th = document.getElementById("sectionTabs")?.getBoundingClientRect().height ?? 0;
    return bh + th + 12;
  }

  tabsRoot.addEventListener("click", (e) => {
    const tab = e.target.closest(".section-tab");
    if (!tab) return;
    const targetEl = document.getElementById(tab.dataset.target);
    if (!targetEl) return;
    tabs.forEach((t) => t.classList.remove("is-active"));
    tab.classList.add("is-active");
    window.scrollTo({
      top: window.scrollY + targetEl.getBoundingClientRect().top - getOffset(),
      behavior: "smooth",
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((e) => e.isIntersecting);
      if (!visible.length) return;
      visible.sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top));
      const activeId = visible[0].target.id;
      tabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.target === activeId));
    },
    { root: null, rootMargin: `-${getOffset()}px 0px -60% 0px`, threshold: 0.01 }
  );
  sectionEls.forEach((el) => observer.observe(el));
}

/* ============================================================
   유틸
============================================================ */
function setTextEl(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}