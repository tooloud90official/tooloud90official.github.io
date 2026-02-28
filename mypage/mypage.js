// mypage.js
// 경로: minju/mypage/mypage.js

import { initFaqItems } from '../common/drop_down/drop_down.js';

document.addEventListener('DOMContentLoaded', async () => {

  // ===== top-banner auth 교체 (로그인 후 버전) =====
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

    if (typeof initAlert === 'function') {
      await initAlert({
        triggerSelector: '#bellBtn',
        mountSelector: '#alert-root',
        alerts: [
          { type: 'like',    title: '좋아요 알림',      desc: '민주님이 작업물에 좋아요를 눌렀어요.', href: '#' },
          { type: 'message', title: '1:1 문의사항 알림', desc: '문의사항에 답글이 달렸어요.',          href: '#' },
          { type: 'like',    title: '좋아요 알림',      desc: '민주님이 작업물에 좋아요를 눌렀어요.', href: '#' },
        ]
      });
    }
  }, 300);


  // ===== 데이터 =====
  const RECENT_TOOLS = [
    { name: 'Framer',     img: 'https://logo.clearbit.com/framer.com' },
    { name: 'Notion',     img: 'https://logo.clearbit.com/notion.so' },
    { name: 'Figma',      img: 'https://logo.clearbit.com/figma.com' },
  ];

  const AI_TOOLS = [
    { name: 'Notion',     img: 'https://logo.clearbit.com/notion.so' },
    { name: 'Claude',     img: 'https://logo.clearbit.com/anthropic.com' },
    { name: 'Gamma',      img: 'https://logo.clearbit.com/gamma.app' },
  ];

  const FAVORITE_TOOLS = [
    { name: 'Canva',      img: 'https://logo.clearbit.com/canva.com' },
    { name: 'ChatGPT',    img: 'https://logo.clearbit.com/openai.com' },
    { name: 'Midjourney', img: 'https://logo.clearbit.com/midjourney.com' },
  ];

  const REVIEWS = [
    { title: '네이버 블로그 리뷰', date: '2025/01/24', desc: 'AI 보다도 전혀 사용감이...', img: 'https://logo.clearbit.com/gamma.app' },
    { title: '네이버 블로그 리뷰', date: '2025/01/24', desc: 'AI 보다도 전혀 사용감이...', img: 'https://logo.clearbit.com/framer.com' },
    { title: '네이버 블로그 리뷰', date: '2025/01/24', desc: 'AI 보다도 전혀 사용감이...', img: 'https://logo.clearbit.com/anthropic.com' },
    { title: '네이버 블로그 리뷰', date: '2025/01/24', desc: 'AI 보다도 전혀 사용감이...', img: 'https://logo.clearbit.com/notion.so' },
    { title: '네이버 블로그 리뷰', date: '2025/01/24', desc: 'AI 보다도 전혀 사용감이...', img: 'https://logo.clearbit.com/adobe.com' },
  ];

  const REVIEW_MANAGE = [
    { toolImg: 'https://logo.clearbit.com/lilys.ai',      date: '2024/01/23', text: '바나나로 너무 좋아도...' },
    { toolImg: 'https://logo.clearbit.com/framer.com',    date: '2024/01/23', text: '바나나로 너무 좋아도...' },
    { toolImg: 'https://logo.clearbit.com/framer.com',    date: '2024/01/23', text: '바나나로 너무 좋아도...' },
    { toolImg: 'https://logo.clearbit.com/grammarly.com', date: '2024/01/23', text: '바나나로 너무 좋아도...' },
  ];

  const WORK_IMAGES = [
    'https://picsum.photos/200/56?random=1',
    'https://picsum.photos/200/56?random=2',
  ];

  const LINKS = [
    { label: '오토레이아웃 바로가기',    href: '#' },
    { label: '내가 만든 템플릿 바로가기', href: '#' },
    { label: '내가 만든 노래 바로가기',  href: '#' },
    { label: '내가 만든 기획 그림',      href: '#' },
  ];


  // ===== 툴 슬라이더 렌더링 =====
  function renderToolSlider(containerId, tools) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let currentIdx = 0;

    function render() {
      const tool = tools[currentIdx];
      container.innerHTML = `
        <button class="slider-arrow" data-dir="prev">←</button>
        <div class="slider-tool-icon">
          <img src="${tool.img}" alt="${tool.name}" onerror="this.style.display='none'">
        </div>
        <button class="slider-arrow" data-dir="next">→</button>
      `;
      container.querySelector('[data-dir=prev]').addEventListener('click', () => {
        currentIdx = (currentIdx - 1 + tools.length) % tools.length;
        render();
      });
      container.querySelector('[data-dir=next]').addEventListener('click', () => {
        currentIdx = (currentIdx + 1) % tools.length;
        render();
      });
    }

    render();
  }


  // ===== 리뷰 리스트 렌더링 =====
  function renderReviewList() {
    const list = document.getElementById('reviewList');
    if (!list) return;

    list.innerHTML = REVIEWS.map(r => `
      <li class="review-item">
        <div class="review-item__icon">
          <img src="${r.img}" alt="" onerror="this.style.display='none'">
        </div>
        <div class="review-item__content">
          <div class="review-item__title">${r.title}</div>
          <div class="review-item__desc">${r.desc}</div>
        </div>
        <span class="review-item__date">${r.date}</span>
      </li>
    `).join('');
  }


  // ===== 작업물 이미지 렌더링 =====
  function renderWorkImages() {
    const container = document.getElementById('workImages');
    if (!container) return;

    container.innerHTML = WORK_IMAGES.map(src => `
      <div class="work-img-thumb">
        <img src="${src}" alt="작업물">
      </div>
    `).join('');
  }


  // ===== 링크 렌더링 =====
  function renderLinks() {
    const list = document.getElementById('linkList');
    if (!list) return;

    list.innerHTML = LINKS.map(l => `
      <li><a href="${l.href}">${l.label}</a></li>
    `).join('');
  }


  // ===== 리뷰 관리 렌더링 =====
  function renderReviewManage() {
    const container = document.getElementById('reviewManageList');
    if (!container) return;

    container.innerHTML = '';

    REVIEW_MANAGE.forEach((r, idx) => {
      const item = document.createElement('div');
      item.className = 'review-manage-item';
      item.dataset.idx = idx;

      function renderViewMode() {
        item.innerHTML = `
          <div class="review-manage-item__icon">
            <img src="${r.toolImg}" alt="" onerror="this.style.display='none'">
          </div>
          <div class="review-manage-item__body">
            <div class="review-manage-item__meta">제마나우 ${r.date}</div>
            <div class="review-manage-item__text">${r.text}</div>
          </div>
          <div class="review-manage-item__actions">
            <button class="icon-btn edit-btn" title="수정">✏️</button>
            <button class="icon-btn delete-btn" title="삭제">🗑️</button>
          </div>
        `;

        // 수정 버튼 → 편집 모드로 전환
        item.querySelector('.edit-btn').addEventListener('click', () => {
          renderEditMode();
        });

        // 삭제 버튼
        item.querySelector('.delete-btn').addEventListener('click', () => {
          if (confirm('리뷰를 삭제할까요?')) {
            item.remove();
          }
        });
      }

      function renderEditMode() {
        item.innerHTML = `
          <div class="review-manage-item__icon">
            <img src="${r.toolImg}" alt="" onerror="this.style.display='none'">
          </div>
          <div class="review-manage-item__body">
            <div class="review-manage-item__meta">제마나우 ${r.date}</div>
            <textarea class="review-edit-textarea" rows="3">${r.text}</textarea>
          </div>
          <div class="review-manage-item__actions">
            <button class="icon-btn save-btn" title="저장">✅</button>
            <button class="icon-btn cancel-btn" title="취소">✖️</button>
          </div>
        `;

        // 저장 버튼
        item.querySelector('.save-btn').addEventListener('click', () => {
          const newText = item.querySelector('.review-edit-textarea').value.trim();
          if (newText) r.text = newText;
          renderViewMode();
        });

        // 취소 버튼
        item.querySelector('.cancel-btn').addEventListener('click', () => {
          renderViewMode();
        });
      }

      renderViewMode();
      container.appendChild(item);
    });
  }


  // ===== 드롭다운 초기화 =====
  initFaqItems();


  // ===== 내 정보 수정 폼 초기화 =====
  function initInfoEditForm() {

    const initSelect = (wrapperId, options, defaultValue) => {
      const wrap = document.getElementById(wrapperId);
      if (!wrap) return;

      if (typeof JeonubSelect !== 'undefined') {
        wrap.innerHTML = '<div class="select-root"></div>';
        const sel = new JeonubSelect(wrap.querySelector('.select-root'));
        sel.setOptions(options.map(o => ({ label: o, value: o })));
        sel.setValue(defaultValue);
      } else {
        // fallback: 기본 select
        wrap.innerHTML = `
          <select style="width:100%;height:40px;border:1px solid #e0e0e0;border-radius:10px;padding:0 14px;font-size:14px;color:#1a1a2e;outline:none;background:#fff;box-sizing:border-box;">
            ${options.map(o => `<option value="${o}" ${o === defaultValue ? 'selected' : ''}>${o}</option>`).join('')}
          </select>
        `;
      }
    };

    initSelect('selectJobWrap',     ['마케터', '개발자', '디자이너', '기획자', '기타'], '마케터');
    initSelect('selectAgeWrap',     ['10대', '20대', '30대', '40대', '50대 이상'],     '20대');
    initSelect('selectCountryWrap', ['대한민국', '미국', '일본', '중국', '기타'],       '대한민국');

    // 중복확인 버튼
    document.getElementById('nicknameCheckBtn')?.addEventListener('click', () => {
      const val = document.getElementById('editNickname')?.value.trim();
      if (!val) { alert('닉네임을 입력해주세요.'); return; }
      // TODO: API 연동
      alert(`"${val}" 사용 가능한 닉네임입니다.`);
    });

    // 수정 버튼
    document.getElementById('infoSubmitBtn')?.addEventListener('click', () => {
      // TODO: API 연동
      alert('정보가 수정되었습니다.');
    });
  }

  initInfoEditForm();


  // ===== 로그아웃 버튼 =====
  document.querySelector('.profile-logout')?.addEventListener('click', () => {
    console.log('로그아웃');
    // TODO: 로그아웃 처리
  });


  // ===== 초기 렌더링 =====
  renderToolSlider('recentToolSlider',   RECENT_TOOLS);
  renderToolSlider('aiToolSlider',       AI_TOOLS);
  renderToolSlider('favoriteToolSlider', FAVORITE_TOOLS);
  renderReviewList();
  renderWorkImages();
  renderLinks();
  renderReviewManage();

});