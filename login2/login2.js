// login2.js
import { loadNativeSelect } from '/_common/select/select.js';
import { supabase } from '/_ignore/supabase.js';

document.addEventListener("DOMContentLoaded", async () => {

  // ===== 1. 다음 버튼 렌더링 =====
  loadButton({
    target: "#signup-button",
    text: "다음",
    variant: "primary",
    size: "md",
    onClick: () => {
      if (window.validateLogin2?.()) {
        window.location.href = "/login3/login3.html";
      }
    }
  });


  // ===== 2. 이메일 도메인 셀렉트 =====
  await loadNativeSelect({
    target: '#emailDomainSelect',
    placeholder: '이메일 주소 선택',
    options: [
      { value: 'gmail.com',  label: 'gmail.com' },
      { value: 'naver.com',  label: 'naver.com' },
      { value: 'icloud.com', label: 'icloud.com' },
      { value: 'direct',     label: '직접 입력' },
    ],
    onChange: (item) => {
      const customInput = document.getElementById('emailCustom');
      if (item.value === 'direct') {
        customInput.style.display = 'block';
        customInput.focus();
      } else {
        customInput.style.display = 'none';
        customInput.value = '';
      }
      resetSendState();
    }
  });


  // ===== 3. 헬퍼 =====
  function getFullEmail() {
    const id     = document.getElementById('emailId').value.trim();
    const custom = document.getElementById('emailCustom');

    let domain = '';
    if (custom.style.display !== 'none') {
      domain = custom.value.trim();
    } else {
      const nativeSelect = document.querySelector('#emailDomainSelect select');
       domain = nativeSelect ? nativeSelect.value : '';
      if (!domain || domain === '이메일 주소 선택') domain = '';
    }

    if (!id || !domain) return null;
    return `${id}@${domain}`;
  }

  function setFieldMsg(el, text, color) {
    el.textContent = text;
    el.style.color = color || '';
  }

  const emailMsg = document.getElementById('email-msg');


  // ===== 4. 상태 변수 =====
  let isEmailVerified = false;
  let timerInterval   = null;
  let currentEmail    = null;


  // ===== 5. 타이머 =====
  const TIMER_SEC = 180;

  function startTimer() {
    clearInterval(timerInterval);
    const timerEl = document.getElementById('verifyTimer');
    let remaining = TIMER_SEC;

    function tick() {
      const m = String(Math.floor(remaining / 60)).padStart(2, '0');
      const s = String(remaining % 60).padStart(2, '0');
      timerEl.textContent = `${m}:${s}`;

      if (remaining <= 0) {
        clearInterval(timerInterval);
        timerEl.textContent = '만료';
        timerEl.classList.add('expired');
        document.getElementById('verifyBtn').disabled = true;
        setFieldMsg(emailMsg, '인증 시간이 만료되었습니다. 재전송 해주세요.', '#e53e3e');
      }
      remaining--;
    }
    tick();
    timerInterval = setInterval(tick, 1000);
  }


  // ===== 6. 전송 상태 초기화 =====
  function resetSendState() {
    clearInterval(timerInterval);
    isEmailVerified = false;
    currentEmail    = null;
    sessionStorage.removeItem('signup_email');
    sessionStorage.removeItem('signup_password');
    setFieldMsg(emailMsg, '', '');

    const sendBtn = document.getElementById('sendCodeBtn');
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.textContent = '인증 메일 전송';
      sendBtn.classList.remove('sent');
    }

    const wrap = document.getElementById('verifyCodeWrap');
    if (wrap) wrap.style.display = 'none';

    const input = document.getElementById('verifyCodeInput');
    if (input) input.value = '';

    const timerEl = document.getElementById('verifyTimer');
    if (timerEl) { timerEl.textContent = ''; timerEl.classList.remove('expired'); }

    const verifyBtn = document.getElementById('verifyBtn');
    if (verifyBtn) {
      verifyBtn.disabled = false;
      verifyBtn.textContent = '확인';
      verifyBtn.classList.remove('verified');
    }
  }

  document.getElementById('emailId')?.addEventListener('input', resetSendState);


  // ===== 7. 인증 메일 전송 (signUp) =====
  async function sendOtp() {
    const email   = getFullEmail();
    const sendBtn = document.getElementById('sendCodeBtn');
    const pw      = document.getElementById('password').value;

    if (!email) {
      setFieldMsg(emailMsg, '이메일 주소를 입력해 주세요.', '#e53e3e');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldMsg(emailMsg, '올바른 이메일 형식이 아닙니다.', '#e53e3e');
      return;
    }
    if (!pw) {
      setFieldMsg(emailMsg, '비밀번호를 먼저 입력해 주세요.', '#e53e3e');
      return;
    }

    sendBtn.disabled = true;
    setFieldMsg(emailMsg, '인증 메일을 전송 중입니다...', '#888');

    const { error } = await supabase.auth.signUp({
      email,
      password: pw,
    });

    if (error) {
      sendBtn.disabled = false;
      if (error.message?.includes('already registered')) {
        setFieldMsg(emailMsg, '이미 사용 중인 이메일입니다.', '#e53e3e');
      } else {
        setFieldMsg(emailMsg, '전송에 실패했습니다. 다시 시도해 주세요.', '#e53e3e');
        console.error('[signUp 오류]', error);
      }
      return;
    }

    currentEmail = email;
    sendBtn.textContent = '전송 완료';
    sendBtn.classList.add('sent');
    setFieldMsg(emailMsg, `${email} 로 인증 코드를 전송했습니다.`, '#0080ff');

    sessionStorage.setItem('signup_email',    email);
    sessionStorage.setItem('signup_password', pw);

    const wrap = document.getElementById('verifyCodeWrap');
    wrap.style.display = 'block';

    const timerEl = document.getElementById('verifyTimer');
    timerEl.classList.remove('expired');

    const verifyBtn = document.getElementById('verifyBtn');
    verifyBtn.disabled = false;
    verifyBtn.textContent = '확인';
    verifyBtn.classList.remove('verified');

    document.getElementById('verifyCodeInput').value = '';
    document.getElementById('verifyCodeInput').focus();

    startTimer();
  }

  document.getElementById('sendCodeBtn')?.addEventListener('click', sendOtp);

  // 재전송 버튼
  document.getElementById('resendBtn')?.addEventListener('click', () => {
    resetSendState();
    sendOtp();
  });


  // ===== 8. 인증코드 확인 =====
  document.getElementById('verifyBtn')?.addEventListener('click', async () => {
    const code      = document.getElementById('verifyCodeInput').value.trim();
    const verifyBtn = document.getElementById('verifyBtn');

    if (!code || code.length < 8) {
      setFieldMsg(emailMsg, '8자리 인증 코드를 입력해 주세요.', '#e53e3e');
      return;
    }
    if (!currentEmail) {
      setFieldMsg(emailMsg, '먼저 인증 메일을 전송해 주세요.', '#e53e3e');
      return;
    }

    verifyBtn.disabled = true;
    setFieldMsg(emailMsg, '인증 코드 확인 중...', '#888');

    const { error } = await supabase.auth.verifyOtp({
      email: currentEmail,
      token: code,
      type:  'signup'
    });

    if (error) {
      verifyBtn.disabled = false;
      setFieldMsg(emailMsg, '인증 코드가 올바르지 않습니다.', '#e53e3e');
      console.error('[OTP 확인 오류]', error);
      return;
    }

    // ✅ 인증 완료
    clearInterval(timerInterval);
    isEmailVerified = true;

    verifyBtn.textContent = '완료';
    verifyBtn.classList.add('verified');
    document.getElementById('verifyCodeInput').disabled = true;
    document.getElementById('verifyTimer').textContent  = '';

    setFieldMsg(emailMsg, '이메일 인증이 완료되었습니다. ✓', '#22c55e');
  });

  // 숫자만 입력 허용
  document.getElementById('verifyCodeInput')?.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '');
  });

  // 엔터키로 확인
  document.getElementById('verifyCodeInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('verifyBtn')?.click();
  });


  // ===== 9. 비밀번호 유효성 검사 =====
  const password        = document.getElementById('password');
  const passwordConfirm = document.getElementById('passwordConfirm');

  function createMessage(inputEl, id) {
    let msg = document.getElementById(id);
    if (!msg) {
      msg = document.createElement('p');
      msg.id = id;
      msg.style.cssText = 'font-size:13px; margin-top:5px; display:flex; align-items:center;';
      inputEl.parentNode.insertBefore(msg, inputEl.nextSibling);
    }
    return msg;
  }

  function setMessage(msg, text, color, showIcon = true) {
    msg.innerHTML = text
      ? `${showIcon ? `<img src="/media/caution.png" alt="caution" style="width:14px;height:14px;margin-right:1px;margin-top:-2px;vertical-align:middle;">` : ''}${text}`
      : '';
    msg.style.color = color || '';
  }

  const PW_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

  password.addEventListener('input', () => {
    const msg = createMessage(password, 'pw-msg');
    if (password.value === '') { setMessage(msg, ''); return; }
    if (!PW_REGEX.test(password.value)) {
      setMessage(msg, '비밀번호는 8자 이상, 영문·숫자·특수문자를 모두 포함해야 합니다.', '#e53e3e');
    } else {
      setMessage(msg, '사용 가능한 비밀번호입니다.', '#0080ff', false);
    }
    if (passwordConfirm.value !== '') checkConfirm();
  });

  function checkConfirm() {
    const msg = createMessage(passwordConfirm, 'pw-confirm-msg');
    if (passwordConfirm.value === '') { setMessage(msg, ''); return; }
    if (password.value !== passwordConfirm.value) {
      setMessage(msg, '비밀번호가 일치하지 않습니다.', '#e53e3e');
    } else {
      setMessage(msg, '비밀번호가 일치합니다.', '#0080ff', false);
    }
  }

  passwordConfirm.addEventListener('input', checkConfirm);


  // ===== 10. 다음 버튼 유효성 검사 =====
  window.validateLogin2 = function() {
    let isValid = true;
    const email = getFullEmail();

    if (!email) {
      setFieldMsg(emailMsg, '이메일 주소를 입력해 주세요.', '#e53e3e');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldMsg(emailMsg, '올바른 이메일 형식이 아닙니다.', '#e53e3e');
      isValid = false;
    }

    if (!PW_REGEX.test(password.value)) {
      const msg = createMessage(password, 'pw-msg');
      setMessage(msg, '비밀번호는 8자 이상, 영문·숫자·특수문자를 모두 포함해야 합니다.', '#e53e3e');
      isValid = false;
    }

    if (password.value !== passwordConfirm.value) {
      const msg = createMessage(passwordConfirm, 'pw-confirm-msg');
      setMessage(msg, '비밀번호가 일치하지 않습니다.', '#e53e3e');
      isValid = false;
    }

    if (!isValid) return false;

    if (!isEmailVerified) {
      setFieldMsg(emailMsg, '이메일 인증을 완료해 주세요.', '#e53e3e');
      return false;
    }

    return true;
  };


  // ===== 11. 이전으로 돌아가기 =====
  document.getElementById('backBtn')?.addEventListener('click', () => {
    const result = confirm('페이지를 나가시겠습니까?\n입력한 내용이 저장되지 않습니다.');
    if (result) {
      clearInterval(timerInterval);
      window.location.href = '/login1/login1.html';
    }
  });

});