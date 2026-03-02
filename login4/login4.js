document.addEventListener("DOMContentLoaded", () => {

  // =============================
  // 툴 데이터
  // =============================
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

  const MAX_SELECT = 5;

  const toolGrid      = document.getElementById('toolGrid');
  const selectedIcons = document.getElementById('selectedIcons');
  const selectedCount = document.getElementById('selectedCount');
  const progressFill  = document.getElementById('progressFill');
  const finishBtn     = document.getElementById('finishBtn');

  let selectedTools = [];


  // =============================
  // 툴 그리드 렌더링
  // =============================
  function renderGrid() {
    toolGrid.innerHTML = '';

    TOOLS.forEach(tool => {
      const card = document.createElement('div');
      card.className = 'tool-icon-card';
      card.dataset.toolName = tool.name;

      card.innerHTML = `
        <span class="tool-icon-card__icon">
          <img src="${tool.img}" alt="${tool.name}"
               onerror="this.style.display='none'">
        </span>
        <span class="tool-icon-card__title">${tool.name}</span>
      `;

      if (selectedTools.includes(tool.name)) {
        card.classList.add('is-selected');
      }

      card.addEventListener('click', () => toggleTool(tool.name, card));
      toolGrid.appendChild(card);
    });

    updateMaxClass();
  }


  // =============================
  // 선택 / 해제
  // =============================
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


  // =============================
  // 선택된 툴 표시
  // =============================
  function renderSelected() {
    selectedIcons.innerHTML = '';

    selectedTools.forEach(name => {
      const tool = TOOLS.find(t => t.name === name);
      if (!tool) return;

      const card = document.createElement('div');
      card.className = 'tool-icon-card';

      card.innerHTML = `
        <span class="tool-icon-card__icon">
          <img src="${tool.img}" alt="${tool.name}"
               onerror="this.style.display='none'">
        </span>
        <span class="tool-icon-card__title">${tool.name}</span>
      `;

      selectedIcons.appendChild(card);
    });
  }


  // =============================
  // 카운트 + 프로그레스
  // =============================
  function updateCount() {
    const count = selectedTools.length;
    selectedCount.textContent = `${count}/${MAX_SELECT}`;
    progressFill.style.width = `${(count / MAX_SELECT) * 100}%`;
  }


  // =============================
  // 선택 완료
  // =============================
  finishBtn.addEventListener('click', () => {

    if (selectedTools.length === 0) {
      alert('최소 1개 이상의 툴을 선택해주세요.');
      return;
    }

    // 다음 페이지 이동
    window.location.href = '/login5/login5.html';
  });


  // =============================
  // 초기 렌더
  // =============================
  renderGrid();
  renderSelected();
  updateCount();

});