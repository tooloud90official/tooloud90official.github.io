import { initFaqItems } from "/_common/drop_down/drop_down.js";
import { supabase } from "/_ignore/supabase.js";

const ADMIN_EMAIL = "admin@example.com"; // ← 이메일 바꿔서 쓰세요

let currentUser = null;
let isAdmin = false;

const FAQ_ITEMS = [
  { question: "서비스 이용 방법이 궁금해요.", answer: "상단 메뉴에서 카테고리를 선택하시면 다양한 AI 툴을 확인하실 수 있습니다." },
  { question: "회원가입은 어떻게 하나요?", answer: "우측 상단의 로그인 버튼을 클릭 후 회원가입을 진행해주세요." },
  { question: "툴 정보가 잘못되었어요.", answer: "문의하기 섹션을 통해 알려주시면 빠르게 수정하겠습니다." },
  { question: "관심 목록은 어디서 확인하나요?", answer: "로그인 후 마이페이지에서 관심 목록을 확인하실 수 있습니다." },
  { question: "리뷰는 어떻게 작성하나요?", answer: "툴 상세 페이지 하단에서 별점과 리뷰를 작성하실 수 있습니다." },
];

async function loadCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  currentUser = user;
  isAdmin = user.email === ADMIN_EMAIL;
}

// ===== FAQ 렌더링 =====
async function renderFaqItems() {
  const container = document.querySelector("#faqList");
  if (!container) return;
  container.innerHTML = "";

  FAQ_ITEMS.forEach((item, i) => {
    const panelId = `faq-panel-${i + 1}`;
    const el = document.createElement("div");
    el.className = "drop_down";
    el.setAttribute("data-drop_down", "");
    el.innerHTML = `
      <button type="button" class="drop_down__trigger" data-faq-trigger
        aria-expanded="false" aria-controls="${panelId}">
        <span class="drop_down__title" data-faq-title>${item.question}</span>
        <span class="drop_down__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" class="drop_down__chevron">
            <path d="M7 14l5-5 5 5" fill="currentColor"></path>
          </svg>
        </span>
      </button>
      <div id="${panelId}" class="drop_down__panel" data-faq-panel role="region" aria-hidden="true">
        <div class="drop_down__content">
          <div class="drop_down__meta">
            <strong class="drop_down__label">답변</strong>
          </div>
          <p class="drop_down__desc" data-faq-desc>${item.answer}</p>
        </div>
      </div>
    `;
    container.appendChild(el);
  });
}

// ===== 내 문의 목록 (일반 유저) =====
async function renderMyInquiries() {
  const container = document.querySelector("#myInquiryList");
  if (!container) return;
  container.innerHTML = "";

  if (!currentUser) {
    container.innerHTML = `<p style="color:#aaa;font-size:14px;">로그인 후 문의 내역을 확인할 수 있습니다.</p>`;
    return;
  }

  const { data, error } = await supabase
    .from("inquiries")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("question_created_at", { ascending: false });

  if (error || !data?.length) {
    container.innerHTML = `<p style="color:#aaa;font-size:14px;">문의 내역이 없습니다.</p>`;
    return;
  }

  data.forEach((item, i) => {
    const panelId = `myinquiry-panel-${i + 1}`;
    const statusBadge = item.status === "answered"
      ? `<span style="font-size:11px;color:#1a6ff4;font-weight:700;margin-left:8px;">[답변완료]</span>`
      : `<span style="font-size:11px;color:#aaa;font-weight:700;margin-left:8px;">[대기중]</span>`;

    const answerHtml = item.answer
      ? `<div style="margin-top:12px;padding:10px;background:#f0f5ff;border-radius:8px;">
          <strong style="color:#1a6ff4;font-size:13px;">관리자 답변</strong>
          <p style="margin:6px 0 0;font-size:13px;">${item.answer}</p>
         </div>`
      : `<p style="color:#aaa;font-size:13px;margin-top:8px;">아직 답변이 등록되지 않았습니다.</p>`;

    const el = document.createElement("div");
    el.className = "drop_down";
    el.setAttribute("data-drop_down", "");
    el.innerHTML = `
      <button type="button" class="drop_down__trigger" data-faq-trigger
        aria-expanded="false" aria-controls="${panelId}">
        <span class="drop_down__title" data-faq-title>${item.question}${statusBadge}</span>
        <span class="drop_down__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" class="drop_down__chevron">
            <path d="M7 14l5-5 5 5" fill="currentColor"></path>
          </svg>
        </span>
      </button>
      <div id="${panelId}" class="drop_down__panel" data-faq-panel role="region" aria-hidden="true">
        <div class="drop_down__content">
          <div class="drop_down__meta">
            <strong class="drop_down__label">${item.question}</strong>
            <span class="drop_down__dot">•</span>
            <span class="drop_down__time">${item.question_created_at?.slice(0,10).replace(/-/g,".")}</span>
          </div>
          ${answerHtml}
        </div>
      </div>
    `;
    container.appendChild(el);
  });
}

// ===== 관리자: 전체 문의 목록 =====
async function renderAdminInquiries() {
  const section = document.querySelector("#myInquiryList")?.closest(".inquiry-section");
  if (section) {
    const titleEl = section.querySelector(".inquiry-section__title");
    if (titleEl) titleEl.textContent = "전체 문의 목록";
  }

  const container = document.querySelector("#myInquiryList");
  if (!container) return;
  container.innerHTML = "";

  const { data, error } = await supabase
    .from("inquiries")
    .select("*")
    .order("question_created_at", { ascending: false });

  if (error || !data?.length) {
    container.innerHTML = `<p style="color:#aaa;font-size:14px;">문의 내역이 없습니다.</p>`;
    return;
  }

  data.forEach((item, i) => {
    const panelId = `admin-panel-${i + 1}`;
    const statusBadge = item.status === "answered"
      ? `<span style="font-size:11px;color:#1a6ff4;font-weight:700;margin-left:8px;">[답변완료]</span>`
      : `<span style="font-size:11px;color:#aaa;font-weight:700;margin-left:8px;">[대기중]</span>`;

    const answerHtml = item.answer
      ? `<div style="margin-top:12px;padding:10px;background:#f0f5ff;border-radius:8px;">
          <strong style="color:#1a6ff4;font-size:13px;">등록된 답변</strong>
          <p style="margin:6px 0 0;font-size:13px;">${item.answer}</p>
         </div>`
      : "";

    const el = document.createElement("div");
    el.className = "drop_down";
    el.setAttribute("data-drop_down", "");
    el.innerHTML = `
      <button type="button" class="drop_down__trigger" data-faq-trigger
        aria-expanded="false" aria-controls="${panelId}">
        <span class="drop_down__title" data-faq-title>${item.question}${statusBadge}</span>
        <span class="drop_down__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" class="drop_down__chevron">
            <path d="M7 14l5-5 5 5" fill="currentColor"></path>
          </svg>
        </span>
      </button>
      <div id="${panelId}" class="drop_down__panel" data-faq-panel role="region" aria-hidden="true">
        <div class="drop_down__content">
          <div class="drop_down__meta">
            <strong class="drop_down__label">${item.question}</strong>
            <span class="drop_down__dot">•</span>
            <span class="drop_down__time">${item.question_created_at?.slice(0,10).replace(/-/g,".")}</span>
          </div>
          <p style="font-size:12px;color:#aaa;margin:4px 0 0;">user: ${item.user_id}</p>
          ${answerHtml}
          <div style="margin-top:12px;">
            <textarea id="adminAnswer-${item.inquiry_id}"
              style="width:100%;min-height:80px;border:1px solid #ddd;border-radius:6px;padding:8px;font-size:13px;font-family:inherit;resize:vertical;"
              placeholder="답변을 입력해주세요.">${item.answer ?? ""}</textarea>
            <div style="margin-top:8px;" id="adminAnswerBtn-${item.inquiry_id}"></div>
          </div>
        </div>
      </div>
    `;
    container.appendChild(el);
  });

  // ✅ loadButton 컴포넌트로 답변 버튼 렌더링
  data.forEach((item) => {
    if (typeof window.loadButton === "function") {
      window.loadButton({
        target:  `#adminAnswerBtn-${item.inquiry_id}`,
        text:    "답변 등록",
        variant: "primary",
        onClick: () => submitAdminAnswer(item.inquiry_id, item.user_id),
      });
    }
  });
}

// ===== 관리자 답변 등록 =====
async function submitAdminAnswer(inquiryId, userId) {
  const textarea = document.querySelector(`#adminAnswer-${inquiryId}`);
  const answer = textarea?.value?.trim();
  if (!answer) return alert("답변을 입력해주세요.");

  const { error } = await supabase
    .from("inquiries")
    .update({
      answer,
      status:            "answered",
      answer_created_at: new Date().toISOString(),
    })
    .eq("inquiry_id", inquiryId);

  if (error) {
    console.error("답변 등록 실패:", error);
    alert("답변 등록 중 오류가 발생했습니다.");
    return;
  }

  // ✅ notification 저장
  const { error: notiError } = await supabase
    .from("notifications")
    .insert({
      notification_id: crypto.randomUUID(),
      user_id:         userId,
      type:            "message",
      reference_id:    inquiryId,
      is_read:         false,
    });

  if (notiError) console.error("알림 저장 실패:", notiError);

  alert("답변이 등록되었습니다.");
  await renderAdminInquiries();
  initFaqItems();
}

// ===== 문의 제출 =====
async function submitInquiry() {
  if (!currentUser) {
    alert("로그인 후 문의를 남길 수 있습니다.");
    window.location.href = "/login1/login1.html";
    return;
  }

  const message = document.querySelector("#contactMessage")?.value?.trim() ?? "";
  if (!message) return alert("문의 내용을 입력해주세요.");

  const { error } = await supabase
    .from("inquiries")
    .insert({
      inquiry_id:          crypto.randomUUID(),
      user_id:             currentUser.id,
      question:            message,
      question_created_at: new Date().toISOString(),
      status:              "pending",
    });

  if (error) {
    console.error("문의 등록 실패:", error);
    alert("문의 등록 중 오류가 발생했습니다.");
    return;
  }

  alert("문의가 등록되었습니다.");
  document.querySelector("#contactMessage").value = "";
  await renderMyInquiries();
  initFaqItems();
}

// ===== 버튼 렌더링 =====
function renderSubmitButton() {
  if (isAdmin) {
    const contactSection = document.querySelector("#contactMessage")?.closest(".inquiry-section");
    const submitWrap     = document.querySelector(".inquiry-submit-wrap");
    if (contactSection) contactSection.style.display = "none";
    if (submitWrap)     submitWrap.style.display     = "none";
    return;
  }

  if (typeof window.loadButton !== "function") return;

  window.loadButton({
    target:  "#submitBtn",
    text:    "등록하기",
    variant: "primary",
    onClick: () => submitInquiry(),
  });
}

// ===== DOMContentLoaded =====
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadCurrentUser();
    await renderFaqItems();

    if (isAdmin) {
      await renderAdminInquiries();
    } else {
      await renderMyInquiries();
    }

    renderSubmitButton();
    initFaqItems();

  } catch (err) {
    console.error("[inquiry] 초기화 실패:", err);
  }
});