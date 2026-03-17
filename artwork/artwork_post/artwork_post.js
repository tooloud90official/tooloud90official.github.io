const $ = (s, r = document) => r.querySelector(s);
const esc = (t) =>
  String(t)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const supabase = window._supabase;
const params   = new URLSearchParams(window.location.search);
const workId   = params.get("id");

let currentUser  = null; // 로그인한 유저
let artworkData  = null; // 작업물 데이터
let workOwnerId  = null; // 작업물 주인 user_id
let state        = { liked: false, likeCount: 0, comments: [] };

/* =========================
   유틸
========================= */
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

/* =========================
   알림 생성
========================= */
async function insertNotification(toUserId, type, referenceId) {
  if (!toUserId || toUserId === currentUser?.id) return; // 본인한테는 알림 X
  await supabase.from("notifications").insert({
    notification_id: crypto.randomUUID(),
    user_id:         toUserId,
    type,
    reference_id:    referenceId,
    is_read:         false,
    created_at:      new Date().toISOString(),
  });
}

/* =========================
   배너 채우기
========================= */
function fillBanner(data) {
  if (data.work_title)   $("#bannerTitle").textContent    = data.work_title;
  if (data.tool_cat)     $("#bannerCategory").textContent = data.tool_cat;
  if (data.user_name)    $("#bannerUsername").textContent = data.user_name;
  if (data.updated_at)   $("#bannerDate").textContent     = `· ${formatDate(data.updated_at)}`;

  const descEl = $("#bannerDesc");
  if (descEl) descEl.textContent = data.work_desc || "";

  // 수정/삭제 버튼 — 본인 작업물만 표시
  const actions = $(".artwork-hero-banner__actions");
  if (actions) actions.style.display = data.isMine ? "flex" : "none";

  // 태그
  if (Array.isArray(data.work_tags) && data.work_tags.length) {
    $("#bannerTags").innerHTML = data.work_tags
      .map(tag => `<span class="artwork-hero-banner__tag">${esc(tag)}</span>`)
      .join("");
  }
}

/* =========================
   좋아요
========================= */
async function initLike() {
  const likeBtn   = $("#btnLike");
  const likeCount = $("#likeCount");
  if (!likeBtn || !likeCount) return;

  // 현재 유저가 이미 좋아요 눌렀는지 확인
  if (currentUser) {
    const { data: userData } = await supabase
      .from("users")
      .select("liked_works")
      .eq("user_id", currentUser.id)
      .single();
    state.liked = (userData?.liked_works || []).includes(workId);
  }

  state.likeCount = artworkData.like_count ?? 0;
  likeCount.textContent = state.likeCount;

  const heartImg = likeBtn.querySelector("img");
  if (heartImg) heartImg.src = state.liked ? "/media/Heart_fill.png" : "/media/Heart.png";

  likeBtn.addEventListener("click", async () => {
    if (!currentUser) {
      alert("로그인이 필요합니다.");
      window.location.href = "/login1/login1.html";
      return;
    }

    state.liked = !state.liked;
    state.likeCount += state.liked ? 1 : -1;
    likeCount.textContent = state.likeCount;
    if (heartImg) heartImg.src = state.liked ? "/media/Heart_fill.png" : "/media/Heart.png";

    // works 테이블 like_count 업데이트
    await supabase
      .from("works")
      .update({ like_count: state.likeCount })
      .eq("work_id", workId);

    // users 테이블 liked_works 배열 업데이트
    const { data: userData } = await supabase
      .from("users")
      .select("liked_works")
      .eq("user_id", currentUser.id)
      .single();

    const likedWorks = userData?.liked_works || [];
    const updated = state.liked
      ? [...new Set([...likedWorks, workId])]
      : likedWorks.filter(id => id !== workId);

    await supabase
      .from("users")
      .update({ liked_works: updated })
      .eq("user_id", currentUser.id);

    // 알림 — 좋아요 누를 때만
    if (state.liked) {
      await insertNotification(workOwnerId, "like", workId);
    }
  });
}

/* =========================
   댓글 렌더
========================= */
function syncCommentCount() {
  const count = state.comments.length;
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
            ? c.replies.map(r => replyHTML(r, c.id)).join("")
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
          <button class="act" data-act="edit-c"   data-cid="${c.id}">수정</button>
          <button class="act danger" data-act="del-c" data-cid="${c.id}">삭제</button>
        </div>`
      : ""}
  </li>`;
}

function render() {
  const list = $("#commentList");
  if (!list) return;
  list.innerHTML = state.comments.map(c => commentHTML(c)).join("");

  state.comments.forEach(c => {
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

/* =========================
   댓글 로드 (Supabase)
========================= */
async function loadComments() {
  const { data: comments, error } = await supabase
    .from("comments")
    .select("comment_id, user_id, content, updated_at, parent_comment_id")
    .eq("work_id", workId)
    .order("updated_at", { ascending: true });

  if (error) { console.error("댓글 로드 실패:", error); return; }

  // user_id → user_name, user_img 매핑
  const userIds = [...new Set((comments || []).map(c => c.user_id).filter(Boolean))];
  let userMap = {};
  if (userIds.length) {
    const { data: users } = await supabase
      .from("users")
      .select("user_id, user_name, user_img")
      .in("user_id", userIds);
    userMap = Object.fromEntries((users || []).map(u => [u.user_id, u]));
  }

  const enriched = (comments || []).map(c => ({
    id:              c.comment_id,
    user_id:         c.user_id,
    user_name:       userMap[c.user_id]?.user_name ?? "user",
    user_img:        userMap[c.user_id]?.user_img  ?? null,
    content:         c.content,
    updated_at:      c.updated_at,
    parent_comment_id: c.parent_comment_id,
    isMine:          currentUser?.id === c.user_id,
    isOpen:          false,
    editMode:        false,
  }));

  // 부모/대댓글 트리 구성
  const roots   = enriched.filter(c => !c.parent_comment_id);
  const replies = enriched.filter(c =>  c.parent_comment_id);
  state.comments = roots.map(c => ({
    ...c,
    replies: replies.filter(r => r.parent_comment_id === c.id),
  }));

  render();
}

/* =========================
   댓글 추가
========================= */
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

  // works comment_count 증가
  await supabase
    .from("works")
    .update({ comment_count: (artworkData.comment_count ?? 0) + 1 })
    .eq("work_id", workId);
  artworkData.comment_count = (artworkData.comment_count ?? 0) + 1;

  // 알림
  await insertNotification(workOwnerId, "comment", newComment.comment_id);

  if (commentInput) commentInput.value = "";
  await loadComments();
}

/* =========================
   대댓글 추가
========================= */
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

  // 알림 — 부모 댓글 작성자한테
  const parentComment = state.comments.find(c => c.id === parentCommentId);
  if (parentComment) {
    await insertNotification(parentComment.user_id, "reply", newReply.comment_id);
  }

  if (ta) ta.value = "";
  await loadComments();
}

/* =========================
   수정/삭제
========================= */
async function editArtwork() {
  window.location.href = `/artwork/artwork_upload/artwork_upload.html?mode=edit&id=${workId}`;
}

async function deleteArtwork() {
  if (!confirm("작업물을 삭제할까요?")) return;

  // 스토리지 파일 삭제
  if (artworkData.work_path) {
    await supabase.storage.from("works").remove([artworkData.work_path]);
  }

  const { error } = await supabase.from("works").delete().eq("work_id", workId);
  if (error) { console.error("삭제 실패:", error); return; }

  alert("작업물이 삭제되었습니다.");
  history.back();
}

/* =========================
   이벤트 위임
========================= */
document.addEventListener("click", async (e) => {
  // 댓글 등록
  if (e.target.closest("#commentSubmitMount button")) {
    await addComment();
    return;
  }

  // 대댓글 등록
  const rBtnArea = e.target.closest("[id^='reply-submit-']");
  if (rBtnArea && e.target.tagName === "BUTTON") {
    await addReply(rBtnArea.id.replace("reply-submit-", ""));
    return;
  }

  const t = e.target.closest("[data-act]");
  if (!t) return;
  const { act, cid, rid } = t.dataset;

  if (act === "toggle") {
    const c = state.comments.find(x => x.id === cid);
    if (c) { c.isOpen = !c.isOpen; render(); }
  }

  // 댓글 수정
  if (act === "edit-c") {
    const c = state.comments.find(x => x.id === cid);
    if (c) { c.editMode = true; render(); $(`#edit-input-c-${cid}`)?.focus(); }
  }
  if (act === "edit-cancel-c") {
    const c = state.comments.find(x => x.id === cid);
    if (c) { c.editMode = false; render(); }
  }
  if (act === "edit-save-c") {
    const ta   = $(`#edit-input-c-${cid}`);
    const text = (ta?.value || "").trim();
    if (!text) return;
    await supabase.from("comments")
      .update({ content: text, updated_at: new Date().toISOString() })
      .eq("comment_id", cid);
    await loadComments();
  }

  // 댓글 삭제
  if (act === "del-c") {
    if (!confirm("댓글을 삭제할까요?")) return;
    await supabase.from("comments").delete().eq("comment_id", cid);
    await loadComments();
  }

  // 대댓글 수정
  if (act === "edit-r") {
    for (const c of state.comments) {
      const r = c.replies?.find(x => x.id === rid);
      if (r) { r.editMode = true; render(); $(`#edit-input-r-${rid}`)?.focus(); break; }
    }
  }
  if (act === "edit-cancel-r") {
    for (const c of state.comments) {
      const r = c.replies?.find(x => x.id === rid);
      if (r) { r.editMode = false; render(); break; }
    }
  }
  if (act === "edit-save-r") {
    const ta   = $(`#edit-input-r-${rid}`);
    const text = (ta?.value || "").trim();
    if (!text) return;
    await supabase.from("comments")
      .update({ content: text, updated_at: new Date().toISOString() })
      .eq("comment_id", rid);
    await loadComments();
  }

  // 대댓글 삭제
  if (act === "del-r") {
    if (!confirm("대댓글을 삭제할까요?")) return;
    await supabase.from("comments").delete().eq("comment_id", rid);
    await loadComments();
  }

  if (act === "edit-artwork") editArtwork();
  if (act === "del-artwork")  deleteArtwork();
});

/* =========================
   초기화
========================= */
document.addEventListener("DOMContentLoaded", async () => {
  if (!workId) { alert("잘못된 접근입니다."); history.back(); return; }

  // 로그인 유저 확인
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    currentUser = { id: session.user.id };
    const { data: userData } = await supabase
      .from("users")
      .select("user_name, user_img")
      .eq("user_id", session.user.id)
      .single();
    if (userData) {
      currentUser.user_name = userData.user_name;
      currentUser.user_img  = userData.user_img;
    }
  }

  // 작업물 로드
  const { data: work, error } = await supabase
    .from("works")
    .select("*")
    .eq("work_id", workId)
    .single();

  if (error || !work) { alert("작업물을 찾을 수 없습니다."); history.back(); return; }

  artworkData  = work;
  workOwnerId  = work.user_id;

  // 작성자 정보 보완
  const { data: ownerData } = await supabase
    .from("users")
    .select("user_name, user_img")
    .eq("user_id", work.user_id)
    .single();

  artworkData.user_name = ownerData?.user_name ?? "unknown";
  artworkData.isMine    = currentUser?.id === work.user_id;

  fillBanner(artworkData);

  // 버튼 마운트
  if (typeof loadButton === "function") {
    loadButton({ target: "#commentSubmitMount", text: "등록", variant: "primary" });
  }

  await initLike();
  await loadComments();
});