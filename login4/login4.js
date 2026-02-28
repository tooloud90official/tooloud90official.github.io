// login4.js
// 경로: minju/login4/login4.js

import { includeHTML } from '../common/confirm/include.js';

document.addEventListener("DOMContentLoaded", async () => {

  // ===== 툴 데이터 =====
  const TOOLS = [
    { name: 'Descript',   img: 'https://logo.clearbit.com/descript.com' },
    { name: 'Adobe',      img: 'https://logo.clearbit.com/adobe.com' },
    { name: 'Midjourney', img: 'https://logo.clearbit.com/midjourney.com' },
    { name: 'Lilys',      img: 'https://logo.clearbit.com/lilys.ai' },
    { name: 'Cursor',     img: 'https://logo.clearbit.com/cursor.sh' },
    { name: 'Pitch',      img: 'https://logo.clearbit.com/pitch.com' },
    { name: 'Notion',     img: 'https://logo.clearbit.com/notion.so' },
    { name: 'Figma',      img: 'https://logo.clearbit.com/figma.com' },
    { name: 'ChatGPT',    img: 'https://logo.clearbit.com/openai.com' },
  ];

  const MAX_SELECT   = 5;
  const toolGrid     = document.getElementById('toolGrid');
  const selectedIcons = document.getElementById('selectedIcons');
  const selectedCount = document.getElementById('selectedCount');
  const progressFill  = document.getElementById('progressFill');
  const finishBtn     = document.getElementById('finishBtn');

  let selectedTools = [];


  // ===== 툴 그리드 렌더링 =====
  function renderGrid() {
    toolGrid.innerHTML = '';
    TOOLS.forEach(tool => {
      const card = document.createElement('div');
      card.className = 'tool-icon-card';
      card.dataset.toolName = tool.name;
      card.innerHTML = `
        <span class="tool-icon-card__icon">
          <img src="${tool.img}" alt="${tool.name}" onerror="this.style.display='none'">
        </span>
        <span class="tool-icon-card__title">${tool.name}</span>
      `;
      if (selectedTools.includes(tool.name)) card.classList.add('is-selected');
      card.addEventListener('click', () => toggleTool(tool.name, card));
      toolGrid.appendChild(card);
    });
    updateMaxClass();
  }


  // ===== 툴 선택/해제 토글 =====
  function toggleTool(name, cardEl) {
    const isSelected = selectedTools.includes(name);
    if (isSelected) {
      selectedTools = selectedTools.filter(t => t !== name);
      cardEl.classList.remove('is-selected');
    } else {
      if (selectedTools.length >= MAX_SELECT) return;
      selectedTools.push(name);
      cardEl.classList.add('is-selected');
    }
    updateMaxClass();
    renderSelected();
    updateCount();
  }

  function updateMaxClass() {
    toolGrid.classList.toggle('is-max', selectedTools.length >= MAX_SELECT);
  }


  // ===== 선택된 툴 영역 렌더링 =====
  function renderSelected() {
    selectedIcons.innerHTML = '';
    selectedTools.forEach(name => {
      const tool = TOOLS.find(t => t.name === name);
      if (!tool) return;
      const card = document.createElement('div');
      card.className = 'tool-icon-card';
      card.innerHTML = `
        <span class="tool-icon-card__icon">
          <img src="${tool.img}" alt="${tool.name}" onerror="this.style.display='none'">
        </span>
        <span class="tool-icon-card__title">${tool.name}</span>
      `;
      selectedIcons.appendChild(card);
    });
  }


  // ===== 카운트 & 프로그레스 바 =====
  function updateCount() {
    const count = selectedTools.length;
    selectedCount.textContent = `${count}/${MAX_SELECT}`;
    progressFill.style.width = `${(count / MAX_SELECT) * 100}%`;
  }


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

    function openConfirm({ title, desc, onOk, hideCancelBtn = false }) {
      modal.querySelector('[data-confirm-title]').textContent = title;
      modal.querySelector('[data-confirm-desc]').textContent  = desc;

      // 취소 버튼 숨기기 옵션 (회원가입 완료 팝업은 확인만 있으면 됨)
      btnCancel.style.display = hideCancelBtn ? 'none' : '';

      modal.hidden = false;
      modal.setAttribute('aria-hidden', 'false');
      dialog.focus();

      // 확인 버튼 콜백 교체
      const btnOk = modal.querySelector('[data-confirm-ok]');
      const newOk = btnOk.cloneNode(true);
      btnOk.parentNode.replaceChild(newOk, btnOk);
      newOk.addEventListener('click', () => {
        closeConfirm();
        if (typeof onOk === 'function') onOk();
      });
    }

    function closeConfirm() {
      modal.hidden = true;
      modal.setAttribute('aria-hidden', 'true');
      btnCancel.style.display = ''; // 숨김 초기화
    }

    btnCancel.addEventListener('click', closeConfirm);
    backdrop.addEventListener('click', closeConfirm);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.hidden) closeConfirm();
    });

    return openConfirm;
  }

  const openConfirm = await initConfirm();


  // ===== 선택 마치기 버튼 =====
  finishBtn.addEventListener('click', () => {
    if (selectedTools.length === 0) {
      alert('최소 1개 이상의 툴을 선택해주세요.');
      return;
    }

    // ✅ 회원가입 완료 팝업
    openConfirm({
      title: '회원 가입이 완료 되었습니다.',
      desc:  '',
      hideCancelBtn: true,  // 취소 버튼 숨김
      onOk: () => {
        // TODO: 메인 페이지로 이동
        // window.location.href = '/index.html';
        console.log('회원가입 완료:', selectedTools);
      }
    });
  });


  // ===== 초기 렌더링 =====
  renderGrid();
  renderSelected();
  updateCount();

}); // DOMContentLoaded 끝