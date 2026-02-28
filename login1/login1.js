// login1.js

const emailInput    = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginError    = document.getElementById('loginError');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PW_REGEX    = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

// ===== 버튼 컴포넌트 로드 =====
loadButton({
  target: '#loginBtnContainer',
  text: '로그인',
  variant: 'primary',
  onClick: handleLogin
});

loadButton({
  target: '#signupBtnContainer',
  text: '회원가입',
  variant: 'outline',
  onClick: () => {
    window.location.href = '/login2/login2.html';
  }
});


// ===== 이메일 형식 검사 =====
emailInput.addEventListener('input', () => {
  const val = emailInput.value.trim();
  if (val === '') { showMsg('', ''); return; }
  if (!EMAIL_REGEX.test(val)) {
    showMsg('⚠️ 올바른 이메일 형식이 아닙니다. (예: example@email.com)', '#e53e3e');
  } else {
    showMsg('✅ 올바른 이메일 형식입니다.', '#38a169');
  }
});


// ===== 비밀번호 형식 검사 =====
passwordInput.addEventListener('input', () => {
  const val = passwordInput.value;
  if (val === '') { showMsg('', ''); return; }
  if (!PW_REGEX.test(val)) {
    showMsg('⚠️ 비밀번호는 8자 이상, 영문·숫자·특수문자(!@#$%^&*)를 모두 포함해야 합니다.', '#e53e3e');
  } else {
    showMsg('✅ 올바른 비밀번호 형식입니다.', '#38a169');
  }
});


// ===== 로그인 처리 =====
function handleLogin() {
  const email    = emailInput.value.trim();
  const password = passwordInput.value;

  if (email === '') {
    showMsg('⚠️ 이메일을 입력해주세요.', '#e53e3e');
    emailInput.focus(); return;
  }
  if (!EMAIL_REGEX.test(email)) {
    showMsg('⚠️ 올바른 이메일 형식이 아닙니다.', '#e53e3e');
    emailInput.focus(); return;
  }
  if (password === '') {
    showMsg('⚠️ 비밀번호를 입력해주세요.', '#e53e3e');
    passwordInput.focus(); return;
  }
  if (!PW_REGEX.test(password)) {
    showMsg('⚠️ 비밀번호는 8자 이상, 영문·숫자·특수문자(!@#$%^&*)를 모두 포함해야 합니다.', '#e53e3e');
    passwordInput.focus(); return;
  }

  // ✅ 유효성 통과 → 로그인 처리
  showMsg('', '');
  localStorage.setItem('isLoggedIn', 'true');
  window.location.href = '/main1/main1.html';
}


// ===== 안내 문구 =====
function showMsg(text, color) {
  loginError.textContent = text;
  loginError.style.color = color;
}