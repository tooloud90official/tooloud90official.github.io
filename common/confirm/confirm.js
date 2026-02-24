// components/confirm/confirm.js

export class ConfirmModal {
    /**
     * @param {Object} options
     * @param {string} [options.rootSelector='[data-confirm-modal]'] 모달 루트 셀렉터
     * @param {boolean} [options.closeOnBackdrop=true] 배경 클릭 닫기
     * @param {boolean} [options.closeOnEsc=true] ESC 닫기
     */
    constructor(options = {}) {
      this.options = {
        rootSelector: '[data-confirm-modal]',
        closeOnBackdrop: true,
        closeOnEsc: true,
        ...options,
      };
  
      this.root = document.querySelector(this.options.rootSelector);
      if (!this.root) {
        throw new Error(`[ConfirmModal] root not found: ${this.options.rootSelector}`);
      }
  
      this.dialog = this.root.querySelector('.confirm-modal__dialog');
      this.titleEl = this.root.querySelector('[data-confirm-title]');
      this.descEl = this.root.querySelector('[data-confirm-desc]');
      this.actionsEl = this.root.querySelector('[data-confirm-actions]');
      this.okBtn = this.root.querySelector('[data-confirm-ok]');
      this.cancelBtn = this.root.querySelector('[data-confirm-cancel]');
  
      this._resolver = null;
      this._isOpen = false;
      this._previousActiveElement = null;
  
      this._bindEvents();
    }
  
    _bindEvents() {
      this._onRootClick = (e) => {
        const closeTarget = e.target.closest('[data-confirm-close]');
        if (closeTarget && this.options.closeOnBackdrop) {
          this.close(false);
          return;
        }
  
        const cancelBtn = e.target.closest('[data-confirm-cancel]');
        if (cancelBtn) {
          this.close(false);
          return;
        }
  
        const okBtn = e.target.closest('[data-confirm-ok]');
        if (okBtn) {
          this.close(true);
        }
      };
  
      this._onKeyDown = (e) => {
        if (!this._isOpen) return;
  
        if (e.key === 'Escape' && this.options.closeOnEsc) {
          e.preventDefault();
          this.close(false);
          return;
        }
  
        // Enter = 확인 (textarea/input에서는 예외 처리 가능)
        if (e.key === 'Enter') {
          const tag = document.activeElement?.tagName?.toLowerCase();
          if (tag === 'textarea') return;
          e.preventDefault();
          this.close(true);
        }
  
        // Tab focus trap
        if (e.key === 'Tab') {
          this._trapFocus(e);
        }
      };
  
      this.root.addEventListener('click', this._onRootClick);
      document.addEventListener('keydown', this._onKeyDown);
    }
  
    _getFocusableElements() {
      if (!this.root) return [];
      const selectors = [
        'button:not([disabled])',
        '[href]',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
      ].join(',');
  
      return [...this.root.querySelectorAll(selectors)].filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );
    }
  
    _trapFocus(e) {
      const focusables = this._getFocusableElements();
      if (!focusables.length) return;
  
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
  
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  
    /**
     * 텍스트 변경
     * @param {Object} param0
     * @param {string} [param0.title]
     * @param {string} [param0.description]
     * @param {string} [param0.okText]
     * @param {string} [param0.cancelText]
     */
    setContent({ title, description, okText, cancelText } = {}) {
      if (typeof title === 'string' && this.titleEl) this.titleEl.textContent = title;
      if (typeof description === 'string' && this.descEl) this.descEl.textContent = description;
      if (typeof okText === 'string' && this.okBtn) this.okBtn.textContent = okText;
      if (typeof cancelText === 'string' && this.cancelBtn) this.cancelBtn.textContent = cancelText;
    }
  
    /**
     * 버튼 영역을 통째로 교체 (외부 버튼 컴포넌트 사용 가능)
     * 주의: 교체한 버튼에는 data-confirm-cancel / data-confirm-ok 속성을 넣어줘야 이벤트 동작함
     * @param {string|HTMLElement} content
     */
    setActions(content) {
      if (!this.actionsEl) return;
  
      this.actionsEl.innerHTML = '';
  
      if (typeof content === 'string') {
        this.actionsEl.insertAdjacentHTML('beforeend', content);
      } else if (content instanceof HTMLElement) {
        this.actionsEl.appendChild(content);
      }
  
      // 교체 후 참조 갱신
      this.okBtn = this.root.querySelector('[data-confirm-ok]');
      this.cancelBtn = this.root.querySelector('[data-confirm-cancel]');
    }
  
    /**
     * 모달 열기 (Promise 반환)
     * @param {Object} config
     * @returns {Promise<boolean>} true=확인, false=취소/닫기
     */
    open(config = {}) {
      this.setContent(config);
  
      // 옵션: actionsHTML로 버튼 영역 교체 가능
      if (config.actionsHTML) {
        this.setActions(config.actionsHTML);
      }
  
      this._previousActiveElement = document.activeElement;
      this._isOpen = true;
  
      this.root.hidden = false;
      this.root.setAttribute('aria-hidden', 'false');
  
      this.root.classList.remove('is-closing');
      this.root.classList.add('is-opening');
  
      // 애니메이션 클래스 정리
      clearTimeout(this._openAnimTimer);
      this._openAnimTimer = setTimeout(() => {
        this.root.classList.remove('is-opening');
      }, 200);
  
      // 포커스 이동
      queueMicrotask(() => {
        const focusTarget = this.cancelBtn || this.okBtn || this.dialog;
        focusTarget?.focus?.();
      });
  
      return new Promise((resolve) => {
        this._resolver = resolve;
      });
    }
  
    /**
     * 모달 닫기
     * @param {boolean} result
     */
    close(result = false) {
      if (!this._isOpen) return;
  
      this._isOpen = false;
      this.root.classList.remove('is-opening');
      this.root.classList.add('is-closing');
  
      clearTimeout(this._closeAnimTimer);
      this._closeAnimTimer = setTimeout(() => {
        this.root.hidden = true;
        this.root.setAttribute('aria-hidden', 'true');
        this.root.classList.remove('is-closing');
  
        // 포커스 복귀
        if (this._previousActiveElement && typeof this._previousActiveElement.focus === 'function') {
          this._previousActiveElement.focus();
        }
      }, 140);
  
      if (this._resolver) {
        this._resolver(Boolean(result));
        this._resolver = null;
      }
    }
  
    destroy() {
      this.root.removeEventListener('click', this._onRootClick);
      document.removeEventListener('keydown', this._onKeyDown);
    }
  }