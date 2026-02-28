// main2.js
// 경로: minju/main2/main2.js

document.addEventListener("DOMContentLoaded", async () => {

  // ===== 검색바 초기화 =====
  loadSearchBar({
    target: '#searchbar-container',
    placeholder: '검색어를 입력하세요',
    onSearch: (value) => {
      console.log('검색어:', value);
      // TODO: 검색 결과 페이지로 이동
    }
  });


  // ===== AI 추천 툴 데이터 (로그인 후 개인 맞춤) =====
  const RECOMMEND_TOOLS = [
    { name: 'Chat GPT',   img: 'https://logo.clearbit.com/openai.com' },
    { name: 'Claude',     img: 'https://logo.clearbit.com/anthropic.com' },
    { name: 'Gemini',     img: 'https://logo.clearbit.com/gemini.google.com' },
    { name: 'ElevenLabs', img: 'https://logo.clearbit.com/elevenlabs.io' },
    { name: 'Midjourney', img: 'https://logo.clearbit.com/midjourney.com' },
    { name: 'Gamma',      img: 'https://logo.clearbit.com/gamma.app' },
    { name: 'Perplexity', img: 'https://logo.clearbit.com/perplexity.ai' },
    { name: 'Descript',   img: 'https://logo.clearbit.com/descript.com' },
  ];


  // ===== 카테고리별 작업물 데이터 =====
  const WORK_DATA = {
    image: {
      img: './media/work-image.png',
      tool: { name: 'Midjourney', img: 'https://logo.clearbit.com/midjourney.com' },
      stars: '★★★★☆'
    },
    research: {
      img: './media/work-research.png',
      tool: { name: 'Perplexity AI', img: 'https://logo.clearbit.com/perplexity.ai' },
      stars: '★★★★★'
    },
    document: {
      img: './media/work-document.png',
      tool: { name: 'Notion AI', img: 'https://logo.clearbit.com/notion.so' },
      stars: '★★★★☆'
    },
    dev: {
      img: './media/work-dev.png',
      tool: { name: 'Cursor', img: 'https://logo.clearbit.com/cursor.sh' },
      stars: '★★★★★'
    },
    edu: {
      img: './media/work-edu.png',
      tool: { name: 'Gamma', img: 'https://logo.clearbit.com/gamma.app' },
      stars: '★★★★☆'
    },
    chat: {
      img: './media/work-chat.png',
      tool: { name: 'ChatGPT', img: 'https://logo.clearbit.com/openai.com' },
      stars: '★★★★★'
    },
  };


  // ===== 카테고리별 툴 데이터 =====
  const TOOLS_DATA = {
    image: [
      { name: 'Midjourney',    img: 'https://logo.clearbit.com/midjourney.com' },
      { name: 'Gamma',         img: 'https://logo.clearbit.com/gamma.app' },
      { name: 'Perplexity AI', img: 'https://logo.clearbit.com/perplexity.ai' },
      { name: 'Pitch',         img: 'https://logo.clearbit.com/pitch.com' },
      { name: 'Adobe',         img: 'https://logo.clearbit.com/adobe.com' },
      { name: 'Canva',         img: 'https://logo.clearbit.com/canva.com' },
    ],
    research: [
      { name: 'Chat GPT',      img: 'https://logo.clearbit.com/openai.com' },
      { name: 'Claude',        img: 'https://logo.clearbit.com/anthropic.com' },
      { name: 'Gemini',        img: 'https://logo.clearbit.com/gemini.google.com' },
      { name: 'Canva',         img: 'https://logo.clearbit.com/canva.com' },
      { name: 'Perplexity AI', img: 'https://logo.clearbit.com/perplexity.ai' },
      { name: 'Notion',        img: 'https://logo.clearbit.com/notion.so' },
    ],
    document: [
      { name: 'Midjourney',    img: 'https://logo.clearbit.com/midjourney.com' },
      { name: 'Gamma',         img: 'https://logo.clearbit.com/gamma.app' },
      { name: 'Perplexity AI', img: 'https://logo.clearbit.com/perplexity.ai' },
      { name: 'Pitch',         img: 'https://logo.clearbit.com/pitch.com' },
      { name: 'Notion',        img: 'https://logo.clearbit.com/notion.so' },
      { name: 'Adobe',         img: 'https://logo.clearbit.com/adobe.com' },
    ],
    dev: [
      { name: 'Chat GPT',  img: 'https://logo.clearbit.com/openai.com' },
      { name: 'Claude',    img: 'https://logo.clearbit.com/anthropic.com' },
      { name: 'Cursor',    img: 'https://logo.clearbit.com/cursor.sh' },
      { name: 'Canva',     img: 'https://logo.clearbit.com/canva.com' },
      { name: 'Gemini',    img: 'https://logo.clearbit.com/gemini.google.com' },
      { name: 'Notion',    img: 'https://logo.clearbit.com/notion.so' },
    ],
    edu: [
      { name: 'Midjourney',    img: 'https://logo.clearbit.com/midjourney.com' },
      { name: 'Gamma',         img: 'https://logo.clearbit.com/gamma.app' },
      { name: 'Perplexity AI', img: 'https://logo.clearbit.com/perplexity.ai' },
      { name: 'Pitch',         img: 'https://logo.clearbit.com/pitch.com' },
      { name: 'Notion',        img: 'https://logo.clearbit.com/notion.so' },
      { name: 'Adobe',         img: 'https://logo.clearbit.com/adobe.com' },
    ],
    chat: [
      { name: 'Chat GPT',  img: 'https://logo.clearbit.com/openai.com' },
      { name: 'Claude',    img: 'https://logo.clearbit.com/anthropic.com' },
      { name: 'Gemini',    img: 'https://logo.clearbit.com/gemini.google.com' },
      { name: 'Canva',     img: 'https://logo.clearbit.com/canva.com' },
      { name: 'Notion',    img: 'https://logo.clearbit.com/notion.so' },
      { name: 'Descript',  img: 'https://logo.clearbit.com/descript.com' },
    ],
  };

  const CATEGORY_LABELS = {
    image:    '이미지·오디오·영상 AI 툴',
    research: '리서치 AI 툴',
    document: '문서 생성·요약·편집 AI 툴',
    dev:      '개발·코딩 AI 툴',
    edu:      '학습·교육 AI 툴',
    chat:     '챗봇·어시스턴트 AI 툴',
  };


  // ===== AI 추천 툴 렌더링 =====
  function renderRecommend() {
    const grid = document.getElementById('recommendGrid');
    if (!grid) return;
    grid.innerHTML = '';
    RECOMMEND_TOOLS.forEach(tool => {
      const card = document.createElement('div');
      card.className = 'tool-icon-card';
      card.innerHTML = `
        <span class="tool-icon-card__icon">
          <img src="${tool.img}" alt="${tool.name}" onerror="this.style.display='none'">
        </span>
        <span class="tool-icon-card__title">${tool.name}</span>
      `;
      card.addEventListener('click', () => {
        console.log('툴 클릭:', tool.name);
      });
      grid.appendChild(card);
    });
  }


  // ===== 작업물 카드 렌더링 =====
  function renderWorkCard(category) {
    const data   = WORK_DATA[category];
    const imgEl  = document.getElementById('workCardImg');
    const toolEl = document.getElementById('workCardTool');
    if (!data) return;

    if (imgEl) {
      imgEl.src = data.img;
      imgEl.onerror = () => {
        imgEl.parentElement.style.background = '#e8eef5';
        imgEl.style.display = 'none';
      };
      imgEl.style.display = 'block';
    }

    if (toolEl) {
      toolEl.innerHTML = `
        <div class="tool-icon-card">
          <span class="tool-icon-card__icon">
            <img src="${data.tool.img}" alt="${data.tool.name}"
              onerror="this.style.display='none'">
          </span>
          <span class="tool-icon-card__title">${data.tool.name}</span>
        </div>
        <div class="work-card__stars">${data.stars}</div>
        <button type="button" class="btn-more">툴 더 알아보기</button>
      `;
    }
  }


  // ===== 툴 그리드 렌더링 =====
  function renderTools(category) {
    const toolsSection = document.getElementById('toolsSection');
    toolsSection.innerHTML = '';

    const categories = category === 'all'
      ? Object.keys(TOOLS_DATA)
      : [category];

    categories.forEach(cat => {
      const tools = TOOLS_DATA[cat];
      if (!tools) return;

      const group = document.createElement('div');
      group.className = 'tool-category-group';

      const label = document.createElement('p');
      label.className = 'tool-category-label';
      label.textContent = CATEGORY_LABELS[cat];

      const grid = document.createElement('div');
      grid.className = 'tool-grid';

      tools.forEach(tool => {
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
        card.addEventListener('click', () => {
          console.log('툴 클릭:', tool.name);
        });
        grid.appendChild(card);
      });

      group.appendChild(label);
      group.appendChild(grid);
      toolsSection.appendChild(group);
    });
  }


  // ===== 카테고리 탭 클릭 =====
  document.getElementById('categoryTabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.category-tab');
    if (!tab) return;

    document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('is-active'));
    tab.classList.add('is-active');

    const category = tab.dataset.category;
    renderWorkCard(category);
    renderTools('all');
  });


  // ===== 초기 렌더링 =====
  renderRecommend();
  renderWorkCard('image');
  renderTools('all');


  // ===== top-banner auth 영역 → 종 아이콘 + 로그아웃으로 교체 =====
  setTimeout(async () => {
    const authBtn = document.getElementById('authBtn');
    if (authBtn) {
      authBtn.innerHTML = `
        <div class="bell-wrapper" id="bellBtn">
          <svg class="auth-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="1.8"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span class="bell-badge hidden">0</span>
        </div>
        <span>로그아웃</span>
      `;
    }

    // alert-root 생성
    if (!document.getElementById('alert-root')) {
      const root = document.createElement('div');
      root.id = 'alert-root';
      document.body.appendChild(root);
    }

    // alert 컴포넌트 초기화
    if (typeof initAlert === 'function') {
      await initAlert({
        triggerSelector: '#bellBtn',
        mountSelector: '#alert-root',
        alerts: [
          { type: 'like',    title: '좋아요 알림',      desc: '민주님이 회원님의 작업물에 좋아요를 눌렀어요.', href: '#' },
          { type: 'message', title: '1:1 문의사항 알림', desc: '회원님의 문의사항에 답글이 달렸어요.',          href: '#' },
          { type: 'like',    title: '좋아요 알림',      desc: '민주님이 회원님의 작업물에 좋아요를 눌렀어요.', href: '#' },
          { type: 'like',    title: '좋아요 알림',      desc: '민주님이 회원님의 작업물에 좋아요를 눌렀어요.', href: '#' },
        ]
      });
    }

  }, 300);

}); // DOMContentLoaded 끝