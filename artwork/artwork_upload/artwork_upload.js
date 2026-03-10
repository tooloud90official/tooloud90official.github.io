const TOOL_LIST = [
  { id:"firefly", name:"Adobe Firefly", brand:"@Adobe", stars:4 },
  { id:"chatgpt", name:"ChatGPT", brand:"@OpenAI", stars:5 },
  { id:"claude", name:"Claude", brand:"@Anthropic", stars:5 },
  { id:"gemini", name:"Gemini", brand:"@Google", stars:4 },
  { id:"midjourney", name:"Midjourney", brand:"@Midjourney", stars:5 },
  { id:"ideogram", name:"Ideogram", brand:"@Ideogram", stars:4 },
  { id:"runway", name:"Runway", brand:"@Runway", stars:4 },
  { id:"pika", name:"Pika", brand:"@Pika", stars:4 },
  { id:"capcut", name:"CapCut", brand:"@ByteDance", stars:4 },
  { id:"notion", name:"Notion", brand:"@Notion", stars:5 },
  { id:"figma", name:"Figma", brand:"@Figma", stars:5 },
  { id:"photoshop", name:"Photoshop", brand:"@Adobe", stars:5 },
  { id:"illustrator", name:"Illustrator", brand:"@Adobe", stars:5 },
  { id:"blender", name:"Blender", brand:"@Blender", stars:5 },
  { id:"premiere", name:"Premiere Pro", brand:"@Adobe", stars:4 },
];

let selectedToolId = null;
let toolModalRef = null;
let fileInputRef = null;
let currentFile = null;
let currentObjectUrl = null;

const previewState = { pdfDoc: null, pdfPage: 1, pdfTotalPages: 1 };

/* ── 툴 카드 ── */
function starsToText(n) {
  const s = Math.max(0, Math.min(5, Number(n) || 0));
  return "★".repeat(s) + "☆".repeat(5 - s);
}
function getSelectedTool() {
  return TOOL_LIST.find(t => t.id === selectedToolId) || null;
}
function renderToolCard(tool) {
  const placeholder = document.getElementById("toolPlaceholder");
  const meta       = document.getElementById("toolMeta");
  const nameEl     = document.getElementById("toolName");
  const brandEl    = document.getElementById("toolBrand");
  const starsEl    = document.getElementById("toolStars");
  if (!placeholder || !meta) return;
  if (!tool) {
    placeholder.hidden = false; meta.hidden = true;
    nameEl.textContent = brandEl.textContent = starsEl.textContent = "";
    return;
  }
  placeholder.hidden = true; meta.hidden = false;
  nameEl.textContent  = tool.name;
  brandEl.textContent = tool.brand || "@";
  starsEl.textContent = starsToText(tool.stars ?? 5);
}

/* ── 툴 모달 ── */
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
      <div class="tool-modal__body"><div class="tool-grid" data-tool-grid></div></div>
    </div>`;
  document.body.appendChild(modal);

  const close = () => modal.classList.remove("is-open");
  const open  = () => modal.classList.add("is-open");
  modal.querySelector("[data-tool-dim]").addEventListener("click", close);
  modal.querySelector("[data-tool-close]").addEventListener("click", close);
  document.addEventListener("keydown", e => { if (modal.classList.contains("is-open") && e.key === "Escape") close(); });

  const search = modal.querySelector("[data-tool-search]");
  const grid   = modal.querySelector("[data-tool-grid]");
  search.addEventListener("input", () => renderToolGrid(grid, search.value.trim()));

  toolModalRef = { modal, search, grid, open, close };
  return toolModalRef;
}

function renderToolGrid(gridEl, keyword = "") {
  const list = TOOL_LIST.filter(t => t.name.toLowerCase().includes(keyword.toLowerCase()));
  gridEl.innerHTML = list.map(t => `
    <button type="button" class="tool-item ${t.id === selectedToolId ? "is-selected" : ""}" data-tool-id="${t.id}">
      <div class="tool-icon" aria-hidden="true"></div>
      <div class="tool-name">${t.name}</div>
    </button>`).join("");
  gridEl.querySelectorAll("[data-tool-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedToolId = btn.getAttribute("data-tool-id");
      renderToolCard(getSelectedTool());
      ensureToolModal().close();
    });
  });
}

function openToolModal() {
  const { search, grid, open } = ensureToolModal();
  open(); search.value = ""; renderToolGrid(grid, "");
  setTimeout(() => search.focus(), 0);
}

/* ── 파일 유틸 ── */
function formatFileSize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
function getFileTypeInfo(file) {
  const type = file.type || "", name = (file.name || "").toLowerCase();
  if (type.startsWith("image/")) return { kind: "image", badge: "IMAGE" };
  if (type.startsWith("video/")) return { kind: "video", badge: "VIDEO" };
  if (type.startsWith("audio/")) return { kind: "audio", badge: "AUDIO" };
  if (type === "application/pdf" || name.endsWith(".pdf")) return { kind: "pdf", badge: "PDF" };
  if (type.startsWith("text/") || name.endsWith(".txt")) return { kind: "text", badge: "TEXT" };
  return { kind: "other", badge: "FILE" };
}
function cleanupObjectUrl() {
  if (currentObjectUrl) { URL.revokeObjectURL(currentObjectUrl); currentObjectUrl = null; }
}

/* ── 프리뷰 ── */
function showPreviewShell(file) {
  document.getElementById("dropZoneEmpty").hidden = true;
  document.getElementById("previewCard").hidden   = false;
  document.getElementById("previewFileName").textContent = file.name;
  document.getElementById("previewFileSize").textContent = formatFileSize(file.size);
  const info = getFileTypeInfo(file);
  document.getElementById("previewTypeBadge").textContent = info.badge;
  document.getElementById("previewBody").innerHTML = "";
}

function resetPreview() {
  cleanupObjectUrl();
  currentFile = null;
  previewState.pdfDoc = null; previewState.pdfPage = 1; previewState.pdfTotalPages = 1;
  const body  = document.getElementById("previewBody");
  const card  = document.getElementById("previewCard");
  const empty = document.getElementById("dropZoneEmpty");
  if (body)  body.innerHTML = "";
  if (card)  card.hidden = true;
  if (empty) empty.hidden = false;
  if (fileInputRef) fileInputRef.value = "";
}

function renderImagePreview(file) {
  cleanupObjectUrl(); currentObjectUrl = URL.createObjectURL(file);
  document.getElementById("previewBody").innerHTML = `
    <div class="preview-image-wrap">
      <img class="preview-image" src="${currentObjectUrl}" alt="${file.name}" />
    </div>`;
}
function renderVideoPreview(file) {
  cleanupObjectUrl(); currentObjectUrl = URL.createObjectURL(file);
  document.getElementById("previewBody").innerHTML = `
    <div class="preview-video-wrap">
      <video class="preview-video" controls playsinline preload="metadata">
        <source src="${currentObjectUrl}" type="${file.type || "video/mp4"}" />
      </video>
    </div>`;
}
function renderAudioPreview(file) {
  cleanupObjectUrl(); currentObjectUrl = URL.createObjectURL(file);
  document.getElementById("previewBody").innerHTML = `
    <div class="preview-audio-wrap">
      <div class="preview-audio-icon">🎵</div>
      <div class="preview-audio-title">${file.name}</div>
      <audio class="preview-audio" controls preload="metadata">
        <source src="${currentObjectUrl}" type="${file.type || "audio/mpeg"}" />
      </audio>
    </div>`;
}
async function renderTextPreview(file) {
  const text = await file.text();
  const safe = text.slice(0, 12000).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
  document.getElementById("previewBody").innerHTML = `
    <div class="preview-text-wrap">
      <div class="preview-text-title">텍스트 미리보기</div>
      <div class="preview-text-content">${safe}</div>
    </div>`;
}

function debounce(fn, delay = 100) {
  let t = null; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), delay); };
}

async function renderPdfPage() {
  const canvas = document.getElementById("pdfPreviewCanvas");
  const indicator = document.getElementById("pdfPageIndicator");
  if (!canvas || !indicator || !previewState.pdfDoc) return;

  const page = await previewState.pdfDoc.getPage(previewState.pdfPage);
  const vp = page.getViewport({ scale: 1 });

  const stage = canvas.parentElement;
  const stageW = stage.clientWidth;
  const stageH = stage.clientHeight;

  // 가로/세로 둘 다 stage에 맞추고 작은 쪽 기준으로 scale → 전체 페이지가 항상 보임
  const scaleW = stageW / vp.width;
  const scaleH = stageH / vp.height;
  const scale = Math.min(scaleW, scaleH);

  const svp = page.getViewport({ scale });
  const ctx = canvas.getContext("2d");
  canvas.width = svp.width;
  canvas.height = svp.height;

  await page.render({ canvasContext: ctx, viewport: svp }).promise;
  indicator.textContent = `${previewState.pdfPage} / ${previewState.pdfTotalPages}`;
}

async function renderPdfPreview(file) {
  const body = document.getElementById("previewBody");
  body.innerHTML = `
    <div class="preview-pdf-wrap">
      <div class="preview-pdf-stage"><canvas class="preview-pdf-canvas" id="pdfPreviewCanvas"></canvas></div>
      <div class="preview-pdf-controls">
        <button type="button" class="preview-pdf-btn" id="pdfPrevBtn">이전</button>
        <div class="preview-pdf-page" id="pdfPageIndicator">1 / 1</div>
        <button type="button" class="preview-pdf-btn" id="pdfNextBtn">다음</button>
      </div>
    </div>`;
  try {
    cleanupObjectUrl(); currentObjectUrl = URL.createObjectURL(file);

    const lib = window.pdfjsLib;
    if (!lib) throw new Error("pdf.js not loaded");
    lib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.6.82/build/pdf.worker.min.mjs';

    previewState.pdfDoc = await lib.getDocument(currentObjectUrl).promise;
    previewState.pdfPage = 1;
    previewState.pdfTotalPages = previewState.pdfDoc.numPages;

    document.getElementById("pdfPrevBtn").addEventListener("click", async () => {
      if (previewState.pdfPage > 1) { previewState.pdfPage--; await renderPdfPage(); }
    });
    document.getElementById("pdfNextBtn").addEventListener("click", async () => {
      if (previewState.pdfPage < previewState.pdfTotalPages) { previewState.pdfPage++; await renderPdfPage(); }
    });

    await renderPdfPage();
    window.addEventListener("resize", debounce(renderPdfPage, 120));
  } catch (err) {
    console.error(err);
    body.innerHTML = `<div class="preview-fallback"><div class="preview-fallback__icon">📄</div><div class="preview-fallback__title">PDF 미리보기 실패</div></div>`;
  }
}

async function renderFilePreview(file) {
  currentFile = file;
  const { kind } = getFileTypeInfo(file);
  showPreviewShell(file);
  if (kind === "image") { renderImagePreview(file); return; }
  if (kind === "video") { renderVideoPreview(file); return; }
  if (kind === "audio") { renderAudioPreview(file); return; }
  if (kind === "pdf")   { await renderPdfPreview(file); return; }
  if (kind === "text")  { await renderTextPreview(file); return; }
  document.getElementById("previewBody").innerHTML = `<div class="preview-fallback"><div class="preview-fallback__icon">📎</div><div class="preview-fallback__title">${file.name}</div></div>`;
}

/* ── 파일 입력 / 드래그앤드롭 ── */
function setupFileInput() {
  const input = document.createElement("input");
  input.type = "file"; input.id = "artworkFileInput"; input.multiple = false;
  input.accept = ".mp4,.mp3,.jpg,.jpeg,.png,.pdf,.txt,video/*,audio/*,image/*,text/plain";
  input.style.display = "none";
  document.body.appendChild(input);
  input.addEventListener("change", async e => {
    const files = Array.from(e.target.files || []);
    if (files.length) await renderFilePreview(files[0]);
  });
  fileInputRef = input;
  return input;
}

function setupDragDrop() {
  const dropZone = document.getElementById("dropZone");
  if (!dropZone) return;
  const prevent = e => { e.preventDefault(); e.stopPropagation(); };
  ["dragenter","dragover"].forEach(t => dropZone.addEventListener(t, e => { prevent(e); dropZone.classList.add("is-dragover"); }));
  ["dragleave","drop"].forEach(t => dropZone.addEventListener(t, e => { prevent(e); dropZone.classList.remove("is-dragover"); }));
  dropZone.addEventListener("drop", async e => {
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length) await renderFilePreview(files[0]);
  });
}

/* ── 버튼 렌더링 ── */
async function mountUploadButton(fileInput) {
  if (typeof loadButton !== "function") return;
  await loadButton({ target: "#fileUploadMount", text: "파일 업로드", variant: "primary", onClick: () => fileInput.click() });
  const btn = document.querySelector("#fileUploadMount .btn") || document.querySelector("#fileUploadMount button");
  if (btn) btn.innerHTML = `<span class="upload-btn__inner"><img class="upload-btn__icon" src="/media/upload.png" alt="" /><span>파일 업로드</span></span>`;
}

async function mountActionButtons() {
  if (typeof loadButton !== "function") return;
  await loadButton({ target: "#cancelBtnMount", text: "취소하기", variant: "outline", onClick: () => history.back() });
  await loadButton({
    target: "#submitBtnMount", text: "등록하기", variant: "primary",
    onClick: () => {
      const desc = document.querySelector("#description")?.value?.trim() ?? "";
      const tool = getSelectedTool();
      alert(`등록하기 클릭\n설명: ${desc || "(없음)"}\n툴: ${tool ? tool.name : "(미선택)"}\n파일: ${currentFile ? currentFile.name : "(미선택)"}`);
    },
  });
}

/* ── INIT ── */
document.addEventListener("DOMContentLoaded", async () => {
  renderToolCard(null);
  const picker = document.getElementById("toolPicker");
  if (picker) {
    picker.addEventListener("click", openToolModal);
    picker.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openToolModal(); } });
  }
  const fileInput = setupFileInput();
  setupDragDrop();
  await mountUploadButton(fileInput);

  document.getElementById("dropZone")?.addEventListener("click", e => {
    if (!e.target.closest("button") && !e.target.closest(".preview-image-wrap") && !e.target.closest(".preview-pdf-wrap") && !e.target.closest(".preview-video-wrap") && !e.target.closest(".preview-audio-wrap")) fileInput.click();
  });

  document.getElementById("removeFileBtn")?.addEventListener("click", resetPreview);
  document.getElementById("replaceFileBtn")?.addEventListener("click", () => fileInput.click());

  await mountActionButtons();
});