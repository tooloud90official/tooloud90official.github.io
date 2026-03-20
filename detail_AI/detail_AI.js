import { loadNativeSelect } from "/_common/select/select.js";
import { supabase } from "/_ignore/supabase.js";

const TOOL_ID = decodeURIComponent(
  new URLSearchParams(location.search).get("tool_ID") || ""
).trim();

let currentUser = null;

/* =========================================================
   작업물 미디어 타입 유틸 + 렌더러
========================================================= */
function getWorkExt(path = "") {
  const idx = path.lastIndexOf(".");
  return idx >= 0 ? path.slice(idx + 1).toLowerCase() : "";
}

function getWorkKind(path = "") {
  const ext = getWorkExt(path);
  if (["jpg","jpeg","png","gif","webp"].includes(ext)) return "image";
  if (["mp4","webm","mov"].includes(ext))              return "video";
  if (["mp3","wav","ogg","m4a"].includes(ext))         return "audio";
  if (ext === "pdf")                                   return "pdf";
  return "other";
}

async function renderWorkPdf(container, url) {
  container.innerHTML = `
    <div class="work-pdf-wrap">
      <div class="work-pdf-stage">
        <canvas class="work-pdf-canvas"></canvas>
      </div>
      <div class="work-pdf-controls">
        <button type="button" class="work-pdf-btn work-pdf-prev">이전</button>
        <div class="work-pdf-page work-pdf-indicator">1 / 1</div>
        <button type="button" class="work-pdf-btn work-pdf-next">다음</button>
      </div>
    </div>
  `;
  try {
    const lib = window.pdfjsLib;
    if (!lib) throw new Error("pdf.js not loaded");

    const canvas  = container.querySelector(".work-pdf-canvas");
    const pageEl  = container.querySelector(".work-pdf-indicator");
    const prevBtn = container.querySelector(".work-pdf-prev");
    const nextBtn = container.querySelector(".work-pdf-next");

    const pdfState = { doc: null, page: 1, total: 1 };

    async function drawPage() {
      if (!canvas || !pdfState.doc) return;
      const page  = await pdfState.doc.getPage(pdfState.page);
      const vp    = page.getViewport({ scale: 1 });
      const stage = canvas.parentElement;
      // ✅ stage의 실제 높이 기준으로 꽉 차게 scale 계산
      const stageW = stage.clientWidth  || 300;
      const stageH = stage.clientHeight || 220;
      const scale  = Math.min(stageW / vp.width, stageH / vp.height);
      const svp    = page.getViewport({ scale });
      canvas.width  = svp.width;
      canvas.height = svp.height;
      await page.render({ canvasContext: canvas.getContext("2d"), viewport: svp }).promise;
      if (pageEl) pageEl.textContent = `${pdfState.page} / ${pdfState.total}`;
    }

    pdfState.doc   = await lib.getDocument(url).promise;
    pdfState.total = pdfState.doc.numPages;
    await drawPage();

    prevBtn?.addEventListener("click", async () => {
      if (pdfState.page > 1) { pdfState.page--; await drawPage(); }
    });
    nextBtn?.addEventListener("click", async () => {
      if (pdfState.page < pdfState.total) { pdfState.page++; await drawPage(); }
    });
  } catch (e) {
    console.error("PDF 렌더 실패:", e);
    container.innerHTML = `
      <div class="work-fallback">
        <div class="work-fallback__icon">📄</div>
        <p class="work-fallback__text">PDF를 불러올 수 없습니다</p>
      </div>`;
  }
}

async function renderWorkMedia(container, work) {
  if (!container) return;
  const url  = work.work_link ?? "";
  const path = work.work_path ?? "";
  const kind = url ? getWorkKind(path) : "empty";

  container.innerHTML = "";

  if (kind === "image") {
    container.innerHTML = `<img class="work-img" src="${url}" alt="작업물" />`;
    return;
  }
  if (kind === "video") {
    // ✅ upload처럼 썸네일 + 재생버튼 오버레이
    container.innerHTML = `
      <div class="work-video-wrap">
        <video class="work-video" playsinline preload="metadata" id="workVideoEl">
          <source src="${url}" />
        </video>
        <canvas class="work-video-thumb" id="workVideoThumb"></canvas>
        <button class="work-video-playbtn" id="workVideoPlayBtn" aria-label="재생">
          <svg viewBox="0 0 24 24" fill="white" width="52" height="52"
            style="filter:drop-shadow(0 2px 8px rgba(0,0,0,0.4))">
            <path d="M8 5v14l11-7z"></path>
          </svg>
        </button>
      </div>`;

    const video   = container.querySelector("#workVideoEl");
    const canvas  = container.querySelector("#workVideoThumb");
    const playBtn = container.querySelector("#workVideoPlayBtn");

    // 썸네일 생성
    video.addEventListener("loadeddata", () => {
      video.currentTime = 0.5;
    });
    video.addEventListener("seeked", () => {
      const ctx = canvas.getContext("2d");
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.style.display = "block";
      video.style.display  = "none";
    });

    // 재생 토글
    playBtn.addEventListener("click", () => {
      if (video.paused) {
        canvas.style.display = "none";
        video.style.display  = "block";
        video.play();
        playBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="white" width="36" height="36"
            style="filter:drop-shadow(0 2px 8px rgba(0,0,0,0.4))">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>
          </svg>`;
      } else {
        video.pause();
        playBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="white" width="52" height="52"
            style="filter:drop-shadow(0 2px 8px rgba(0,0,0,0.4))">
            <path d="M8 5v14l11-7z"></path>
          </svg>`;
      }
    });
    video.addEventListener("ended", () => {
      canvas.style.display = "block";
      video.style.display  = "none";
      playBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="white" width="52" height="52"
          style="filter:drop-shadow(0 2px 8px rgba(0,0,0,0.4))">
          <path d="M8 5v14l11-7z"></path>
        </svg>`;
    });
    return;
  }

  if (kind === "audio") {
    // ✅ upload처럼 그라데이션 배경 + 음표 아이콘 + 재생버튼
    const audioId = `workAudio_${Date.now()}`;
    container.innerHTML = `
      <div class="work-audio-wrap">
        <div class="work-audio-thumb">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="1.8"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 18V5l12-2v13"></path>
            <circle cx="6" cy="18" r="3"></circle>
            <circle cx="18" cy="16" r="3"></circle>
          </svg>
          <button class="work-audio-playbtn" id="workAudioPlayBtn" aria-label="재생">
            <svg viewBox="0 0 24 24" fill="white" width="52" height="52"
              style="filter:drop-shadow(0 2px 6px rgba(0,0,0,0.3))">
              <path d="M8 5v14l11-7z"></path>
            </svg>
          </button>
        </div>
        <audio id="${audioId}" preload="metadata">
          <source src="${url}" />
        </audio>
      </div>`;

    const audio   = container.querySelector(`#${audioId}`);
    const playBtn = container.querySelector("#workAudioPlayBtn");

    playBtn.addEventListener("click", () => {
      if (audio.paused) {
        audio.play();
        playBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="white" width="36" height="36">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>
          </svg>`;
      } else {
        audio.pause();
        playBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="white" width="52" height="52">
            <path d="M8 5v14l11-7z"></path>
          </svg>`;
      }
    });
    audio.addEventListener("ended", () => {
      playBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="white" width="52" height="52">
          <path d="M8 5v14l11-7z"></path>
        </svg>`;
    });
    return;
  }
  if (kind === "pdf") {
    await renderWorkPdf(container, url);
    return;
  }

  container.innerHTML = `
    <div class="work-fallback">
      <div class="work-fallback__icon">🖼️</div>
    </div>`;
}

async function loadCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    currentUser = null;
    return;
  }

  // ✅ users 테이블에서 user_name, user_img 조회
  let displayName   = user.email ?? "나";
  let displayAvatar = "/media/profil.png";
  try {
    const { data: userData } = await supabase
      .from("users")
      .select("user_name, user_img")
      .eq("user_id", user.id)
      .single();
    if (userData?.user_name) displayName   = userData.user_name;
    if (userData?.user_img)  displayAvatar = userData.user_img;
  } catch (e) {
    console.warn("user 정보 조회 실패, 기본값 사용:", e);
  }

  currentUser = {
    id:     user.id,
    name:   displayName,
    avatar: displayAvatar,
  };
}

function applyToolIcon(mountSelector, iconUrl) {
  if (!iconUrl) return;
  const iconEl = document.querySelector(`${mountSelector} .tool-icon-card__icon`);
  if (iconEl) iconEl.style.backgroundImage = `url("${iconUrl}")`;
}

let reviewData    = [];
let selectedScore = 0;
let editingId     = null;
let currentSort   = "none";

// ✅ recent_tools 저장
async function saveRecentTool() {
  if (!currentUser || !TOOL_ID) return;
  try {
    const { data } = await supabase
      .from("users")
      .select("recent_tools")
      .eq("user_id", currentUser.id)
      .single();

    const current = data?.recent_tools ?? [];
    const updated = [TOOL_ID, ...current.filter(id => id !== TOOL_ID)].slice(0, 8);

    await supabase
      .from("users")
      .update({ recent_tools: updated })
      .eq("user_id", currentUser.id);
  } catch (e) {
    console.error("recent_tools 저장 실패:", e);
  }
}

// ✅ user_id(UUID) 배열로 user_name, user_img 일괄 조회
async function fetchUserInfo(userIds) {
  if (!userIds.length) return {};
  try {
    const { data, error } = await supabase
      .from("users")
      .select("user_id, user_name, user_img")
      .in("user_id", userIds);
    if (error) throw error;
    return Object.fromEntries(
      (data ?? []).map(u => [u.user_id, {
        name:   u.user_name ?? u.user_id ?? "알 수 없음",
        avatar: u.user_img  ?? "/media/profil.png",
      }])
    );
  } catch (e) {
    console.error("user 정보 일괄 조회 실패:", e);
    return {};
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadCurrentUser();

  if (currentUser) await saveRecentTool();

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
    }).then(async () => {
      const btn = document.querySelector("#wishlistBtn .btn");
      if (!btn) return;

      let pinned = false;

      if (currentUser) {
        const { data } = await supabase
          .from("users")
          .select("favorite_tools")
          .eq("user_id", currentUser.id)
          .single();
        pinned = (data?.favorite_tools ?? []).includes(TOOL_ID);
      }

      const updateBtnUI = (isPinned) => {
        btn.innerHTML = `
          <img src="${isPinned ? "/media/pin_fill.png" : "/media/pin.png"}"
            style="width:1em;height:1em;object-fit:contain;vertical-align:middle;margin-right:6px;">
          ${isPinned ? "관심 목록에 추가됨" : "관심 목록에 추가"}
        `;
      };

      updateBtnUI(pinned);

      btn.addEventListener("click", async () => {
        if (!currentUser) {
          window.location.href = "/login1/login.html";
          return;
        }

        const { data } = await supabase
          .from("users")
          .select("favorite_tools")
          .eq("user_id", currentUser.id)
          .single();

        const current = data?.favorite_tools ?? [];
        let updated;
        if (pinned) {
          updated = current.filter(id => id !== TOOL_ID);
        } else {
          updated = current.includes(TOOL_ID) ? current : [...current, TOOL_ID];
        }

        const { error } = await supabase
          .from("users")
          .update({ favorite_tools: updated })
          .eq("user_id", currentUser.id);

        if (error) { console.error("관심 목록 업데이트 실패:", error); return; }

        pinned = !pinned;
        updateBtnUI(pinned);
      });
    }),

    window.loadButton({ target: "#planBtn1", text: "사이트 바로가기", variant: "outline",  onClick: () => {} }),
    window.loadButton({ target: "#planBtn2", text: "사이트 바로가기", variant: "primary", onClick: () => {} }),
    window.loadButton({ target: "#planBtn3", text: "사이트 바로가기", variant: "primary", onClick: () => {} }),
    window.loadButton({ target: "#promoBtn", text: "사이트 바로가기", variant: "outline",  onClick: () => {} }),
  ]);

  const toolRow = await loadToolInfo();

  if (TOOL_ID && toolRow) {
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

async function loadToolInfo() {
  try {
    if (!TOOL_ID) throw new Error("URL에 tool_ID 파라미터가 없음");

    const { data, error } = await supabase
      .from("tools")
      .select("*")
      .eq("tool_ID", TOOL_ID)
      .single();

    if (error || !data) throw error ?? new Error("툴 없음");

    await window.loadToolIconCard("#toolIconMount", {
      toolName: data.tool_name ?? "",
      url: data.tool_link ?? "#",
    });
    applyToolIcon("#toolIconMount", data.icon);

    setTextEl("toolBrand", data.tool_company ? `@ ${data.tool_company}` : "");
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

    await window.loadToolIconCard("#toolIconMount", { toolName: "툴 정보 없음", url: "#" });
    setTextEl("toolBrand", "");
    setTextEl("toolDesc", "툴 정보를 불러오지 못했습니다.");

    const dotsEl = document.querySelector(".similar-tools__dots");
    if (dotsEl) { dotsEl.innerHTML = ""; dotsEl.style.display = "none"; }

    const rowEl = document.getElementById("similarToolsRow");
    if (rowEl) renderSimEmpty(rowEl);

    return null;
  }
}

function renderPlanCards(tool) {
  function getEmoji(text) {
    if (/무제한|unlimited/i.test(text)) return "♾️";
    if (/무료|free/i.test(text))        return "🆓";
    if (/API/i.test(text))              return "🔌";
    if (/팀|인원|계정|멤버/i.test(text)) return "👥";
    if (/분석|리포트|통계/i.test(text)) return "📊";
    if (/지원|서포트|support/i.test(text)) return "🛟";
    if (/보안|privacy|SSL/i.test(text)) return "🔒";
    if (/속도|빠른|fast/i.test(text))   return "⚡";
    if (/이미지|생성|create/i.test(text)) return "🎨";
    if (/비디오|영상|video/i.test(text)) return "🎬";
    if (/클라우드|저장|storage/i.test(text)) return "☁️";
    if (/크레딧|credit/i.test(text))    return "💳";
    return "✅";
  }

  const plans = [
    { nameKey: "tool_plan1_name", priceKey: "tool_plan1_price_krw", desKey: "tool_plan1_des" },
    { nameKey: "tool_plan2name",  priceKey: "tool_plan2_price_krw", desKey: "tool_plan2_des" },
    { nameKey: "tool_plan3_name", priceKey: "tool_plan3_price_krw", desKey: "tool_plan3_des" },
  ];

  plans.forEach(({ nameKey, priceKey, desKey }, i) => {
    const card = document.querySelectorAll(".plan-card")[i];
    if (!card) return;

    const nameEl  = card.querySelector(".plan-card__name");
    const listEl  = card.querySelector(".plan-card__list");
    const topEl   = card.querySelector(".plan-card__top");
    const badgeEl = card.querySelector(".plan-card__badge");

    if (badgeEl) badgeEl.textContent = `플랜 #${i + 1}`;
    if (nameEl)  nameEl.textContent  = tool[nameKey] ?? "";

    const price = tool[priceKey];
    let priceEl = topEl?.querySelector(".plan-card__price");

    if (price !== undefined && price !== null && price !== "") {
      if (!priceEl && topEl) {
        priceEl = document.createElement("div");
        priceEl.className = "plan-card__price";
        topEl.appendChild(priceEl);
      }
      if (priceEl) {
        priceEl.textContent = Number(price) === 0 ? "무료" : `₩${Number(price).toLocaleString()} / 월`;
      }
    } else if (priceEl) {
      priceEl.remove();
    }

    if (listEl) {
      const raw   = tool[desKey] ?? "";
      const lines = raw.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
      listEl.innerHTML = lines
        .map(line => `<li><span class="plan-item-emoji">${getEmoji(line)}</span>${line}</li>`)
        .join("");
    }
  });
}

function renderPromo(toolName, toolProm) {
  const section    = document.getElementById("promoSection");
  const titleEl    = document.querySelector(".promo__title");
  const headlineEl = document.querySelector(".promo-banner__headline");
  const subEl      = document.querySelector(".promo-banner__sub");
  const dateEl     = document.querySelector(".promo-banner__date");

  if (titleEl) titleEl.textContent = toolName ? `${toolName} 에서 진행 중인 프로모션` : "";

  if (!toolProm) {
    if (section) section.style.display = "none";
    return;
  }

  if (section) section.style.display = "";

  const lines = toolProm.split(/[\/,\n]/).map(s => s.trim()).filter(Boolean);

  function getPromoEmoji(text) {
    if (/할인|%|dc/i.test(text))     return "🎉";
    if (/무료|free/i.test(text))     return "🆓";
    if (/기간|기한|만료/i.test(text)) return "📅";
    if (/크레딧|credit/i.test(text)) return "💳";
    if (/상시|언제든/i.test(text))   return "♾️";
    if (/Pro|프로/i.test(text))      return "⭐";
    if (/가입|신규/i.test(text))     return "🙋";
    if (/확인|자세|상세/i.test(text)) return "🔍";
    return "✨";
  }

  if (headlineEl) headlineEl.textContent = lines[0] ? `${getPromoEmoji(lines[0])} ${lines[0]}` : "";

  if (subEl) {
    if (lines.length > 1) {
      subEl.style.display = "";
      subEl.innerHTML = lines.slice(1).map(l => `<span>${getPromoEmoji(l)} ${l}</span>`).join("<br>");
    } else {
      subEl.innerHTML = "";
      subEl.style.display = "none";
    }
  }

  if (dateEl) { dateEl.textContent = ""; dateEl.style.display = "none"; }
}

async function loadSimilarTools(toolCat, currentToolId) {
  const rowEl  = document.getElementById("similarToolsRow");
  const dotsEl = document.querySelector(".similar-tools__dots");

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

    if (dotsEl && totalPages >= 2) {
      dotsEl.style.display = "flex";
      dotsEl.innerHTML = Array.from({ length: totalPages })
        .map((_, i) => `<span class="sdot${i === 0 ? " is-active" : ""}"></span>`)
        .join("");

      dotsEl.querySelectorAll(".sdot").forEach((dot, i) => {
        dot.addEventListener("click", async () => {
          dotsEl.querySelectorAll(".sdot").forEach(d => d.classList.remove("is-active"));
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
    .map((_, i) => `
      <div class="similar-tools__item">
        <div class="similar-tools__mount" id="simTool${i + 1}"></div>
      </div>
    `).join("");

  await Promise.all(
    pageTools.map(async (tool, i) => {
      await window.loadToolIconCard(`#simTool${i + 1}`, {
        toolName: tool.tool_name,
        url: `/detail_AI/detail_AI.html?tool_ID=${tool.tool_ID}`,
      });
      applyToolIcon(`#simTool${i + 1}`, tool.icon);
    })
  );
}

async function loadWorks() {
  try {
    if (!TOOL_ID) { renderEmptyWorks(); return; }

    const { data, error } = await supabase
      .from("works")
      .select("work_id, work_path, work_link, like_count, user_id") // ✅ work_link 추가
      .eq("tool_id", TOOL_ID)
      .order("like_count", { ascending: false })
      .order("updated_at", { ascending: false }) // 좋아요 같으면 최신순
      .limit(10);

    if (error) throw error;
    if (!data?.length) { renderEmptyWorks(); return; }

    // ✅ user_id(UUID) → user_name, user_img 일괄 조회
    const userIds = [...new Set(data.map(w => w.user_id).filter(Boolean))];
    const infoMap = await fetchUserInfo(userIds);

    const worksWithNames = data.map(w => ({
      ...w,
      display_name:   infoMap[w.user_id]?.name   ?? w.user_id ?? "알 수 없음",
      display_avatar: infoMap[w.user_id]?.avatar ?? "/media/profil.png",
    }));

    renderWorksCarousel(worksWithNames);
  } catch (e) {
    console.error("작업물 로드 실패:", e);
    renderEmptyWorks();
  }
}

function renderEmptyWorks() {
  const profile  = document.querySelector(".detail_AI__profile");
  const showcase = document.querySelector(".detail_AI__showcase");
  const carousel = document.querySelector(".detail_AI__carousel");

  if (profile)  profile.style.display = "none";
  if (showcase) showcase.style.gridTemplateColumns = "1fr";
  if (carousel) carousel.style.gridColumn = "1";
  if (!carousel) return;

  const wrapper = carousel.querySelector(".detail_AI__carousel-wrapper");
  const dots    = document.getElementById("workDots");

  if (wrapper) wrapper.outerHTML = `<div class="works-empty-text">아직 등록된 작업물이 없습니다.</div>`;
  if (dots)    dots.style.display = "none";
}

async function renderWorksCarousel(works) {
  const profile   = document.querySelector(".detail_AI__profile");
  const showcase  = document.querySelector(".detail_AI__showcase");
  const container = document.getElementById("workMediaContainer");
  const dotsEl    = document.getElementById("workDots");
  const nameEl    = document.getElementById("profileName");
  const avatarImg = document.getElementById("profileImg");

  if (profile)  profile.style.display = "";
  if (showcase) showcase.style.gridTemplateColumns = "";

  // ✅ 현재 보고 있는 work_id 추적
  let currentWorkId = works[0].work_id;

  await renderWorkMedia(container, works[0]);

  // ✅ 컨테이너 클릭 → artwork_post로 이동
  if (container) {
    container.style.cursor = "pointer";
    container.addEventListener("click", () => {
      window.location.href =
        `/artwork/artwork_post/artwork_post.html?work_id=${encodeURIComponent(currentWorkId)}`;
    });
  }

  if (nameEl) nameEl.textContent = works[0].display_name ? `by. ${works[0].display_name}` : "";
  if (avatarImg) {
    avatarImg.src = works[0].display_avatar ?? "/media/profil.png";
    avatarImg.style.display = "block";
  }

  if (dotsEl) {
    dotsEl.style.display = works.length > 1 ? "" : "none";
    dotsEl.innerHTML = works.slice(0, 5)
      .map((_, i) => `<button class="dot${i === 0 ? " is-active" : ""}" type="button" aria-label="${i + 1}"></button>`)
      .join("");

    dotsEl.querySelectorAll(".dot").forEach((dot, i) => {
      dot.addEventListener("click", async (e) => {
        e.stopPropagation(); // ✅ 버블링 방지
        dotsEl.querySelectorAll(".dot").forEach(d => d.classList.remove("is-active"));
        dot.classList.add("is-active");
        currentWorkId = works[i].work_id; // ✅ work_id 업데이트
        await renderWorkMedia(container, works[i]);
        if (nameEl) nameEl.textContent = works[i].display_name ? `by. ${works[i].display_name}` : "";
        if (avatarImg) {
          avatarImg.src = works[i].display_avatar ?? "/media/profil.png";
          avatarImg.style.display = "block";
        }
      });
    });
  }
}

async function loadReviews() {
  try {
    if (!TOOL_ID) { reviewData = []; updateAvgScore(); return; }

    // ✅ 테이블명 tool_reviews
    const { data, error } = await supabase
      .from("tool_reviews")
      .select("review_id, user_id, rating, review_content, created_at")
      .eq("tool_id", TOOL_ID)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const rows = data ?? [];

    // ✅ user_id(UUID) → user_name, user_img 일괄 조회
    const userIds = [...new Set(rows.map(r => r.user_id).filter(Boolean))];
    const infoMap = await fetchUserInfo(userIds);

    reviewData = rows.map(r => ({
      id:     r.review_id,
      userId: r.user_id,
      name:   infoMap[r.user_id]?.name   ?? r.user_id ?? "알 수 없음",
      avatar: infoMap[r.user_id]?.avatar ?? "/media/profil.png",
      date:   r.created_at?.slice(0, 10).replace(/-/g, ".") ?? "",
      score:  r.rating ?? 0,
      text:   r.review_content ?? "",
      // ✅ UUID 기준 isMine 판별
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

function initReviewSystem() {
  initWriteStars();
  renderReviewList();
  renderMyReviewArea();
}

function getSortedOtherReviews() {
  const others = reviewData.filter(r => !r.isMine);
  if (currentSort === "high") return [...others].sort((a, b) => b.score - a.score);
  if (currentSort === "low")  return [...others].sort((a, b) => a.score - b.score);
  if (currentSort === "new")  return [...others].sort((a, b) => {
    const da = new Date(a.date.replace(/\./g, "-"));
    const db = new Date(b.date.replace(/\./g, "-"));
    return db - da;
  });
  return others;
}

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

  container.innerHTML = items.map(r => `
    <article class="review-card">
      <div class="review-card__date">${r.date}</div>
      <div class="review-card__stars">
        ${[1,2,3,4,5].map(n => `<span class="rstar ${n <= r.score ? "is-on" : "is-off"}">★</span>`).join("")}
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
            ${[1,2,3,4,5].map(() => `<span class="rstar-input">★</span>`).join("")}
            <span class="review-write__hint">(0점)</span>
          </div>
          <textarea class="review-write__textarea" placeholder="리뷰를 작성해주세요." disabled></textarea>
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

  const myReview = reviewData.find(r => r.isMine);

  if (myReview) {
    writeArea.innerHTML = `
      <div class="review-write__head">
        <div class="review-write__title">내 리뷰</div>
      </div>
      <article class="review-card review-card--mine">
        <div class="review-card__date">${myReview.date}</div>
        <div class="review-card__stars">
          ${[1,2,3,4,5].map(n => `<span class="rstar ${n <= myReview.score ? "is-on" : "is-off"}">★</span>`).join("")}
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
        ${[1,2,3,4,5].map(n => `<span class="rstar-input" data-val="${n}">★</span>`).join("")}
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
  const hint  = document.getElementById("writeStarHint");

  stars.forEach(star => {
    star.addEventListener("mouseenter", () => {
      stars.forEach(s => s.classList.toggle("is-on", +s.dataset.val <= +star.dataset.val));
    });
    star.addEventListener("mouseleave", () => {
      stars.forEach(s => s.classList.toggle("is-on", +s.dataset.val <= selectedScore));
    });
    star.addEventListener("click", () => {
      selectedScore = +star.dataset.val;
      stars.forEach(s => s.classList.toggle("is-on", +s.dataset.val <= selectedScore));
      if (hint) hint.textContent = `(${selectedScore}점)`;
    });
  });
}

async function submitReview() {
  const textarea = document.getElementById("reviewTextarea");
  const text = textarea?.value.trim();

  if (!selectedScore) return alert("별점을 선택해주세요.");
  if (!text)          return alert("리뷰 내용을 입력해주세요.");
  if (!TOOL_ID)       return alert("툴 정보를 찾을 수 없습니다.");

  try {
    if (editingId !== null) {
      const { error } = await supabase
        .from("tool_reviews")
        .update({
          rating:         selectedScore,
          review_content: text,
          created_at:     new Date().toISOString(),
        })
        .eq("review_id", editingId);

      if (error) throw error;

      const now = new Date();
      const updatedDateStr = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,"0")}.${String(now.getDate()).padStart(2,"0")}`;
      const target = reviewData.find(r => r.id === editingId);
      if (target) { target.score = selectedScore; target.text = text; target.date = updatedDateStr; }
      editingId = null;

    } else {
      const today = new Date();
      const dateStr = `${today.getFullYear()}.${String(today.getMonth()+1).padStart(2,"0")}.${String(today.getDate()).padStart(2,"0")}`;

      const newReviewId = crypto.randomUUID();
      const { data: inserted, error } = await supabase
        .from("tool_reviews")
        .insert({
          review_id:      newReviewId,
          tool_id:        TOOL_ID,
          user_id:        currentUser.id,
          rating:         selectedScore,
          review_content: text,
          created_at:     new Date().toISOString(),
        })
        .select("review_id")
        .single();

      if (error) throw error;

      reviewData.unshift({
        id:     inserted?.review_id ?? newReviewId,
        userId: currentUser.id,
        name:   currentUser.name,
        avatar: currentUser.avatar,
        date:   dateStr,
        score:  selectedScore,
        text,
        isMine: true,
      });
    }
  } catch (e) {
    console.error("리뷰 저장 실패 code:",    e?.code);
    console.error("리뷰 저장 실패 message:", e?.message);
    console.error("리뷰 저장 실패 details:", e?.details);
    console.error("리뷰 저장 실패 hint:",    e?.hint);
    alert("리뷰 저장 중 오류가 발생했습니다.");
    return;
  }

  selectedScore = 0;
  renderMyReviewArea();
  renderReviewList();
  updateAvgScore();
}

function startEditMyReview() {
  const myReview = reviewData.find(r => r.isMine);
  if (!myReview) return;

  editingId     = myReview.id;
  selectedScore = myReview.score;

  const writeArea = document.querySelector(".review-write");
  if (!writeArea) return;

  writeArea.innerHTML = `
    <div class="review-write__head">
      <div class="review-write__title">리뷰 수정</div>
    </div>
    <div class="review-write__box">
      <div class="review-write__stars" id="writeStars">
        ${[1,2,3,4,5].map(n => `<span class="rstar-input" data-val="${n}">★</span>`).join("")}
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
  document.querySelectorAll(".rstar-input").forEach(s => {
    s.classList.toggle("is-on", +s.dataset.val <= selectedScore);
  });
}

async function deleteMyReview(id) {
  if (!confirm("리뷰를 삭제할까요?")) return;

  try {
    const { error } = await supabase.from("tool_reviews").delete().eq("review_id", id);
    if (error) throw error;
    const idx = reviewData.findIndex(r => r.id === id);
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
    if (starsEl) starsEl.innerHTML = [1,2,3,4,5].map(() => `<span class="rstar is-off">★</span>`).join("");
    updateCardStars(0);
    return;
  }

  const avg     = reviewData.reduce((s, r) => s + r.score, 0) / reviewData.length;
  const rounded = Math.round(avg * 10) / 10;

  if (numEl)   numEl.textContent = `${rounded} 점`;
  if (starsEl) starsEl.innerHTML = [1,2,3,4,5]
    .map(n => `<span class="rstar ${n <= Math.round(avg) ? "is-on" : "is-off"}">★</span>`)
    .join("");

  updateCardStars(Math.round(avg));
}

function updateCardStars(roundedAvg = 0) {
  const cardStarsEl = document.getElementById("toolStars");
  if (!cardStarsEl) return;
  cardStarsEl.innerHTML = [1,2,3,4,5]
    .map(n => `<span class="star ${n <= roundedAvg ? "is-on" : "is-off"}">★</span>`)
    .join("");
}

window.startEditMyReview = startEditMyReview;
window.deleteMyReview    = deleteMyReview;

function initReviewSort() {
  if (!document.querySelector("#reviewSortSelect")) return;

  loadNativeSelect({
    target: "#reviewSortSelect",
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

function setSitePreview({ name, url, icon, iframeEnabled = false } = {}) {
  const nameEl = document.getElementById("sitePreviewName");
  const urlEl  = document.getElementById("sitePreviewUrl");

  if (nameEl) nameEl.textContent = name ?? "";
  if (urlEl)  { urlEl.textContent = url ?? ""; urlEl.href = url ?? "#"; }

  const mediaEl = document.querySelector(".site-preview__media");
  const cardEl  = document.querySelector(".site-preview__card");
  if (!mediaEl) return;

  mediaEl.querySelectorAll("iframe").forEach(el => el.remove());
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
      if (icon) { imgEl.src = icon; imgEl.style.display = ""; }
      else      { imgEl.removeAttribute("src"); imgEl.style.display = "none"; }
    }

    if (imgEl && !imgEl.closest(".site-preview__fallback-logo")) {
      const wrapper = document.createElement("div");
      wrapper.className = "site-preview__fallback-logo";
      imgEl.replaceWith(wrapper);
      wrapper.appendChild(imgEl);
    }
  }
}

function initSectionTabs() {
  const tabsRoot = document.getElementById("sectionTabs");
  if (!tabsRoot) return;

  const tabs       = Array.from(tabsRoot.querySelectorAll(".section-tab"));
  const sectionEls = tabs.map(t => document.getElementById(t.dataset.target)).filter(Boolean);

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
    tabs.forEach(t => t.classList.remove("is-active"));
    tab.classList.add("is-active");
    window.scrollTo({
      top: window.scrollY + targetEl.getBoundingClientRect().top - getOffset(),
      behavior: "smooth",
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter(e => e.isIntersecting);
      if (!visible.length) return;
      visible.sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top));
      const activeId = visible[0].target.id;
      tabs.forEach(tab => { tab.classList.toggle("is-active", tab.dataset.target === activeId); });
    },
    { root: null, rootMargin: `-${getOffset()}px 0px -60% 0px`, threshold: 0.01 }
  );

  sectionEls.forEach(el => observer.observe(el));
}

function setTextEl(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text ?? "";
}