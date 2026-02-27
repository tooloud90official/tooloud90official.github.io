// alert.js
// 경로: common/alert/alert.js

/**
 * 알림 컴포넌트 초기화
 * @param {string} triggerSelector  - 종 아이콘 버튼 선택자 (예: '#bellBtn')
 * @param {string} mountSelector    - 알림 패널 삽입 위치 (예: '#alert-root')
 * @param {Array}  alerts           - 알림 데이터 배열
 */
async function initAlert({ triggerSelector, mountSelector, alerts = [] }) {

  const mount = document.querySelector(mountSelector);
  if (!mount) {
    console.warn(`[initAlert] mount target not found: ${mountSelector}`);
    return;
  }

  // alert.html 로드
  try {
    const res = await fetch('/common/alert/alert.html');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    mount.innerHTML = html;
  } catch (err) {
    console.error('[initAlert] alert.html 로드 실패:', err);
    return;
  }

  // alert.css 로드
  if (!document.querySelector('link[data-style="alert"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/common/alert/alert.css';
    link.dataset.style = 'alert';
    document.head.appendChild(link);
  }

  const panel   = document.getElementById('alertPanel');
  const listEl  = document.getElementById('alertList');
  const trigger = document.querySelector(triggerSelector);

  if (!panel || !listEl || !trigger) return;


  // ===== 알림 아이콘 타입 SVG =====
  function getIconSVG(type) {
    if (type === 'like') {
      return `<svg class="alert-item__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>`;
    }
    if (type === 'message') {
      return `<svg class="alert-item__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>`;
    }
    // 기본 아이콘
    return `<svg class="alert-item__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>`;
  }


  // ===== 알림 리스트 렌더링 =====
  function renderAlerts(data) {
    listEl.innerHTML = '';

    if (!data.length) {
      listEl.innerHTML = '<p style="text-align:center; color:#999; padding:20px; font-size:13px;">알림이 없습니다.</p>';
      return;
    }

    data.forEach(item => {
      const el = document.createElement('div');
      el.className = 'alert-item';
      el.innerHTML = `
        <div class="alert-item__header">
          ${getIconSVG(item.type)}
          <span class="alert-item__title">${item.title}</span>
        </div>
        <p class="alert-item__desc">${item.desc}</p>
        <button class="alert-item__btn" data-href="${item.href || '#'}">바로가기</button>
      `;

      el.querySelector('.alert-item__btn').addEventListener('click', (e) => {
        const href = e.target.dataset.href;
        if (href && href !== '#') window.location.href = href;
      });

      listEl.appendChild(el);
    });
  }


  // ===== 뱃지 업데이트 =====
  function updateBadge(count) {
    const badge = trigger.querySelector('.bell-badge');
    if (!badge) return;
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }


  // ===== 패널 열기/닫기 =====
  function openPanel() {
    panel.hidden = false;
  }

  function closePanel() {
    panel.hidden = true;
  }

  function togglePanel() {
    panel.hidden ? openPanel() : closePanel();
  }


  // ===== 이벤트 바인딩 =====
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePanel();
  });

  // 패널 외부 클릭 시 닫기
  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && !trigger.contains(e.target)) {
      closePanel();
    }
  });


  // ===== 초기 렌더링 =====
  renderAlerts(alerts);
  updateBadge(alerts.length);


  // ===== 외부에서 알림 추가 가능하도록 API 반환 =====
  return {
    setAlerts: (newAlerts) => {
      renderAlerts(newAlerts);
      updateBadge(newAlerts.length);
    },
    open:  openPanel,
    close: closePanel,
  };
}

window.initAlert = initAlert;