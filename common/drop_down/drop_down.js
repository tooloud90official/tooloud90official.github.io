// drop_down.js

export class FaqItem {
    /**
     * @param {HTMLElement|string} root - .drop_down 요소 또는 셀렉터
     * @param {Object} options
     * @param {boolean} [options.defaultOpen=false]
     */
    constructor(root, options = {}) {
      this.root = typeof root === "string" ? document.querySelector(root) : root;
      if (!this.root) throw new Error("[FaqItem] root not found");
  
      this.trigger = this.root.querySelector("[data-faq-trigger]");
      this.panel = this.root.querySelector("[data-faq-panel]");
      this.titleEl = this.root.querySelector("[data-faq-title]");
      this.timeEl = this.root.querySelector("[data-faq-time]");
      this.descEl = this.root.querySelector("[data-faq-desc]");
  
      if (!this.trigger || !this.panel) {
        throw new Error("[FaqItem] trigger/panel not found");
      }
  
      this.isOpen = false;
      this._onClick = this.toggle.bind(this);
      this.trigger.addEventListener("click", this._onClick);
  
      if (options.defaultOpen) {
        this.open(false);
      } else {
        this.close(false);
      }
    }
  
    setContent({ title, time, desc } = {}) {
      if (typeof title === "string" && this.titleEl) this.titleEl.textContent = title;
      if (typeof time === "string" && this.timeEl) this.timeEl.textContent = time;
      if (typeof desc === "string" && this.descEl) this.descEl.textContent = desc;
    }
  
    open(animate = true) {
      this.isOpen = true;
      this.root.classList.add("is-open");
      this.trigger.setAttribute("aria-expanded", "true");
      this.panel.setAttribute("aria-hidden", "false");
  
      if (!animate) {
        const prev = this.panel.style.transition;
        this.panel.style.transition = "none";
        requestAnimationFrame(() => {
          this.panel.style.transition = prev;
        });
      }
    }
  
    close(animate = true) {
      this.isOpen = false;
      this.root.classList.remove("is-open");
      this.trigger.setAttribute("aria-expanded", "false");
      this.panel.setAttribute("aria-hidden", "true");
  
      if (!animate) {
        const prev = this.panel.style.transition;
        this.panel.style.transition = "none";
        requestAnimationFrame(() => {
          this.panel.style.transition = prev;
        });
      }
    }
  
    toggle() {
      this.isOpen ? this.close() : this.open();
    }
  
    destroy() {
      this.trigger.removeEventListener("click", this._onClick);
    }
  }
  
  /**
   * 페이지 내 모든 [data-drop_down] 자동 초기화
   * @param {Object} options
   * @returns {FaqItem[]}
   */
  export function initFaqItems(options = {}) {
    const items = [...document.querySelectorAll("[data-drop_down]")];
    return items.map((el, idx) => {
      // panel id 자동 보정 (중복 방지)
      const trigger = el.querySelector("[data-faq-trigger]");
      const panel = el.querySelector("[data-faq-panel]");
      if (trigger && panel) {
        const panelId = panel.id || `faq-panel-auto-${idx + 1}`;
        panel.id = panelId;
        trigger.setAttribute("aria-controls", panelId);
      }
      return new FaqItem(el, options);
    });
  }