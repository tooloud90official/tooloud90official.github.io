// alert.js
// 경로: common/alert/alert.js

function resolveLink(type, referenceId) {
  if (!referenceId) return null;
  switch (type) {
    case 'like':
    case 'reply':
      return `/artwork/artwork_post/artwork_post.html?work_id=${referenceId}`;
    case 'inquiry':
      return `/inquiry/inquiry.html`;
    default:
      return null;
  }
}


async function initAlert({ triggerSelector, mountSelector, alerts = [], onRemove = null }) {

  const mount = document.querySelector(mountSelector);
  if (!mount) {
    console.warn(`[initAlert] mount target not found: ${mountSelector}`);
    return;
  }

  try {
    const res = await fetch('/_common/alert/alert.html');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    mount.innerHTML = html;
  } catch (err) {
    console.error('[initAlert] alert.html 로드 실패:', err);
    return;
  }

  if (!document.querySelector('link[data-style="alert"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/_common/alert/alert.css';
    link.dataset.style = 'alert';
    document.head.appendChild(link);
  }

  const panel   = document.getElementById('alertPanel');
  const listEl  = document.getElementById('alertList');
  const trigger = document.querySelector(triggerSelector);

  if (!panel || !listEl || !trigger) return;

  let currentAlerts = [...alerts];


  // ===== 알림 아이콘 타입 SVG =====
  function getIconSVG(type) {
    if (type === 'like') {
      return `<svg class="alert-item__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>`;
    }
    if (type === 'reply') {
      return `<svg class="alert-item__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>`;
    }
    if (type === 'inquiry') {
      return `<svg class="alert-item__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>`;
    }
    return `<svg class="alert-item__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>`;
  }


  // ===== 알림 밀어내기 애니메이션 후 삭제 =====
  function removeAlertWithAnimation(index, el) {
    el.classList.add('is-removing');

    el.addEventListener('transitionend', async () => {
      // DB 삭제 콜백 호출
      if (typeof onRemove === 'function') {
        await onRemove(currentAlerts[index]);
      }
      currentAlerts.splice(index, 1);
      renderAlerts(currentAlerts);
      updateBadge(currentAlerts.length);
    }, { once: true });
  }


  // ===== 알림 리스트 렌더링 =====
  function renderAlerts(data) {
    listEl.innerHTML = '';

    if (!data.length) {
      listEl.innerHTML = '<p style="text-align:center; color:#999; padding:20px; font-size:13px;">알림이 없습니다.</p>';
      return;
    }

    data.forEach((item, index) => {
      const el = document.createElement('div');
      el.className = 'alert-item';

      const link = item.href && item.href !== '#'
        ? item.href
        : resolveLink(item.type, item.reference_id);

      el.innerHTML = `
        <button class="alert-item__close" aria-label="알림 삭제">✕</button>
        <div class="alert-item__header">
          ${getIconSVG(item.type)}
          <span class="alert-item__title">${item.title}</span>
        </div>
        <p class="alert-item__desc">${item.desc}</p>
        <button class="alert-item__btn">바로가기</button>
      `;

      // X 버튼 — 밀어내기 애니메이션 후 삭제
      el.querySelector('.alert-item__close').addEventListener('click', () => {
        removeAlertWithAnimation(index, el);
      });

      const goBtn = el.querySelector('.alert-item__btn');

      if (link) {
        goBtn.addEventListener('click', async () => {
          // DB 삭제 콜백 호출 후 이동
          if (typeof onRemove === 'function') {
            await onRemove(item);
          }
          currentAlerts.splice(index, 1);
          window.location.href = link;
        });
      } else {
        goBtn.disabled = true;
        goBtn.style.opacity = '0.4';
        goBtn.style.cursor = 'default';
      }

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
  function openPanel() { panel.hidden = false; }
  function closePanel() { panel.hidden = true; }
  function togglePanel() { panel.hidden ? openPanel() : closePanel(); }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePanel();
  });

  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && !trigger.contains(e.target)) {
      closePanel();
    }
  });

  renderAlerts(currentAlerts);
  updateBadge(currentAlerts.length);

  return {
    setAlerts: (newAlerts) => {
      currentAlerts = [...newAlerts];
      renderAlerts(currentAlerts);
      updateBadge(currentAlerts.length);
    },
    open:  openPanel,
    close: closePanel,
  };
}

window.initAlert = initAlert;