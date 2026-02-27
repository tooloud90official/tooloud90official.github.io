export async function mountArtworkCardTemplate() {
    // 템플릿 HTML을 한 번만 DOM에 주입
    if (document.getElementById("artworkCardTpl")) return;
  
    const res = await fetch("/yujin/html/artwork-card.html");
    const html = await res.text();
  
    const wrap = document.createElement("div");
    wrap.innerHTML = html;
    document.body.appendChild(wrap);
  }
  
  export function renderArtworkCards(targetSelector, items = []) {
    const target = document.querySelector(targetSelector);
    if (!target) throw new Error(`target not found: ${targetSelector}`);
  
    const tpl = document.getElementById("artworkCardTpl");
    if (!tpl) throw new Error(`템플릿이 없습니다. mountArtworkCardTemplate() 먼저 호출하세요.`);
  
    const frag = document.createDocumentFragment();
  
    items.forEach((item) => {
      const node = tpl.content.cloneNode(true);
  
      const img = node.querySelector("[data-art-img]");
      const avatar = node.querySelector("[data-art-avatar]");
      const tool = node.querySelector("[data-art-tool]");
      const stars = node.querySelector("[data-art-stars]");
      const user = node.querySelector("[data-art-user]");
      const date = node.querySelector("[data-art-date]");
      const text = node.querySelector("[data-art-text]");
  
      if (img) img.src = item.imageSrc || "";
      if (avatar) avatar.src = item.avatarSrc || "";
      if (tool) tool.textContent = item.toolName || "Tool";
      if (stars) stars.textContent = item.stars || "★★★★★";
      if (user) user.textContent = item.userName || "user";
      if (date) date.textContent = item.dateText || "";
      if (text) text.textContent = item.text || "";
  
      // 버튼 핸들러 (필요하면 item.id 연결)
      const likeBtn = node.querySelector("[data-art-like]");
      const commentBtn = node.querySelector("[data-art-comment]");
      const saveBtn = node.querySelector("[data-art-save]");
  
      likeBtn?.addEventListener("click", () => item.onLike?.(item));
      commentBtn?.addEventListener("click", () => item.onComment?.(item));
      saveBtn?.addEventListener("click", () => item.onSave?.(item));
  
      frag.appendChild(node);
    });
  
    target.innerHTML = "";
    target.appendChild(frag);
  }