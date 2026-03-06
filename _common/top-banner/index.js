// index.js
// top-banner 동작 스크립트

// ===== 드롭다운 메뉴 데이터 =====
const MENU_DATA = {
  category: {
    desc: '카테고리별 AI 툴을\n탐색해보세요.',
    items: [
      { label: '이미지·오디오·영상', href: '#' },
      { label: '리서치',             href: '#' },
      { label: '문서 생성·요약·편집', href: '#' },
      { label: '개발·코딩',          href: '#' },
      { label: '학습·교육',          href: '#' },
      { label: '챗봇·어시스턴트',    href: '#' },
    ]
  },
  price: {
    desc: '가격별 AI 툴을\n탐색해보세요.',
    items: [
      { label: '이미지·오디오·영상', href: '#' },
      { label: '리서치',             href: '#' },
      { label: '문서 생성·요약·편집', href: '#' },
      { label: '개발·코딩',          href: '#' },
      { label: '학습·교육',          href: '#' },
      { label: '문서 생성·요약·편집', href: '#' },
    ]
  },
  personal: {
    desc: '개인 맞춤 AI 툴을\n탐색해보세요.',
    items: [
      { label: '이미지·오디오·영상', href: '#' },
      { label: '리서치',             href: '#' },
      { label: '문서 생성·요약·편집', href: '#' },
      { label: '개발·코딩',          href: '#' },
      { label: '학습·교육',          href: '#' },
      { label: '챗봇·어시스턴트',    href: '#' },
    ]
  },
  library: {
    desc: '작업물 라이브러리를\n탐색해보세요.',
    items: [
      { label: '이미지·오디오·영상', href: '#' },
      { label: '리서치',             href: '#' },
      { label: '문서 생성·요약·편집', href: '#' },
      { label: '개발·코딩',          href: '#' },
      { label: '학습·교육',          href: '#' },
      { label: '챗봇·어시스턴트',    href: '#' },
    ]
  },
  mypage: null
};

// ===== 드롭다운 렌더링 =====
function renderDropdown(menuKey, navItemEl) {
  const data    = MENU_DATA[menuKey];
  const panel   = document.getElementById('dropdownPanel');
  const descEl  = document.getElementById('dropdownDesc');
  const listEl  = document.getElementById('dropdownList');
  const inner   = document.querySelector('.dropdown-inner');

  if (!data || !panel || !descEl || !listEl || !inner) return;

  // 내용 채우기
  descEl.textContent = data.desc;
  listEl.innerHTML = data.items
    .map(item => `<li><a href="${item.href}">${item.label}</a></li>`)
    .join('');

  // ✅ 탭 위치 기준으로 dropdown-inner 좌측 정렬
  if (navItemEl) {
    const rect = navItemEl.getBoundingClientRect();
    inner.style.paddingLeft = `${rect.left-260}px`;
  }

  panel.classList.add('is-open');
}

function closeDropdown() {
  const panel = document.getElementById('dropdownPanel');
  if (panel) panel.classList.remove('is-open');
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('is-active'));
}

// ===== 이벤트 위임 =====
document.addEventListener('mouseover', (e) => {
  const navItem = e.target.closest('.nav-item');

  if (navItem) {
    const menuKey = navItem.dataset.menu;
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('is-active'));

    if (MENU_DATA[menuKey]) {
      navItem.classList.add('is-active');
      renderDropdown(menuKey, navItem); // ✅ navItem 전달
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

// ===== 클릭 이벤트 =====
document.addEventListener('click', (e) => {
  const toggle = e.target.closest('#menuToggle');
  const logo   = e.target.closest('#logo');

  if (toggle) {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) navMenu.classList.toggle('open');
  }
});

// ✅ 로고 직접 등록
const logoEl = document.getElementById('logo');
if (logoEl) {
  logoEl.addEventListener('click', () => {
    window.location.href = '/main1/main1.html';
  });
}

// ===== 키보드 접근성 =====
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
document.addEventListener('click', (e) => {

  const mypageLink = e.target.closest('.nav-item[data-menu="mypage"] a');
  if (!mypageLink) return;

  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  if (!isLoggedIn) {
    e.preventDefault(); // 기본 이동 차단
    window.location.href = '/login1/login1.html';
  }

});