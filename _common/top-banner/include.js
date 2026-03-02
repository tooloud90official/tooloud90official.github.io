// include.js
// top-banner 자동 로드 - 로그인 상태에 따라 배리언트 분기

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

(async () => {

  // ===== 로그인 상태 확인 =====
  const isLoginPage = window.location.pathname.includes('/login');
  const isLoggedIn  = !isLoginPage && localStorage.getItem('isLoggedIn') === 'true';

  const bannerFile = isLoggedIn
    ? '/_common/top-banner/top-banner-logged.html'
    : '/_common/top-banner/top-banner.html';

  // ===== HTML 로드 =====
  try {
    const res  = await fetch(bannerFile);
    const html = await res.text();
    const container = document.getElementById('top-banner');
    if (container) container.innerHTML = html;
  } catch (err) {
    console.error('[include.js] top-banner 로드 실패:', err);
    return;
  }

  // ===== index.js 로드 =====
  const script = document.createElement('script');
  script.src = '/_common/top-banner/index.js';
  script.dataset.script = 'top-banner';
  document.body.appendChild(script);

  // ===== 로그인 후 배너 전용 =====
  if (isLoggedIn) {
    script.addEventListener('load', async () => {

      // ===== confirm CSS + 스크립트 동적 로드 =====
      await Promise.all([
        loadStyle('/_common/confirm/confirm.css'),
        loadScript('/_common/confirm/include.js'),
        loadScript('/_common/confirm/confirm.js'),
      ]);

      // confirm HTML 삽입
      if (!document.getElementById('modal-root')) {
        const root = document.createElement('div');
        root.id = 'modal-root';
        document.body.appendChild(root);
      }
      await window.includeHTML('#modal-root', '/_common/confirm/confirm.html');
      const confirmModal = new window.ConfirmModal();

      // 로그아웃 버튼 → confirm 팝업
      document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        const result = await confirmModal.open({
          title: '로그아웃 하시겠습니까?',
          okText: '확인',
          cancelText: '취소',
        });
        if (result) {
          localStorage.removeItem('isLoggedIn');
          window.location.href = '/main1/main1.html';
        }
      });

      // ===== alert 초기화 =====
      if (typeof initAlert === 'function') {
        if (!document.getElementById('alert-root')) {
          const alertRoot = document.createElement('div');
          alertRoot.id = 'alert-root';
          document.body.appendChild(alertRoot);
        }
        await initAlert({
          triggerSelector: '#bellBtn',
          mountSelector:   '#alert-root',
          alerts: window.ALERT_DATA || []  // ← 수정

        });
      }

    });
  } else {
    // 로그인 전 배너: 로그인/회원가입 버튼
    script.addEventListener('load', () => {
      document.getElementById('authBtn')?.addEventListener('click', () => {
        window.location.href = '/login1/login1.html';
      });
    });
  }

})();