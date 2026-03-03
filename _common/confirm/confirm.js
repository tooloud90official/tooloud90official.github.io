/**
 * Confirm Dialog
 * /_common/confirm/confirm.js
 *
 * 사용법:
 *   window.showConfirm({
 *     title       : '삭제하시겠습니까?',   // 제목 (선택)
 *     desc        : '되돌릴 수 없습니다.',  // 본문 (선택)
 *     confirmText : '확인',               // 확인 버튼 텍스트 (기본: '확인')
 *     cancelText  : '취소',               // 취소 버튼 텍스트 (기본: '취소')
 *     variant     : 'danger',             // 확인 버튼 variant: 'primary'|'danger' (기본: 'primary')
 *     onConfirm   : () => {},             // 확인 콜백
 *     onCancel    : () => {},             // 취소 콜백
 *   });
 *
 *   또는 Promise 방식:
 *   const ok = await window.showConfirm({ title: '삭제할까요?' });
 *   if (ok) { ... }
 */

(function () {
  const OVERLAY_ID   = 'confirmOverlay';
  const BACKDROP_ID  = 'confirmBackdrop';
  const TITLE_ID     = 'confirmTitle';
  const DESC_ID      = 'confirmDesc';
  const BTN_CANCEL   = 'confirmBtnCancel';
  const BTN_OK       = 'confirmBtnOk';

  // ESC 키 핸들러 참조 보관
  let _escHandler = null;

  /**
   * 다이얼로그 닫기 (애니메이션 포함)
   */
  function closeDialog(overlay) {
    overlay.classList.add('is-leaving');
    overlay.setAttribute('aria-hidden', 'true');

    if (_escHandler) {
      document.removeEventListener('keydown', _escHandler);
      _escHandler = null;
    }

    setTimeout(() => {
      overlay.classList.remove('is-active', 'is-leaving');
    }, 160);
  }

  /**
   * showConfirm — 메인 API
   * @param {object} options
   * @returns {Promise<boolean>}
   */
  window.showConfirm = function ({
    title       = '확인하시겠습니까?',
    desc        = '',
    confirmText = '확인',
    cancelText  = '취소',
    variant     = 'primary',   // 'primary' | 'danger'
    onConfirm   = null,
    onCancel    = null,
  } = {}) {
    return new Promise(async (resolve) => {
      const overlay  = document.getElementById(OVERLAY_ID);
      const backdrop = document.getElementById(BACKDROP_ID);
      const titleEl  = document.getElementById(TITLE_ID);
      const descEl   = document.getElementById(DESC_ID);
      const cancelEl = document.getElementById(BTN_CANCEL);
      const okEl     = document.getElementById(BTN_OK);

      if (!overlay) {
        console.warn('[Confirm] #confirmOverlay 를 찾을 수 없습니다.');
        resolve(false);
        return;
      }

      // 텍스트 세팅
      if (titleEl) titleEl.textContent = title;
      if (descEl)  {
        descEl.textContent = desc;
        descEl.style.display = desc ? '' : 'none';
      }

      // 버튼 슬롯 초기화
      if (cancelEl) cancelEl.innerHTML = '';
      if (okEl)     okEl.innerHTML     = '';

      // 결과 처리 공통 함수
      function handleResult(confirmed) {
        closeDialog(overlay);
        if (confirmed) {
          onConfirm && onConfirm();
        } else {
          onCancel && onCancel();
        }
        resolve(confirmed);
      }

      // 취소 버튼 로드
      if (cancelEl && typeof window.loadButton === 'function') {
        await window.loadButton({
          target  : cancelEl,
          text    : cancelText,
          variant : 'outline',   // 취소는 아웃라인 스타일
          size    : 'md',
          onClick : () => handleResult(false),
        });
      }

      // 확인 버튼 로드
      if (okEl && typeof window.loadButton === 'function') {
        await window.loadButton({
          target  : okEl,
          text    : confirmText,
          variant : variant,
          size    : 'md',
          onClick : () => handleResult(true),
        });
      }

      // 백드롭 클릭 → 취소
      if (backdrop) {
        backdrop.onclick = () => handleResult(false);
      }

      // ESC 키 → 취소
      _escHandler = (e) => {
        if (e.key === 'Escape') handleResult(false);
      };
      document.addEventListener('keydown', _escHandler);

      // 다이얼로그 열기
      overlay.setAttribute('aria-hidden', 'false');
      overlay.classList.add('is-active');

      // 포커스 이동 (접근성)
      requestAnimationFrame(() => {
        const firstBtn = overlay.querySelector('button');
        if (firstBtn) firstBtn.focus();
      });
    });
  };
})();