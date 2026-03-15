export async function mountArtworkCardTemplate() {
  if (document.getElementById("artworkCardTpl")) return;

  const res = await fetch("/artwork/artwork_card/artwork-card.html");
  const html = await res.text();

  const wrap = document.createElement("div");
  wrap.innerHTML = html;
  document.body.appendChild(wrap);
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getPreviewType(item = {}) {
  const explicitType = (item.fileType || item.previewType || "").toLowerCase();
  const src = (item.previewSrc || item.imageSrc || item.fileSrc || "").toLowerCase();

  if (explicitType) {
    if (explicitType.includes("image")) return "image";
    if (explicitType.includes("video")) return "video";
    if (explicitType.includes("audio")) return "audio";
    if (explicitType.includes("pdf")) return "pdf";
    if (explicitType.includes("text")) return "text";
  }

  if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(src)) return "image";
  if (/\.(mp4|webm|mov|m4v)$/i.test(src)) return "video";
  if (/\.(mp3|wav|ogg|m4a)$/i.test(src)) return "audio";
  if (/\.pdf$/i.test(src)) return "pdf";
  if (/\.(txt|md|json|js|html|css)$/i.test(src)) return "text";

  return "image";
}

function renderImagePreview(previewRoot, src, item) {
  previewRoot.innerHTML = `
    <img
      class="artwork-card__img"
      src="${src}"
      alt="${escapeHtml(item.alt || item.toolName || "작업물 이미지")}"
    />
  `;
}

function renderVideoPreview(previewRoot, src) {
  previewRoot.innerHTML = `
    <video
      class="artwork-card__video"
      src="${src}"
      muted
      playsinline
      preload="metadata"
    ></video>
    <div class="artwork-card__file-badge">VIDEO</div>
  `;
}

function renderAudioPreview(previewRoot, item) {
  previewRoot.innerHTML = `
    <div class="artwork-card__audio">
      <div class="artwork-card__audio-box">
        <svg class="artwork-card__audio-icon" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.8"
             stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 18V5l12-2v13"></path>
          <circle cx="6" cy="18" r="3"></circle>
          <circle cx="18" cy="16" r="3"></circle>
        </svg>
        <div class="artwork-card__audio-play"></div>
        <div class="artwork-card__audio-label">${escapeHtml(item.fileName || "AUDIO")}</div>
      </div>
    </div>
    <div class="artwork-card__file-badge">AUDIO</div>
  `;
}

function renderTextPreview(previewRoot, item) {
  const textPreview = escapeHtml(item.textPreview || item.text || "텍스트 미리보기");

  previewRoot.innerHTML = `
    <div class="artwork-card__text-preview">
      <div class="artwork-card__text-preview-box">
        <div class="artwork-card__text-preview-label">TEXT</div>
        <div class="artwork-card__text-preview-content">${textPreview}</div>
      </div>
    </div>
    <div class="artwork-card__file-badge">TEXT</div>
  `;
}

function renderFallbackPreview(previewRoot) {
  previewRoot.innerHTML = `
    <div class="artwork-card__fallback">
      <div class="artwork-card__fallback-box">
        <div class="artwork-card__fallback-icon">📎</div>
      </div>
    </div>
    <div class="artwork-card__file-badge">FILE</div>
  `;
}

function getContainerSize(el) {
  const w = el.clientWidth || el.offsetWidth || 600;
  const h = el.clientHeight || el.offsetHeight || 360;
  return { w, h };
}

function waitForPdfjsLib(timeout = 5000) {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) {
      resolve(window.pdfjsLib);
      return;
    }
    const start = Date.now();
    const check = () => {
      if (window.pdfjsLib) {
        resolve(window.pdfjsLib);
      } else if (Date.now() - start > timeout) {
        reject(new Error("pdfjsLib load timeout"));
      } else {
        requestAnimationFrame(check);
      }
    };
    check();
  });
}

async function renderPdfPreview(previewRoot, src) {
  previewRoot.innerHTML = `
    <div class="artwork-card__pdf">
      <canvas class="artwork-card__pdf-canvas"></canvas>
    </div>
    <div class="artwork-card__file-badge">PDF</div>
  `;

  const canvas = previewRoot.querySelector(".artwork-card__pdf-canvas");
  if (!canvas) {
    renderFallbackPreview(previewRoot);
    return;
  }

  let pdfjsLib;
  try {
    pdfjsLib = await waitForPdfjsLib();
  } catch {
    console.warn("pdfjsLib 로드 실패 — fallback으로 전환");
    renderFallbackPreview(previewRoot);
    return;
  }

  try {
    // ✅ upload.js와 동일한 worker CDN 사용
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://unpkg.com/pdfjs-dist@4.6.82/build/pdf.worker.min.mjs";

    const pdf = await pdfjsLib.getDocument(src).promise;
    const page = await pdf.getPage(1);

    const baseViewport = page.getViewport({ scale: 1 });

    const { w: rootWidth, h: rootHeight } = getContainerSize(previewRoot);

    const scale = Math.min(
      rootWidth / baseViewport.width,
      rootHeight / baseViewport.height
    );

    const viewport = page.getViewport({ scale });
    const ctx = canvas.getContext("2d");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise;
  } catch (err) {
    console.error("PDF preview render failed:", err);
    renderFallbackPreview(previewRoot);
  }
}

async function renderArtworkPreview(previewRoot, item = {}) {
  if (!previewRoot) return;

  const src =
    item.previewSrc ||
    item.fileSrc ||
    item.imageSrc ||
    "/media/sample3.pdf";

  const type = getPreviewType({
    ...item,
    previewSrc: src,
  });

  if (type === "image") {
    renderImagePreview(previewRoot, src, item);
    return;
  }
  if (type === "video") {
    renderVideoPreview(previewRoot, src);
    return;
  }
  if (type === "audio") {
    renderAudioPreview(previewRoot, item);
    return;
  }
  if (type === "text") {
    renderTextPreview(previewRoot, item);
    return;
  }
  if (type === "pdf") {
    await renderPdfPreview(previewRoot, src);
    return;
  }

  renderFallbackPreview(previewRoot);
}

export function renderArtworkCards(targetSelector, items = []) {
  const target = document.querySelector(targetSelector);
  if (!target) throw new Error(`target not found: ${targetSelector}`);

  const tpl = document.getElementById("artworkCardTpl");
  if (!tpl) throw new Error("템플릿이 없습니다.");

  const frag = document.createDocumentFragment();

  items.forEach((item, index) => {
    const node = tpl.content.cloneNode(true);

    const cardElement    = node.querySelector(".artwork-card");
    const previewRoot    = node.querySelector("[data-art-preview]");
    const avatar         = node.querySelector("[data-art-avatar]");
    const toolNameEl     = node.querySelector("[data-tool-name]");
    const toolStarsEl    = node.querySelector("[data-tool-stars]");
    const toolBrandEl    = node.querySelector("[data-tool-brand]");
    const toolIconEl     = node.querySelector("[data-art-tool-icon]");
    const toolLink       = node.querySelector(".artwork-card__tool-icLink");
    const user           = node.querySelector("[data-art-user]");
    const date           = node.querySelector("[data-art-date]");
    const text           = node.querySelector("[data-art-text]");
    const likeBtn        = node.querySelector("[data-art-like]");
    const commentBtn     = node.querySelector("[data-art-comment]");
    const likeCountEl    = node.querySelector("[data-art-like-count]");
    const commentCountEl = node.querySelector("[data-art-comment-count]");

    const artworkId = item.id || `artwork_${index + 1}`;

    if (cardElement) {
      cardElement.style.cursor = "pointer";
      cardElement.onclick = () => {
        window.location.href = `/artwork/artwork_post/artwork_post.html?id=${encodeURIComponent(artworkId)}`;
      };
    }

    if (toolLink) {
      const toolId = item.toolId || "";
      toolLink.href = `/detail_AI/detail_AI.html?tool=${encodeURIComponent(toolId)}`;
      toolLink.addEventListener("click", (e) => e.stopPropagation());
    }

    if (avatar) {
      avatar.src = item.avatarSrc || "/media/profil.png";
      avatar.onerror = () => { avatar.style.visibility = "hidden"; };
    }

    if (toolNameEl)  toolNameEl.textContent  = item.toolName  || "Tool";
    if (toolStarsEl) toolStarsEl.textContent = item.stars     || "★★★★★";
    if (toolBrandEl) toolBrandEl.textContent = item.toolBrand || "@Brand";

    if (toolIconEl) {
      toolIconEl.src = item.toolIcon || "/media/tool-default.png";
      toolIconEl.alt = item.toolName || "툴 아이콘";
      toolIconEl.onerror = () => { toolIconEl.style.visibility = "hidden"; };
    }

    if (user) user.textContent = item.userName || "user";
    if (date) date.textContent = item.dateText || "";
    if (text) text.textContent = item.text     || "";

    if (likeCountEl)    likeCountEl.textContent    = item.likeCount    ?? 0;
    if (commentCountEl) commentCountEl.textContent = item.commentCount ?? 0;

    likeBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      item.onLike?.(item);
    });

    commentBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      item.onComment?.(item);
    });

    frag.appendChild(node);

    requestAnimationFrame(() => {
      renderArtworkPreview(previewRoot, item);
    });
  });

  target.innerHTML = "";
  target.appendChild(frag);
}