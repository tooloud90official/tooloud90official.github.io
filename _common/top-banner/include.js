// include.js
// top-banner 자동 로드 - 로그인 상태에 따라 배리언트 분기

(async () => {

  // ===== 로그인 상태 확인 =====
  // login 페이지에서는 무조건 default 배너 표시
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

  // ===== 로그인 후 배너 전용: alert + 로그아웃 초기화 =====
  if (isLoggedIn) {
    script.addEventListener('load', async () => {

      // alert 컴포넌트 초기화 (alert.js가 로드된 경우)
      if (typeof initAlert === 'function') {
        if (!document.getElementById('alert-root')) {
          const root = document.createElement('div');
          root.id = 'alert-root';
          document.body.appendChild(root);
        }

        await initAlert({
          triggerSelector: '#bellBtn',
          mountSelector:   '#alert-root',
          alerts: [] // 실제 알림은 각 페이지 또는 API에서 주입
        });
      }

      // 로그아웃 버튼
      document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.removeItem('isLoggedIn');
        window.location.href = '/main1/main1.html';
      });

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