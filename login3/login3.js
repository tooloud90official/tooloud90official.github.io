import { JeonubSelect } from '/_common/select/select.js';

document.addEventListener("DOMContentLoaded", async () => {

  // =============================
  // select 안전 초기화
  // =============================

  function safeSelect(selector, options) {
    const el = document.querySelector(selector);
    if (!el) return null;
    return new JeonubSelect(selector, options);
  }

  const jobSelect = safeSelect('#job-select-wrap', {
    placeholder: '선택 해주세요'
  });

  const countrySelect = safeSelect('#country-select-wrap', {
    placeholder: '선택 해주세요'
  });

  const currentYear = new Date().getFullYear();
  const yearItems = [];
  for (let y = currentYear; y >= 1924; y--) {
    yearItems.push({ label: `${y}년`, value: String(y) });
  }

  const yearSelect = safeSelect('#birth-year-wrap', {
    placeholder: '선택',
    items: yearItems
  });

  const monthItems = Array.from({ length: 12 }, (_, i) => ({
    label: `${i + 1}월`, value: String(i + 1)
  }));

  const monthSelect = safeSelect('#birth-month-wrap', {
    placeholder: '선택',
    items: monthItems
  });

  function getDayItems(year, month) {
    const days = new Date(year || 2000, month || 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => ({
      label: `${i + 1}일`, value: String(i + 1)
    }));
  }

  const daySelect = safeSelect('#birth-day-wrap', {
    placeholder: '선택',
    items: getDayItems(null, null)
  });

  if (yearSelect && monthSelect && daySelect) {
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
  }

  // =============================
  // 닉네임 중복 확인
  // =============================

  const nicknameInput = document.getElementById('nickname');
  const nicknameMsg   = document.getElementById('nickname-msg');
  const checkBtn      = document.getElementById('check-duplicate-btn');

  let isNicknameChecked = false;

  if (nicknameInput && nicknameMsg && checkBtn) {

    nicknameInput.addEventListener('input', () => {
      isNicknameChecked = false;
      nicknameMsg.textContent = '';
    });

    checkBtn.addEventListener('click', () => {
      const val = nicknameInput.value.trim();

      if (!val) {
        nicknameMsg.textContent = '⚠️ 닉네임을 입력해주세요.';
        nicknameMsg.style.color = '#e53e3e';
        return;
      }

      if (val.length < 2 || val.length > 12) {
        nicknameMsg.textContent = '⚠️ 닉네임은 2자 이상 12자 이하';
        nicknameMsg.style.color = '#e53e3e';
        return;
      }

      isNicknameChecked = true;
      nicknameMsg.textContent = '✅ 사용 가능한 닉네임입니다.';
      nicknameMsg.style.color = '#38a169';
    });
  }

  // =============================
  // confirm 초기화
  // =============================

  async function initConfirm() {
    if (!document.getElementById('modal-root')) {
      const root = document.createElement('div');
      root.id = 'modal-root';
      document.body.appendChild(root);
    }

    await window.includeHTML('#modal-root', '/_common/confirm/confirm.html');

    const modal = document.querySelector('[data-confirm-modal]');
    const dialog = modal.querySelector('.confirm-modal__dialog');

    function openConfirm({ title, desc, onOk }) {

      modal.querySelector('[data-confirm-title]').textContent = title;
      modal.querySelector('[data-confirm-desc]').textContent = desc;

      modal.hidden = false;
      modal.setAttribute('aria-hidden', 'false');
      dialog.focus();

      const btnCancel = modal.querySelector('[data-confirm-cancel]');
      const btnClose  = modal.querySelector('[data-confirm-close]');
      const btnOk     = modal.querySelector('[data-confirm-ok]');

      const close = () => {
        modal.hidden = true;
        modal.setAttribute('aria-hidden', 'true');
      };

      btnCancel.onclick = close;
      btnClose.onclick  = close;

      btnOk.onclick = () => {
        close();
        onOk?.();
      };

      document.onkeydown = (e) => {
        if (e.key === 'Escape') close();
      };
    }

    return openConfirm;
  }

  const openConfirm = await initConfirm();

  // =============================
  // 취소 버튼
  // =============================

  document.getElementById('cancel-btn')?.addEventListener('click', () => {
    openConfirm({
      title: '입력을 취소하시겠습니까?',
      desc: '입력한 내용이 저장되지 않습니다.',
      onOk: () => history.back()
    });
  });

  // =============================
  // 확인 (폼 제출 제어 핵심)
  // =============================

  const form = document.getElementById('additional-info-form');

  form?.addEventListener('submit', (e) => {
    e.preventDefault();   // ⭐ 페이지 새로고침 방지 (핵심)
    location.href = '/login4/login4.html'; 
  });
});