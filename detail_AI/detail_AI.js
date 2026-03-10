import { loadNativeSelect } from "/_common/select/select.js";

document.addEventListener("DOMContentLoaded", async () => {
  await Promise.all([
    window.loadToolIconCard("#toolIconMount", {
      toolName: "Midjourney",
      url: "https://www.midjourney.com/",
    }),
    window.loadButton({
      target: "#visitSiteBtn",
      text: "사이트 바로가기",
      variant: "primary",
      onClick: () => window.open("https://www.midjourney.com/", "_blank"),
    }),
    window.loadButton({
      target: "#wishlistBtn",
      text: "관심 목록에 추가",
      variant: "outline",
      onClick: () => alert("관심 목록에 추가!"),
    }),
    window.loadButton({
      target: "#planBtn1",
      text: "사이트 바로가기",
      variant: "outline",
      onClick: () => window.open("https://www.midjourney.com/", "_blank"),
    }),
    window.loadButton({
      target: "#planBtn2",
      text: "사이트 바로가기",
      variant: "primary",
      onClick: () => window.open("https://www.midjourney.com/", "_blank"),
    }),
    window.loadButton({
      target: "#planBtn3",
      text: "사이트 바로가기",
      variant: "primary",
      onClick: () => window.open("https://www.midjourney.com/", "_blank"),
    }),
    window.loadButton({
      target: "#promoBtn",
      text: "사이트 바로가기",
      variant: "outline",
      onClick: () => window.open("https://www.midjourney.com/", "_blank"),
    }),
    window.loadButton({
      target: "#reviewSubmitBtn",
      text: "등록",
      variant: "primary",
      onClick: () => submitReview(),
    }),
  ]);

  const allSimTools = [
    { name: "Pitch",            url: "https://pitch.com/" },
    { name: "Canva",            url: "https://www.canva.com/" },
    { name: "Gemini",           url: "https://gemini.google.com/" },
    { name: "Gamma AI",         url: "https://gamma.app/" },
    { name: "DALL·E",           url: "https://openai.com/dall-e" },
    { name: "Stable Diffusion", url: "https://stability.ai/" },
    { name: "Adobe Firefly",    url: "https://firefly.adobe.com/" },
    { name: "Runway",           url: "https://runwayml.com/" },
    { name: "Pika",             url: "https://pika.art/" },
    { name: "Kling AI",         url: "https://klingai.com/" },
    { name: "Leonardo",         url: "https://leonardo.ai/" },
    { name: "Ideogram",         url: "https://ideogram.ai/" },
  ];

  initReviewSort();
  initSectionTabs();
  setSitePreview({ name: "Midjourney", url: "https://www.midjourney.com/" });
  initWorkCarousel();
  initSimilarToolsSlider(allSimTools);
  initReviewSystem();
});

/* ============================
   리뷰 시스템
============================= */

const reviewData = [
  { id: 1, name: "민주 캉", avatar: "/media/profil.png", date: "2026.01.01", score: 4, text: "이미지 퀄리티가 정말 뛰어나요!", isMine: false },
  { id: 2, name: "김지수",  avatar: "/media/profil.png", date: "2026.01.02", score: 5, text: "프롬프트 결과가 매번 놀랍네요.", isMine: false },
  { id: 3, name: "이하늘",  avatar: "/media/profil.png", date: "2026.01.03", score: 3, text: "가격이 좀 비싼 편이에요.", isMine: false },
  { id: 4, name: "박서연",  avatar: "/media/profil.png", date: "2026.01.04", score: 5, text: "디자인 작업에 없어선 안 될 툴!", isMine: false },
  { id: 5, name: "최민준",  avatar: "/media/profil.png", date: "2026.01.05", score: 4, text: "업데이트가 빠르고 퀄리티가 좋아요.", isMine: false },
  { id: 6, name: "정유진",  avatar: "/media/profil.png", date: "2026.01.06", score: 2, text: "처음 쓰기엔 진입장벽이 있어요.", isMine: false },
];

let currentReviewPage = 0;
let selectedScore = 0;
let editingId = null;
const PAGE_SIZE_REVIEW = 3;

function initReviewSystem() {
  initWriteStars();
  renderReviewPage(0);
  renderMyReviewArea();
}

/** 왼쪽 영역: 입력창 or 내 리뷰 카드 */
function renderMyReviewArea() {
  const myReview = reviewData.find((r) => r.isMine);
  const writeArea = document.querySelector(".review-write");
  if (!writeArea) return;

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
          <div class="review-card__avatar">
            <img src="${myReview.avatar}" alt="${myReview.name}" />
          </div>
          <div class="review-card__name">${myReview.name}</div>
          <div class="review-card__actions">
            <button class="review-card__action-btn" onclick="startEditMyReview()">수정</button>
            <button class="review-card__action-btn review-card__action-btn--delete" onclick="deleteMyReview(${myReview.id})">삭제</button>
          </div>
        </div>
      </article>
    `;
  } else {
    writeArea.innerHTML = `
      <div class="review-write__head">
        <div class="review-write__title">리뷰 쓰기</div>
      </div>
      <div class="review-write__box">
        <div class="review-write__stars" aria-label="내 별점" id="writeStars">
          <span class="rstar-input" data-val="1">★</span>
          <span class="rstar-input" data-val="2">★</span>
          <span class="rstar-input" data-val="3">★</span>
          <span class="rstar-input" data-val="4">★</span>
          <span class="rstar-input" data-val="5">★</span>
          <span class="review-write__hint" id="writeStarHint">(0점)</span>
        </div>
        <textarea
          class="review-write__textarea"
          id="reviewTextarea"
          placeholder="리뷰를 작성해주세요."
          maxlength="300"
        ></textarea>
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
}

/** 별점 입력 초기화 */
function initWriteStars() {
  const stars = Array.from(document.querySelectorAll(".rstar-input"));
  const hint = document.getElementById("writeStarHint");

  stars.forEach((star) => {
    star.addEventListener("mouseenter", () => {
      const val = +star.dataset.val;
      stars.forEach((s) => s.classList.toggle("is-on", +s.dataset.val <= val));
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

/** 리뷰 등록 */
function submitReview() {
  const textarea = document.getElementById("reviewTextarea");
  const text = textarea?.value.trim();

  if (!selectedScore) return alert("별점을 선택해주세요.");
  if (!text) return alert("리뷰 내용을 입력해주세요.");

  const today = new Date();
  const date = `${today.getFullYear()}.${String(today.getMonth()+1).padStart(2,"0")}.${String(today.getDate()).padStart(2,"0")}`;

  if (editingId !== null) {
    const target = reviewData.find((r) => r.id === editingId);
    if (target) {
      target.text = text;
      target.score = selectedScore;
      target.date = date;
    }
    editingId = null;
  } else {
    reviewData.unshift({
      id: Date.now(),
      name: "나",
      avatar: "/media/profil.png",
      date,
      score: selectedScore,
      text,
      isMine: true,
    });
  }

  selectedScore = 0;
  renderMyReviewArea();
  renderReviewPage(0);
  updateAvgScore();
}

/** 수정 모드 진입 */
function startEditMyReview() {
  const myReview = reviewData.find((r) => r.isMine);
  if (!myReview) return;

  editingId = myReview.id;
  selectedScore = myReview.score;

  const writeArea = document.querySelector(".review-write");
  writeArea.innerHTML = `
    <div class="review-write__head">
      <div class="review-write__title">리뷰 수정</div>
    </div>
    <div class="review-write__box">
      <div class="review-write__stars" aria-label="내 별점" id="writeStars">
        <span class="rstar-input" data-val="1">★</span>
        <span class="rstar-input" data-val="2">★</span>
        <span class="rstar-input" data-val="3">★</span>
        <span class="rstar-input" data-val="4">★</span>
        <span class="rstar-input" data-val="5">★</span>
        <span class="review-write__hint" id="writeStarHint">(${selectedScore}점)</span>
      </div>
      <textarea
        class="review-write__textarea"
        id="reviewTextarea"
        placeholder="리뷰를 작성해주세요."
        maxlength="300"
      >${myReview.text}</textarea>
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

/** 삭제 */
function deleteMyReview(id) {
  if (!confirm("리뷰를 삭제할까요?")) return;
  const idx = reviewData.findIndex((r) => r.id === id);
  if (idx !== -1) reviewData.splice(idx, 1);
  renderMyReviewArea();
  renderReviewPage(0);
  updateAvgScore();
}

/** 리뷰 페이지 렌더링 */
function renderReviewPage(pageIndex) {
  currentReviewPage = pageIndex;
  const container = document.getElementById("reviewCards");
  const countEl = document.getElementById("reviewCount");
  if (!container) return;

  const otherReviews = reviewData.filter((r) => !r.isMine);
  const totalPages = Math.ceil(otherReviews.length / PAGE_SIZE_REVIEW);

  const dotsContainer = document.getElementById("reviewDots");
  if (dotsContainer) {
    dotsContainer.innerHTML = Array.from({ length: totalPages })
      .map((_, i) => `<span class="rdot${i === pageIndex ? " is-active" : ""}"></span>`)
      .join("");
    dotsContainer.querySelectorAll(".rdot").forEach((dot, i) => {
      dot.addEventListener("click", () => renderReviewPage(i));
    });
  }

  if (countEl) countEl.textContent = `전체 리뷰 (${reviewData.length})`;

  const start = pageIndex * PAGE_SIZE_REVIEW;
  const pageItems = otherReviews.slice(start, start + PAGE_SIZE_REVIEW);

  container.innerHTML = pageItems.map((r) => `
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
        <div class="review-card__avatar">
          <img src="${r.avatar}" alt="${r.name}" />
        </div>
        <div class="review-card__name">${r.name}</div>
      </div>
    </article>
  `).join("");
}

/** 평균 별점 업데이트 */
function updateAvgScore() {
  if (!reviewData.length) return;
  const avg = reviewData.reduce((s, r) => s + r.score, 0) / reviewData.length;
  const rounded = Math.round(avg * 10) / 10;

  const numEl = document.getElementById("avgScoreNum");
  const starsEl = document.getElementById("avgScoreStars");
  if (numEl) numEl.textContent = `${rounded} 점`;
  if (starsEl) {
    starsEl.innerHTML = [1,2,3,4,5].map((n) =>
      `<span class="rstar ${n <= Math.round(avg) ? "is-on" : "is-off"}">★</span>`
    ).join("");
  }
}

// 전역 등록
window.startEditMyReview = startEditMyReview;
window.deleteMyReview = deleteMyReview;

/* ============================
   유사 툴 슬라이더
============================= */
async function initSimilarToolsSlider(allTools) {
  const PAGE_SIZE = 4;

  async function renderPage(pageIndex) {
    const start = pageIndex * PAGE_SIZE;
    const pageTools = allTools.slice(start, start + PAGE_SIZE);
    await Promise.all(
      pageTools.map((tool, i) =>
        window.loadToolIconCard(`#simTool${i + 1}`, {
          toolName: tool.name,
          url: tool.url,
        })
      )
    );
  }

  const dots = Array.from(document.querySelectorAll(".similar-tools__dots .sdot"));
  dots.forEach((dot, i) => {
    dot.addEventListener("click", async () => {
      dots.forEach((d) => d.classList.remove("is-active"));
      dot.classList.add("is-active");
      await renderPage(i);
    });
  });

  await renderPage(0);
}

/* ============================
   작업물 캐러셀
============================= */
function initWorkCarousel() {
  const dots = Array.from(document.querySelectorAll(".detail_AI__dots .dot"));
  const workImg = document.querySelector(".detail_AI__carousel-frame img");

  const images = [
    "/media/work.png",
    "/media/work2.png",
    "/media/work3.png",
    "/media/work4.png",
    "/media/work5.png",
  ];

  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => {
      dots.forEach((d) => d.classList.remove("is-active"));
      dot.classList.add("is-active");
      if (workImg) workImg.src = images[i];
    });
  });
}

/* ============================
   리뷰 정렬 셀렉트
============================= */
function initReviewSort() {
  const mount = document.querySelector("#reviewSortSelect");
  if (!mount) return;

  loadNativeSelect({
    target: "#reviewSortSelect",
    options: [
      { label: "최신순",      value: "new" },
      { label: "평점 높은순", value: "high" },
      { label: "평점 낮은순", value: "low" },
    ],
    placeholder: "최신순",
    onChange: (item) => console.log("정렬 선택:", item),
  });
}

/* ============================
   사이트 미리보기
============================= */
function setSitePreview({ name, url } = {}) {
  const nameEl = document.getElementById("sitePreviewName");
  const urlEl  = document.getElementById("sitePreviewUrl");
  if (nameEl && name) nameEl.textContent = name;
  if (urlEl  && url)  { urlEl.textContent = url; urlEl.href = url; }
}

/* ============================
   섹션 탭
============================= */
function initSectionTabs() {
  const tabsRoot = document.getElementById("sectionTabs");
  if (!tabsRoot) return;

  const tabs = Array.from(tabsRoot.querySelectorAll(".section-tab"));
  const sectionEls = tabs.map((t) => document.getElementById(t.dataset.target)).filter(Boolean);

  function getOffset() {
    const bannerH = document.querySelector(".detail_AI-banner-root")?.getBoundingClientRect().height ?? 0;
    const tabsH   = document.getElementById("sectionTabs")?.getBoundingClientRect().height ?? 0;
    return bannerH + tabsH + 12;
  }

  tabsRoot.addEventListener("click", (e) => {
    const tab = e.target.closest(".section-tab");
    if (!tab) return;
    const targetEl = document.getElementById(tab.dataset.target);
    if (!targetEl) return;
    tabs.forEach((t) => t.classList.remove("is-active"));
    tab.classList.add("is-active");
    const y = window.scrollY + targetEl.getBoundingClientRect().top - getOffset();
    window.scrollTo({ top: y, behavior: "smooth" });
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