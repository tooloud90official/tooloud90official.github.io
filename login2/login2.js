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

  // 전송 상태 초기화
  let pollingInterval = null;
  let isEmailVerified = false;

  function resetSendState() {
    clearInterval(pollingInterval);
    isEmailVerified = false;
    sessionStorage.removeItem('signup_email');
    sessionStorage.removeItem('signup_password');
    setFieldMsg(emailMsg, '', '');
    const btn = document.getElementById('sendCodeBtn');
    if (btn) { btn.disabled = false; btn.textContent = '인증 메일 전송'; }
  }

  document.getElementById('emailId')?.addEventListener('input', resetSendState);


  // ===== 4. 인증 메일 전송 + 폴링 =====
  document.getElementById('sendCodeBtn')?.addEventListener('click', async () => {
    const email = getFullEmail();
    const btn   = document.getElementById('sendCodeBtn');
    const pw    = document.getElementById('password').value;

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

    btn.disabled = true;
    setFieldMsg(emailMsg, '인증 메일을 전송 중입니다...', '#888');

    // ⭐ emailRedirectTo 추가
    const { error } = await supabase.auth.signUp({
      email,
      password: pw,
      options: {
        emailRedirectTo: `http://127.0.0.1:5500/login3/login3.html`
      }
    });

    if (error) {
      btn.disabled = false;
      if (error.message?.includes('already registered')) {
        setFieldMsg(emailMsg, '이미 사용 중인 이메일입니다.', '#e53e3e');
      } else {
        setFieldMsg(emailMsg, '전송에 실패했습니다. 다시 시도해 주세요.', '#e53e3e');
        console.error('[signUp 오류]', error);
      }
      return;
    }

    btn.textContent = '전송 완료';
    setFieldMsg(emailMsg, `${email} 로 인증 메일을 전송했습니다. 메일함을 확인해 주세요.`, '#0080ff');

    sessionStorage.setItem('signup_email',    email);
    sessionStorage.setItem('signup_password', pw);

    // ── 폴링 시작: 3초마다 인증 여부 체크 ──────────────────
    clearInterval(pollingInterval);
    pollingInterval = setInterval(async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      if (user?.email_confirmed_at) {
        clearInterval(pollingInterval);
        isEmailVerified = true;
        setFieldMsg(emailMsg, '이메일 인증이 완료되었습니다.', '#0080ff');
      }
    }, 3000);
  });


  // ===== 5. 비밀번호 유효성 검사 =====
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


  // ===== 6. 다음 버튼 유효성 검사 =====
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

    // 인증 완료 여부 체크
    if (!isEmailVerified) {
      setFieldMsg(emailMsg, '이메일 인증을 완료해 주세요.', '#e53e3e');
      return false;
    }

    return true;
  };


  // ===== 7. confirm 모달 초기화 =====
  if (!document.getElementById('modal-root')) {
    const root = document.createElement('div');
    root.id = 'modal-root';
    document.body.appendChild(root);
  }

  await window.includeHTML('#modal-root', '/_common/confirm/confirm.html');


  // ===== 8. 이전으로 돌아가기 =====
  document.getElementById('backBtn')?.addEventListener('click', async () => {
    const result = await window.showConfirm({
      title      : '페이지를 나가시겠습니까?',
      desc       : '입력한 내용이 저장되지 않습니다.',
      confirmText: '확인',
      cancelText : '취소',
    });
    if (result) {
      clearInterval(pollingInterval);
      window.location.href = '/login1/login1.html';
    }
  });

});