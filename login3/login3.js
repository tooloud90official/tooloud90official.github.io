// login3.js
import { JeonubSelect } from '/_common/select/select.js';

document.addEventListener("DOMContentLoaded", async () => {

  // ===== 1. 다음 버튼 렌더링 (login2와 동일한 구조) =====
  loadButton({
    target: "#signup-button",
    text: "다음",
    variant: "primary",
    size: "md",
    onClick: () => {
      if (window.validateLogin3?.()) {
        window.location.href = "/login4/login4.html";
      }
    }
  });


  // ===== 2. JeonubSelect 초기화 (login2와 동일한 방식) =====
  const jobSelect = new JeonubSelect('#job-select-wrap', {
    placeholder: '선택 해주세요'
  });

  const countrySelect = new JeonubSelect('#country-select-wrap', {
    placeholder: '선택 해주세요'
  });

  // 연도 목록 생성
  const currentYear = new Date().getFullYear();
  const yearUl = document.querySelector('#birth-year-wrap [data-select-menu]');
  for (let y = currentYear; y >= 1924; y--) {
    const li = document.createElement('li');
    li.className = 'select__option';
    li.setAttribute('data-select-option', '');
    li.setAttribute('data-value', String(y));
    li.setAttribute('role', 'option');
    li.textContent = `${y}년`;
    yearUl.appendChild(li);
  }

  // 월 목록 생성
  const monthUl = document.querySelector('#birth-month-wrap [data-select-menu]');
  for (let m = 1; m <= 12; m++) {
    const li = document.createElement('li');
    li.className = 'select__option';
    li.setAttribute('data-select-option', '');
    li.setAttribute('data-value', String(m));
    li.setAttribute('role', 'option');
    li.textContent = `${m}월`;
    monthUl.appendChild(li);
  }

  // 일 목록 생성 함수
  function buildDayOptions(year, month) {
    const dayUl = document.querySelector('#birth-day-wrap [data-select-menu]');
    dayUl.innerHTML = '';
    const days = new Date(year || 2000, month || 1, 0).getDate();
    for (let d = 1; d <= days; d++) {
      const li = document.createElement('li');
      li.className = 'select__option';
      li.setAttribute('data-select-option', '');
      li.setAttribute('data-value', String(d));
      li.setAttribute('role', 'option');
      li.textContent = `${d}일`;
      dayUl.appendChild(li);
    }
  }
  buildDayOptions(null, null);

  const yearSelect  = new JeonubSelect('#birth-year-wrap',  { placeholder: '연도' });
  const monthSelect = new JeonubSelect('#birth-month-wrap', { placeholder: '월' });
  const daySelect   = new JeonubSelect('#birth-day-wrap',   { placeholder: '일' });

  // 연도/월 변경 시 일 목록 갱신
  yearSelect.onChange = () => {
    const y = document.querySelector('#birth-year-wrap [data-select-trigger]')
                ?.getAttribute('data-value');
    const m = document.querySelector('#birth-month-wrap [data-select-trigger]')
                ?.getAttribute('data-value');
    buildDayOptions(y, m);
    new JeonubSelect('#birth-day-wrap', { placeholder: '일' });
  };
  monthSelect.onChange = () => {
    const y = document.querySelector('#birth-year-wrap [data-select-trigger]')
                ?.getAttribute('data-value');
    const m = document.querySelector('#birth-month-wrap [data-select-trigger]')
                ?.getAttribute('data-value');
    buildDayOptions(y, m);
    new JeonubSelect('#birth-day-wrap', { placeholder: '일' });
  };


  // ===== 3. 닉네임 중복 확인 =====
  const nicknameInput = document.getElementById('nickname');
  const nicknameMsg   = document.getElementById('nickname-msg');
  const checkBtn      = document.getElementById('check-duplicate-btn');
  let isNicknameChecked = false;

  const CAUTION_ICON = `<img src="/media/caution.png" alt="caution" style="width:14px;height:14px;margin-right:1px;margin-top:-2px;vertical-align:middle;">`;

  nicknameInput?.addEventListener('input', () => {
    isNicknameChecked = false;
    nicknameMsg.innerHTML = '';
  });

  checkBtn?.addEventListener('click', () => {
    const val = nicknameInput.value.trim();
    if (!val) {
      nicknameMsg.innerHTML = `${CAUTION_ICON}닉네임을 입력해주세요.`;
      nicknameMsg.style.color = '#e53e3e';
      return;
    }
    if (val.length < 2 || val.length > 12) {
      nicknameMsg.innerHTML = `${CAUTION_ICON}닉네임은 2자 이상 12자 이하로 입력해주세요.`;
      nicknameMsg.style.color = '#e53e3e';
      return;
    }
    isNicknameChecked = true;
    nicknameMsg.innerHTML = '사용 가능한 닉네임입니다.';
    nicknameMsg.style.color = '#38a169';
  });


  // ===== 4. 다음 버튼 유효성 검사 =====
  window.validateLogin3 = function() {
    if (!isNicknameChecked) {
      nicknameMsg.innerHTML = `${CAUTION_ICON}닉네임 중복 확인을 해주세요.`;
      nicknameMsg.style.color = '#e53e3e';
      return false;
    }
    return true;
  };


  // ===== 5. confirm 모달 초기화 =====
  if (!document.getElementById('modal-root')) {
    const root = document.createElement('div');
    root.id = 'modal-root';
    document.body.appendChild(root);
  }

  await window.includeHTML('#modal-root', '/_common/confirm/confirm.html');


  // ===== 6. 이전으로 돌아가기 (login2와 동일한 구조) =====
  document.getElementById('backBtn')?.addEventListener('click', async () => {
    const result = await window.showConfirm({
      title      : '페이지를 나가시겠습니까?',
      desc       : '입력한 내용이 저장되지 않습니다.',
      confirmText: '확인',
      cancelText : '취소',
    });
    if (result) {
      window.location.href = '/login2/login2.html';
    }
  });

});