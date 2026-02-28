// login2.js
// 경로: minju/js/login2.js

import { includeHTML } from '/_common/confirm/include.js';

document.addEventListener("DOMContentLoaded", async () => {

  // ===== 비밀번호 유효성 검사 =====

  const password        = document.getElementById('password');
  const passwordConfirm = document.getElementById('passwordConfirm');

  function createMessage(inputEl, id) {
    let msg = document.getElementById(id);
    if (!msg) {
      msg = document.createElement('p');
      msg.id = id;
      msg.style.cssText = 'font-size:13px; margin-top:5px;';
      inputEl.parentNode.insertBefore(msg, inputEl.nextSibling);
    }
    return msg;
  }

  const PW_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

  password.addEventListener('input', () => {
    const msg = createMessage(password, 'pw-msg');

    if (password.value === '') {
      msg.textContent = '';
      return;
    }

    if (!PW_REGEX.test(password.value)) {
      msg.textContent = '⚠️ 비밀번호는 8자 이상, 영문·숫자·특수문자(!@#$%^&*)를 모두 포함해야 합니다.';
      msg.style.color = '#e53e3e';
    } else {
      msg.textContent = '✅ 사용 가능한 비밀번호입니다.';
      msg.style.color = '#38a169';
    }

    if (passwordConfirm.value !== '') checkConfirm();
  });

  function checkConfirm() {
    const msg = createMessage(passwordConfirm, 'pw-confirm-msg');

    if (passwordConfirm.value === '') {
      msg.textContent = '';
      return;
    }

    if (password.value !== passwordConfirm.value) {
      msg.textContent = '⚠️ 비밀번호가 일치하지 않습니다.';
      msg.style.color = '#e53e3e';
    } else {
      msg.textContent = '✅ 비밀번호가 일치합니다.';
      msg.style.color = '#38a169';
    }
  }

  passwordConfirm.addEventListener('input', checkConfirm);


  // ===== 가입 버튼 클릭 시 최종 검사 =====

  document.getElementById('signupBtn')?.addEventListener('click', () => {
    let isValid = true;

    if (!PW_REGEX.test(password.value)) {
      const msg = createMessage(password, 'pw-msg');
      msg.textContent = '⚠️ 비밀번호는 8자 이상, 영문·숫자·특수문자(!@#$%^&*)를 모두 포함해야 합니다.';
      msg.style.color = '#e53e3e';
      isValid = false;
    }

    if (password.value !== passwordConfirm.value) {
      const msg = createMessage(passwordConfirm, 'pw-confirm-msg');
      msg.textContent = '⚠️ 비밀번호가 일치하지 않습니다.';
      msg.style.color = '#e53e3e';
      isValid = false;
    }

    if (!isValid) return;

    console.log('회원가입 진행');
  });


  // ===== confirm 컴포넌트 초기화 =====

  async function initConfirm() {
    if (!document.getElementById('modal-root')) {
      const root = document.createElement('div');
      root.id = 'modal-root';
      document.body.appendChild(root);
    }

    await includeHTML('#modal-root', '/_common/confirm/confirm.html');

    const modal     = document.querySelector('[data-confirm-modal]');
    const dialog    = modal.querySelector('.confirm-modal__dialog');
    const btnCancel = modal.querySelector('[data-confirm-cancel]');
    const btnOk     = modal.querySelector('[data-confirm-ok]');
    const backdrop  = modal.querySelector('[data-confirm-close]');

    function openConfirm() {
      modal.querySelector('[data-confirm-title]').textContent = '페이지를 나가시겠습니까?';
      modal.querySelector('[data-confirm-desc]').textContent  = '입력한 내용이 저장되지 않습니다.';
      modal.hidden = false;
      modal.setAttribute('aria-hidden', 'false');
      dialog.focus();
    }

    function closeConfirm() {
      modal.hidden = true;
      modal.setAttribute('aria-hidden', 'true');
    }

    btnCancel.addEventListener('click', closeConfirm);
    backdrop.addEventListener('click', closeConfirm);

    // ✅ 여기 수정됨
    btnOk.addEventListener('click', () => {
      closeConfirm();
      window.location.href = '/login1/login1.html';
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.hidden) closeConfirm();
    });

    return openConfirm;
  }


  // ===== 이전으로 돌아가기 버튼 =====

  const backLink = document.querySelector('.back-link');
  backLink.removeAttribute('onclick');

  const openConfirm = await initConfirm();
  backLink.addEventListener('click', openConfirm);

});