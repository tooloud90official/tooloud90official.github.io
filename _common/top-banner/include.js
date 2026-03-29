import { supabase } from '/_ignore/supabase.js';

window._supabase = supabase;

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

  const mobileLoginItem  = document.getElementById('mobileLoginItem');
  const mobileLogoutItem = document.getElementById('mobileLogoutItem');
  if (mobileLoginItem)  mobileLoginItem.style.display  = 'none';
  if (mobileLogoutItem) mobileLogoutItem.style.display = 'block';
}

// ===== 알림 타입별 텍스트 + 링크 변환 =====
function formatAlert(n, senderNameMap = {}, currentUserId = null) {
  const sender      = senderNameMap[n.sender_id] || '누군가';
  const referenceId = n.reference_id || null;

  function resolveLink(type, refId) {
    if (!refId) return null;
    switch (type) {
      case 'like':
      case 'reply':
        return `/artwork/artwork_post/artwork_post.html?work_id=${refId}`;
      case 'inquiry':
        return `/inquiry/inquiry.html`;
      default:
        return null;
    }
  }

  const link = resolveLink(n.type, referenceId);
  const base = {
    notification_id: n.notification_id,
    reference_id:    referenceId,
    href:            link,
  };

  if (n.type === 'reply') {
    return { ...base, type: 'reply', title: '댓글 알림', desc: `${sender}님이 회원님의 작업물에 댓글을 달았어요.` };
  }

  if (n.type === 'like') {
    return { ...base, type: 'like', title: '좋아요 알림', desc: `${sender}님이 회원님의 작업물에 좋아요를 눌렀어요.` };
  }

  if (n.type === 'inquiry') {

    // 🔥 관리자 판별 (현재는 이름 기준)
    const isAdmin = sender.includes('툴라우드 오피셜');

    let desc;

    if (isAdmin) {
      // ✅ 유저 입장 (관리자가 답변)
      desc = '관리자님이 문의사항에 답변을 했어요.';
    } else {
      // ✅ 관리자 입장 (유저가 문의 등록)
      desc = `${sender}님이 문의사항을 등록했어요.`;
    }

    return {
      ...base,
      type: 'inquiry',
      title: '문의 알림',
      desc
    };
  }

  return { ...base, type: n.type, title: '알림', desc: '새로운 알림이 있어요.' };
}

// ===== 로그아웃 초기화 =====
async function initLogout() {
  const logoutBtn       = document.getElementById('logoutBtn');
  const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');

  const doLogout = async () => {
    await supabase.auth.signOut();
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

  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
    logoutBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleLogout(); }
    });
  }

  if (mobileLogoutBtn) {
    mobileLogoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleLogout();
    });
  }
}

// ===== 메인 실행 =====
(async () => {

  const { data: { session } } = await supabase.auth.getSession();
  const isLoggedIn = !!session?.user;

  try {
    const res  = await fetch('/_common/top-banner/top-banner.html');
    const html = await res.text();
    const container = document.getElementById('top-banner');
    if (container) container.innerHTML = html;
  } catch (err) {
    console.error('[include.js] top-banner 로드 실패:', err);
    return;
  }

  loadStyle('/_common/top-banner/top-banner.css');

  const authArea = document.getElementById('authArea');
  if (!authArea) return;

  if (isLoggedIn) {
    renderLoggedIn(authArea);
  } else {
    renderLoggedOut(authArea);
  }

  try {
    await loadScript('/_common/top-banner/index.js');
  } catch (e) {
    console.error('[include.js] index.js 로드 실패:', e);
  }

  if (isLoggedIn) {

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
      console.warn('[include.js] confirm 모듈 로드 실패:', e);
    }

    await initLogout();

    try {
      await loadScript('/_common/alert/alert.js');

      const { data: notiData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      const senderIds = [...new Set((notiData || []).map(n => n.sender_id).filter(Boolean))];
      let senderNameMap = {};

      if (senderIds.length > 0) {
        const { data: senderUsers } = await supabase
          .from('users')
          .select('user_id, user_name')
          .in('user_id', senderIds);

        (senderUsers || []).forEach(u => {
          senderNameMap[u.user_id] = u.user_name;
        });
      }

      const alerts = (notiData || []).map(n =>
        formatAlert(n, senderNameMap, session.user.id)
      );

      if (!document.getElementById('alert-root')) {
        const alertRoot = document.createElement('div');
        alertRoot.id = 'alert-root';
        document.body.appendChild(alertRoot);
      }

      if (typeof window.initAlert === 'function') {
        await window.initAlert({
          triggerSelector: '#bellBtn',
          mountSelector:   '#alert-root',
          alerts,
          onRemove: async (item) => {
            if (!item.notification_id) return;
            try {
              await supabase
                .from('notifications')
                .delete()
                .eq('notification_id', item.notification_id);
            } catch (e) {
              console.warn('[alert] 알림 DB 삭제 실패:', e);
            }
          },
        });
      }
    } catch (e) {
      console.warn('[include.js] alert 모듈 초기화 실패:', e);
    }

  }

})();