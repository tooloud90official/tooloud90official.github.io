/**
 * mypage.js  –  마이페이지 통합 스크립트
 *
 * ──────────────────────────────────────────────────────
 * [빈 상태 전환]
 *  EMPTY_MODE = false  → 기본 상태 (데이터 있음)
 *  EMPTY_MODE = true   → 신규 사용자 빈 상태 UI
 *
 *  빈 상태 적용 섹션: 최근 사용한 툴, 관심 있는 툴,
 *                     내가 쓴 리뷰, 업로드한 작업물, 리뷰 관리
 *  항상 데이터 유지: 내 정보, AI 추천 툴, 드롭다운 섹션
 * ──────────────────────────────────────────────────────
 */

document.addEventListener('DOMContentLoaded', async () => {

  /* =====================================================
     [0] 빈 상태 플래그
     false = 기본(데이터 있음) / true = 신규 사용자 빈 상태
     ===================================================== */
  const EMPTY_MODE = true;


  /* =====================================================
     [1] 데이터
     ===================================================== */

  const RECENT_TOOLS = [
    { name: 'Framer',  img: 'https://logo.clearbit.com/framer.com' },
    { name: 'Notion',  img: 'https://logo.clearbit.com/notion.so' },
    { name: 'Figma',   img: 'https://logo.clearbit.com/figma.com' },
  ];

  const AI_TOOLS = [
    { name: 'Notion',  img: 'https://logo.clearbit.com/notion.so' },
    { name: 'Claude',  img: 'https://logo.clearbit.com/anthropic.com' },
    { name: 'Gamma',   img: 'https://logo.clearbit.com/gamma.app' },
  ];

  const FAVORITE_TOOLS = [
    { name: 'Canva',   img: 'https://logo.clearbit.com/canva.com' },
    {
      name: 'ChatGPT',
      img: 'https://cdn.brandfetch.io/ideA07K8J2/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1766207012399',
    },
  ];

  /**
   * 통합 리뷰 데이터
   * '내가 쓴 리뷰' 카드 + '리뷰 관리' 섹션이 이 배열을 공유합니다.
   */
  const MY_REVIEWS = [
    { toolName: '네이버 클로바 더빙', toolImg: 'https://logo.clearbit.com/naver.com',   date: '2026/01/26', rating: 5, text: 'AI 보이스 진짜 사람같네요...' },
    { toolName: 'Jotform',           toolImg: 'https://logo.clearbit.com/jotform.com', date: '2026/01/26', rating: 4, text: '폼 만들기가 너무 쉬워요.' },
    { toolName: 'Linear',            toolImg: 'https://logo.clearbit.com/linear.app',  date: '2026/01/26', rating: 4, text: '이슈 트래킹이 깔끔해요.' },
    { toolName: 'Framer',            toolImg: 'https://logo.clearbit.com/framer.com',  date: '2026/01/26', rating: 5, text: '레이아웃 잡기가 편해요.' },
    { toolName: 'Adobe',             toolImg: 'https://logo.clearbit.com/adobe.com',   date: '2026/01/26', rating: 3, text: '기능은 많은데 무거워요.' },
  ];

  const WORK_IMAGES = [
    'https://picsum.photos/200/56?random=1',
    'https://picsum.photos/200/56?random=2',
  ];

  const LINKS = [
    { label: '오토레이아웃 바로가기', href: '#' },
    { label: '내가 만든 템플릿',     href: '#' },
  ];


  /* =====================================================
     [2] 빈 상태 오버레이 헬퍼
     대상 요소 위에 블러 + 안내 문구 오버레이를 씌웁니다.
     부모 요소에 position:relative가 필요합니다.
     ===================================================== */

  function applyEmptyOverlay(wrapperEl, message) {
    if (!wrapperEl) return;
    // 내용 자체는 유지하되 블러로 가림
    wrapperEl.classList.add('empty-blurred');
    // 오버레이 삽입
    const overlay = document.createElement('div');
    overlay.className = 'empty-overlay';
    overlay.innerHTML = `
      <span class="empty-overlay__icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.8"
             stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </span>
      <span class="empty-overlay__msg">${message}</span>
    `;
    // 부모가 relative 포지션을 갖도록
    wrapperEl.style.position = 'relative';
    wrapperEl.appendChild(overlay);
  }


  /* =====================================================
     [3] 아이콘 마크업 생성 헬퍼
     ===================================================== */

  function iconCardHtml(imgUrl, sizeKey = 'lg') {
    return `<div class="mypage-icon mypage-icon--${sizeKey}"
                 style="background-image:url('${imgUrl}');"></div>`;
  }


  /* =====================================================
     [4] 내가 쓴 리뷰 카드 렌더링 (대시보드)
     ===================================================== */

  function renderReviewList() {
    const container = document.getElementById('reviewList');
    if (!container) return;

    const starsHtml = (rating) =>
      '★'.repeat(rating) + '☆'.repeat(5 - rating) + ' ' + rating + '.0';

    // 더미 콘텐츠 (블러용) — 빈 상태에서도 형태 유지
    const dummyReviews = [
      { toolName: '툴 이름', toolImg: '', date: '----/--/--', rating: 5, text: '리뷰 내용이 표시됩니다.' },
      { toolName: '툴 이름', toolImg: '', date: '----/--/--', rating: 4, text: '리뷰 내용이 표시됩니다.' },
      { toolName: '툴 이름', toolImg: '', date: '----/--/--', rating: 3, text: '리뷰 내용이 표시됩니다.' },
    ];

    const source = EMPTY_MODE ? dummyReviews : MY_REVIEWS;

    container.innerHTML = source.map(r => `
      <li class="review-item">
        <div class="review-item__header">
          <span class="review-item__tool-name">${r.toolName}</span>
          <span class="review-item__date">${r.date}</span>
        </div>
        <div class="review-item__row">
          ${iconCardHtml(r.toolImg, 'sm')}
          <div style="display:flex;flex-direction:column;flex:1;min-width:0;gap:2px;">
            <span class="review-item__stars">${starsHtml(r.rating)}</span>
            <span class="review-item__desc">${r.text}</span>
          </div>
        </div>
      </li>
    `).join('');

    if (EMPTY_MODE) {
      const card = container.closest('.dashboard-card');
      applyEmptyOverlay(card, '작성한 리뷰가 없습니다');
    }
  }


  /* =====================================================
     [5] 리뷰 관리 섹션 렌더링
     ===================================================== */

  function renderReviewManage() {
    const container = document.getElementById('reviewManageList');
    if (!container) return;

    if (EMPTY_MODE) {
      // 더미 아이템 2개 블러 처리
      container.innerHTML = `
        <div class="review-manage-item">
          <div class="mypage-icon mypage-icon--md" style="background-color:#e8eef5;"></div>
          <div class="review-manage-item__body">
            <div class="review-manage-item__meta">툴 이름 · ----/--/--</div>
            <div class="review-manage-item__text">리뷰 내용이 표시됩니다.</div>
          </div>
          <div class="review-manage-item__actions">
            <button class="review-action-btn" disabled>수정</button>
            <button class="review-action-btn review-action-btn--delete" disabled>삭제</button>
          </div>
        </div>
        <div class="review-manage-item">
          <div class="mypage-icon mypage-icon--md" style="background-color:#e8eef5;"></div>
          <div class="review-manage-item__body">
            <div class="review-manage-item__meta">툴 이름 · ----/--/--</div>
            <div class="review-manage-item__text">리뷰 내용이 표시됩니다.</div>
          </div>
          <div class="review-manage-item__actions">
            <button class="review-action-btn" disabled>수정</button>
            <button class="review-action-btn review-action-btn--delete" disabled>삭제</button>
          </div>
        </div>
      `;
      applyEmptyOverlay(container, '작성한 리뷰가 없습니다');
      return;
    }

    container.innerHTML = '';

    MY_REVIEWS.forEach((r, idx) => {
      const item = document.createElement('div');
      item.className = 'review-manage-item';

      const renderView = () => {
        item.innerHTML = `
          ${iconCardHtml(r.toolImg, 'md')}
          <div class="review-manage-item__body">
            <div class="review-manage-item__meta">${r.toolName} · ${r.date}</div>
            <div class="review-manage-item__text">${r.text}</div>
          </div>
          <div class="review-manage-item__actions">
            <button class="review-action-btn edit-btn">수정</button>
            <button class="review-action-btn review-action-btn--delete delete-btn">삭제</button>
          </div>
        `;
        item.querySelector('.edit-btn').onclick = renderEdit;
        item.querySelector('.delete-btn').onclick = () => {
          if (!confirm('리뷰를 삭제할까요?')) return;
          MY_REVIEWS.splice(idx, 1);
          renderReviewList();
          renderReviewManage();
        };
      };

      const renderEdit = () => {
        item.innerHTML = `
          ${iconCardHtml(r.toolImg, 'md')}
          <div class="review-manage-item__body">
            <div class="review-manage-item__meta">${r.toolName} · ${r.date}</div>
            <textarea class="review-edit-textarea" rows="2">${r.text}</textarea>
          </div>
          <div class="review-manage-item__actions">
            <button class="review-action-btn save-btn">저장</button>
            <button class="review-action-btn review-action-btn--cancel cancel-btn">취소</button>
          </div>
        `;
        item.querySelector('.save-btn').onclick = () => {
          MY_REVIEWS[idx].text = item.querySelector('textarea').value;
          r.text = MY_REVIEWS[idx].text;
          renderReviewList();
          renderReviewManage();
        };
        item.querySelector('.cancel-btn').onclick = renderView;
      };

      renderView();
      container.appendChild(item);
    });
  }


  /* =====================================================
     [6] 툴 슬라이더
     ===================================================== */

  function renderToolSlider(containerId, tools, isEmpty = false, emptyMsg = '사용한 툴이 없습니다') {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (isEmpty) {
      // 더미 슬라이더 렌더 후 블러
      container.innerHTML = `
        <button class="slider-arrow prev" disabled>
          <img src="/media/next.png" alt="이전">
        </button>
        <div class="mypage-icon mypage-icon--lg" style="background-color:#e8eef5;"></div>
        <button class="slider-arrow next" disabled>
          <img src="/media/next.png" alt="다음">
        </button>
      `;
      const card = container.closest('.dashboard-card');
      applyEmptyOverlay(card, emptyMsg);
      return;
    }

    let idx = 0;
    const update = () => {
      const tool = tools[idx];
      container.innerHTML = `
        <button class="slider-arrow prev">
          <img src="/media/next.png" alt="이전">
        </button>
        ${iconCardHtml(tool.img, 'lg')}
        <button class="slider-arrow next">
          <img src="/media/next.png" alt="다음">
        </button>
      `;
      container.querySelector('.prev').onclick = () => {
        idx = (idx - 1 + tools.length) % tools.length;
        update();
      };
      container.querySelector('.next').onclick = () => {
        idx = (idx + 1) % tools.length;
        update();
      };
    };
    update();
  }


  /* =====================================================
     [7] 업로드한 작업물 렌더링
     ===================================================== */

  function renderWorks() {
    const worksCard = document.querySelector('.works-card');

    if (EMPTY_MODE) {
      applyEmptyOverlay(worksCard, '업로드한 작업물이 없습니다');
      return;
    }

    const listRender = (id, data, tpl) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = data.map(tpl).join('');
    };

    listRender('workImages', WORK_IMAGES, src => `
      <div class="work-img-thumb"><img src="${src}" alt=""></div>
    `);

    listRender('linkList', LINKS, l => `
      <li><a href="${l.href}">${l.label}</a></li>
    `);
  }


  /* =====================================================
     [8] 내 정보 수정 폼
     ===================================================== */

  async function initInfoEditForm() {
    const initSelect = (wrapperId, options, defaultValue) => {
      const wrap = document.getElementById(wrapperId);
      if (!wrap) return;
      wrap.innerHTML = `
        <select class="edit-input">
          ${options.map(o =>
            `<option${o === defaultValue ? ' selected' : ''}>${o}</option>`
          ).join('')}
        </select>
      `;
    };

    initSelect('selectJobWrap',     ['마케터', '개발자', '디자이너', '기획자', '기타'], '마케터');
    initSelect('selectAgeWrap',     ['10대', '20대', '30대', '40대', '50대 이상'],       '20대');
    initSelect('selectCountryWrap', ['대한민국', '미국', '일본', '중국', '기타'],        '대한민국');

    await loadButton({
      target: '#nicknameCheckContainer',
      text: '중복확인',
      variant: 'outline',
      onClick: () => {
        const nick = document.getElementById('editNickname').value.trim();
        if (!nick) return alert('닉네임을 입력해주세요.');
        alert(`"${nick}"은(는) 사용 가능한 닉네임입니다.`);
      },
    });

    await loadButton({
      target: '#infoSubmitContainer',
      text: '수정',
      variant: 'primary',
      onClick: () => alert('정보가 수정되었습니다.'),
    });
  }


  /* =====================================================
     [9] FAQ 드롭다운
     ===================================================== */

  function initFaqItems() {
    document.querySelectorAll('[data-drop_down]').forEach(drop => {
      const trigger = drop.querySelector('[data-faq-trigger]');
      const panel   = drop.querySelector('[data-faq-panel]');
      if (!trigger || !panel) return;

      panel.style.display = 'none';

      trigger.addEventListener('click', () => {
        const isOpen = trigger.getAttribute('aria-expanded') === 'true';
        trigger.setAttribute('aria-expanded', String(!isOpen));
        panel.setAttribute('aria-hidden', String(isOpen));
        panel.style.display = isOpen ? 'none' : 'block';
      });
    });
  }


  /* =====================================================
     [10] 버튼 클릭 동작
     ===================================================== */

  function initButtonActions() {
    document.querySelectorAll('[data-scroll-to]').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = document.getElementById(btn.getAttribute('data-scroll-to'));
        if (!target) return;

        const trigger = target.querySelector('[data-faq-trigger]');
        const panel   = target.querySelector('[data-faq-panel]');
        if (trigger && panel && trigger.getAttribute('aria-expanded') !== 'true') {
          trigger.setAttribute('aria-expanded', 'true');
          panel.setAttribute('aria-hidden', 'false');
          panel.style.display = 'block';
        }

        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    document.querySelectorAll('[data-href]').forEach(btn => {
      btn.addEventListener('click', () => {
        window.location.href = btn.getAttribute('data-href');
      });
    });
  }


  /* =====================================================
     [11] 1:1 문의 버튼
     ===================================================== */

  await loadButton({
    target: '#inquiryBtnContainer',
    text: '문의하기',
    variant: 'primary',
    onClick: () => { window.location.href = '/inquiry/inquiry.html'; },
  });


  /* =====================================================
     [12] 초기화
     ===================================================== */

  initFaqItems();
  initButtonActions();
  await initInfoEditForm();

  // AI 추천 툴 — 항상 데이터 있음
  renderToolSlider('aiToolSlider', AI_TOOLS, false);

  // 최근 사용한 툴 / 관심 있는 툴 — EMPTY_MODE 적용
  renderToolSlider('recentToolSlider',   RECENT_TOOLS,   EMPTY_MODE, '사용한 툴이 없습니다');
  renderToolSlider('favoriteToolSlider', FAVORITE_TOOLS, EMPTY_MODE, '관심 툴이 없습니다');

  // 리뷰 — EMPTY_MODE 적용
  renderReviewList();
  renderReviewManage();

  // 작업물 — EMPTY_MODE 적용
  renderWorks();

});