const $ = (s, r = document) => r.querySelector(s);
const esc = (t) => String(t).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
const now = () => "방금 전";

const state = {
  liked: false,
  comments: [
    { id: "c1", name: "Soojin", date: "1분 전", text: "작업물 너무 예뻐요! 설정값 공유 가능?", isMine: false, isOpen: false,
      replies: [{ id: "r1", name: "작성자", date: "방금 전", text: "가능해요! 정리해서 올릴게요 🙂", isMine: true }] },
    { id: "c2", name: "Mina", date: "10분 전", text: "glass 톤 진짜 미쳤다…", isMine: false, isOpen: false, replies: [] },
  ]
};

const likeBtn = $("#btnLike"), likeCount = $("#likeCount");
const commentInput = $("#commentInput"), list = $("#commentList");
const cCount = $("#commentCount"), cCountTitle = $("#commentCountTitle");

function mountBtn() {
  if (typeof loadButton === "function") {
    loadButton({ target: '#commentSubmitMount', text: '등록하기', variant: 'primary' });
  }
}

function render() {
  cCount.textContent = String(state.comments.length);
  cCountTitle.textContent = String(state.comments.length);
  list.innerHTML = state.comments.map(c => commentHTML(c)).join("");

  state.comments.forEach(c => {
    const panel = $(`#replies-${c.id}`), pill = $(`#pill-${c.id}`);
    if (panel) panel.classList.toggle("is-open", !!c.isOpen);
    if (pill) pill.classList.toggle("is-open", !!c.isOpen);

    const replyMountId = `#reply-submit-${c.id}`;
    if ($(replyMountId) && typeof loadButton === "function") {
      loadButton({ target: replyMountId, text: '대댓글 등록', variant: 'primary' });
    }
  });
}

function commentHTML(c) {
  const rN = c.replies.length;
  return `
  <li class="comment-item" data-cid="${c.id}">
    <div class="row-top">
      <div class="head">
        <div class="avatar sm">
          <div class="avatar__inner"><img src="/media/profil.png" alt="프로필"></div>
        </div>
        <div class="meta"><div class="n">${esc(c.name)}</div><div class="d">${esc(c.date)}</div></div>
      </div>
      <button class="pill ${c.isOpen ? "is-open" : ""}" data-act="toggle" data-cid="${c.id}" id="pill-${c.id}">
        <span>💬</span><b>${rN}</b>
      </button>
    </div>
    <p class="text">${esc(c.text)}</p>
    <div class="replies ${c.isOpen ? "is-open" : ""}" id="replies-${c.id}">
      <div class="rin">
        <ul class="reply-list">${rN ? c.replies.map(r => replyHTML(r, c.id)).join("") : `<li class="reply-item reply-item--empty">대댓글이 없습니다.</li>`}</ul>
        <div class="comment-write reply-write">
          <div class="avatar sm">
            <div class="avatar__inner"><img src="/media/profil.png" alt="내 프로필"></div>
          </div>
          <div class="write-col">
            <div class="box"><textarea id="rin-${c.id}" placeholder="대댓글을 남겨주세요." rows="2"></textarea></div>
            <div class="submit" id="reply-submit-${c.id}"></div>
          </div>
        </div>
      </div>
    </div>
    ${c.isMine ? `<div class="actions">
        <button class="act" data-act="edit-c" data-cid="${c.id}">수정</button>
        <button class="act danger" data-act="del-c" data-cid="${c.id}">삭제</button>
      </div>` : ""}
  </li>`;
}

function replyHTML(r, cid) {
  return `
  <li class="reply-item">
    <div class="reply-item__inner">
      <div class="avatar sm">
        <div class="avatar__inner"><img src="/media/profil.png" alt="프로필"></div>
      </div>
      <div class="reply-body">
        <div class="reply-head">
          <span class="n">${esc(r.name)}</span>
          <span class="d">${esc(r.date)}</span>
        </div>
        <p class="reply-text">${esc(r.text)}</p>
        ${r.isMine ? `<div class="actions">
            <button class="act" data-act="edit-r" data-cid="${cid}" data-rid="${r.id}">수정</button>
            <button class="act danger" data-act="del-r" data-cid="${cid}" data-rid="${r.id}">삭제</button>
          </div>` : ""}
      </div>
    </div>
  </li>`;
}

function addComment() {
  const text = (commentInput.value || "").trim();
  if (!text) return;
  state.comments.unshift({ id: `c${Date.now()}`, name: "작성자", date: now(), text, isMine: true, isOpen: true, replies: [] });
  commentInput.value = ""; render();
}

function addReply(cid) {
  const ta = $(`#rin-${cid}`); if (!ta) return;
  const text = (ta.value || "").trim(); if (!text) return;
  const c = state.comments.find(x => x.id === cid); if (!c) return;
  c.replies.push({ id: `r${Date.now()}`, name: "작성자", date: now(), text, isMine: true });
  c.isOpen = true; ta.value = ""; render();
}

document.addEventListener("click", (e) => {
  if (e.target.closest("#commentSubmitMount button")) { addComment(); return; }
  const rBtnArea = e.target.closest("[id^='reply-submit-']");
  if (rBtnArea && e.target.tagName === 'BUTTON') { addReply(rBtnArea.id.replace("reply-submit-", "")); return; }

  const t = e.target.closest("[data-act]"); if (!t) return;
  const { act, cid, rid } = t.dataset;
  if (act === "toggle") { const c = state.comments.find(x => x.id === cid); if (c) { c.isOpen = !c.isOpen; render(); } }
  if (act === "del-c") { const i = state.comments.findIndex(x => x.id === cid); if (i >= 0 && confirm("삭제할까요?")) { state.comments.splice(i, 1); render(); } }
});

mountBtn(); render();