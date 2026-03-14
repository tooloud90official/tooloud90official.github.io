import { loadNativeSelect } from "/_common/select/select.js";
import { supabase } from "/_ignore/supabase.js";

/* ============================================================
   URL 파라미터
   - 이전 페이지에서 ?tool=Claude 처럼 전달됨
   - 여기서는 tool 값을 tool_name 으로 사용해서 tools 조회
============================================================ */
const TOOL_NAME = decodeURIComponent(
  new URLSearchParams(location.search).get("tool") || ""
).trim();

let TOOL_ID = null;

/* ============================================================
   Auth — supabase.auth.getUser() 로 현재 로그인 유저 확인
============================================================ */
let currentUser = null; // { id, name, avatar } | null

async function loadCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    currentUser = null;
    return;
  }

  currentUser = {
    id: user.id,
    name: user.user_metadata?.user_name ?? user.email ?? "나",
    avatar: user.user_metadata?.avatar_url ?? "/media/profil.png",
  };
}

/* ============================================================
   아이콘 카드에 Brandfetch CDN 이미지 적용
============================================================ */
function applyToolIcon(mountSelector, iconUrl) {
  if (!iconUrl) return;
  const iconEl = document.querySelector(`${mountSelector} .tool-icon-card__icon`);
  if (iconEl) iconEl.style.backgroundImage = `url("${iconUrl}")`;
}

/* ============================================================
   전역 상태
============================================================ */
let reviewData = [];
let selectedScore = 0;
let editingId = null;
let currentSort = "none";

/* ============================================================
   DOMContentLoaded
============================================================ */
document.addEventListener("DOMContentLoaded", async () => {
  await loadCurrentUser();

  updateAvgScore();
  updateCardStars(0);

  await Promise.all([
    window.loadButton({
      target: "#visitSiteBtn",
      text: "사이트 바로가기",
      variant: "primary",
      onClick: () => {},
    }),

    window.loadButton({
      target: "#wishlistBtn",
      text: "관심 목록에 추가",
      variant: "outline",
      onClick: () => {},
    }).then(() => {
      const btn = document.querySelector("#wishlistBtn .btn");
      if (!btn) return;

      btn.innerHTML = `
        <img src="/media/pin.png"
          style="width:1em;height:1em;object-fit:contain;vertical-align:middle;margin-right:6px;">
        관심 목록에 추가
      `;

      let pinned = false;

      btn.addEventListener("click", () => {
        if (!currentUser) {
          window.location.href = "/login1/login.html";
          return;
        }

        pinned = !pinned;
        const img = btn.querySelector("img");
        if (img) {
          img.src = pinned ? "/media/pin_fill.png" : "/media/pin.png";
        }
      });
    }),

    window.loadButton({
      target: "#planBtn1",
      text: "사이트 바로가기",
      variant: "outline",
      onClick: () => {},
    }),
    window.loadButton({
      target: "#planBtn2",
      text: "사이트 바로가기",
      variant: "primary",
      onClick: () => {},
    }),
    window.loadButton({
      target: "#planBtn3",
      text: "사이트 바로가기",
      variant: "primary",
      onClick: () => {},
    }),
    window.loadButton({
      target: "#promoBtn",
      text: "사이트 바로가기",
      variant: "outline",
      onClick: () => {},
    }),
  ]);

  const toolRow = await loadToolInfo();

  if (TOOL_ID) {
    await Promise.all([loadWorks(), loadReviews()]);
  } else {
    renderEmptyWorks();
    reviewData = [];
    updateAvgScore();
  }

  const toolUrl = toolRow?.tool_link ?? "#";
  ["#visitSiteBtn", "#planBtn1", "#planBtn2", "#planBtn3", "#promoBtn"].forEach((sel) => {
    document.querySelector(`${sel} .btn`)?.addEventListener("click", () => {
      if (toolUrl && toolUrl !== "#") window.open(toolUrl, "_blank");
    });
  });

  initReviewSort();
  initSectionTabs();
  initReviewSystem();
});

/* ============================================================
   툴 정보 로드 (tools 테이블)
   - URL의 ?tool=값을 tool_name 으로 조회
   - 조회 성공 시 실제 tool_ID 저장
============================================================ */
async function loadToolInfo() {
  try {
    if (!TOOL_NAME) {
      throw new Error("URL에 tool 파라미터가 없음");
    }

    const { data, error } = await supabase
      .from("tools")
      .select("*")
      .eq("tool_name", TOOL_NAME)
      .limit(1)
      .single();

    if (error || !data) throw error ?? new Error("툴 없음");

    TOOL_ID = data.tool_ID;

    await window.loadToolIconCard("#toolIconMount", {
      toolName: data.tool_name ?? "",
      url: data.tool_link ?? "#",
    });
    applyToolIcon("#toolIconMount", data.icon);

    setTextEl("toolBrand", `@ ${data.tool_company ?? ""}`);
    setTextEl("toolDesc", data.tool_des ?? "");

    setSitePreview({
      name: data.tool_name,
      url: data.tool_link,
      icon: data.icon,
      iframeEnabled: data.iframe ?? false,
    });

    renderPlanCards(data);
    renderPromo(data.tool_name, data.tool_prom);
    await loadSimilarTools(data.tool_cat, data.tool_ID);

    return data;
  } catch (e) {
    console.error("툴 정보 로드 실패:", e);

    await window.loadToolIconCard("#toolIconMount", {
      toolName: TOOL_NAME || "툴 정보 없음",
      url: "#",
    });

    setTextEl("toolBrand", "");
    setTextEl("toolDesc", "툴 정보를 불러오지 못했습니다.");

    const dotsEl = document.querySelector(".similar-tools__dots");
    if (dotsEl) {
      dotsEl.innerHTML = "";
      dotsEl.style.display = "none";
    }

    const rowEl = document.getElementById("similarToolsRow");
    if (rowEl) renderSimEmpty(rowEl);

    return null;
  }
}

/* ============================================================
   플랜 카드 렌더링
============================================================ */
function renderPlanCards(tool) {
  function getEmoji(text) {
    if (/무제한|unlimited/i.test(text)) return "♾️";
    if (/무료|free/i.test(text)) return "🆓";
    if (/API/i.test(text)) return "🔌";
    if (/팀|인원|계정|멤버/i.test(text)) return "👥";
    if (/분석|리포트|통계/i.test(text)) return "📊";
    if (/지원|서포트|support/i.test(text)) return "🛟";
    if (/보안|privacy|SSL/i.test(text)) return "🔒";
    if (/속도|빠른|fast/i.test(text)) return "⚡";
    if (/이미지|생성|create/i.test(text)) return "🎨";
    if (/비디오|영상|video/i.test(text)) return "🎬";
    if (/클라우드|저장|storage/i.test(text)) return "☁️";
    if (/크레딧|credit/i.test(text)) return "💳";
    return "✅";
  }

  const plans = [
    { nameKey: "tool_plan1_name", priceKey: "tool_plan1_price_krw", desKey: "tool_plan1_des" },
    { nameKey: "tool_plan2name", priceKey: "tool_plan2_price_krw", desKey: "tool_plan2_des" },
    { nameKey: "tool_plan3_name", priceKey: "tool_plan3_price_krw", desKey: "tool_plan3_des" },
  ];

  plans.forEach(({ nameKey, priceKey, desKey }, i) => {
    const card = document.querySelectorAll(".plan-card")[i];
    if (!card) return;

    const nameEl = card.querySelector(".plan-card__name");
    const listEl = card.querySelector(".plan-card__list");
    const topEl = card.querySelector(".plan-card__top");

    if (nameEl) nameEl.textContent = tool[nameKey] ?? "";

    const price = tool[priceKey];
    if (topEl && price !== undefined && price !== null && price !== "") {
      let priceEl = topEl.querySelector(".plan-card__price");
      if (!priceEl) {
        priceEl = document.createElement("div");
        priceEl.className = "plan-card__price";
        topEl.appendChild(priceEl);
      }
      priceEl.textContent = Number(price) === 0 ? "무료" : `₩${Number(price).toLocaleString()} / 월`;
    }

    if (listEl) {
      const raw = tool[desKey] ?? "";
      const lines = raw
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean);

      listEl.innerHTML = lines
        .map((line) => `<li><span class="plan-item-emoji">${getEmoji(line)}</span>${line}</li>`)
        .join("");
    }
  });
}

/* ============================================================
   프로모션 렌더
============================================================ */
function renderPromo(toolName, toolProm) {
  const section = document.getElementById("promoSection");
  const titleEl = document.querySelector(".promo__title");
  const headlineEl = document.querySelector(".promo-banner__headline");
  const subEl = document.querySelector(".promo-banner__sub");
  const dateEl = document.querySelector(".promo-banner__date");

  if (titleEl && toolName) {
    titleEl.textContent = `${toolName} 에서 진행 중인 프로모션`;
  }

  if (!toolProm) {
    if (section) section.style.display = "none";
    return;
  }

  const lines = toolProm.split(/[\/,\n]/).map((s) => s.trim()).filter(Boolean);

  function getPromoEmoji(text) {
    if (/할인|%|dc/i.test(text)) return "🎉";
    if (/무료|free/i.test(text)) return "🆓";
    if (/기간|기한|만료/i.test(text)) return "📅";
    if (/크레딧|credit/i.test(text)) return "💳";
    if (/상시|언제든/i.test(text)) return "♾️";
    if (/Pro|프로/i.test(text)) return "⭐";
    if (/가입|신규/i.test(text)) return "🙋";
    if (/확인|자세|상세/i.test(text)) return "🔍";
    return "✨";
  }

  if (headlineEl && lines[0]) {
    headlineEl.textContent = `${getPromoEmoji(lines[0])} ${lines[0]}`;
  }

  if (subEl) {
    if (lines.length > 1) {
      subEl.innerHTML = lines
        .slice(1)
        .map((l) => `<span>${getPromoEmoji(l)} ${l}</span>`)
        .join("<br>");
    } else {
      subEl.style.display = "none";
    }
  }

  if (dateEl) dateEl.style.display = "none";
}

/* ============================================================
   유사 툴 (tool_cat 기반)
============================================================ */
async function loadSimilarTools(toolCat, currentToolId) {
  const rowEl = document.getElementById("similarToolsRow");
  const dotsEl = document.querySelector(".similar-tools__dots");

  if (dotsEl) {
    dotsEl.innerHTML = "";
    dotsEl.style.display = "none";
  }

  if (!rowEl || !toolCat) {
    if (rowEl) renderSimEmpty(rowEl);
    return;
  }

  try {
    const { data, error } = await supabase
      .from("tools")
      .select("tool_ID, tool_name, tool_link, icon")
      .eq("tool_cat", toolCat)
      .neq("tool_ID", currentToolId)
      .limit(8);

    if (error) throw error;

    if (!data?.length) {
      renderSimEmpty(rowEl);
      return;
    }

    const PAGE = 4;
    const totalPages = Math.ceil(data.length / PAGE);

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

  rowEl.innerHTML = pageTools
    .map(
      (_, i) => `
      <div class="similar-tools__item">
        <div class="similar-tools__mount" id="simTool${i + 1}"></div>
      </div>
    `
    )
    .join("");

  await Promise.all(
    pageTools.map(async (tool, i) => {
      await window.loadToolIconCard(`#simTool${i + 1}`, {
        toolName: tool.tool_name,
        url: tool.tool_link ?? "#",
      });
      applyToolIcon(`#simTool${i + 1}`, tool.icon);
    })
  );
}

/* ============================================================
   작업물 로드 (works 테이블)
============================================================ */
async function loadWorks() {
  try {
    if (!TOOL_ID) {
      renderEmptyWorks();
      return;
    }

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

/* ============================================================
   작업물 없을 때
============================================================ */
function renderEmptyWorks() {
  const profile = document.querySelector(".detail_AI__profile");
  const showcase = document.querySelector(".detail_AI__showcase");
  const carousel = document.querySelector(".detail_AI__carousel");

  if (profile) profile.style.display = "none";
  if (showcase) showcase.style.gridTemplateColumns = "1fr";
  if (carousel) carousel.style.gridColumn = "1";

  if (!carousel) return;

  const wrapper = carousel.querySelector(".detail_AI__carousel-wrapper");
  const dots = carousel.querySelector(".detail_AI__dots");

  if (wrapper) {
    wrapper.outerHTML = `<div class="works-empty-text">아직 등록된 작업물이 없습니다.</div>`;
  }
  if (dots) dots.style.display = "none";
}

function renderWorksCarousel(works) {
  const frame = document.querySelector(".detail_AI__carousel-frame img");
  const likeEl = document.querySelector(".detail_AI__like-count");
  const dotsEl = document.querySelector(".detail_AI__dots");
  const nameEl = document.querySelector(".detail_AI__profile-name");

  if (frame) frame.src = works[0].work_path ?? "/media/work.png";
  if (likeEl) likeEl.textContent = works[0].like_count ?? 0;
  if (nameEl && works[0].user_id) nameEl.textContent = `by. ${works[0].user_id}`;

  if (dotsEl) {
    dotsEl.innerHTML = works
      .slice(0, 5)
      .map(
        (_, i) =>
          `<button class="dot${i === 0 ? " is-active" : ""}" type="button" aria-label="${i + 1}"></button>`
      )
      .join("");

    dotsEl.querySelectorAll(".dot").forEach((dot, i) => {
      dot.addEventListener("click", () => {
        dotsEl.querySelectorAll(".dot").forEach((d) => d.classList.remove("is-active"));
        dot.classList.add("is-active");

        if (frame) frame.src = works[i].work_path ?? "/media/work.png";
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
    if (!TOOL_ID) {
      reviewData = [];
      updateAvgScore();
      return;
    }

    const { data, error } = await supabase
      .from("reviews")
      .select("review_id, user_id, rating, review_content, created_at")
      .eq("tool_id", TOOL_ID)
      .order("created_at", { ascending: false });

    if (error) throw error;

    reviewData = (data ?? []).map((r) => ({
      id: r.review_id,
      name: r.user_id,
      avatar: "/media/profil.png",
      date: r.created_at?.slice(0, 10).replace(/-/g, ".") ?? "",
      score: r.rating ?? 0,
      text: r.review_content ?? "",
      isMine: currentUser ? r.user_id === currentUser.id : false,
    }));

    updateAvgScore();
    updateCardStars(Math.round(reviewData.reduce((s, r) => s + r.score, 0) / (reviewData.length || 1)));
  } catch (e) {
    console.error("리뷰 로드 실패:", e);
    reviewData = [];
    updateAvgScore();
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
  if (currentSort === "low") return [...others].sort((a, b) => a.score - b.score);
  if (currentSort === "new") return [...others].sort((a, b) => (b.date > a.date ? 1 : -1));

  return others;
}

function renderReviewList() {
  const container = document.getElementById("reviewCards");
  const countEl = document.getElementById("reviewCount");
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

  container.innerHTML = items
    .map(
      (r) => `
      <article class="review-card">
        <div class="review-card__date">${r.date}</div>
        <div class="review-card__stars">
          ${[1, 2, 3, 4, 5]
            .map((n) => `<span class="rstar ${n <= r.score ? "is-on" : "is-off"}">★</span>`)
            .join("")}
          <span class="review-card__rate">(${r.score}점)</span>
        </div>
        <div class="review-card__text">${r.text}</div>
        <div class="review-card__user">
          <div class="review-card__avatar"><img src="${r.avatar}" alt="${r.name}" /></div>
          <div class="review-card__name">${r.name}</div>
        </div>
      </article>
    `
    )
    .join("");
}

/* ============================================================
   리뷰 쓰기 영역
============================================================ */
function renderMyReviewArea() {
  const writeArea = document.querySelector(".review-write");
  if (!writeArea) return;

  if (!currentUser) {
    writeArea.innerHTML = `
      <div class="review-write__head">
        <div class="review-write__title">리뷰 쓰기</div>
      </div>
      <div class="review-write__locked">
        <div class="review-write__box review-write__box--disabled" aria-hidden="true">
          <div class="review-write__stars">
            ${[1, 2, 3, 4, 5].map(() => `<span class="rstar-input">★</span>`).join("")}
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

  const myReview = reviewData.find((r) => r.isMine);

  if (myReview) {
    writeArea.innerHTML = `
      <div class="review-write__head">
        <div class="review-write__title">내 리뷰</div>
      </div>
      <article class="review-card review-card--mine">
        <div class="review-card__date">${myReview.date}</div>
        <div class="review-card__stars">
          ${[1, 2, 3, 4, 5]
            .map((n) => `<span class="rstar ${n <= myReview.score ? "is-on" : "is-off"}">★</span>`)
            .join("")}
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

  writeArea.innerHTML = `
    <div class="review-write__head">
      <div class="review-write__title">리뷰 쓰기</div>
    </div>
    <div class="review-write__box">
      <div class="review-write__stars" id="writeStars">
        ${[1, 2, 3, 4, 5].map((n) => `<span class="rstar-input" data-val="${n}">★</span>`).join("")}
        <span class="review-write__hint" id="writeStarHint">(0점)</span>
      </div>
      <textarea class="review-write__textarea" id="reviewTextarea"
        placeholder="리뷰를 작성해주세요." maxlength="300"></textarea>
    </div>
    <div class="review-write__submit" id="reviewSubmitBtn"></div>
  `;

  window.loadButton({
    target: "#reviewSubmitBtn",
    text: "등록",
    variant: "primary",
    onClick: () => submitReview(),
  });

  selectedScore = 0;
  initWriteStars();
}

function initWriteStars() {
  const stars = Array.from(document.querySelectorAll(".rstar-input"));
  const hint = document.getElementById("writeStarHint");

  stars.forEach((star) => {
    star.addEventListener("mouseenter", () => {
      stars.forEach((s) => s.classList.toggle("is-on", +s.dataset.val <= +star.dataset.val));
    });

    star.addEventListener("mouseleave", () => {
      stars.forEach((s) => s.classList.toggle("is-on", +s.dataset.val <= selectedScore));
    });

    star.addEventListener("click", () => {
      selectedScore = +star.dataset.val;
      stars.forEach((s) => s.classList.toggle("is-on", +s.dataset.val <= selectedScore));
      if (hint) hint.textContent = `(${selectedScore}점)`;
    });
  });
}

/* ============================================================
   리뷰 CRUD
============================================================ */
async function submitReview() {
  const textarea = document.getElementById("reviewTextarea");
  const text = textarea?.value.trim();

  if (!selectedScore) return alert("별점을 선택해주세요.");
  if (!text) return alert("리뷰 내용을 입력해주세요.");
  if (!TOOL_ID) return alert("툴 정보를 찾을 수 없습니다.");

  try {
    if (editingId !== null) {
      const { error } = await supabase
        .from("reviews")
        .update({ rating: selectedScore, review_content: text })
        .eq("review_id", editingId);

      if (error) throw error;

      const target = reviewData.find((r) => r.id === editingId);
      if (target) {
        target.score = selectedScore;
        target.text = text;
      }

      editingId = null;
    } else {
      const today = new Date();
      const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(
        today.getDate()
      ).padStart(2, "0")}`;

      const { data: inserted, error } = await supabase
        .from("reviews")
        .insert({
          tool_id: TOOL_ID,
          user_id: currentUser.id,
          rating: selectedScore,
          review_content: text,
        })
        .select("review_id")
        .single();

      if (error) throw error;

      reviewData.unshift({
        id: inserted?.review_id ?? Date.now(),
        name: currentUser.name,
        avatar: currentUser.avatar,
        date: dateStr,
        score: selectedScore,
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

  editingId = myReview.id;
  selectedScore = myReview.score;

  const writeArea = document.querySelector(".review-write");
  if (!writeArea) return;

  writeArea.innerHTML = `
    <div class="review-write__head">
      <div class="review-write__title">리뷰 수정</div>
    </div>
    <div class="review-write__box">
      <div class="review-write__stars" id="writeStars">
        ${[1, 2, 3, 4, 5].map((n) => `<span class="rstar-input" data-val="${n}">★</span>`).join("")}
        <span class="review-write__hint" id="writeStarHint">(${selectedScore}점)</span>
      </div>
      <textarea class="review-write__textarea" id="reviewTextarea"
        placeholder="리뷰를 작성해주세요." maxlength="300">${myReview.text}</textarea>
    </div>
    <div class="review-write__submit" id="reviewSubmitBtn"></div>
  `;

  window.loadButton({
    target: "#reviewSubmitBtn",
    text: "수정 완료",
    variant: "primary",
    onClick: () => submitReview(),
  });

  initWriteStars();

  document.querySelectorAll(".rstar-input").forEach((s) => {
    s.classList.toggle("is-on", +s.dataset.val <= selectedScore);
  });
}

async function deleteMyReview(id) {
  if (!confirm("리뷰를 삭제할까요?")) return;

  try {
    const { error } = await supabase.from("reviews").delete().eq("review_id", id);

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
  const numEl = document.getElementById("avgScoreNum");
  const starsEl = document.getElementById("avgScoreStars");

  if (!reviewData.length) {
    if (numEl) numEl.textContent = "0 점";
    if (starsEl) {
      starsEl.innerHTML = [1, 2, 3, 4, 5]
        .map(() => `<span class="rstar is-off">★</span>`)
        .join("");
    }
    updateCardStars(0);
    return;
  }

  const avg = reviewData.reduce((s, r) => s + r.score, 0) / reviewData.length;
  const rounded = Math.round(avg * 10) / 10;

  if (numEl) numEl.textContent = `${rounded} 점`;
  if (starsEl) {
    starsEl.innerHTML = [1, 2, 3, 4, 5]
      .map((n) => `<span class="rstar ${n <= Math.round(avg) ? "is-on" : "is-off"}">★</span>`)
      .join("");
  }

  updateCardStars(Math.round(avg));
}

function updateCardStars(roundedAvg = 0) {
  const cardStarsEl = document.querySelector(".detail_AI__stars");
  if (!cardStarsEl) return;

  cardStarsEl.innerHTML = [1, 2, 3, 4, 5]
    .map((n) => `<span class="star ${n <= roundedAvg ? "is-on" : "is-off"}">★</span>`)
    .join("");
}

window.startEditMyReview = startEditMyReview;
window.deleteMyReview = deleteMyReview;

/* ============================================================
   리뷰 정렬 셀렉트
============================================================ */
function initReviewSort() {
  if (!document.querySelector("#reviewSortSelect")) return;

  loadNativeSelect({
    target: "#reviewSortSelect",
    options: [
      { label: "최신순", value: "new" },
      { label: "평점 높은순", value: "high" },
      { label: "평점 낮은순", value: "low" },
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
============================================================ */
function setSitePreview({ name, url, icon, iframeEnabled = false } = {}) {
  const nameEl = document.getElementById("sitePreviewName");
  const urlEl = document.getElementById("sitePreviewUrl");

  if (nameEl && name) nameEl.textContent = name;
  if (urlEl && url) {
    urlEl.textContent = url;
    urlEl.href = url;
  }

  const mediaEl = document.querySelector(".site-preview__media");
  const cardEl = document.querySelector(".site-preview__card");
  if (!mediaEl) return;

  mediaEl.querySelectorAll("iframe").forEach((el) => el.remove());
  cardEl?.classList.remove("has-iframe");
  mediaEl.classList.remove("has-iframe");

  if (iframeEnabled && url) {
    cardEl?.classList.add("has-iframe");
    mediaEl.classList.add("has-iframe");

    const iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.title = name || "사이트 미리보기";
    iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
    mediaEl.appendChild(iframe);

    const logo = mediaEl.querySelector(".site-preview__fallback-logo, img");
    if (logo) logo.style.display = "none";
  } else {
    const imgEl = mediaEl.querySelector("img");
    if (imgEl) {
      imgEl.style.display = "";
      if (icon) imgEl.src = icon;
    }

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

  const tabs = Array.from(tabsRoot.querySelectorAll(".section-tab"));
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

      tabs.forEach((tab) => {
        tab.classList.toggle("is-active", tab.dataset.target === activeId);
      });
    },
    {
      root: null,
      rootMargin: `-${getOffset()}px 0px -60% 0px`,
      threshold: 0.01,
    }
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