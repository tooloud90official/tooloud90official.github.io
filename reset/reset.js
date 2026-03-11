import { loadNativeSelect } from '/_common/select/select.js';

document.addEventListener("DOMContentLoaded", async () => {

  // =========================
  // top banner 로드
  // =========================
  if (window.includeHTML) {
    await includeHTML("#top-banner", "/_common/top-banner/top-banner.html");
  }

  // =========================
  // 이메일 도메인 셀렉트
  // =========================
  let domainInstance = await loadNativeSelect({
    target: '#emailDomain',
    placeholder: '이메일 주소 선택',
    options: [
      { value: 'gmail.com',  label: 'gmail.com' },
      { value: 'naver.com',  label: 'naver.com' },
      { value: 'icloud.com', label: 'icloud.com' },
    ]
  });

  // =========================
  // 코드 전송 버튼 생성
  // =========================
  if (window.loadButton) {
    loadButton({
      target: "#sendCodeBtnContainer",
      text: "코드 전송",
      variant: "primary",
      size: "md",
      onClick: sendResetCode
    });
  } else {
    const btn = document.createElement("button");
    btn.className = "btn btn-primary";
    btn.textContent = "코드 전송";
    btn.onclick = sendResetCode;
    document.getElementById("sendCodeBtnContainer").appendChild(btn);
  }

  // =========================
  // 뒤로가기
  // =========================
  document.getElementById("goBack").addEventListener("click", () => {
    window.location.href = "/login1/login1.html";
  });

  // =========================
  // 코드 전송 함수
  // =========================
  function sendResetCode() {
    const id = document.getElementById("emailId").value.trim();
    const domain = domainInstance?.getValue();

    if (!id) {
      alert("이메일을 입력하세요.");
      return;
    }

    if (!domain) {
      alert("이메일 주소를 선택하세요.");
      return;
    }

    const email = `${id}@${domain}`;
    console.log("코드 전송:", email);
    alert("코드가 전송되었습니다.");
  }

});