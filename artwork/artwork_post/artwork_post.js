const $ = (s, r = document) => r.querySelector(s);
const esc = (t) =>
  String(t)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const supabase = window._supabase;
const params = new URLSearchParams(window.location.search);
const workId = params.get("work_id");

let currentUser = null;
let artworkData = null;
let workOwnerId = null;
let state = { liked: false, likeCount: 0, comments: [] };

async function renderPdfWithPdfJs(url, mountEl) {
  const pdfjsLib = window.pdfjsLib;
  if (!pdfjsLib) {
    mountEl.innerHTML = `
      <div class="pdf-fallback">
        <p>PDF 미리보기를 불러오지 못했어요.</p>
        <a href="${url}" target="_blank" rel="noopener noreferrer">새 창에서 열기</a>
      </div>
    `;
    return;
  }

  mountEl.innerHTML = `
    <div class="hero__pdf-wrap">
      <div class="hero__pdf-stage">
        <canvas class="hero__pdf-canvas"></canvas>
      </div>
      <div class="hero__pdf-controls">
        <button type="button" class="hero__pdf-btn" data-pdf-prev>이전</button>
        <span class="hero__pdf-page" data-pdf-page>1 / 1</span>
        <button type="button" class="hero__pdf-btn" data-pdf-next>다음</button>
      </div>
    </div>
  `;

  const canvas   = mountEl.querySelector(".hero__pdf-canvas");
  const ctx      = canvas.getContext("2d");
  const prevBtn  = mountEl.querySelector("[data-pdf-prev]");
  const nextBtn  = mountEl.querySelector("[data-pdf-next]");
  const pageText = mountEl.querySelector("[data-pdf-page]");

  let pdfDoc    = null;
  let pageNum   = 1;
  let rendering = false;
  let pendingPage = null;

  const getFitScale = (page) => {
    const stage    = mountEl.querySelector(".hero__pdf-stage");
    const unscaled = page.getViewport({ scale: 1 });
    const stageW   = stage.clientWidth  || 800;
    const stageH   = stage.clientHeight || 500;
    return Math.min(stageW / unscaled.width, stageH / unscaled.height, 2.2);
  };

  const renderPage = async (num) => {
    rendering = true;
    const page     = await pdfDoc.getPage(num);
    const scale    = getFitScale(page);
    const viewport = page.getViewport({ scale });
    const outputScale = window.devicePixelRatio || 1;

    canvas.width  = Math.floor(viewport.width  * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width  = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;
    await page.render({ canvasContext: ctx, viewport, transform }).promise;

    pageText.textContent = `${num} / ${pdfDoc.numPages}`;
    prevBtn.disabled = num <= 1;
    nextBtn.disabled = num >= pdfDoc.numPages;
    rendering = false;

    if (pendingPage !== null) {
      const next = pendingPage;
      pendingPage = null;
      renderPage(next);
    }
  };

  const queueRenderPage = (num) => {
    if (rendering) { pendingPage = num; } else { renderPage(num); }
  };

  pdfDoc = await pdfjsLib.getDocument(url).promise;
  await renderPage(pageNum);

  prevBtn.addEventListener("click", () => { if (pageNum <= 1) return; pageNum--; queueRenderPage(pageNum); });
  nextBtn.addEventListener("click", () => { if (pageNum >= pdfDoc.numPages) return; pageNum++; queueRenderPage(pageNum); });
  window.addEventListener("resize", () => { queueRenderPage(pageNum); });
}

function renderVideoMedia(url, mountEl) {
  mountEl.innerHTML = `
    <div class="hero__video-wrap">
      <video class="hero__video" playsinline preload="metadata">
        <source src="${url}" />
      </video>
      <canvas class="hero__video-thumb"></canvas>
      <button class="hero__video-playbtn" aria-label="재생">
        <svg viewBox="0 0 24 24" fill="white" width="64" height="64"
          style="filter:drop-shadow(0 2px 10px rgba(0,0,0,0.5))">
          <path d="M8 5v14l11-7z"></path>
        </svg>
      </button>
      <div class="hero__video-controls">
        <span class="hero__video-time">0:00 / 0:00</span>
        <div class="hero__video-seekbar">
          <div class="hero__video-seekbar__fill"></div>
        </div>
      </div>
    </div>
  `;

  const video    = mountEl.querySelector(".hero__video");
  const canvas   = mountEl.querySelector(".hero__video-thumb");
  const playBtn  = mountEl.querySelector(".hero__video-playbtn");
  const controls = mountEl.querySelector(".hero__video-controls");
  const timeEl   = mountEl.querySelector(".hero__video-time");
  const seekbar  = mountEl.querySelector(".hero__video-seekbar");
  const fill     = mountEl.querySelector(".hero__video-seekbar__fill");

  const pauseSvg = `<svg viewBox="0 0 24 24" fill="white" width="48" height="48" style="filter:drop-shadow(0 2px 10px rgba(0,0,0,0.5))"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>`;
  const playSvg  = `<svg viewBox="0 0 24 24" fill="white" width="64" height="64" style="filter:drop-shadow(0 2px 10px rgba(0,0,0,0.5))"><path d="M8 5v14l11-7z"></path></svg>`;

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  video.addEventListener("loadeddata", () => { video.currentTime = 0.5; });
  video.addEventListener("seeked", () => {
    if (video.paused) {
      const ctx = canvas.getContext("2d");
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.style.display = "block";
      video.style.display  = "none";
    }
  });

  video.addEventListener("loadedmetadata", () => {
    timeEl.textContent = `0:00 / ${formatTime(video.duration)}`;
  });

  video.addEventListener("timeupdate", () => {
    if (!video.duration) return;
    const pct = (video.currentTime / video.duration) * 100;
    fill.style.width = `${pct}%`;
    timeEl.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
  });

  playBtn.addEventListener("click", () => {
    if (video.paused) {
      canvas.style.display = "none";
      video.style.display  = "block";
      video.play();
      playBtn.innerHTML = pauseSvg;
    } else {
      video.pause();
      playBtn.innerHTML = playSvg;
    }
  });

  seekbar.addEventListener("click", (e) => {
    if (!video.duration) return;
    const rect = seekbar.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = pct * video.duration;
  });

  controls.addEventListener("click", (e) => e.stopPropagation());

  video.addEventListener("ended", () => {
    canvas.style.display = "block";
    video.style.display  = "none";
    playBtn.innerHTML = playSvg;
  });
}

function renderAudioMedia(url, mountEl) {
  const audioId = `heroAudio_${Date.now()}`;
  mountEl.innerHTML = `
    <div class="hero__audio-wrap">
      <div class="hero__audio-card">
        <div class="hero__audio-thumb">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="1.5"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 18V5l12-2v13"></path>
            <circle cx="6" cy="18" r="3"></circle>
            <circle cx="18" cy="16" r="3"></circle>
          </svg>
          <button class="hero__audio-playbtn" id="${audioId}_btn" aria-label="재생">
            <svg viewBox="0 0 24 24" fill="white" width="64" height="64"
              style="filter:drop-shadow(0 2px 8px rgba(0,0,0,0.4))">
              <path d="M8 5v14l11-7z"></path>
            </svg>
          </button>
        </div>
        <div class="hero__audio-controls" id="${audioId}_controls">
          <span class="hero__audio-time" id="${audioId}_time">0:00 / 0:00</span>
          <div class="hero__audio-seekbar" id="${audioId}_seekbar">
            <div class="hero__audio-seekbar__fill" id="${audioId}_fill"></div>
          </div>
        </div>
      </div>
      <audio id="${audioId}" preload="metadata">
        <source src="${url}" />
      </audio>
    </div>
  `;

  const audio   = mountEl.querySelector(`#${audioId}`);
  const playBtn = mountEl.querySelector(`#${audioId}_btn`);
  const timeEl  = mountEl.querySelector(`#${audioId}_time`);
  const seekbar = mountEl.querySelector(`#${audioId}_seekbar`);
  const fill    = mountEl.querySelector(`#${audioId}_fill`);

  const pauseSvg = `<svg viewBox="0 0 24 24" fill="white" width="48" height="48">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>
  </svg>`;
  const playSvg = `<svg viewBox="0 0 24 24" fill="white" width="64" height="64"
    style="filter:drop-shadow(0 2px 8px rgba(0,0,0,0.4))">
    <path d="M8 5v14l11-7z"></path>
  </svg>`;

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  playBtn.addEventListener("click", () => {
    if (audio.paused) { audio.play(); playBtn.innerHTML = pauseSvg; }
    else              { audio.pause(); playBtn.innerHTML = playSvg; }
  });

  seekbar.addEventListener("click", (e) => {
    if (!audio.duration) return;
    const rect = seekbar.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = pct * audio.duration;
  });

  audio.addEventListener("loadedmetadata", () => {
    timeEl.textContent = `0:00 / ${formatTime(audio.duration)}`;
  });

  audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    fill.style.width = `${pct}%`;
    timeEl.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
  });

  audio.addEventListener("ended", () => { playBtn.innerHTML = playSvg; });
}

function renderArtworkMedia(data) {
  const hero     = document.querySelector(".hero");
  const oldMedia = document.querySelector(".hero__img");
  if (!hero || !oldMedia) return;
  if (!data.work_link) return;

  const url = data.work_link;

  // ✅ 이미지
  if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    oldMedia.outerHTML = `<img class="hero__img" src="${url}" alt="">`;
    return;
  }

  // ✅ 영상
  if (url.match(/\.(mp4|webm|mov)$/i)) {
    const mount = document.createElement("div");
    mount.className = "hero__img hero__img--video";
    oldMedia.replaceWith(mount);
    renderVideoMedia(url, mount);
    return;
  }

  // ✅ 오디오
  if (url.match(/\.(mp3|wav|ogg|m4a)$/i)) {
    const mount = document.createElement("div");
    mount.className = "hero__img hero__img--audio";
    oldMedia.replaceWith(mount);
    renderAudioMedia(url, mount);
    return;
  }

  // ✅ PDF
  if (url.match(/\.pdf$/i)) {
    const mount = document.createElement("div");
    mount.className = "hero__img hero__img--pdf";
    oldMedia.replaceWith(mount);
    renderPdfWithPdfJs(url, mount).catch((err) => {
      console.error("PDF 렌더 실패:", err);
      mount.innerHTML = `
        <div class="pdf-fallback">
          <p>PDF 미리보기에 실패했어요.</p>
          <a href="${url}" target="_blank" rel="noopener noreferrer">새 창에서 열기</a>
        </div>
      `;
    });
    return;
  }

  oldMedia.outerHTML = `
    <div class="hero__img hero__img--fallback">
      미리보기를 지원하지 않는 파일입니다.
    </div>
  `;
}

function formatDate(isoStr) {
  if (!isoStr) return "";
  return new Date(isoStr).toLocaleDateString("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit",
  });
}

function timeAgo(isoStr) {
  if (!isoStr) return "방금 전";
  const diff = Date.now() - new Date(isoStr).getTime();
  const min  = Math.floor(diff / 60000);
  if (min < 1)  return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24)  return `${hr}시간 전`;
  return `${Math.floor(hr / 24)}일 전`;
}

async function insertNotification(toUserId, type, referenceId) {
  if (!toUserId || toUserId === currentUser?.id) return;
  await supabase.from("notifications").insert({
    notification_id: crypto.randomUUID(),
    user_id:         toUserId,
    sender_id:       currentUser?.id ?? null,  // ✅ 보낸 사람 ID 추가
    type,
    reference_id:    referenceId,
    is_read:         false,
    created_at:      new Date().toISOString(),
  });
}

async function fetchToolInfo(toolId) {
  console.log("fetchToolInfo toolId:", toolId);
  if (!toolId) return { tool_name: "", tool_company: "", tool_icon: "", rating: "0.0" };

  let tool_name = "", tool_company = "", tool_icon = "", rating = "0.0";

  const { data: toolData, error: toolError } = await supabase
    .from("tools")
    .select("tool_ID, tool_name, tool_company, icon")
    .eq("tool_ID", toolId)
    .maybeSingle();

  if (toolError) {
    console.error("tools 조회 실패 raw:", toolError);
    console.error("tools 조회 실패 message:", toolError.message);
  }
  if (toolData) {
    tool_name    = toolData.tool_name    ?? "";
    tool_company = toolData.tool_company ?? "";
    tool_icon    = toolData.icon         ?? "";
  } else {
    console.warn("tools에서 일치하는 데이터 없음. toolId =", toolId);
  }

  const { data: reviewData, error: reviewError } = await supabase
    .from("tool_reviews")
    .select("rating")
    .eq("tool_id", toolId);

  if (reviewError) console.error("tool_reviews 조회 실패:", reviewError.message);

  if (Array.isArray(reviewData) && reviewData.length) {
    const validRatings = reviewData.map((r) => Number(r.rating)).filter((n) => !Number.isNaN(n));
    if (validRatings.length) {
      rating = (validRatings.reduce((s, c) => s + c, 0) / validRatings.length).toFixed(1);
    }
  }

  return { tool_name, tool_company, tool_icon, rating };
}
function getToolCatLabel(value) {
  const map = {
    media: "이미지·오디오·영상",
    res: "리서치",
    doc: "문서 생성·요약·편집",
    dev: "개발·코딩",
    edu: "학습·교육",
    ast: "챗봇·어시스턴트",
  };
  return map[value] || "";
}

function fillBanner(data) {
  if (data.work_title) $("#bannerTitle").textContent = data.work_title;

  if (data.tool_cat)   $("#bannerCategory").textContent = getToolCatLabel(data.tool_cat);
  
  if (data.user_name)  $("#bannerUsername").textContent = data.user_name;
  if (data.updated_at) $("#bannerDate").textContent = `· ${formatDate(data.updated_at)}`;

  const descEl = $("#bannerDesc");
  if (descEl) descEl.textContent = data.work_desc || "";

  const profileImgEl = $("#bannerProfileImg");
  if (profileImgEl) profileImgEl.src = data.user_img || "/media/profil.png";

  const myProfileImgEl = $("#myProfileImg");
  if (myProfileImgEl) myProfileImgEl.src = currentUser?.user_img || "/media/profil.png";

  const toolNameEl    = $("#bannerToolName");
  const toolCompanyEl = $("#bannerToolCompany");
  const toolRatingEl  = $("#bannerToolRating");
  const toolIconEl    = $("#bannerToolIcon");

  if (toolNameEl)    toolNameEl.textContent    = data.tool_name || "툴 이름 없음";

  // ✅ 개발사 — 툴 이름 바로 아래
  if (toolCompanyEl) {
    toolCompanyEl.textContent = data.tool_company
      ? `@${String(data.tool_company).replace(/^@+/, "")}`
      : "";
    toolCompanyEl.style.display = data.tool_company ? "" : "none";
  }

  // ✅ 별점 — 숫자 대신 별 아이콘으로 렌더링
  if (toolRatingEl) {
    const rating  = parseFloat(data.rating ?? "0") || 0;
    const rounded = Math.round(rating);
    toolRatingEl.innerHTML = [1,2,3,4,5]
      .map(n => `<span class="tool-star ${n <= rounded ? "is-on" : "is-off"}">★</span>`)
      .join("");
  }

  if (toolIconEl) {
    toolIconEl.src = data.tool_icon || "/media/image.png";
    toolIconEl.alt = data.tool_name || "툴 아이콘";
  
    // ✅ 툴 카드 클릭 시 툴 페이지로 이동
    const toolCard = toolIconEl.closest(".artwork-post__tool");
    if (toolCard && artworkData?.tool_id) {
      toolCard.addEventListener("click", () => {
        window.location.href = `/detail_AI/detail_AI.html?tool_ID=${encodeURIComponent(artworkData.tool_id)}`;
      });
    }
  }
  
  const actions = $(".artwork-hero-banner__actions");
  if (actions) actions.style.display = data.isMine ? "flex" : "none";

  if (Array.isArray(data.work_tags) && data.work_tags.length) {
    $("#bannerTags").innerHTML = data.work_tags
      .map((tag) => `<span class="artwork-hero-banner__tag">${esc(tag)}</span>`)
      .join("");
  } else {
    const tagWrap = $("#bannerTags");
    if (tagWrap) tagWrap.innerHTML = "";
  }
}

async function initLike() {
  const likeBtn   = $("#btnLike");
  const likeCount = $("#likeCount");
  if (!likeBtn || !likeCount) return;

  if (currentUser) {
    const { data: userData } = await supabase
      .from("users").select("liked_works").eq("user_id", currentUser.id).single();
    state.liked = (userData?.liked_works || []).includes(workId);
  }

  state.likeCount = artworkData.like_count ?? 0;
  likeCount.textContent = state.likeCount;

  const heartImg = likeBtn.querySelector("img");
  if (heartImg) heartImg.src = state.liked ? "/media/Heart_fill.png" : "/media/Heart.png";

  likeBtn.addEventListener("click", async () => {
    if (!currentUser) { alert("로그인이 필요합니다."); window.location.href = "/login1/login1.html"; return; }

    state.liked      = !state.liked;
    state.likeCount += state.liked ? 1 : -1;
    likeCount.textContent = state.likeCount;
    if (heartImg) heartImg.src = state.liked ? "/media/Heart_fill.png" : "/media/Heart.png";

    await supabase.from("works").update({ like_count: state.likeCount }).eq("work_id", workId);

    const { data: userData } = await supabase
      .from("users").select("liked_works").eq("user_id", currentUser.id).single();
    const likedWorks = userData?.liked_works || [];
    const updated    = state.liked ? [...new Set([...likedWorks, workId])] : likedWorks.filter((id) => id !== workId);
    await supabase.from("users").update({ liked_works: updated }).eq("user_id", currentUser.id);

    if (state.liked) await insertNotification(workOwnerId, "like", workId);
  });
}

function syncCommentCount() {
  const count       = state.comments.length;
  const cCount      = $("#commentCount");
  const cCountTitle = $("#commentCountTitle");
  if (cCount)      cCount.textContent      = String(count);
  if (cCountTitle) cCountTitle.textContent = String(count);
}

function replyHTML(r, cid) {
  const textArea = r.editMode
    ? `<div class="edit-box">
        <textarea class="edit-textarea" id="edit-input-r-${r.id}" rows="2">${esc(r.content || r.text)}</textarea>
        <div class="edit-actions">
          <button class="act" data-act="edit-cancel-r" data-cid="${cid}" data-rid="${r.id}">취소</button>
          <button class="act" data-act="edit-save-r"   data-cid="${cid}" data-rid="${r.id}">저장</button>
        </div>
      </div>`
    : `<p class="reply-text">${esc(r.content || r.text)}</p>`;

  return `
  <li class="reply-item">
    <div class="reply-item__inner">
      <div class="avatar sm"><div class="avatar__inner">
        <img src="${r.user_img || "/media/profil.png"}" alt="프로필">
      </div></div>
      <div class="reply-body">
        <div class="reply-head">
          <span class="n">${esc(r.user_name || "user")}</span>
          <span class="d">${timeAgo(r.updated_at)}</span>
        </div>
        ${textArea}
        ${r.isMine && !r.editMode
          ? `<div class="actions">
              <button class="act" data-act="edit-r" data-cid="${cid}" data-rid="${r.id}">수정</button>
              <button class="act danger" data-act="del-r" data-cid="${cid}" data-rid="${r.id}">삭제</button>
            </div>`
          : ""}
      </div>
    </div>
  </li>`;
}

function commentHTML(c) {
  const rN = c.replies?.length ?? 0;
  const textArea = c.editMode
    ? `<div class="edit-box">
        <textarea class="edit-textarea" id="edit-input-c-${c.id}" rows="3">${esc(c.content || c.text)}</textarea>
        <div class="edit-actions">
          <button class="act" data-act="edit-cancel-c" data-cid="${c.id}">취소</button>
          <button class="act" data-act="edit-save-c"   data-cid="${c.id}">저장</button>
        </div>
      </div>`
    : `<p class="text">${esc(c.content || c.text)}</p>`;

  return `
  <li class="comment-item" data-cid="${c.id}">
    <div class="row-top">
      <div class="head">
        <div class="avatar sm"><div class="avatar__inner">
          <img src="${c.user_img || "/media/profil.png"}" alt="프로필">
        </div></div>
        <div class="meta">
          <div class="n">${esc(c.user_name || "user")}</div>
          <div class="d">${timeAgo(c.updated_at)}</div>
        </div>
      </div>
      <button class="pill ${c.isOpen ? "is-open" : ""}" data-act="toggle" data-cid="${c.id}" id="pill-${c.id}">
        <img src="/media/comment.png" alt="" class="pill-icon" aria-hidden="true">
        <b>${rN}</b>
      </button>
    </div>
    ${textArea}
    <div class="replies ${c.isOpen ? "is-open" : ""}" id="replies-${c.id}">
      <div class="rin">
        <ul class="reply-list">
          ${rN
            ? c.replies.map((r) => replyHTML(r, c.id)).join("")
            : `<li class="reply-item reply-item--empty">대댓글이 없습니다.</li>`}
        </ul>
        <div class="comment-write reply-write">
          <div class="avatar sm"><div class="avatar__inner">
            <img src="${currentUser?.user_img || "/media/profil.png"}" alt="내 프로필">
          </div></div>
          <div class="write-col">
            <div class="box">
              <textarea id="rin-${c.id}" placeholder="대댓글을 남겨주세요." rows="2"></textarea>
            </div>
            <div class="submit" id="reply-submit-${c.id}"></div>
          </div>
        </div>
      </div>
    </div>
    ${c.isMine && !c.editMode
      ? `<div class="actions">
          <button class="act" data-act="edit-c" data-cid="${c.id}">수정</button>
          <button class="act danger" data-act="del-c" data-cid="${c.id}">삭제</button>
        </div>`
      : ""}
  </li>`;
}

function render() {
  const list = $("#commentList");
  if (!list) return;
  list.innerHTML = state.comments.map((c) => commentHTML(c)).join("");
  state.comments.forEach((c) => {
    const panel = $(`#replies-${c.id}`);
    const pill  = $(`#pill-${c.id}`);
    if (panel) panel.classList.toggle("is-open", !!c.isOpen);
    if (pill)  pill.classList.toggle("is-open",  !!c.isOpen);
    const replyMountId = `#reply-submit-${c.id}`;
    if ($(replyMountId) && typeof loadButton === "function") {
      loadButton({ target: replyMountId, text: "등록", variant: "primary" });
    }
  });
  syncCommentCount();
}

async function loadComments() {
  const { data: comments, error } = await supabase
    .from("comments")
    .select("comment_id, user_id, content, updated_at, parent_comment_id")
    .eq("work_id", workId)
    .order("updated_at", { ascending: true });

  if (error) { console.error("댓글 로드 실패:", error); return; }

  const userIds = [...new Set((comments || []).map((c) => c.user_id).filter(Boolean))];
  let userMap = {};
  if (userIds.length) {
    const { data: users } = await supabase
      .from("users").select("user_id, user_name, user_img").in("user_id", userIds);
    userMap = Object.fromEntries((users || []).map((u) => [u.user_id, u]));
  }

  const enriched = (comments || []).map((c) => ({
    id:                c.comment_id,
    user_id:           c.user_id,
    user_name:         userMap[c.user_id]?.user_name ?? "user",
    user_img:          userMap[c.user_id]?.user_img  ?? null,
    content:           c.content,
    updated_at:        c.updated_at,
    parent_comment_id: c.parent_comment_id,
    isMine:            currentUser?.id === c.user_id,
    isOpen:            false,
    editMode:          false,
  }));

  const roots   = enriched.filter((c) => !c.parent_comment_id);
  const replies = enriched.filter((c) =>  c.parent_comment_id);
  state.comments = roots.map((c) => ({ ...c, replies: replies.filter((r) => r.parent_comment_id === c.id) }));
  render();
}

async function addComment() {
  const commentInput = $("#commentInput");
  const text = (commentInput?.value || "").trim();
  if (!text) return;
  if (!currentUser) { alert("로그인이 필요합니다."); return; }

  const newComment = {
    comment_id:        crypto.randomUUID(),
    work_id:           workId,
    user_id:           currentUser.id,
    content:           text,
    updated_at:        new Date().toISOString(),
    parent_comment_id: null,
  };

  const { error } = await supabase.from("comments").insert(newComment);
  if (error) { console.error("댓글 등록 실패:", error); return; }

  await supabase.from("works").update({ comment_count: (artworkData.comment_count ?? 0) + 1 }).eq("work_id", workId);
  artworkData.comment_count = (artworkData.comment_count ?? 0) + 1;
  await insertNotification(workOwnerId, "reply", workId);
  if (commentInput) commentInput.value = "";
  alert("댓글이 등록되었습니다."); 
  await loadComments();
}

async function addReply(parentCommentId) {
  const ta   = $(`#rin-${parentCommentId}`);
  const text = (ta?.value || "").trim();
  if (!text) return;
  if (!currentUser) { alert("로그인이 필요합니다."); return; }

  const newReply = {
    comment_id:        crypto.randomUUID(),
    work_id:           workId,
    user_id:           currentUser.id,
    content:           text,
    updated_at:        new Date().toISOString(),
    parent_comment_id: parentCommentId,
  };

  const { error } = await supabase.from("comments").insert(newReply);
  if (error) { console.error("대댓글 등록 실패:", error); return; }

  const parentComment = state.comments.find((c) => c.id === parentCommentId);
  if (parentComment) await insertNotification(parentComment.user_id, "reply", workId);
  if (ta) ta.value = "";
  await loadComments();
}

async function editArtwork() {
  window.location.href = `/artwork/artwork_upload/artwork_upload.html?mode=edit&work_id=${workId}`;
}

async function deleteArtwork() {
  if (!confirm("작업물을 삭제할까요?")) return;
  if (artworkData.work_path) await supabase.storage.from("works").remove([artworkData.work_path]);
  const { error } = await supabase.from("works").delete().eq("work_id", workId);
  if (error) { console.error("삭제 실패:", error); return; }
  alert("작업물이 삭제되었습니다.");
  history.back();
  window.location.href = "/artwork/artwork.html";
}

document.addEventListener("click", async (e) => {
  if (e.target.closest("#commentSubmitMount button")) { await addComment(); return; }

  const rBtnArea = e.target.closest("[id^='reply-submit-']");
  if (rBtnArea && e.target.tagName === "BUTTON") { await addReply(rBtnArea.id.replace("reply-submit-", "")); return; }

  const t = e.target.closest("[data-act]");
  if (!t) return;
  const { act, cid, rid } = t.dataset;

  if (act === "toggle") {
    const c = state.comments.find((x) => x.id === cid);
    if (c) { c.isOpen = !c.isOpen; render(); }
  }
  if (act === "edit-c") {
    const c = state.comments.find((x) => x.id === cid);
    if (c) { c.editMode = true; render(); $(`#edit-input-c-${cid}`)?.focus(); }
  }
  if (act === "edit-cancel-c") {
    const c = state.comments.find((x) => x.id === cid);
    if (c) { c.editMode = false; render(); }
  }
  if (act === "edit-save-c") {
    const ta   = $(`#edit-input-c-${cid}`);
    const text = (ta?.value || "").trim();
    if (!text) return;
    await supabase.from("comments").update({ content: text, updated_at: new Date().toISOString() }).eq("comment_id", cid);
    await loadComments();
  }
  if (act === "del-c") {
    if (!confirm("댓글을 삭제할까요?")) return;
    await supabase.from("comments").delete().eq("comment_id", cid);
    await loadComments();
  }
  if (act === "edit-r") {
    for (const c of state.comments) {
      const r = c.replies?.find((x) => x.id === rid);
      if (r) { r.editMode = true; render(); $(`#edit-input-r-${rid}`)?.focus(); break; }
    }
  }
  if (act === "edit-cancel-r") {
    for (const c of state.comments) {
      const r = c.replies?.find((x) => x.id === rid);
      if (r) { r.editMode = false; render(); break; }
    }
  }
  if (act === "edit-save-r") {
    const ta   = $(`#edit-input-r-${rid}`);
    const text = (ta?.value || "").trim();
    if (!text) return;
    await supabase.from("comments").update({ content: text, updated_at: new Date().toISOString() }).eq("comment_id", rid);
    await loadComments();
  }
  if (act === "del-r") {
    if (!confirm("대댓글을 삭제할까요?")) return;
    await supabase.from("comments").delete().eq("comment_id", rid);
    await loadComments();
  }
  if (act === "edit-artwork") editArtwork();
  if (act === "del-artwork")  deleteArtwork();
});

document.addEventListener("DOMContentLoaded", async () => {
  if (!workId) { alert("잘못된 접근입니다."); history.back(); return; }

  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    currentUser = { id: session.user.id };
    const { data: userData } = await supabase
      .from("users").select("user_name, user_img").eq("user_id", session.user.id).single();
    if (userData) { currentUser.user_name = userData.user_name; currentUser.user_img = userData.user_img; }
  }

  const { data: work, error } = await supabase.from("works").select("*").eq("work_id", workId).single();
  if (error || !work) { alert("작업물을 찾을 수 없습니다."); history.back(); return; }

  artworkData  = work;
  workOwnerId  = work.user_id;

  const { data: ownerData } = await supabase
    .from("users").select("user_name, user_img").eq("user_id", work.user_id).single();
  artworkData.user_name = ownerData?.user_name ?? "unknown";
  artworkData.user_img  = ownerData?.user_img  ?? "/media/profil.png";
  artworkData.isMine    = currentUser?.id === work.user_id;

  const toolInfo = await fetchToolInfo(work.tool_id);
  artworkData.tool_name    = toolInfo.tool_name;
  artworkData.tool_company = toolInfo.tool_company;
  artworkData.tool_icon    = toolInfo.tool_icon;
  artworkData.rating       = toolInfo.rating;

  fillBanner(artworkData);
  renderArtworkMedia(artworkData);

  if (typeof loadButton === "function") {
    loadButton({ target: "#commentSubmitMount", text: "등록", variant: "primary" });
  }

  await initLike();
  await loadComments();
});