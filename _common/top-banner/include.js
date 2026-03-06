// include.js
// top-banner 자동 로드 - 로그인 상태에 따라 authArea를 동적으로 렌더링

// ===== 스크립트 동적 로드 헬퍼 =====
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload  = resolve;
    s.onerror = reject;
    document.body.appendChild(s);
  });
}

// ===== 스타일 동적 로드 헬퍼 =====
function loadStyle(href) {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = href;
    link.onload  = resolve;
    link.onerror = reject;
    document.head.appendChild(link);
  });
}

// ===== 로그인 전 UI 렌더링 =====
function renderLoggedOut(authArea) {
  authArea.innerHTML = `
    <div id="loginBtn" role="button" tabindex="0" aria-label="로그인 / 회원가입">
      <span>로그인 / 회원가입</span>
    </div>
  `;

  const loginBtn = document.getElementById('loginBtn');
  const go = () => { window.location.href = '/login1/login1.html'; };
  loginBtn?.addEventListener('click', go);
  loginBtn?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
  });

  // 모바일: 로그인/회원가입 표시, 로그아웃 숨김
  const mobileLoginItem  = document.getElementById('mobileLoginItem');
  const mobileLogoutItem = document.getElementById('mobileLogoutItem');
  if (mobileLoginItem)  mobileLoginItem.style.display  = 'block';
  if (mobileLogoutItem) mobileLogoutItem.style.display = 'none';
}

// ===== 로그인 후 UI 렌더링 =====
function renderLoggedIn(authArea) {
  authArea.innerHTML = `
    <div class="bell-wrapper" id="bellBtn" role="button" tabindex="0" aria-label="알림">
      <svg class="auth-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="1.8"
        stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
      <span class="bell-badge hidden" id="bellBadge">0</span>
    </div>
    <span id="logoutBtn" role="button" tabindex="0">로그아웃</span>
  `;

  // 모바일: 로그인/회원가입 숨김, 로그아웃 표시
  const mobileLoginItem  = document.getElementById('mobileLoginItem');
  const mobileLogoutItem = document.getElementById('mobileLogoutItem');
  if (mobileLoginItem)  mobileLoginItem.style.display  = 'none';
  if (mobileLogoutItem) mobileLogoutItem.style.display = 'block';
}

// ===== 로그아웃 초기화 =====
async function initLogout() {
  const logoutBtn       = document.getElementById('logoutBtn');
  const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');

  const doLogout = () => {
    localStorage.removeItem('isLoggedIn');
    window.location.href = '/main1/main1.html';
  };

  const handleLogout = async () => {
    if (typeof window.ConfirmModal !== 'undefined') {
      const confirmModal = new window.ConfirmModal();
      const result = await confirmModal.open({
        title: '로그아웃 하시겠습니까?',
        okText: '확인',
        cancelText: '취소',
      });
      if (result) doLogout();
    } else {
      if (window.confirm('로그아웃 하시겠습니까?')) doLogout();
    }
  };

  // 데스크탑 로그아웃 버튼
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
    logoutBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleLogout(); }
    });
  }

  // 모바일 로그아웃 버튼
  if (mobileLogoutBtn) {
    mobileLogoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleLogout();
    });
  }
}

// ===== 메인 실행 =====
(async () => {

  // ===== 로그인 상태 확인 =====
  const isLoginPage = window.location.pathname.includes('/login');
  const isLoggedIn  = !isLoginPage && localStorage.getItem('isLoggedIn') === 'true';

  // ===== HTML 로드 =====
  try {
    const res  = await fetch('/_common/top-banner/top-banner.html');
    const html = await res.text();
    const container = document.getElementById('top-banner');
    if (container) container.innerHTML = html;
  } catch (err) {
    console.error('[include.js] top-banner 로드 실패:', err);
    return;
  }

  // ===== CSS 로드 =====
  loadStyle('/_common/top-banner/top-banner.css');

  // ===== authArea에 로그인 상태별 UI 렌더링 =====
  const authArea = document.getElementById('authArea');
  if (!authArea) return;

  if (isLoggedIn) {
    renderLoggedIn(authArea);
  } else {
    renderLoggedOut(authArea);
  }

  // ===== index.js 로드 (드롭다운·로고 등 공통 동작) =====
  try {
    await loadScript('/_common/top-banner/index.js');
  } catch (e) {
    console.error('[include.js] index.js 로드 실패:', e);
  }

  // ===== 로그인 후 전용 초기화 =====
  if (isLoggedIn) {

    // confirm 모달 로드 — 실패해도 로그아웃/알림은 반드시 실행
    try {
      await Promise.all([
        loadStyle('/_common/confirm/confirm.css'),
        loadScript('/_common/confirm/include.js'),
        loadScript('/_common/confirm/confirm.js'),
      ]);
      if (!document.getElementById('modal-root')) {
        const root = document.createElement('div');
        root.id = 'modal-root';
        document.body.appendChild(root);
      }
      if (typeof window.includeHTML === 'function') {
        await window.includeHTML('#modal-root', '/_common/confirm/confirm.html');
      }
    } catch (e) {
      console.warn('[include.js] confirm 모듈 로드 실패 (fallback 사용):', e);
    }

    // 로그아웃 초기화 (데스크탑 + 모바일 버튼 모두)
    await initLogout();

    // ===== alert 모듈 로드 및 초기화 =====
    try {
      await loadScript('/_common/alert/alert.js');
      await loadScript('/_common/top-banner/alert-data.js');

      if (!document.getElementById('alert-root')) {
        const alertRoot = document.createElement('div');
        alertRoot.id = 'alert-root';
        document.body.appendChild(alertRoot);
      }

      if (typeof window.initAlert === 'function') {
        await window.initAlert({
          triggerSelector: '#bellBtn',
          mountSelector:   '#alert-root',
          alerts: window.ALERT_DATA || [],
        });
      }
    } catch (e) {
      console.warn('[include.js] alert 모듈 초기화 실패:', e);
    }

  }

})();