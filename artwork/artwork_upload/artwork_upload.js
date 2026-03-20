const supabase = window._supabase;
const $ = (s, r = document) => r.querySelector(s);

if (!supabase) {
  console.error("Supabase가 연결되지 않았습니다. window._supabase 확인 필요");
}

/* =========================================================
   상태
========================================================= */
let TOOL_LIST = [];
let selectedToolId = null;
let toolModalRef = null;
let fileInputRef = null;
let currentFile = null;
let currentObjectUrl = null;
let currentUser = null;
let originalWorkData = null;

const previewState = {
  pdfDoc: null,
  pdfPage: 1,
  pdfTotalPages: 1,
};

const urlParams = new URLSearchParams(window.location.search);
const isEditMode = urlParams.get("mode") === "edit";
const editWorkId = urlParams.get("work_id") ?? null;

const tags = [];

/* =========================================================
   유틸
========================================================= */
function esc(t) {
  return String(t ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatFileSize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function getFileExtension(name = "") {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : "";
}

function getMimeFromPath(path = "") {
  const ext = getFileExtension(path);
  if (["jpg", "jpeg"].includes(ext)) return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "mp4") return "video/mp4";
  if (ext === "mp3") return "audio/mpeg";
  if (ext === "pdf") return "application/pdf";
  if (ext === "txt") return "text/plain";
  return "";
}

function getFileTypeInfo(fileOrPath) {
  const type =
    typeof fileOrPath === "string"
      ? getMimeFromPath(fileOrPath)
      : (fileOrPath?.type || "");

  const name =
    typeof fileOrPath === "string"
      ? fileOrPath.toLowerCase()
      : (fileOrPath?.name || "").toLowerCase();

  if (type.startsWith("image/")) return { kind: "image", badge: "IMAGE" };
  if (type.startsWith("video/")) return { kind: "video", badge: "VIDEO" };
  if (type.startsWith("audio/")) return { kind: "audio", badge: "AUDIO" };
  if (type === "application/pdf" || name.endsWith(".pdf")) return { kind: "pdf", badge: "PDF" };
  if (type.startsWith("text/") || name.endsWith(".txt")) return { kind: "text", badge: "TEXT" };
  return { kind: "other", badge: "FILE" };
}

function cleanupObjectUrl() {
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
}

function debounce(fn, delay = 100) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

function generateWorkId() {
  return crypto.randomUUID().replaceAll("-", "");
}

function getSelectedTool() {
  if (!selectedToolId) return null;
  // ✅ 대소문자 무관하게 매칭
  return TOOL_LIST.find((t) =>
    String(t.id).toLowerCase() === String(selectedToolId).toLowerCase()
  ) || null;
}

function getPublicUrl(bucket, path) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl ?? "";
}

function normalizeTag(v) {
  let val = String(v || "").trim();
  if (!val) return "";
  if (!val.startsWith("#")) val = "#" + val;
  return val;
}

// ✅ pdfjsLib 로드 대기 헬퍼 (최대 3초 폴링)
function waitForPdfJs(timeout = 3000, interval = 50) {
  return new Promise((resolve) => {
    if (window.pdfjsLib) { resolve(window.pdfjsLib); return; }
    const start = Date.now();
    const timer = setInterval(() => {
      if (window.pdfjsLib) { clearInterval(timer); resolve(window.pdfjsLib); }
      else if (Date.now() - start >= timeout) { clearInterval(timer); resolve(null); }
    }, interval);
  });
}

function logSupabaseError(label, error) {
  console.group(`[${label}] Supabase Error`);
  console.error("raw error:", error);
  console.error("message:", error?.message);
  console.error("details:", error?.details);
  console.error("hint:", error?.hint);
  console.error("code:", error?.code);
  try { console.error("json:", JSON.stringify(error, null, 2)); } catch (_) {}
  console.groupEnd();
}

/* =========================================================
   현재 유저
========================================================= */
async function loadCurrentUser() {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) { logSupabaseError("auth.getSession", error); return; }
  if (!session?.user) { currentUser = null; return; }

  const authUser = session.user;

  const { data: userRow, error: userErr } = await supabase
    .from("users")
    .select("user_id, user_name, user_img")
    .eq("user_id", authUser.id)
    .single();

  if (userErr) { console.warn("users 조회 실패:"); logSupabaseError("users.select", userErr); }

  currentUser = {
    id: authUser.id,
    user_name: userRow?.user_name ?? authUser.user_metadata?.user_name ?? authUser.email ?? "사용자",
    user_img:  userRow?.user_img  ?? authUser.user_metadata?.avatar_url ?? "/media/profil.png",
  };
}

function renderCurrentUserProfile() {
  const imgEl  = $("#profileImg");
  const nameEl = $("#profileName");
  if (imgEl)  imgEl.src         = currentUser?.user_img  || "/media/profil.png";
  if (nameEl) nameEl.textContent = currentUser?.user_name || "사용자";
}

/* =========================================================
   tools 로드
========================================================= */
async function loadToolsFromDB() {
  try {
    console.group("[tools] loadToolsFromDB");

    let { data, error } = await supabase
      .from("tools")
      .select("tool_ID, tool_name, tool_company, icon, tool_cat")
      .order("tool_name", { ascending: true });

    if (error) {
      logSupabaseError("tools.firstQuery", error);
      const retry1 = await supabase.from("tools").select("tool_ID, tool_name, tool_company, icon, tool_cat");
      if (retry1.error) {
        logSupabaseError("tools.retryWithoutOrder", retry1.error);
        const retry2 = await supabase.from("tools").select("*").limit(100);
        if (retry2.error) { logSupabaseError("tools.retrySelectAll", retry2.error); TOOL_LIST = []; console.groupEnd(); return []; }
        data = retry2.data; error = null;
      } else { data = retry1.data; error = null; }
    }

    const { data: reviews } = await supabase.from("tool_reviews").select("tool_id, rating");

    TOOL_LIST = (data || []).map((t) => {
      const related = (reviews || []).filter(r => r.tool_id == t.tool_ID);
      const avg = related.length > 0
        ? related.reduce((a, b) => a + b.rating, 0) / related.length : 0;
      return {
        id: String(t.tool_ID ?? ""),
        name: t.tool_name || "",
        brand: t.tool_company ? `@${t.tool_company}` : "@Tool",
        icon: t.icon || "",
        tool_cat: t.tool_cat || "",
        stars: avg,
      };
    });

    console.log("[tools] count:", TOOL_LIST.length);
    console.groupEnd();
    return TOOL_LIST;
  } catch (err) {
    console.error(err);
    TOOL_LIST = [];
    return [];
  }
}

/* =========================================================
   툴 카드
========================================================= */
function starsToText(n) {
  const num = Number(n);
  if (!Number.isFinite(num) || num <= 0) return "";
  const s = Math.max(0, Math.min(5, Math.round(num)));
  return "★".repeat(s) + "☆".repeat(5 - s);
}

function renderToolCard(tool) {
  const placeholder       = $("#toolPlaceholder");
  const meta              = $("#toolMeta");
  const iconEl            = $("#toolCardIcon");
  const placeholderIconEl = $("#toolCardPlaceholderIcon");
  const nameEl            = $("#toolName");
  const brandEl           = $("#toolBrand");
  const starsEl           = $("#toolStars");

  if (!placeholder || !meta || !nameEl || !brandEl || !starsEl || !iconEl || !placeholderIconEl) return;

  if (!tool) {
    placeholder.hidden = false;
    meta.hidden = true;
    iconEl.src = ""; iconEl.alt = ""; iconEl.style.display = "none";
    placeholderIconEl.style.display = "inline-flex";
    nameEl.textContent = ""; brandEl.textContent = "";
    starsEl.textContent = ""; starsEl.hidden = true;
    return;
  }

  placeholder.hidden = true;   // ✅ 툴 선택됐으면 placeholder 숨김
  meta.hidden = false;
  nameEl.textContent  = tool.name  || "";
  brandEl.textContent = tool.brand || "@";

  // ✅ 별점 — 숫자 대신 별 아이콘
  const rounded = Math.round(tool.stars || 0);
  starsEl.innerHTML = [1,2,3,4,5]
    .map(n => `<span class="tool-star ${n <= rounded ? "is-on" : "is-off"}">★</span>`)
    .join("");
  starsEl.hidden = false;

  if (tool.icon) {
    iconEl.src = tool.icon; iconEl.alt = tool.name || "툴 아이콘"; iconEl.style.display = "block";
    placeholderIconEl.style.display = "none";
    iconEl.onerror = () => { iconEl.src = ""; iconEl.alt = ""; iconEl.style.display = "none"; placeholderIconEl.style.display = "inline-flex"; };
  } else {
    iconEl.src = ""; iconEl.alt = ""; iconEl.style.display = "none";
    placeholderIconEl.style.display = "inline-flex";
  }
}

/* =========================================================
   툴 모달
========================================================= */
function ensureToolModal() {
  if (toolModalRef) return toolModalRef;

  const modal = document.createElement("div");
  modal.className = "tool-modal";
  modal.innerHTML = `
    <div class="tool-modal__dim" data-tool-dim></div>
    <div class="tool-modal__panel" role="dialog" aria-modal="true" aria-label="툴 선택">
      <div class="tool-modal__header">
        <div class="tool-modal__toprow">
          <h3 class="tool-modal__title">툴 선택</h3>
          <button type="button" class="tool-modal__close" data-tool-close aria-label="닫기">×</button>
        </div>
        <input class="tool-modal__search" data-tool-search type="text" placeholder="툴 이름 검색..." />
      </div>
      <div class="tool-modal__body">
        <div class="tool-grid" data-tool-grid></div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const close = () => modal.classList.remove("is-open");
  const open  = () => modal.classList.add("is-open");

  modal.querySelector("[data-tool-dim]")?.addEventListener("click", close);
  modal.querySelector("[data-tool-close]")?.addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (modal.classList.contains("is-open") && e.key === "Escape") close(); });

  const search = modal.querySelector("[data-tool-search]");
  const grid   = modal.querySelector("[data-tool-grid]");
  search?.addEventListener("input", () => { renderToolGrid(grid, search.value.trim()); });

  toolModalRef = { modal, search, grid, open, close };
  return toolModalRef;
}

function renderToolGrid(gridEl, keyword = "") {
  if (!gridEl) return;
  const source = Array.isArray(TOOL_LIST) ? TOOL_LIST : [];
  const k = String(keyword || "").trim().toLowerCase();

  if (!source.length) { gridEl.innerHTML = `<div class="tool-empty">불러올 툴이 없습니다.</div>`; return; }

  const list = !k ? source : source.filter((t) => (t.name || "").toLowerCase().includes(k));
  if (!list.length) { gridEl.innerHTML = `<div class="tool-empty">검색 결과가 없습니다.</div>`; return; }

  gridEl.innerHTML = list.map((t) => {
    const starsText = starsToText(t.stars);
    return `
      <button type="button" class="tool-item ${String(t.id) === String(selectedToolId) ? "is-selected" : ""}" data-tool-id="${esc(t.id)}">
        ${t.icon ? `<img class="tool-icon" src="${esc(t.icon)}" alt="${esc(t.name)}" />` : `<div class="tool-icon" aria-hidden="true"></div>`}
        <div class="tool-name">${esc(t.name)}</div>
        ${starsText ? `<div class="tool-stars">${esc(starsText)}</div>` : ``}
      </button>`;
  }).join("");

  gridEl.querySelectorAll("[data-tool-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedToolId = String(btn.getAttribute("data-tool-id"));
      renderToolCard(getSelectedTool());
      ensureToolModal().close();
    });
  });
}

async function openToolModal() {
  const { search, grid, open } = ensureToolModal();
  open();
  if (search) search.value = "";
  grid.innerHTML = `<div class="tool-empty">툴 목록 불러오는 중...</div>`;
  const list = await loadToolsFromDB();
  if (!list.length) { grid.innerHTML = `<div class="tool-empty">불러올 툴이 없습니다.</div>`; return; }
  renderToolGrid(grid, "");
  setTimeout(() => search?.focus(), 0);
}

/* =========================================================
   태그
========================================================= */
function renderTags() {
  const tagList = $("#tagList");
  if (!tagList) return;
  tagList.innerHTML = tags.map((t, i) => `
    <span class="artwork-hero-banner__tag">
      ${esc(t)}
      <button class="artwork-hero-banner__tag-remove" data-i="${i}" aria-label="태그 삭제">×</button>
    </span>`).join("");
  tagList.querySelectorAll("[data-i]").forEach((btn) => {
    btn.addEventListener("click", () => { const i = Number(btn.dataset.i); if (!Number.isNaN(i)) { tags.splice(i, 1); renderTags(); } });
  });
}

function setupTagInput() {
  const tagInput = $("#tagInput");
  if (!tagInput) return;
  tagInput.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    if (e.isComposing) return; // ✅ 한글 조합 중이면 무시
    e.preventDefault();
    const val = normalizeTag(tagInput.value);
    if (!val) return;
    if (tags.includes(val)) { tagInput.value = ""; return; }
    if (tags.length >= 10) { alert("태그는 최대 10개까지 가능합니다."); return; }
    tags.push(val);
    renderTags();
    tagInput.value = "";
  });
}

/* =========================================================
   프리뷰 공통
========================================================= */
function showPreviewShell(fileLike) {
  const empty      = $("#dropZoneEmpty");
  const card       = $("#previewCard");
  const fileName   = $("#previewFileName");
  const fileSize   = $("#previewFileSize");
  const typeBadge  = $("#previewTypeBadge");
  const previewBody = $("#previewBody");
  if (!empty || !card || !fileName || !fileSize || !typeBadge || !previewBody) return;
  empty.hidden = true;
  card.hidden  = false;
  fileName.textContent  = fileLike.name || "파일";
  fileSize.textContent  = fileLike.size ? formatFileSize(fileLike.size) : "";
  typeBadge.textContent = getFileTypeInfo(fileLike).badge;
  previewBody.innerHTML = "";
}

function resetPreview() {
  cleanupObjectUrl();
  currentFile = null;
  previewState.pdfDoc = null;
  previewState.pdfPage = 1;
  previewState.pdfTotalPages = 1;
  const body  = $("#previewBody");
  const card  = $("#previewCard");
  const empty = $("#dropZoneEmpty");
  if (body)  body.innerHTML  = "";
  if (card)  card.hidden     = true;
  if (empty) empty.hidden    = false;
  if (fileInputRef) fileInputRef.value = "";
}

function renderImagePreview(file) {
  cleanupObjectUrl();
  currentObjectUrl = URL.createObjectURL(file);
  $("#previewBody").innerHTML = `
    <div class="preview-image-wrap">
      <img class="preview-image" src="${currentObjectUrl}" alt="${esc(file.name)}" />
    </div>`;
}

// ✅ 영상 — 썸네일 + 재생버튼 (신규 파일)
function renderVideoPreview(file) {
  cleanupObjectUrl();
  currentObjectUrl = URL.createObjectURL(file);

  $("#previewBody").innerHTML = `
    <div class="preview-video-wrap">
      <video class="preview-video" playsinline preload="metadata" id="newVideoEl">
        <source src="${currentObjectUrl}" type="${esc(file.type || "video/mp4")}" />
      </video>
      <canvas class="preview-video-thumb" id="newVideoThumb"></canvas>
      <button class="preview-video-playbtn" id="newVideoPlayBtn" aria-label="재생">
        <svg viewBox="0 0 24 24" fill="white" width="52" height="52"
          style="filter:drop-shadow(0 2px 8px rgba(0,0,0,0.4))">
          <path d="M8 5v14l11-7z"></path>
        </svg>
      </button>
    </div>`;

  const body    = $("#previewBody");
  const video   = body.querySelector("#newVideoEl");
  const canvas  = body.querySelector("#newVideoThumb");
  const playBtn = body.querySelector("#newVideoPlayBtn");

  video.addEventListener("loadeddata", () => { video.currentTime = 0.5; });
  video.addEventListener("seeked", () => {
    const ctx = canvas.getContext("2d");
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.style.display = "block";
    video.style.display  = "none";
  });

  const pauseSvg = `<svg viewBox="0 0 24 24" fill="white" width="36" height="36" style="filter:drop-shadow(0 2px 8px rgba(0,0,0,0.4))"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>`;
  const playSvg  = `<svg viewBox="0 0 24 24" fill="white" width="52" height="52" style="filter:drop-shadow(0 2px 8px rgba(0,0,0,0.4))"><path d="M8 5v14l11-7z"></path></svg>`;

  playBtn.addEventListener("click", () => {
    if (video.paused) { canvas.style.display = "none"; video.style.display = "block"; video.play(); playBtn.innerHTML = pauseSvg; }
    else              { video.pause(); playBtn.innerHTML = playSvg; }
  });
  video.addEventListener("ended", () => { canvas.style.display = "block"; video.style.display = "none"; playBtn.innerHTML = playSvg; });
}

// ✅ 오디오 — 그라데이션 + 재생버튼 (신규 파일)
function renderAudioPreview(file) {
  cleanupObjectUrl();
  currentObjectUrl = URL.createObjectURL(file);

  const audioId = `audioPlayer_${Date.now()}`;
  $("#previewBody").innerHTML = `
    <div class="preview-audio-wrap" style="display:flex;align-items:center;justify-content:center;padding:24px;">
      <div style="position:relative;width:220px;height:220px;flex-shrink:0;border-radius:24px;overflow:hidden;">
        <div style="width:220px;height:220px;border-radius:24px;background:linear-gradient(135deg,#dce8f8 0%,#c8d9f5 100%);display:flex;align-items:center;justify-content:center;color:#2a7cff;">
          <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 18V5l12-2v13"></path>
            <circle cx="6" cy="18" r="3"></circle>
            <circle cx="18" cy="16" r="3"></circle>
          </svg>
        </div>
        <button id="${audioId}_btn" aria-label="재생"
          style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:transparent;border:none;cursor:pointer;border-radius:24px;">
          <svg viewBox="0 0 24 24" fill="white" width="52" height="52" style="filter:drop-shadow(0 2px 6px rgba(0,0,0,0.3))">
            <path d="M8 5v14l11-7z"></path>
          </svg>
        </button>
      </div>
      <audio id="${audioId}" preload="metadata">
        <source src="${currentObjectUrl}" type="${esc(file.type || "audio/mpeg")}" />
      </audio>
    </div>`;

  const audio   = document.getElementById(audioId);
  const playBtn = document.getElementById(`${audioId}_btn`);
  const pauseSvg = `<svg viewBox="0 0 24 24" fill="white" width="36" height="36"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>`;
  const playSvg  = `<svg viewBox="0 0 24 24" fill="white" width="52" height="52" style="filter:drop-shadow(0 2px 6px rgba(0,0,0,0.3))"><path d="M8 5v14l11-7z"></path></svg>`;

  playBtn?.addEventListener("click", () => {
    if (audio.paused) { audio.play(); playBtn.innerHTML = pauseSvg; }
    else              { audio.pause(); playBtn.innerHTML = playSvg; }
  });
  audio?.addEventListener("ended", () => { playBtn.innerHTML = playSvg; });
}

async function renderTextPreview(file) {
  const text = await file.text();
  const safe = esc(text.slice(0, 12000));
  $("#previewBody").innerHTML = `
    <div class="preview-text-wrap">
      <div class="preview-text-title">텍스트 미리보기</div>
      <div class="preview-text-content">${safe}</div>
    </div>`;
}

async function renderPdfPage() {
  const canvas    = $("#pdfPreviewCanvas");
  const indicator = $("#pdfPageIndicator");
  if (!canvas || !indicator || !previewState.pdfDoc) return;

  const page  = await previewState.pdfDoc.getPage(previewState.pdfPage);
  const vp    = page.getViewport({ scale: 1 });
  const stage = canvas.parentElement;
  const scale = Math.min(stage.clientWidth / vp.width, stage.clientHeight / vp.height);
  const svp   = page.getViewport({ scale });

  const ctx = canvas.getContext("2d");
  canvas.width  = svp.width;
  canvas.height = svp.height;
  await page.render({ canvasContext: ctx, viewport: svp }).promise;
  indicator.textContent = `${previewState.pdfPage} / ${previewState.pdfTotalPages}`;
}

async function renderPdfPreview(file) {
  const body = $("#previewBody");
  if (!body) return;

  body.innerHTML = `
    <div class="preview-pdf-wrap">
      <div class="preview-pdf-stage">
        <canvas class="preview-pdf-canvas" id="pdfPreviewCanvas"></canvas>
      </div>
      <div class="preview-pdf-controls">
        <button type="button" class="preview-pdf-btn" id="pdfPrevBtn">이전</button>
        <div class="preview-pdf-page" id="pdfPageIndicator">1 / 1</div>
        <button type="button" class="preview-pdf-btn" id="pdfNextBtn">다음</button>
      </div>
    </div>`;

  try {
    cleanupObjectUrl();
    currentObjectUrl = URL.createObjectURL(file);
    const lib = window.pdfjsLib;
    if (!lib) throw new Error("pdf.js not loaded");

    previewState.pdfDoc        = await lib.getDocument(currentObjectUrl).promise;
    previewState.pdfPage       = 1;
    previewState.pdfTotalPages = previewState.pdfDoc.numPages;

    $("#pdfPrevBtn")?.addEventListener("click", async () => { if (previewState.pdfPage > 1) { previewState.pdfPage--; await renderPdfPage(); } });
    $("#pdfNextBtn")?.addEventListener("click", async () => { if (previewState.pdfPage < previewState.pdfTotalPages) { previewState.pdfPage++; await renderPdfPage(); } });

    await renderPdfPage();
    window.addEventListener("resize", debounce(renderPdfPage, 120));
  } catch (err) {
    console.error("PDF 미리보기 실패:", err);
    body.innerHTML = `<div class="preview-fallback"><div class="preview-fallback__icon">📄</div><div class="preview-fallback__title">PDF 미리보기 실패</div></div>`;
  }
}

async function renderFilePreview(file) {
  currentFile = file;
  showPreviewShell(file);
  const { kind } = getFileTypeInfo(file);
  if (kind === "image") return renderImagePreview(file);
  if (kind === "video") return renderVideoPreview(file);
  if (kind === "audio") return renderAudioPreview(file);
  if (kind === "pdf")   return renderPdfPreview(file);
  if (kind === "text")  return renderTextPreview(file);
  $("#previewBody").innerHTML = `<div class="preview-fallback"><div class="preview-fallback__icon">📎</div><div class="preview-fallback__title">${esc(file.name)}</div></div>`;
}

/* =========================================================
   기존 파일 프리뷰 (수정 모드)
========================================================= */
function showRemotePreviewShell({ name = "기존 파일", path = "" }) {
  const empty       = $("#dropZoneEmpty");
  const card        = $("#previewCard");
  const fileName    = $("#previewFileName");
  const fileSize    = $("#previewFileSize");
  const typeBadge   = $("#previewTypeBadge");
  const previewBody = $("#previewBody");
  if (!empty || !card || !fileName || !fileSize || !typeBadge || !previewBody) return;
  empty.hidden = true;
  card.hidden  = false;
  fileName.textContent  = name;
  fileSize.textContent  = "";
  typeBadge.textContent = getFileTypeInfo(path).badge;
  previewBody.innerHTML = "";
}

async function renderRemotePreview({ name, path, url }) {
  if (!url) return;
  showRemotePreviewShell({ name, path });
  const { kind } = getFileTypeInfo(path);
  const body = $("#previewBody");
  if (!body) return;

  if (kind === "image") {
    body.innerHTML = `
      <div class="preview-image-wrap">
        <img class="preview-image" src="${esc(url)}" alt="${esc(name || "기존 파일")}" />
      </div>`;
    return;
  }

  // ✅ 영상 — 썸네일 + 재생버튼 (기존 파일)
  if (kind === "video") {
    body.innerHTML = `
      <div class="preview-video-wrap">
        <video class="preview-video" playsinline preload="metadata" id="remoteVideoEl">
          <source src="${esc(url)}" type="${esc(getMimeFromPath(path) || "video/mp4")}" />
        </video>
        <canvas class="preview-video-thumb" id="remoteVideoThumb"></canvas>
        <button class="preview-video-playbtn" id="remoteVideoPlayBtn" aria-label="재생">
          <svg viewBox="0 0 24 24" fill="white" width="52" height="52"
            style="filter:drop-shadow(0 2px 8px rgba(0,0,0,0.4))">
            <path d="M8 5v14l11-7z"></path>
          </svg>
        </button>
      </div>`;

    const video   = body.querySelector("#remoteVideoEl");
    const canvas  = body.querySelector("#remoteVideoThumb");
    const playBtn = body.querySelector("#remoteVideoPlayBtn");
    const pauseSvg = `<svg viewBox="0 0 24 24" fill="white" width="36" height="36" style="filter:drop-shadow(0 2px 8px rgba(0,0,0,0.4))"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>`;
    const playSvg  = `<svg viewBox="0 0 24 24" fill="white" width="52" height="52" style="filter:drop-shadow(0 2px 8px rgba(0,0,0,0.4))"><path d="M8 5v14l11-7z"></path></svg>`;

    video.addEventListener("loadeddata", () => { video.currentTime = 0.5; });
    video.addEventListener("seeked", () => {
      const ctx = canvas.getContext("2d");
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.style.display = "block";
      video.style.display  = "none";
    });
    playBtn.addEventListener("click", () => {
      if (video.paused) { canvas.style.display = "none"; video.style.display = "block"; video.play(); playBtn.innerHTML = pauseSvg; }
      else              { video.pause(); playBtn.innerHTML = playSvg; }
    });
    video.addEventListener("ended", () => { canvas.style.display = "block"; video.style.display = "none"; playBtn.innerHTML = playSvg; });
    return;
  }

  // ✅ 오디오 — 그라데이션 + 재생버튼 (기존 파일)
  if (kind === "audio") {
    const audioId = `remoteAudio_${Date.now()}`;
    body.innerHTML = `
      <div class="preview-audio-wrap" style="display:flex;align-items:center;justify-content:center;padding:24px;">
        <div style="position:relative;width:220px;height:220px;flex-shrink:0;border-radius:24px;overflow:hidden;">
          <div style="width:220px;height:220px;border-radius:24px;background:linear-gradient(135deg,#dce8f8 0%,#c8d9f5 100%);display:flex;align-items:center;justify-content:center;color:#2a7cff;">
            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18V5l12-2v13"></path>
              <circle cx="6" cy="18" r="3"></circle>
              <circle cx="18" cy="16" r="3"></circle>
            </svg>
          </div>
          <button id="${audioId}_btn" aria-label="재생"
            style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:transparent;border:none;cursor:pointer;border-radius:24px;">
            <svg viewBox="0 0 24 24" fill="white" width="52" height="52" style="filter:drop-shadow(0 2px 6px rgba(0,0,0,0.3))">
              <path d="M8 5v14l11-7z"></path>
            </svg>
          </button>
        </div>
        <audio id="${audioId}" preload="metadata">
          <source src="${esc(url)}" type="${esc(getMimeFromPath(path) || "audio/mpeg")}" />
        </audio>
      </div>`;

    const audio   = body.querySelector(`#${audioId}`);
    const playBtn = body.querySelector(`#${audioId}_btn`);
    const pauseSvg = `<svg viewBox="0 0 24 24" fill="white" width="36" height="36"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>`;
    const playSvg  = `<svg viewBox="0 0 24 24" fill="white" width="52" height="52" style="filter:drop-shadow(0 2px 6px rgba(0,0,0,0.3))"><path d="M8 5v14l11-7z"></path></svg>`;

    playBtn?.addEventListener("click", () => {
      if (audio.paused) { audio.play(); playBtn.innerHTML = pauseSvg; }
      else              { audio.pause(); playBtn.innerHTML = playSvg; }
    });
    audio?.addEventListener("ended", () => { playBtn.innerHTML = playSvg; });
    return;
  }

  if (kind === "pdf") {
    // ✅ 기존 파일도 캔버스로 PDF 미리보기
    body.innerHTML = `
      <div class="preview-pdf-wrap">
        <div class="preview-pdf-stage">
          <canvas class="preview-pdf-canvas" id="remotePdfCanvas"></canvas>
        </div>
        <div class="preview-pdf-controls">
          <button type="button" class="preview-pdf-btn" id="remotePdfPrev">이전</button>
          <div class="preview-pdf-page" id="remotePdfPage">1 / 1</div>
          <button type="button" class="preview-pdf-btn" id="remotePdfNext">다음</button>
        </div>
      </div>`;

    try {
      // ✅ pdfjsLib 로드 대기 — 최대 3초 폴링
      const lib = await waitForPdfJs();
      if (!lib) throw new Error("pdf.js not loaded");

      // ✅ workerSrc 설정
      if (!lib.GlobalWorkerOptions.workerSrc) {
        lib.GlobalWorkerOptions.workerSrc =
          "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.6.82/build/pdf.worker.min.mjs";
      }

      const pdfState = { doc: null, page: 1, total: 1 };
      const canvas  = body.querySelector("#remotePdfCanvas");
      const pageEl  = body.querySelector("#remotePdfPage");
      const prevBtn = body.querySelector("#remotePdfPrev");
      const nextBtn = body.querySelector("#remotePdfNext");

      async function drawRemotePage() {
        if (!canvas || !pdfState.doc) return;
        const page  = await pdfState.doc.getPage(pdfState.page);
        const vp    = page.getViewport({ scale: 1 });
        const stage = canvas.parentElement;
        const scale = Math.min(
          (stage.clientWidth  || 600) / vp.width,
          (stage.clientHeight || 400) / vp.height
        );
        const svp = page.getViewport({ scale });
        canvas.width  = svp.width;
        canvas.height = svp.height;
        await page.render({ canvasContext: canvas.getContext("2d"), viewport: svp }).promise;
        if (pageEl) pageEl.textContent = `${pdfState.page} / ${pdfState.total}`;
        if (prevBtn) prevBtn.disabled = pdfState.page <= 1;
        if (nextBtn) nextBtn.disabled = pdfState.page >= pdfState.total;
      }

      pdfState.doc   = await lib.getDocument(url).promise;
      pdfState.total = pdfState.doc.numPages;
      await drawRemotePage();

      prevBtn?.addEventListener("click", async () => { if (pdfState.page > 1) { pdfState.page--; await drawRemotePage(); } });
      nextBtn?.addEventListener("click", async () => { if (pdfState.page < pdfState.total) { pdfState.page++; await drawRemotePage(); } });
    } catch (e) {
      console.error("기존 PDF 미리보기 실패:", e);
      body.innerHTML = `
        <div class="preview-fallback">
          <div class="preview-fallback__icon">📄</div>
          <div class="preview-fallback__title">PDF 미리보기 실패</div>
          <a href="${esc(url)}" target="_blank" rel="noopener noreferrer">새 창에서 보기</a>
        </div>`;
    }
    return;
  }

  if (kind === "text") {
    body.innerHTML = `
      <div class="preview-fallback">
        <div class="preview-fallback__icon">📝</div>
        <div class="preview-fallback__title">기존 텍스트 파일</div>
        <a href="${esc(url)}" target="_blank" rel="noopener noreferrer">새 창에서 보기</a>
      </div>`;
    return;
  }

  body.innerHTML = `
    <div class="preview-fallback">
      <div class="preview-fallback__icon">📎</div>
      <div class="preview-fallback__title">기존 파일</div>
      <a href="${esc(url)}" target="_blank" rel="noopener noreferrer">새 창에서 보기</a>
    </div>`;
}

/* =========================================================
   파일 입력 / 드래그
========================================================= */
function validateFile(file) {
  if (!file) return { ok: false, message: "파일이 없습니다." };
  const allowedExt = ["jpg", "jpeg", "png", "mp4", "mp3", "pdf", "txt"];
  const ext = getFileExtension(file.name);
  if (!allowedExt.includes(ext)) return { ok: false, message: "jpg, jpeg, png, mp4, mp3, pdf, txt 파일만 업로드 가능합니다." };
  if (file.size > 3 * 1024 * 1024) return { ok: false, message: "파일 용량은 3MB 이하만 업로드 가능합니다." };
  return { ok: true };
}

function setupFileInput() {
  const input = document.createElement("input");
  input.type     = "file";
  input.id       = "artworkFileInput";
  input.multiple = false;
  input.accept   = ".mp4,.mp3,.jpg,.jpeg,.png,.pdf,.txt,video/*,audio/*,image/*,text/plain";
  input.style.display = "none";
  document.body.appendChild(input);

  input.addEventListener("change", async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const file  = files[0];
    const valid = validateFile(file);
    if (!valid.ok) { alert(valid.message); input.value = ""; return; }
    await renderFilePreview(file);
  });

  fileInputRef = input;
  return input;
}

function setupDragDrop() {
  const dropZone = $("#dropZone");
  if (!dropZone) return;
  const prevent = (e) => { e.preventDefault(); e.stopPropagation(); };
  ["dragenter", "dragover"].forEach((type) => { dropZone.addEventListener(type, (e) => { prevent(e); dropZone.classList.add("is-dragover"); }); });
  ["dragleave", "drop"].forEach((type)     => { dropZone.addEventListener(type, (e) => { prevent(e); dropZone.classList.remove("is-dragover"); }); });
  dropZone.addEventListener("drop", async (e) => {
    const files = Array.from(e.dataTransfer?.files || []);
    if (!files.length) return;
    const file  = files[0];
    const valid = validateFile(file);
    if (!valid.ok) { alert(valid.message); return; }
    await renderFilePreview(file);
  });
}

/* =========================================================
   스토리지
========================================================= */
async function uploadFileToStorage(file, workId) {
  if (!file) return null;
  const ext    = getFileExtension(file.name) || "bin";
  const safeExt = ext.replace(/[^a-z0-9]/gi, "").toLowerCase() || "bin";
  const fileName = `${Date.now()}.${safeExt}`;
  const path = `${currentUser.id}/${workId}/${fileName}`;
  console.log("path:", path);
  const { error } = await supabase.storage.from("works").upload(path, file, { upsert: true, contentType: file.type || undefined });
  if (error) throw error;
  return { path, url: getPublicUrl("works", path) };
}

async function removeStorageFile(path) {
  if (!path) return;
  const { error } = await supabase.storage.from("works").remove([path]);
  if (error) console.warn("기존 파일 삭제 실패:", error);
}

/* =========================================================
   edit 모드
========================================================= */
function applyEditModeUI() {
  if (!isEditMode) return;
  const modeEl = $("#bannerMode");
  if (modeEl) modeEl.textContent = "수정";
  document.title = "작업물 수정";
}

async function fillEditDataFromDB() {
  if (!isEditMode || !editWorkId) return;
  const { data: work, error } = await supabase.from("works").select("*").eq("work_id", editWorkId).single();
  if (error || !work) { alert("수정할 작업물을 찾을 수 없습니다."); history.back(); return; }
  if (!currentUser || currentUser.id !== work.user_id) { alert("본인 작업물만 수정할 수 있습니다."); history.back(); return; }

  originalWorkData = work;
  const titleEl = $("#titleInput");
  const descEl  = $("#description");
  if (titleEl) titleEl.value = work.work_title || "";
  if (descEl)  descEl.value  = work.work_desc  || "";

  tags.length = 0;
  if (Array.isArray(work.work_tags)) {
    work.work_tags.forEach((tag) => { const norm = normalizeTag(tag); if (norm && !tags.includes(norm)) tags.push(norm); });
  }
  renderTags();

  if (work.tool_id) {
    // ✅ TOOL_LIST가 이미 로드돼 있으면 재로드 안 함
    if (!TOOL_LIST.length) await loadToolsFromDB();
    selectedToolId = String(work.tool_id);

    const found = getSelectedTool();
    console.log("[edit] tool_id:", work.tool_id, "found:", found);
    renderToolCard(found);
  }

  if (work.work_link) {
    renderRemotePreview({ name: work.work_title || "기존 파일", path: work.work_path || "", url: work.work_link });
  }
}

/* =========================================================
   버튼 마운트
========================================================= */
async function mountUploadButton(fileInput) {
  if (typeof loadButton !== "function") return;
  await loadButton({ target: "#fileUploadMount", text: "파일 업로드", variant: "primary", onClick: () => fileInput.click() });
  const btn = document.querySelector("#fileUploadMount .btn") || document.querySelector("#fileUploadMount button");
  if (btn) {
    btn.innerHTML = `<span class="upload-btn__inner"><img class="upload-btn__icon" src="/media/upload.png" alt="" /><span>파일 업로드</span></span>`;
  }
}

async function mountActionButtons() {
  if (typeof loadButton !== "function") return;
  await loadButton({ target: "#cancelBtnMount", text: "취소하기", variant: "outline", onClick: () => history.back() });
  await loadButton({ target: "#submitBtnMount", text: isEditMode ? "수정하기" : "등록하기", variant: "primary", onClick: async () => { await submitArtwork(); } });
}

/* =========================================================
   등록 / 수정
========================================================= */
async function submitArtwork() {
  try {
    if (!currentUser) await loadCurrentUser();
    if (!currentUser) { alert("로그인이 필요합니다."); window.location.href = "/login1/login1.html"; return; }

    const title = ($("#titleInput")?.value || "").trim();
    const desc  = ($("#description")?.value || "").trim();
    const tool  = getSelectedTool();

    if (!title) { alert("제목을 입력해주세요."); $("#titleInput")?.focus(); return; }
    if (!desc)  { alert("설명을 입력해주세요."); $("#description")?.focus(); return; }
    if (!tool)  { alert("사용한 툴을 선택해주세요."); return; }
    if (!isEditMode && !currentFile) { alert("파일을 업로드해주세요."); return; }

    const submitBtn = document.querySelector("#submitBtnMount .btn") || document.querySelector("#submitBtnMount button");
    if (submitBtn) { submitBtn.disabled = true; submitBtn.style.pointerEvents = "none"; }

    const now = new Date().toISOString();

    if (!isEditMode) {
      const workId   = generateWorkId();
      const uploaded = currentFile ? await uploadFileToStorage(currentFile, workId) : null;
      const payload  = {
        work_id: workId, user_id: currentUser.id, tool_id: tool.id, tool_cat: tool.tool_cat || "",
        work_link: uploaded?.url || "", work_desc: desc, updated_at: now,
        like_count: 0, comment_count: 0, work_path: uploaded?.path || "",
        work_tags: [...tags], work_title: title,
      };
      const { error } = await supabase.from("works").insert(payload);
      if (error) throw error;
      alert("작업물이 등록되었습니다.");
      window.location.href = `/artwork/artwork_post/artwork_post.html?work_id=${workId}`;
      return;
    }

    if (!originalWorkData) { alert("기존 작업물 정보를 찾을 수 없습니다."); return; }

    let nextPath = originalWorkData.work_path || "";
    let nextLink = originalWorkData.work_link || "";

    if (currentFile) {
      const uploaded = await uploadFileToStorage(currentFile, originalWorkData.work_id);
      nextPath = uploaded?.path || "";
      nextLink = uploaded?.url  || "";
      if (originalWorkData.work_path && originalWorkData.work_path !== nextPath) await removeStorageFile(originalWorkData.work_path);
    }

    const updatePayload = {
      tool_id: tool.id, tool_cat: tool.tool_cat || "", work_link: nextLink,
      work_desc: desc, updated_at: now, work_path: nextPath,
      work_tags: [...tags], work_title: title,
    };
    const { error } = await supabase.from("works").update(updatePayload).eq("work_id", originalWorkData.work_id).eq("user_id", currentUser.id);
    if (error) throw error;

    alert("작업물이 수정되었습니다.");
    window.location.href = `/artwork/artwork_post/artwork_post.html?work_id=${originalWorkData.work_id}`;
  } catch (err) {
    console.error("등록/수정 실패:", err);
    alert(`저장에 실패했습니다.\n${err.message || "알 수 없는 오류"}`);
  } finally {
    const submitBtn = document.querySelector("#submitBtnMount .btn") || document.querySelector("#submitBtnMount button");
    if (submitBtn) { submitBtn.disabled = false; submitBtn.style.pointerEvents = ""; }
  }
}

/* =========================================================
   INIT
========================================================= */
document.addEventListener("DOMContentLoaded", async () => {
  applyEditModeUI();
  renderToolCard(null);
  setupTagInput();

  await loadCurrentUser();
  renderCurrentUserProfile();
  await loadToolsFromDB();

  const picker = $("#toolPicker");
  if (picker) {
    picker.addEventListener("click", async () => { await openToolModal(); });
    picker.addEventListener("keydown", async (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); await openToolModal(); } });
  }

  const fileInput = setupFileInput();
  setupDragDrop();
  await mountUploadButton(fileInput);

  $("#dropZone")?.addEventListener("click", (e) => {
    if (!e.target.closest("button") && !e.target.closest(".preview-image-wrap") &&
        !e.target.closest(".preview-pdf-wrap") && !e.target.closest(".preview-video-wrap") &&
        !e.target.closest(".preview-audio-wrap")) {
      fileInput.click();
    }
  });

  $("#removeFileBtn")?.addEventListener("click", () => {
    cleanupObjectUrl();
    currentFile = null;
    if (isEditMode && originalWorkData?.work_link) {
      renderRemotePreview({ name: originalWorkData.work_title || "기존 파일", path: originalWorkData.work_path || "", url: originalWorkData.work_link });
      return;
    }
    resetPreview();
  });

  $("#replaceFileBtn")?.addEventListener("click", () => fileInput.click());
  await mountActionButtons();
  if (isEditMode) await fillEditDataFromDB();
});