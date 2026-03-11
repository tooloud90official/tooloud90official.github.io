// login2.js
import { loadNativeSelect } from '/_common/select/select.js';

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


  // ===== 2. 이메일 도메인 셀렉트 (loadNativeSelect) =====
  await loadNativeSelect({
    target: '#emailDomainSelect',
    placeholder: '이메일 주소 선택',
    options: [
      { value: 'gmail.com',   label: 'gmail.com' },
      { value: 'naver.com',   label: 'naver.com' },
      { value: 'icloud.com',  label: 'icloud.com' },
      { value: 'direct',      label: '직접 입력' },
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
    }
  });


  // ===== 3. 비밀번호 유효성 검사 =====
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
      setMessage(msg, '사용 가능한 비밀번호입니다.', '#38a169', false);
    }
    if (passwordConfirm.value !== '') checkConfirm();
  });

  function checkConfirm() {
    const msg = createMessage(passwordConfirm, 'pw-confirm-msg');
    if (passwordConfirm.value === '') { setMessage(msg, ''); return; }
    if (password.value !== passwordConfirm.value) {
      setMessage(msg, '비밀번호가 일치하지 않습니다.', '#e53e3e');
    } else {
      setMessage(msg, '비밀번호가 일치합니다.', '#38a169', false);
    }
  }

  passwordConfirm.addEventListener('input', checkConfirm);


  // ===== 4. 다음 버튼 유효성 검사 함수 =====
  window.validateLogin2 = function() {
    let isValid = true;

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

    return isValid;
  };


  // ===== 5. confirm 모달 초기화 =====
  if (!document.getElementById('modal-root')) {
    const root = document.createElement('div');
    root.id = 'modal-root';
    document.body.appendChild(root);
  }

  await window.includeHTML('#modal-root', '/_common/confirm/confirm.html');


  // ===== 6. 이전으로 돌아가기 =====
  document.getElementById('backBtn')?.addEventListener('click', async () => {
    const result = await window.showConfirm({
      title      : '페이지를 나가시겠습니까?',
      desc       : '입력한 내용이 저장되지 않습니다.',
      confirmText: '확인',
      cancelText : '취소',
    });
    if (result) {
      window.location.href = '/login1/login1.html';
    }
  });

});