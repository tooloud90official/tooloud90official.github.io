/* =========================
   버튼 생성
========================= */

window.addEventListener('DOMContentLoaded', () => {

  loadButton({
    target: '#loginBtn',
    text: '로그인',
    variant: 'primary',
    onClick: login
  });

  loadButton({
    target: '#signupBtn',
    text: '회원가입',
    variant: 'outline',
    onClick: () => alert('회원가입 페이지 이동')
  });

});

/* =========================
   로그인 로직
========================= */

function login() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!email) return alert('이메일 입력하세요');
  if (!password) return alert('비밀번호 입력하세요');

  alert('로그인 시도');
}

/* =========================
   Enter 로그인
========================= */

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') login();
});

/* =========================
   기타 버튼
========================= */

document.getElementById('resetPw').onclick = () =>
  alert('비밀번호 재설정 이동');

document.getElementById('googleLogin').onclick = () =>
  alert('구글 로그인');

document.getElementById('appleLogin').onclick = () =>
  alert('애플 로그인');