export async function mountArtworkCardTemplate() {
  if (document.getElementById("artworkCardTpl")) return;

  const res = await fetch("/artwork/artwork_card/artwork-card.html");
  const html = await res.text();

  const wrap = document.createElement("div");
  wrap.innerHTML = html;
  document.body.appendChild(wrap);
}

export function renderArtworkCards(targetSelector, items = []) {
  const target = document.querySelector(targetSelector);
  if (!target) throw new Error(`target not found: ${targetSelector}`);

  const tpl = document.getElementById("artworkCardTpl");
  if (!tpl) throw new Error(`템플릿이 없습니다.`);

  const frag = document.createDocumentFragment();

  items.forEach((item) => {
    const node = tpl.content.cloneNode(true);

    // ✅ [추가] 카드 전체를 클릭하면 상세 페이지로 이동
    const cardElement = node.querySelector(".artwork-card");
    if (cardElement) {
      cardElement.style.cursor = "pointer"; // 마우스 올리면 손가락 모양 나오게!
      cardElement.onclick = () => {
        // 실제로는 item.id 같은 걸 쿼리 스트링으로 붙여서 보내는 게 좋아!
        // 예: `/artwork/artwork_post/artwork_post.html?id=${item.id}`
        window.location.href = "/artwork/artwork_post/artwork_post.html";
      };
    }

    // 데이터 바인딩 부분 (기존과 동일)
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

    // 버튼 핸들러 (버튼 클릭 시 상세 페이지 이동을 막으려면 e.stopPropagation()이 필요해)
    const likeBtn = node.querySelector("[data-art-like]");
    const commentBtn = node.querySelector("[data-art-comment]");
    
    likeBtn?.addEventListener("click", (e) => {
      e.stopPropagation(); // 카드 클릭 이벤트가 실행되지 않게 막음!
      item.onLike?.(item);
    });

    commentBtn?.addEventListener("click", (e) => {
      e.stopPropagation(); // 카드 클릭 이벤트가 실행되지 않게 막음!
      item.onComment?.(item);
    });

    frag.appendChild(node);
  });

  target.innerHTML = "";
  target.appendChild(frag);
}