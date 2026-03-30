import { loadNativeSelect } from '../_common/select/select.js';
import { supabase } from '../_ignore/supabase.js';

document.addEventListener('DOMContentLoaded', async () => {

    /* ===== 임시: 모든 요소 강제 노출 =====
    document.getElementById('verifyCodeWrap').style.display = 'block';
    document.getElementById('newPwWrap').style.display = 'block';
    loadButton({
      target: '#resetBtnContainer',
      text: '비밀번호 변경 완료',
      variant: 'primary',
      size: 'md',
      onClick: () => {}
    });
    */ 

  // ===== 1. 도메인 셀렉트 =====
  await loadNativeSelect({
    target: '#emailDomainSelect',
    placeholder: '이메일 주소 선택',
    options: [
      { value: 'gmail.com', label: 'gmail.com' },
      { value: 'naver.com', label: 'naver.com' },
      { value: 'icloud.com', label: 'icloud.com' },
      { value: 'direct', label: '직접 입력' },
    ],
    onChange: (item) => {
      const customInput = document.getElementById('emailCustom');
      if (!customInput) return;

      if (item.value === 'direct') {
        customInput.style.display = 'block';
        customInput.focus();
      } else {
        customInput.style.display = 'none';
        customInput.value = '';
      }

      resetState();
    }
  });

  // ===== 2. 공통 헬퍼 =====
  function getFullEmail() {
    const idInput = document.getElementById('emailId');
    const customInput = document.getElementById('emailCustom');
    const nativeSelect = document.querySelector('#emailDomainSelect select');

    const id = idInput?.value.trim() || '';
    let domain = '';

    if (customInput && customInput.style.display !== 'none') {
      domain = customInput.value.trim();
    } else {
      domain = nativeSelect?.value || '';
      if (!domain || domain === '이메일 주소 선택') domain = '';
    }

    if (!id || !domain) return null;
    return `${id}@${domain}`;
  }

  function setMsg(el, text, color = '') {
    if (!el) return;
    el.textContent = text;
    el.style.color = color;
  }

  const emailMsg = document.getElementById('email-msg');

  // ===== 3. 상태 변수 =====
  let currentEmail = null;
  let isCodeVerified = false;
  let timerInterval = null;

  // ===== 4. 타이머 =====
  const TIMER_SEC = 180;

  function startTimer() {
    clearInterval(timerInterval);

    const timerEl = document.getElementById('verifyTimer');
    if (!timerEl) return;

    let remaining = TIMER_SEC;

    function tick() {
      const m = String(Math.floor(remaining / 60)).padStart(2, '0');
      const s = String(remaining % 60).padStart(2, '0');
      timerEl.textContent = `${m}:${s}`;

      if (remaining <= 0) {
        clearInterval(timerInterval);
        timerEl.textContent = '만료';
        timerEl.classList.add('expired');

        const verifyBtn = document.getElementById('verifyBtn');
        if (verifyBtn) verifyBtn.disabled = true;

        setMsg(emailMsg, '인증 시간이 만료되었습니다. 재전송 해주세요.', '#e53e3e');
        return;
      }

      remaining -= 1;
    }

    tick();
    timerInterval = setInterval(tick, 1000);
  }

  // ===== 5. 상태 초기화 =====
  function resetState() {
    clearInterval(timerInterval);

    currentEmail = null;
    isCodeVerified = false;

    setMsg(emailMsg, '');

    const sendBtn = document.getElementById('sendCodeBtn');
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.textContent = '코드 전송';
      sendBtn.classList.remove('sent');
    }

    const verifyWrap = document.getElementById('verifyCodeWrap');
    if (verifyWrap) verifyWrap.style.display = 'none';

    const codeInput = document.getElementById('verifyCodeInput');
    if (codeInput) {
      codeInput.value = '';
      codeInput.disabled = false;
    }

    const timerEl = document.getElementById('verifyTimer');
    if (timerEl) {
      timerEl.textContent = '';
      timerEl.classList.remove('expired');
    }

    const verifyBtn = document.getElementById('verifyBtn');
    if (verifyBtn) {
      verifyBtn.disabled = false;
      verifyBtn.textContent = '확인';
      verifyBtn.classList.remove('verified');
    }

    const newPwWrap = document.getElementById('newPwWrap');
    if (newPwWrap) newPwWrap.style.display = 'none';

    const resetBtnContainer = document.getElementById('resetBtnContainer');
    if (resetBtnContainer) resetBtnContainer.innerHTML = '';

    const pwMsg = document.getElementById('pw-msg');
    const pwConfirmMsg = document.getElementById('pw-confirm-msg');
    if (pwMsg) pwMsg.textContent = '';
    if (pwConfirmMsg) pwConfirmMsg.textContent = '';

    const newPassword = document.getElementById('newPassword');
    const newPasswordConfirm = document.getElementById('newPasswordConfirm');
    if (newPassword) newPassword.value = '';
    if (newPasswordConfirm) newPasswordConfirm.value = '';
  }

  document.getElementById('emailId')?.addEventListener('input', resetState);
  document.getElementById('emailCustom')?.addEventListener('input', resetState);

  // ===== 6. 코드 전송 =====
  async function sendCode() {
    const email = getFullEmail();
    const sendBtn = document.getElementById('sendCodeBtn');

    if (!email) {
      setMsg(emailMsg, '이메일 주소를 입력해 주세요.', '#e53e3e');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMsg(emailMsg, '올바른 이메일 형식이 아닙니다.', '#e53e3e');
      return;
    }

    if (sendBtn) sendBtn.disabled = true;
    setMsg(emailMsg, '코드를 전송 중입니다...', '#888');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false
      }
    });

    if (error) {
      if (sendBtn) sendBtn.disabled = false;

      if (
        error.message?.includes('not found') ||
        error.message?.includes('No user')
      ) {
        setMsg(emailMsg, '가입되지 않은 이메일입니다.', '#e53e3e');
      } else if (
        error.message?.includes('social') ||
        error.message?.includes('provider')
      ) {
        setMsg(emailMsg, '소셜 로그인으로 가입된 계정입니다.', '#e53e3e');
      } else {
        setMsg(emailMsg, '전송에 실패했습니다. 다시 시도해 주세요.', '#e53e3e');
      }

      console.error('[코드 전송 오류]', error);
      return;
    }

    currentEmail = email;

    if (sendBtn) {
      sendBtn.textContent = '전송 완료';
      sendBtn.classList.add('sent');
    }

    setMsg(emailMsg, `${email} 로 인증 코드를 전송했습니다.`, '#0080ff');

    const verifyWrap = document.getElementById('verifyCodeWrap');
    if (verifyWrap) verifyWrap.style.display = 'block';

    const timerEl = document.getElementById('verifyTimer');
    if (timerEl) timerEl.classList.remove('expired');

    const verifyBtn = document.getElementById('verifyBtn');
    if (verifyBtn) {
      verifyBtn.disabled = false;
      verifyBtn.textContent = '확인';
      verifyBtn.classList.remove('verified');
    }

    const codeInput = document.getElementById('verifyCodeInput');
    if (codeInput) {
      codeInput.value = '';
      codeInput.focus();
    }

    startTimer();
  }

  document.getElementById('sendCodeBtn')?.addEventListener('click', sendCode);
  document.getElementById('resendBtn')?.addEventListener('click', () => {
    resetState();
    sendCode();
  });

  // ===== 7. 코드 확인 =====
  document.getElementById('verifyBtn')?.addEventListener('click', async () => {
    const codeInput = document.getElementById('verifyCodeInput');
    const verifyBtn = document.getElementById('verifyBtn');
    const code = codeInput?.value.trim() || '';

    if (!currentEmail) {
      setMsg(emailMsg, '먼저 인증 메일을 전송해 주세요.', '#e53e3e');
      return;
    }

    if (!code || code.length < 6) {
      setMsg(emailMsg, '인증 코드를 입력해 주세요.', '#e53e3e');
      return;
    }

    if (verifyBtn) verifyBtn.disabled = true;
    setMsg(emailMsg, '코드 확인 중...', '#888');

    const { error } = await supabase.auth.verifyOtp({
      email: currentEmail,
      token: code,
      type: 'email'
    });

    if (error) {
      if (verifyBtn) verifyBtn.disabled = false;
      setMsg(emailMsg, '인증 코드가 올바르지 않습니다.', '#e53e3e');
      console.error('[OTP 확인 오류]', error);
      return;
    }

    clearInterval(timerInterval);
    isCodeVerified = true;

    if (verifyBtn) {
      verifyBtn.textContent = '완료';
      verifyBtn.classList.add('verified');
    }

    if (codeInput) codeInput.disabled = true;

    const timerEl = document.getElementById('verifyTimer');
    if (timerEl) timerEl.textContent = '';

    setMsg(emailMsg, '인증이 완료되었습니다. 새 비밀번호를 입력해 주세요. ✓', '#22c55e');

    const newPwWrap = document.getElementById('newPwWrap');
    if (newPwWrap) newPwWrap.style.display = 'block';

    loadButton({
      target: '#resetBtnContainer',
      text: '비밀번호 변경 완료',
      variant: 'primary',
      size: 'md',
      onClick: handleResetPassword
    });
  });

  document.getElementById('verifyCodeInput')?.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '');
  });

  document.getElementById('verifyCodeInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('verifyBtn')?.click();
    }
  });

  // ===== 8. 비밀번호 검사 =====
  const PW_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
  const newPassword = document.getElementById('newPassword');
  const newPasswordConfirm = document.getElementById('newPasswordConfirm');
  const pwMsg = document.getElementById('pw-msg');
  const pwConfirmMsg = document.getElementById('pw-confirm-msg');

  newPassword?.addEventListener('input', () => {
    if (!pwMsg) return;

    if (!newPassword.value) {
      pwMsg.textContent = '';
      return;
    }

    if (!PW_REGEX.test(newPassword.value)) {
      pwMsg.textContent = '비밀번호는 8자 이상, 영문·숫자·특수문자를 모두 포함해야 합니다.';
      pwMsg.style.color = '#e53e3e';
    } else {
      pwMsg.textContent = '사용 가능한 비밀번호입니다.';
      pwMsg.style.color = '#0080ff';
    }

    if (newPasswordConfirm?.value) checkConfirm();
  });

  function checkConfirm() {
    if (!pwConfirmMsg || !newPasswordConfirm) return;

    if (!newPasswordConfirm.value) {
      pwConfirmMsg.textContent = '';
      return;
    }

    if (newPassword?.value !== newPasswordConfirm.value) {
      pwConfirmMsg.textContent = '비밀번호가 일치하지 않습니다.';
      pwConfirmMsg.style.color = '#e53e3e';
    } else {
      pwConfirmMsg.textContent = '비밀번호가 일치합니다.';
      pwConfirmMsg.style.color = '#0080ff';
    }
  }

  newPasswordConfirm?.addEventListener('input', checkConfirm);

  // ===== 9. 비밀번호 변경 =====
  async function handleResetPassword() {
    if (!isCodeVerified) {
      setMsg(emailMsg, '먼저 인증 코드를 확인해 주세요.', '#e53e3e');
      return;
    }

    if (!newPassword || !newPasswordConfirm || !pwMsg || !pwConfirmMsg) return;

    if (!PW_REGEX.test(newPassword.value)) {
      pwMsg.textContent = '비밀번호는 8자 이상, 영문·숫자·특수문자를 모두 포함해야 합니다.';
      pwMsg.style.color = '#e53e3e';
      return;
    }

    if (newPassword.value !== newPasswordConfirm.value) {
      pwConfirmMsg.textContent = '비밀번호가 일치하지 않습니다.';
      pwConfirmMsg.style.color = '#e53e3e';
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword.value
    });

    if (error) {
      pwMsg.textContent = '비밀번호 변경에 실패했습니다. 다시 시도해 주세요.';
      pwMsg.style.color = '#e53e3e';
      console.error('[비밀번호 변경 오류]', error);
      return;
    }

    alert('비밀번호가 변경되었습니다. 다시 로그인해 주세요.');
    await supabase.auth.signOut();
    window.location.href = '/login1/login1.html';
  }

  // ===== 10. 뒤로가기 =====
  document.getElementById('goBack')?.addEventListener('click', () => {
    window.location.href = '/login1/login1.html';
  });
});