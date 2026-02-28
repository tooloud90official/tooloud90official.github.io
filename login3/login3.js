// login3.js
import { includeHTML } from '../common/confirm/include.js';
import { JeonubSelect } from '../common/select/select.js';

document.addEventListener("DOMContentLoaded", async () => {

  // ===== JeonubSelect 초기화 =====

  const jobSelect = new JeonubSelect('#job-select-wrap', {
    placeholder: '선택 해주세요'
  });

  const countrySelect = new JeonubSelect('#country-select-wrap', {
    placeholder: '선택 해주세요'
  });

  // 연도 옵션 동적 생성
  const currentYear = new Date().getFullYear();
  const yearItems = [];
  for (let y = currentYear; y >= 1924; y--) {
    yearItems.push({ label: `${y}년`, value: String(y) });
  }
  const yearSelect = new JeonubSelect('#birth-year-wrap', {
    placeholder: '선택',
    items: yearItems
  });

  // 월 옵션
  const monthItems = Array.from({ length: 12 }, (_, i) => ({
    label: `${i + 1}월`, value: String(i + 1)
  }));
  const monthSelect = new JeonubSelect('#birth-month-wrap', {
    placeholder: '선택',
    items: monthItems
  });

  // 일 옵션 (기본 31일)
  function getDayItems(year, month) {
    const days = new Date(year || 2000, month || 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => ({
      label: `${i + 1}일`, value: String(i + 1)
    }));
  }

  const daySelect = new JeonubSelect('#birth-day-wrap', {
    placeholder: '선택',
    items: getDayItems(null, null)
  });

  // 연도/월 변경 시 일 옵션 업데이트
  yearSelect.onChange = () => {
    const y = yearSelect.getValue()?.value;
    const m = monthSelect.getValue()?.value;
    daySelect.setOptions(getDayItems(y, m));
  };
  monthSelect.onChange = () => {
    const y = yearSelect.getValue()?.value;
    const m = monthSelect.getValue()?.value;
    daySelect.setOptions(getDayItems(y, m));
  };


  // ===== 닉네임 중복 확인 =====

  const nicknameInput = document.getElementById('nickname');
  const nicknameMsg   = document.getElementById('nickname-msg');
  let isNicknameChecked = false;

  nicknameInput.addEventListener('input', () => {
    isNicknameChecked = false;
    nicknameMsg.textContent = '';
  });

  document.getElementById('check-duplicate-btn').addEventListener('click', () => {
    const val = nicknameInput.value.trim();

    if (!val) {
      nicknameMsg.textContent = '⚠️ 닉네임을 입력해주세요.';
      nicknameMsg.style.color = '#e53e3e';
      return;
    }
    if (val.length < 2 || val.length > 12) {
      nicknameMsg.textContent = '⚠️ 닉네임은 2자 이상 12자 이하로 입력해주세요.';
      nicknameMsg.style.color = '#e53e3e';
      return;
    }

    // TODO: 실제 서버 중복 확인 API 연동
    isNicknameChecked = true;
    nicknameMsg.textContent = '✅ 사용 가능한 닉네임입니다.';
    nicknameMsg.style.color = '#38a169';
  });


  // ===== confirm 컴포넌트 초기화 =====

  async function initConfirm() {
    if (!document.getElementById('modal-root')) {
      const root = document.createElement('div');
      root.id = 'modal-root';
      document.body.appendChild(root);
    }

    await includeHTML('#modal-root', '../../common/confirm/confirm.html');

    const modal     = document.querySelector('[data-confirm-modal]');
    const dialog    = modal.querySelector('.confirm-modal__dialog');
    const btnCancel = modal.querySelector('[data-confirm-cancel]');
    const backdrop  = modal.querySelector('[data-confirm-close]');

    function openConfirm({ title, desc, onOk }) {
      modal.querySelector('[data-confirm-title]').textContent = title;
      modal.querySelector('[data-confirm-desc]').textContent  = desc;
      modal.hidden = false;
      modal.setAttribute('aria-hidden', 'false');
      dialog.focus();

      const btnOk = modal.querySelector('[data-confirm-ok]');
      const newOk = btnOk.cloneNode(true);
      btnOk.parentNode.replaceChild(newOk, btnOk);
      newOk.addEventListener('click', () => { closeConfirm(); onOk(); });
    }

    function closeConfirm() {
      modal.hidden = true;
      modal.setAttribute('aria-hidden', 'true');
    }

    btnCancel.addEventListener('click', closeConfirm);
    backdrop.addEventListener('click', closeConfirm);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.hidden) closeConfirm();
    });

    return openConfirm;
  }

  const openConfirm = await initConfirm();


  // ===== 취소 버튼 =====

  document.getElementById('cancel-btn').addEventListener('click', () => {
    openConfirm({
      title: '입력을 취소하시겠습니까?',
      desc:  '입력한 내용이 저장되지 않습니다.',
      onOk:  () => history.back()
    });
  });


  // ===== 확인 버튼 유효성 검사 =====

  document.getElementById('additional-info-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const nickname = nicknameInput.value.trim();
    const job      = jobSelect.getValue();
    const year     = yearSelect.getValue();
    const month    = monthSelect.getValue();
    const day      = daySelect.getValue();
    const country  = countrySelect.getValue();

    if (!nickname) {
      nicknameMsg.textContent = '⚠️ 닉네임을 입력해주세요.';
      nicknameMsg.style.color = '#e53e3e';
      return;
    }
    if (!isNicknameChecked) {
      nicknameMsg.textContent = '⚠️ 닉네임 중복 확인을 해주세요.';
      nicknameMsg.style.color = '#e53e3e';
      return;
    }
    if (!job)     { alert('직군을 선택해주세요.'); return; }
    if (!year || !month || !day) { alert('생년월일을 모두 선택해주세요.'); return; }
    if (!country) { alert('국가를 선택해주세요.'); return; }

    // ✅ 유효성 통과
    console.log('추가 정보 입력 완료', { nickname, job, year, month, day, country });
    // TODO: 다음 페이지로 이동
  });

}); // DOMContentLoaded 끝