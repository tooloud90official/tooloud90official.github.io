import { supabase } from '/_ignore/supabase.js';

const emailInput  = document.getElementById('email');
const pwInput     = document.getElementById('password');
const loginBtn    = document.getElementById('loginBtn');
const loginError  = document.getElementById('loginError');
const btnText     = loginBtn.querySelector('.btn-text');
const btnLoader   = loginBtn.querySelector('.btn-loader');

// 이미 로그인된 관리자라면 대시보드로 바로 이동
(async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single();
    if (data?.role === 'admin') {
      window.location.href = '/admin/dashboard/dashboard.html';
    }
  }
})();

function setLoading(bool) {
  loginBtn.disabled = bool;
  btnText.style.display  = bool ? 'none'  : 'inline';
  btnLoader.style.display = bool ? 'inline' : 'none';
}

async function handleLogin() {
  loginError.textContent = '';
  const email    = emailInput.value.trim();
  const password = pwInput.value;

  if (!email || !password) {
    loginError.textContent = '이메일과 비밀번호를 입력해주세요.';
    return;
  }

  setLoading(true);

  try {
    // 1. Supabase Auth 로그인
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      loginError.textContent = '이메일 또는 비밀번호가 올바르지 않습니다.';
      setLoading(false);
      return;
    }

    // 2. users 테이블에서 role 확인
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', authData.user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      await supabase.auth.signOut();
      loginError.textContent = '관리자 권한이 없는 계정입니다.';
      setLoading(false);
      return;
    }

    // 3. 관리자 확인 → 대시보드로 이동
    window.location.href = '/admin/dashboard/dashboard.html';

  } catch (e) {
    loginError.textContent = '오류가 발생했습니다. 다시 시도해주세요.';
    console.error(e);
    setLoading(false);
  }
}

loginBtn.addEventListener('click', handleLogin);
pwInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleLogin();
});