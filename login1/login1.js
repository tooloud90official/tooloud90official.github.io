// login1.js

const emailInput    = document.getElementById('email');
const passwordInput = document.getElementById('password');

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
  target: '#googleBtnContainer',
  text: 'Google 계정으로 계속하기',
  variant: 'outline',
  onClick: () => {}
}).then(() => {
  const btn = document.querySelector('#googleBtnContainer .btn');
  btn.insertAdjacentHTML(
    'afterbegin',
    '<img src="/media/googleLogo.svg" alt="Google" style="width:20px;height:20px;margin-right:10px;">'
  );
  btn.style.display = 'flex';
  btn.style.alignItems = 'center';
  btn.style.justifyContent = 'center';
});

loadButton({
  target: '#appleBtnContainer',
  text: 'Apple 계정으로 계속하기',
  variant: 'outline',
  onClick: () => {}
}).then(() => {
  const btn = document.querySelector('#appleBtnContainer .btn');
  btn.insertAdjacentHTML(
    'afterbegin',
    '<img src="/media/appleLogo.svg" alt="Apple" style="width:20px;height:20px;margin-right:10px;margin-top:-3px;">'
  );
  btn.style.display = 'flex';
  btn.style.alignItems = 'center';
  btn.style.justifyContent = 'center';
});

// ===== 회원가입 텍스트 링크 =====
const signupLink = document.getElementById('signupLink');
signupLink?.addEventListener('click', () => {
  window.location.href = '/login2/login2.html';
});

// ===== 비밀번호 재설정 =====
const resetPwBtn = document.getElementById('resetPw');
resetPwBtn?.addEventListener('click', () => {
  window.location.href = '/reset/reset.html';
});


// ===== 에러 메시지 함수 =====
function showEmailError(text) {
  const el = document.getElementById('emailError');
  el.innerHTML = text ? `<img src="/media/caution.png" alt="caution" style="width:14px;height:14px;margin-right:1px;margin-top:-2px;vertical-align:middle;">${text}` : '';
  el.classList.toggle('visible', text !== '');
}

function showPasswordError(text) {
  const el = document.getElementById('passwordError');
  el.innerHTML = text ? `<img src="/media/caution.png" alt="caution" style="width:14px;height:14px;margin-right:1px;margin-top:-2px;vertical-align:middle;">${text}` : '';
  el.classList.toggle('visible', text !== '');
}


// ===== 이메일 형식 검사 =====
emailInput.addEventListener('input', () => {
  const val = emailInput.value.trim();
  if (val === '') { showEmailError(''); return; }
  if (!EMAIL_REGEX.test(val)) {
    showEmailError('올바른 이메일 형식이 아닙니다. (예: example@email.com)');
  } else {
    showEmailError('');
  }
});


// ===== 비밀번호 형식 검사 =====
passwordInput.addEventListener('input', () => {
  const val = passwordInput.value;
  if (val === '') { showPasswordError(''); return; }
  if (!PW_REGEX.test(val)) {
    showPasswordError('비밀번호는 8자 이상, 영문·숫자·특수문자를 모두 포함해야 합니다.');
  } else {
    showPasswordError('');
  }
});


// ===== 로그인 처리 =====
function handleLogin() {
  const email    = emailInput.value.trim();
  const password = passwordInput.value;

  if (email === '') {
    showEmailError('이메일을 입력해주세요.');
    emailInput.focus(); return;
  }
  if (!EMAIL_REGEX.test(email)) {
    showEmailError('올바른 이메일 형식이 아닙니다.');
    emailInput.focus(); return;
  }
  if (password === '') {
    showPasswordError('비밀번호를 입력해주세요.');
    passwordInput.focus(); return;
  }
  if (!PW_REGEX.test(password)) {
    showPasswordError('비밀번호는 8자 이상, 영문·숫자·특수문자를 모두 포함해야 합니다.');
    passwordInput.focus(); return;
  }

  // ✅ 로그인 성공
  showEmailError('');
  showPasswordError('');
  localStorage.setItem('isLoggedIn', 'true');
  window.location.href = '/main1/main1.html';
}