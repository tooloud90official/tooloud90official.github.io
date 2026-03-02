// login2.js

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
      msg.textContent = ''; return;
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
      msg.textContent = ''; return;
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


  // ===== 다음 버튼 유효성 검사 =====
  window.validateLogin2 = function() {
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

    return isValid;
  };


  // ===== confirm 컴포넌트 초기화 =====
  if (!document.getElementById('modal-root')) {
    const root = document.createElement('div');
    root.id = 'modal-root';
    document.body.appendChild(root);
  }

  await window.includeHTML('#modal-root', '/_common/confirm/confirm.html');
  const confirmModal = new window.ConfirmModal();


  // ===== 이전으로 돌아가기 버튼 =====
  document.getElementById('backBtn')?.addEventListener('click', async () => {
    const result = await confirmModal.open({
      title: '페이지를 나가시겠습니까?',
      description: '입력한 내용이 저장되지 않습니다.',
      okText: '확인',
      cancelText: '취소',
    });
    if (result) {
      window.location.href = '/login1/login1.html';
    }
  });

});