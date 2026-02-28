// login1.js
// 경로: minju/js/login1.js

document.addEventListener("DOMContentLoaded", () => {

  const emailInput    = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginError    = document.getElementById('loginError');
  const loginBtn      = document.getElementById('loginBtn');

  // ===== 안내 문구 스타일 =====
  loginError.style.cssText = 'font-size:13px; margin-top:8px; text-align:center;';


  // ===== 이메일 형식 검사 =====
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  emailInput.addEventListener('input', () => {
    const val = emailInput.value.trim();

    if (val === '') {
      showMsg('', '');
      return;
    }

    if (!EMAIL_REGEX.test(val)) {
      showMsg('⚠️ 올바른 이메일 형식이 아닙니다. (예: example@email.com)', '#e53e3e');
    } else {
      showMsg('✅ 올바른 이메일 형식입니다.', '#38a169');
    }
  });


  // ===== 비밀번호 형식 검사 =====
  const PW_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

  passwordInput.addEventListener('input', () => {
    const val = passwordInput.value;

    if (val === '') {
      showMsg('', '');
      return;
    }

    if (!PW_REGEX.test(val)) {
      showMsg('⚠️ 비밀번호는 8자 이상, 영문·숫자·특수문자(!@#$%^&*)를 모두 포함해야 합니다.', '#e53e3e');
    } else {
      showMsg('✅ 올바른 비밀번호 형식입니다.', '#38a169');
    }
  });


  // ===== 로그인 버튼 클릭 시 최종 검사 =====
  loginBtn.addEventListener('click', () => {
    const email    = emailInput.value.trim();
    const password = passwordInput.value;

    // 이메일 빈값
    if (email === '') {
      showMsg('⚠️ 이메일을 입력해주세요.', '#e53e3e');
      emailInput.focus();
      return;
    }

    // 이메일 형식
    if (!EMAIL_REGEX.test(email)) {
      showMsg('⚠️ 올바른 이메일 형식이 아닙니다. (예: example@email.com)', '#e53e3e');
      emailInput.focus();
      return;
    }

    // 비밀번호 빈값
    if (password === '') {
      showMsg('⚠️ 비밀번호를 입력해주세요.', '#e53e3e');
      passwordInput.focus();
      return;
    }

    // 비밀번호 형식
    if (!PW_REGEX.test(password)) {
      showMsg('⚠️ 비밀번호는 8자 이상, 영문·숫자·특수문자(!@#$%^&*)를 모두 포함해야 합니다.', '#e53e3e');
      passwordInput.focus();
      return;
    }

    // ✅ 유효성 통과 시 로그인 로직 실행
    showMsg('', '');
    console.log('로그인 진행', { email, password });
    // TODO: 서버 로그인 API 연동
  });


  // ===== 안내 문구 출력 함수 =====
  function showMsg(text, color) {
    loginError.textContent = text;
    loginError.style.color = color;
  }

});