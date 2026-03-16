const $ = (s, r = document) => r.querySelector(s);
const esc = (t) =>
  String(t)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
const now = () => "방금 전";

const artworkData = {
  id: "artwork_001",
  isMine: true,

  // 배너용 데이터 — 실제 서비스에서는 API 응답값으로 교체하세요
  title: "한여름 밤의 꿈",
  category: "디지털 아트",
  desc: "신년을 맞아 비즈니스 계획을 세워보았습니다.",
  username: "Soojin",
  date: "2026년 01월 01일",
  tags: ["#이미지생성", "#AdobeFirefly", "#디지털아트", "#신년"],
};

const state = {
  liked: false,
  comments: [
    {
      id: "c1",
      name: "Soojin",
      date: "1분 전",
      text: "작업물 너무 예뻐요! 설정값 공유 가능?",
      isMine: false,
      isOpen: false,
      editMode: false,
      replies: [
        {
          id: "r1",
          name: "작성자",
          date: "방금 전",
          text: "가능해요! 정리해서 올릴게요 🙂",
          isMine: true,
          editMode: false,
        },
      ],
    },
    {
      id: "c2",
      name: "Mina",
      date: "10분 전",
      text: "glass 톤 진짜 미쳤다…",
      isMine: false,
      isOpen: false,
      editMode: false,
      replies: [],
    },
  ],
};

const likeBtn = $("#btnLike");
const likeCount = $("#likeCount");
const commentInput = $("#commentInput");
const list = $("#commentList");
const cCount = $("#commentCount");
const cCountTitle = $("#commentCountTitle");

// 배너 채우기
function fillBanner(data) {
  if (data.title)    $("#bannerTitle").textContent    = data.title;
  if (data.category) $("#bannerCategory").textContent = data.category;
  if (data.username) $("#bannerUsername").textContent = data.username;
  if (data.date)     $("#bannerDate").textContent     = `· ${data.date}`;

  // description
  const descEl = $("#bannerDesc");
  if (descEl) descEl.textContent = data.desc || "";

  // 수정/삭제 버튼 — 내 글 아니면 숨김
  const actions = $(".artwork-hero-banner__actions");
  if (actions) actions.style.display = data.isMine ? "flex" : "none";

  // 태그
  if (Array.isArray(data.tags) && data.tags.length) {
    $("#bannerTags").innerHTML = data.tags
      .map(tag => `<span class="artwork-hero-banner__tag">${esc(tag)}</span>`)
      .join("");
  }
}

// 배너 댓글 수 동기화
function syncBannerComments() {
  if (cCount) cCount.textContent = String(state.comments.length);
  if (cCountTitle) cCountTitle.textContent = String(state.comments.length);
}

// 좋아요
likeBtn.addEventListener("click", () => {
  state.liked = !state.liked;
  const heartImg = likeBtn.querySelector("img");
  heartImg.src = state.liked ? "/media/Heart_fill.png" : "/media/Heart.png";
  const count = parseInt(likeCount.textContent) || 0;
  likeCount.textContent = state.liked ? count + 1 : count - 1;
});

function mountBtn() {
  if (typeof loadButton === "function") {
    loadButton({ target: "#commentSubmitMount", text: "등록", variant: "primary" });
  }
}

function render() {
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

  syncBannerComments();
}

function commentHTML(c) {
  const rN = c.replies.length;

  const textArea = c.editMode
    ? `<div class="edit-box">
        <textarea class="edit-textarea" id="edit-input-c-${c.id}" rows="3">${esc(c.text)}</textarea>
        <div class="edit-actions">
          <button class="act" data-act="edit-cancel-c" data-cid="${c.id}">취소</button>
          <button class="act" data-act="edit-save-c" data-cid="${c.id}">저장</button>
        </div>
      </div>`
    : `<p class="text">${esc(c.text)}</p>`;

  return `
  <li class="comment-item" data-cid="${c.id}">
    <div class="row-top">
      <div class="head">
        <div class="avatar sm">
          <div class="avatar__inner">
            <img src="/media/profil.png" alt="프로필">
          </div>
        </div>
        <div class="meta">
          <div class="n">${esc(c.name)}</div>
          <div class="d">${esc(c.date)}</div>
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
            : `<li class="reply-item reply-item--empty">대댓글이 없습니다.</li>`
          }
        </ul>
        <div class="comment-write reply-write">
          <div class="avatar sm">
            <div class="avatar__inner">
              <img src="/media/profil.png" alt="내 프로필">
            </div>
          </div>
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
      : ""
    }
  </li>`;
}

function replyHTML(r, cid) {
  const textArea = r.editMode
    ? `<div class="edit-box">
        <textarea class="edit-textarea" id="edit-input-r-${r.id}" rows="2">${esc(r.text)}</textarea>
        <div class="edit-actions">
          <button class="act" data-act="edit-cancel-r" data-cid="${cid}" data-rid="${r.id}">취소</button>
          <button class="act" data-act="edit-save-r" data-cid="${cid}" data-rid="${r.id}">저장</button>
        </div>
      </div>`
    : `<p class="reply-text">${esc(r.text)}</p>`;

  return `
  <li class="reply-item">
    <div class="reply-item__inner">
      <div class="avatar sm">
        <div class="avatar__inner">
          <img src="/media/profil.png" alt="프로필">
        </div>
      </div>
      <div class="reply-body">
        <div class="reply-head">
          <span class="n">${esc(r.name)}</span>
          <span class="d">${esc(r.date)}</span>
        </div>
        ${textArea}
        ${r.isMine && !r.editMode
          ? `<div class="actions">
              <button class="act" data-act="edit-r" data-cid="${cid}" data-rid="${r.id}">수정</button>
              <button class="act danger" data-act="del-r" data-cid="${cid}" data-rid="${r.id}">삭제</button>
            </div>`
          : ""
        }
      </div>
    </div>
  </li>`;
}

function addComment() {
  const text = (commentInput.value || "").trim();
  if (!text) return;
  state.comments.unshift({
    id: `c${Date.now()}`,
    name: "작성자",
    date: now(),
    text,
    isMine: true,
    isOpen: true,
    editMode: false,
    replies: [],
  });
  commentInput.value = "";
  render();
}

function addReply(cid) {
  const ta = $(`#rin-${cid}`);
  if (!ta) return;
  const text = (ta.value || "").trim();
  if (!text) return;
  const c = state.comments.find((x) => x.id === cid);
  if (!c) return;
  c.replies.push({
    id: `r${Date.now()}`,
    name: "작성자",
    date: now(),
    text,
    isMine: true,
    editMode: false,
  });
  c.isOpen = true;
  ta.value = "";
  render();
}

function editArtwork() {
  window.location.href = `/artwork/artwork_upload/artwork_upload.html?mode=edit&id=${artworkData.id}`;
}

function deleteArtwork() {
  if (!confirm("작업물을 삭제할까요?")) return;
  alert("작업물이 삭제되었습니다.");
  history.back();
}

document.addEventListener("click", (e) => {
  if (e.target.closest("#commentSubmitMount button")) {
    addComment();
    return;
  }

  const rBtnArea = e.target.closest("[id^='reply-submit-']");
  if (rBtnArea && e.target.tagName === "BUTTON") {
    addReply(rBtnArea.id.replace("reply-submit-", ""));
    return;
  }

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
    const ta = $(`#edit-input-c-${cid}`);
    const text = (ta?.value || "").trim();
    if (!text) return;
    const c = state.comments.find((x) => x.id === cid);
    if (c) { c.text = text; c.editMode = false; c.date = now(); render(); }
  }
  if (act === "del-c") {
    const i = state.comments.findIndex((x) => x.id === cid);
    if (i >= 0 && confirm("댓글을 삭제할까요?")) { state.comments.splice(i, 1); render(); }
  }
  if (act === "edit-r") {
    for (const c of state.comments) {
      const r = c.replies.find((x) => x.id === rid);
      if (r) { r.editMode = true; render(); $(`#edit-input-r-${rid}`)?.focus(); break; }
    }
  }
  if (act === "edit-cancel-r") {
    for (const c of state.comments) {
      const r = c.replies.find((x) => x.id === rid);
      if (r) { r.editMode = false; render(); break; }
    }
  }
  if (act === "edit-save-r") {
    const ta = $(`#edit-input-r-${rid}`);
    const text = (ta?.value || "").trim();
    if (!text) return;
    for (const c of state.comments) {
      const r = c.replies.find((x) => x.id === rid);
      if (r) { r.text = text; r.editMode = false; r.date = now(); render(); break; }
    }
  }
  if (act === "del-r") {
    for (const c of state.comments) {
      const i = c.replies.findIndex((x) => x.id === rid);
      if (i >= 0 && confirm("대댓글을 삭제할까요?")) { c.replies.splice(i, 1); render(); break; }
    }
  }
  if (act === "edit-artwork") editArtwork();
  if (act === "del-artwork") deleteArtwork();
});

// 초기화
fillBanner(artworkData);
mountBtn();
render();