/**
 * mypage.js - 마이페이지 통합 스크립트
 */

document.addEventListener('DOMContentLoaded', async () => {

  // ===== [1] 데이터 세팅 =====
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
    { name: 'ChatGPT', img: 'https://logo.clearbit.com/openai.com' },
  ];

  const REVIEW_MANAGE = [
    { toolImg: 'https://logo.clearbit.com/lilys.ai',   date: '2024/01/23', text: '바나나로 너무 좋아도...' },
    { toolImg: 'https://logo.clearbit.com/framer.com', date: '2024/01/23', text: '레이아웃 잡기가 편해요.' },
  ];

  const WORK_IMAGES = [
    'https://picsum.photos/200/56?random=1',
    'https://picsum.photos/200/56?random=2'
  ];

  const LINKS = [
    { label: '오토레이아웃 바로가기', href: '#' },
    { label: '내가 만든 템플릿',     href: '#' }
  ];


  // ===== [2] 리뷰 관리 렌더링 =====

  function renderReviewManage() {

    const container = document.getElementById('reviewManageList');
    if (!container) return;

    container.innerHTML = '';

    REVIEW_MANAGE.forEach((r) => {

      const item = document.createElement('div');
      item.className = 'review-manage-item';


      // ===== 기본 View =====
      const renderView = () => {

        item.innerHTML = `
          <div class="review-manage-item__icon">
            <img src="${r.toolImg}" alt="">
          </div>

          <div class="review-manage-item__body">
            <div class="review-manage-item__meta">
              제마나우 ${r.date}
            </div>
            <div class="review-manage-item__text">
              ${r.text}
            </div>
          </div>

          <div class="review-manage-item__actions">

            <button class="icon-btn edit-btn">
              <img src="../media/edit.png" alt="수정">
            </button>

            <button class="icon-btn delete-btn">
              <img src="../media/delete.png" alt="삭제">
            </button>

          </div>
        `;

        item.querySelector('.edit-btn').onclick = renderEdit;

        item.querySelector('.delete-btn').onclick = () => {
          if (confirm('삭제할까요?')) item.remove();
        };
      };


      // ===== 수정 모드 =====
      const renderEdit = () => {

  item.innerHTML = `
    <div class="review-manage-item__icon">
      <img src="${r.toolImg}" alt="">
    </div>

    <div class="review-manage-item__body">
      <textarea class="review-edit-textarea">${r.text}</textarea>
    </div>

    <div class="review-manage-item__actions">

      <button class="icon-btn save-btn">
        <img src="/media/check1.png" alt="저장">
      </button>

      <button class="icon-btn cancel-btn">
        <img src="/media/cancel1.png" alt="취소">
      </button>

    </div>
  `;

  item.querySelector('.save-btn').onclick = () => {
    r.text = item.querySelector('textarea').value;
    renderView();
  };

  item.querySelector('.cancel-btn').onclick = renderView;
};

        

      renderView();
      container.appendChild(item);
    });
  }


  // ===== [3] 툴 슬라이더 =====

  function renderToolSlider(containerId, tools) {

    const container = document.getElementById(containerId);
    if (!container) return;

    let idx = 0;

    const update = () => {

      container.innerHTML = `
        <button class="slider-arrow prev">←</button>

        <div class="slider-tool-icon">
          <img src="${tools[idx].img}" alt="${tools[idx].name}">
        </div>

        <button class="slider-arrow next">→</button>
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


  // ===== [4] 내 정보 수정 폼 =====

  async function initInfoEditForm() {

    const initSelect = (wrapperId, options, defaultValue) => {

      const wrap = document.getElementById(wrapperId);
      if (!wrap) return;

      wrap.innerHTML = `
        <select class="edit-input">
          ${options.map(o =>
            `<option ${o === defaultValue ? 'selected' : ''}>${o}</option>`
          ).join('')}
        </select>
      `;
    };

    initSelect(
      'selectJobWrap',
      ['마케터', '개발자', '디자이너', '기획자', '기타'],
      '마케터'
    );

    initSelect(
      'selectAgeWrap',
      ['10대', '20대', '30대', '40대', '50대 이상'],
      '20대'
    );

    initSelect(
      'selectCountryWrap',
      ['대한민국', '미국', '일본', '중국', '기타'],
      '대한민국'
    );


    await loadButton({
      target: '#nicknameCheckContainer',
      text: '중복확인',
      variant: 'outline',
      onClick: () => {

        const nick = document
          .getElementById('editNickname')
          .value.trim();

        if (!nick) {
          return alert('닉네임을 입력해주세요.');
        }

        alert(`"${nick}"은(는) 사용 가능한 닉네임입니다.`);
      }
    });


    await loadButton({
      target: '#infoSubmitContainer',
      text: '수정',
      variant: 'primary',
      onClick: () => {
        alert('정보가 수정되었습니다.');
      }
    });
  }


  // ===== [5] FAQ 드롭다운 =====

  function initFaqItems() {

    document
      .querySelectorAll('[data-drop_down]')
      .forEach(drop => {

        const trigger = drop.querySelector('[data-faq-trigger]');
        const panel   = drop.querySelector('[data-faq-panel]');

        if (!trigger || !panel) return;

        trigger.addEventListener('click', () => {

          const isOpen =
            trigger.getAttribute('aria-expanded') === 'true';

          trigger.setAttribute(
            'aria-expanded',
            String(!isOpen)
          );

          panel.setAttribute(
            'aria-hidden',
            String(isOpen)
          );

          panel.style.display = isOpen ? 'none' : 'block';
        });

        panel.style.display = 'none';
      });
  }


  // ===== [6] 1:1 문의 버튼 =====

  await loadButton({
    target: '#inquiryBtnContainer',
    text: '문의하기',
    variant: 'primary',
    onClick: () => {
      window.location.href = '/inquiry/inquiry.html';
    }
  });


  // ===== [7] 초기화 =====

  initFaqItems();

  await initInfoEditForm();

  renderToolSlider('recentToolSlider', RECENT_TOOLS);
  renderToolSlider('aiToolSlider', AI_TOOLS);
  renderToolSlider('favoriteToolSlider', FAVORITE_TOOLS);

  renderReviewManage();


  const listRender = (id, data, tpl) => {

    const el = document.getElementById(id);

    if (el) {
      el.innerHTML = data.map(tpl).join('');
    }
  };

  listRender(
    'workImages',
    WORK_IMAGES,
    src => `
      <div class="work-img-thumb">
        <img src="${src}">
      </div>
    `
  );

  listRender(
    'linkList',
    LINKS,
    l => `
      <li>
        <a href="${l.href}">
          ${l.label}
        </a>
      </li>
    `
  );

});