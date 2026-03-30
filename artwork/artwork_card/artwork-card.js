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
    const titleEl        = node.querySelector("[data-art-text]");
    const likeBtn        = node.querySelector("[data-art-like]");
    const commentBtn     = node.querySelector("[data-art-comment]");
    const likeCountEl    = node.querySelector("[data-art-like-count]");
    const commentCountEl = node.querySelector("[data-art-comment-count]");

    const artworkId = item.id || item.work_id || `artwork_${index+1}`;

    /* 카드 클릭 → 작업물 페이지 */
    if (cardElement) {
      cardElement.style.cursor = "pointer";
      cardElement.onclick = () => {
        window.location.href =
          `/artwork/artwork_post/artwork_post.html?work_id=${encodeURIComponent(artworkId)}`;
      };
    }

    /* 툴 아이콘 클릭 */
    if (toolLink) {
      const toolId = item.toolId || item.tool_id || "";
      toolLink.href =
        `/detail_AI/detail_AI.html?tool_ID=${encodeURIComponent(toolId)}`;
      toolLink.addEventListener("click", e => e.stopPropagation());
    }

    /* 프로필 */
    if (avatar) {
      avatar.src = item.user_img || "/media/profil.png";
      avatar.onerror = () => avatar.style.visibility = "hidden";
    }

    /* 툴 이름 */
    if (toolNameEl) toolNameEl.textContent = item.tool_name || "Tool";

    /* ✅ 툴 개발사 — @ 앞에 붙이기 */
    if (toolBrandEl) {
      const brand = item.tool_brand || "";
      toolBrandEl.textContent = brand ? `@${brand.replace(/^@+/, "")}` : "";
      toolBrandEl.style.display = brand ? "" : "none";
    }

    /* ✅ 툴 별점 — 개발사 아래, 별 아이콘으로 렌더링 */
    if (toolStarsEl) {
      const rating  = parseFloat(item.tool_stars ?? item.stars ?? 0) || 0;
      const rounded = Math.round(rating);
      toolStarsEl.innerHTML = [1,2,3,4,5]
        .map(n => `<span class="tool-star ${n <= rounded ? "is-on" : "is-off"}">★</span>`)
        .join("");
    }

    if (toolIconEl) {
      toolIconEl.src = item.icon || "/media/tool-default.png";
      toolIconEl.onerror = () => toolIconEl.style.visibility = "hidden";
    }

    /* 작성자 */
    if (user) user.textContent = item.user_name || "user";

    /* 날짜 */
    if (date) date.textContent = item.dateText || "";

    /* 제목 */
    if (titleEl) titleEl.textContent = item.work_title || "";

    /* 좋아요 카운트 */
    if (likeCountEl) likeCountEl.textContent = item.like_count ?? 0;

    /* ✅ 좋아요 하트 아이콘 — is_liked 여부에 따라 분기 */
    const heartImg = likeBtn?.querySelector(".artwork-card__action-img");
    if (heartImg) heartImg.src = item.is_liked ? "/media/Heart_fill.png" : "/media/Heart.png";

    /* 댓글 */
    if (commentCountEl) commentCountEl.textContent = item.comment_count ?? 0;

    likeBtn?.addEventListener("click", e => {
      e.stopPropagation();
      item.onLike?.(item);
    });

    commentBtn?.addEventListener("click", e => {
      e.stopPropagation();
      item.onComment?.(item);
    });

    frag.appendChild(node);

    /* 미리보기 렌더 */
    requestAnimationFrame(() => {
      renderArtworkPreview(previewRoot, item);
    });

  });

  target.innerHTML = "";
  target.appendChild(frag);
}


/* ===============================
   미리보기 렌더 (이미지 / 영상 / PDF / 오디오)
================================ */
function renderArtworkPreview(root, item) {
  if (!root) return;

  const src = item.previewSrc;
  if (!src) return;

  const ext = src.split(".").pop().toLowerCase().split("?")[0];

  /* 이미지 */
  if (["png","jpg","jpeg","webp","gif"].includes(ext)) {
    root.innerHTML = `<img src="${src}" class="artwork-card__img">`;
    return;
  }

  /* 영상 — 썸네일 캡처 + 재생버튼 */
  if (["mp4","webm","mov"].includes(ext)) {
    root.innerHTML = `
      <div class="artwork-card__video-wrap">
        <video class="artwork-card__video" muted playsinline preload="metadata">
          <source src="${src}">
        </video>
        <canvas class="artwork-card__video-thumb"></canvas>
        <div class="artwork-card__video-play">
          <svg viewBox="0 0 24 24" fill="white" width="36" height="36"
            style="filter:drop-shadow(0 2px 8px rgba(0,0,0,0.5))">
            <path d="M8 5v14l11-7z"></path>
          </svg>
        </div>
      </div>`;

    const video  = root.querySelector(".artwork-card__video");
    const canvas = root.querySelector(".artwork-card__video-thumb");

    video.addEventListener("loadeddata", () => { video.currentTime = 0.5; });
    video.addEventListener("seeked", () => {
      const ctx = canvas.getContext("2d");
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.style.display = "block";
      video.style.display  = "none";
    });
    return;
  }

  /* 오디오 */
  if (["mp3","wav","ogg","m4a"].includes(ext)) {
    root.innerHTML = `
      <div class="artwork-card__audio-wrap">
        <div class="artwork-card__audio-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="1.8"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 18V5l12-2v13"></path>
            <circle cx="6" cy="18" r="3"></circle>
            <circle cx="18" cy="16" r="3"></circle>
          </svg>
        </div>
      </div>`;
    return;
  }

  /* PDF */
  if (ext === "pdf" && window.pdfjsLib) {
    root.innerHTML = `
      <div class="artwork-card__pdf">
        <canvas class="artwork-card__pdf-canvas"></canvas>
      </div>`;

    const canvas = root.querySelector("canvas");

    pdfjsLib.getDocument(src).promise.then(pdf => {
      pdf.getPage(1).then(page => {
        const vp  = page.getViewport({ scale: 1 });
        const w   = root.clientWidth  || 300;
        const h   = root.clientHeight || 200;
        const scale = Math.min(w / vp.width, h / vp.height);
        const svp = page.getViewport({ scale });
        canvas.width  = svp.width;
        canvas.height = svp.height;
        page.render({ canvasContext: canvas.getContext("2d"), viewport: svp });
      });
    });
    return;
  }
}


/* 템플릿 mount (현재 사용 안함) */
export async function mountArtworkCardTemplate() {
  return;
}