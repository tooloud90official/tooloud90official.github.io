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
    const titleEl        = node.querySelector("[data-art-text]"); // ← 제목 표시용으로 재활용
    const likeBtn        = node.querySelector("[data-art-like]");
    const commentBtn     = node.querySelector("[data-art-comment]");
    const likeCountEl    = node.querySelector("[data-art-like-count]");
    const commentCountEl = node.querySelector("[data-art-comment-count]");

    const artworkId = item.id || item.work_id || `artwork_${index + 1}`;

    // 카드 전체 클릭 → 작업물 상세 페이지
    if (cardElement) {
      cardElement.style.cursor = "pointer";
      cardElement.onclick = () => {
        window.location.href = `/artwork/artwork_post/artwork_post.html?id=${encodeURIComponent(artworkId)}`;
      };
    }

    // 툴 아이콘 클릭 → 툴 상세 페이지 (?tool_ID=xxx 로 수정)
    if (toolLink) {
      const toolId = item.toolId || item.tool_id || "";
      toolLink.href = `/detail_AI/detail_AI.html?tool_ID=${encodeURIComponent(toolId)}`;
      toolLink.addEventListener("click", (e) => e.stopPropagation());
    }

    if (avatar) {
      avatar.src = item.avatarSrc || item.user_img || "/media/profil.png";
      avatar.onerror = () => { avatar.style.visibility = "hidden"; };
    }

    if (toolNameEl)  toolNameEl.textContent  = item.toolName  || item.tool_name  || "Tool";
    if (toolStarsEl) toolStarsEl.textContent = item.stars     || "★★★★★";
    if (toolBrandEl) toolBrandEl.textContent = item.toolBrand || item.tool_brand || "@Brand";

    if (toolIconEl) {
      toolIconEl.src = item.toolIcon || item.icon || "/media/tool-default.png";
      toolIconEl.alt = item.toolName || item.tool_name || "툴 아이콘";
      toolIconEl.onerror = () => { toolIconEl.style.visibility = "hidden"; };
    }

    if (user)    user.textContent    = item.userName  || item.user_name || "user";
    if (date)    date.textContent    = item.dateText   || item.date     || "";

    // ↓ text 대신 제목(work_title) 표시
    if (titleEl) titleEl.textContent = item.work_title || item.title    || "";

    if (likeCountEl)    likeCountEl.textContent    = item.likeCount    ?? item.like_count    ?? 0;
    if (commentCountEl) commentCountEl.textContent = item.commentCount ?? item.comment_count ?? 0;

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