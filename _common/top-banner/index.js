const MENU_DATA = {
  category: {
    desc: '카테고리별 AI 툴을\n탐색해보세요.',
    items: [
      { label: '이미지·오디오·영상', href: '/category/category.html?tab=이미지·오디오·영상' },
      { label: '리서치',             href: '/category/category.html?tab=리서치' },
      { label: '문서 생성·요약·편집', href: '/category/category.html?tab=문서 생성·요약·편집' },
      { label: '개발·코딩',          href: '/category/category.html?tab=개발·코딩' },
      { label: '학습·교육',          href: '/category/category.html?tab=학습·교육' },
      { label: '챗봇·어시스턴트',    href: '/category/category.html?tab=챗봇·어시스턴트' },
    ]
  },
  price: {
    desc: '가격별 AI 툴을\n탐색해보세요.',
    items: [
      { label: '이미지·오디오·영상', href: '/price_AI/price_AI.html?category=이미지·오디오·영상' },
      { label: '리서치',             href: '/price_AI/price_AI.html?category=리서치' },
      { label: '문서 생성·요약·편집', href: '/price_AI/price_AI.html?category=문서 생성·요약·편집' },
      { label: '개발·코딩',          href: '/price_AI/price_AI.html?category=개발·코딩' },
      { label: '학습·교육',          href: '/price_AI/price_AI.html?category=학습·교육' },
      { label: '챗봇·어시스턴트',    href: '/price_AI/price_AI.html?category=챗봇·어시스턴트' },
    ]
  },
  personal: {
    desc: '개인 맞춤 AI 툴을\n탐색해보세요.',
    items: [
      { label: 'AI 추천 툴',     href: '/personal_AI/personal_AI.html#ai-recommend',   requireLogin: true },
      { label: '최근 사용한 툴', href: '/personal_AI/personal_AI.html#recent-tools',   requireLogin: true },
      { label: '관심 있는 툴',   href: '/personal_AI/personal_AI.html#interest-tools', requireLogin: true },
    ]
  },
  library: {
    desc: '작업물 라이브러리를\n탐색해보세요.',
    items: [
      // ✅ 각 항목의 href 뒤에 ?tab=파라미터를 추가했어!
      { label: '이미지·오디오·영상', href: '/artwork/artwork.html?tab=이미지·오디오·영상' },
      { label: '리서치',             href: '/artwork/artwork.html?tab=리서치' },
      { label: '문서 생성·요약·편집', href: '/artwork/artwork.html?tab=문서 생성·요약·편집' },
      { label: '개발·코딩',          href: '/artwork/artwork.html?tab=개발·코딩' },
      { label: '학습·교육',          href: '/artwork/artwork.html?tab=학습·교육' },
      { label: '챗봇·어시스턴트',    href: '/artwork/artwork.html?tab=챗봇·어시스턴트' },
      { label: 'AI 추천 작업물',     href: '/artwork/artwork.html?tab=AI 추천 작업물' },
      { label: '내 라이브러리',      href: '/artwork/artwork.html?tab=내 라이브러리' },
      { label: '작업물 올리기',      href: '/artwork/artwork_upload/artwork_upload.html' },
    ]
  },
  mypage: null
};

// ... 이하 renderDropdown 및 이벤트 리스너 코드는 동일함 ...

function renderDropdown(menuKey, navItemEl) {
  const data   = MENU_DATA[menuKey];
  const panel  = document.getElementById('dropdownPanel');
  const descEl = document.getElementById('dropdownDesc');
  const listEl = document.getElementById('dropdownList');
  const inner  = document.querySelector('.dropdown-inner');

  if (!data || !panel || !descEl || !listEl || !inner) return;

  descEl.textContent = data.desc;
  listEl.innerHTML = data.items
    .map(item => `<li><a href="${item.href}" ${item.requireLogin ? 'data-require-login="true"' : ''}>${item.label}</a></li>`)
    .join('');

  if (navItemEl) {
    const rect = navItemEl.getBoundingClientRect();
    inner.style.paddingLeft = `${rect.left - 260}px`;
  }

  panel.classList.add('is-open');
}

function closeDropdown() {
  const panel = document.getElementById('dropdownPanel');
  if (panel) panel.classList.remove('is-open');
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('is-active'));
}

document.addEventListener('mouseover', (e) => {
  const navItem = e.target.closest('.nav-item');

  if (navItem) {
    const menuKey = navItem.dataset.menu;
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('is-active'));

    if (MENU_DATA[menuKey]) {
      navItem.classList.add('is-active');
      renderDropdown(menuKey, navItem);
    } else {
      closeDropdown();
    }
    return;
  }

  const panel = e.target.closest('#dropdownPanel');
  if (panel) return;

  const nav = e.target.closest('.nav-container');
  if (!nav) closeDropdown();
});

document.addEventListener('mouseover', (e) => {
  const inNav      = e.target.closest('.nav-container');
  const inDropdown = e.target.closest('#dropdownPanel');
  if (!inNav && !inDropdown) closeDropdown();
});

document.addEventListener('click', (e) => {
  const toggle = e.target.closest('#menuToggle');
  if (toggle) {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) navMenu.classList.toggle('open');
  }
});

const logoEl = document.getElementById('logo');
if (logoEl) {
  logoEl.addEventListener('click', () => {
    window.location.href = '/main1/main1.html';
  });
}

document.addEventListener('keydown', (e) => {
  const toggle = e.target.closest('#menuToggle');
  if (!toggle) return;
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    const navMenu = document.getElementById('navMenu');
    if (navMenu) navMenu.classList.toggle('open');
  }
});

// ===== 마이페이지 로그인 체크 =====
document.addEventListener('click', async (e) => {
  const mypageLink = e.target.closest('.nav-item[data-menu="mypage"] a');
  if (!mypageLink) return;

  const { data: { session } } = await window._supabase.auth.getSession();
  if (!session) {
    e.preventDefault();
    window.location.href = '/login1/login1.html';
  }
});

// ===== 개인 맞춤 AI 툴 로그인 체크 + 섹션 스크롤 =====
document.addEventListener('click', async (e) => {
  const personalLink = e.target.closest('[data-require-login="true"]');
  if (!personalLink) return;

  e.preventDefault();

  const { data: { session } } = await window._supabase.auth.getSession();
  if (!session) {
    window.location.href = '/login1/login1.html';
    return;
  }

  const href = personalLink.getAttribute('href');
  const hashIndex = href.indexOf('#');
  const path = hashIndex !== -1 ? href.slice(0, hashIndex) : href;
  const hash = hashIndex !== -1 ? href.slice(hashIndex + 1) : '';
  const currentPath = window.location.pathname;

  // 이미 personal_AI 페이지에 있으면 스크롤만
  if (currentPath.includes('personal_AI')) {
    if (hash) {
      const target = document.getElementById(hash);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }
  } else {
    // 다른 페이지에서 접근 시 hash 포함 URL로 이동
    window.location.href = href;
  }
});

// ===== personal_AI 페이지 진입 시 hash 스크롤 처리 =====
window.addEventListener('load', () => {
  const hash = window.location.hash?.replace('#', '');
  if (!hash) return;

  const target = document.getElementById(hash);
  if (target) {
    setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 300);
  }
});