// select.js

export class JeonubSelect {
    /**
     * @param {HTMLElement|string} root
     * @param {Object} options
     * @param {string} [options.placeholder='선택 해주세요']
     * @param {Array<{label:string,value:string}>} [options.items]
     * @param {(item:{label:string,value:string}, instance:JeonubSelect)=>void} [options.onChange]
     * @param {boolean} [options.defaultOpen=false]
     */
    constructor(root, options = {}) {
      this.root = typeof root === "string" ? document.querySelector(root) : root;
      if (!this.root) throw new Error("[JeonubSelect] root not found");
  
      this.trigger = this.root.querySelector("[data-select-trigger]");
      this.valueEl = this.root.querySelector("[data-select-value]");
      this.menu = this.root.querySelector("[data-select-menu]");
      this.menuWrap = this.root.querySelector("[data-select-menu-wrap]");
  
      if (!this.trigger || !this.valueEl || !this.menu) {
        throw new Error("[JeonubSelect] required elements not found");
      }
  
      this.placeholder = options.placeholder ?? "선택 해주세요";
      this.onChange = typeof options.onChange === "function" ? options.onChange : null;
  
      this.items = [];
      this.selectedIndex = -1;
      this.isOpen = false;
  
      // 초기 placeholder 표시
      this.valueEl.textContent = this.placeholder;
      this.root.classList.add("is-placeholder");
  
      // 기존 HTML 옵션 읽기 (html 기본값 사용 가능)
      const defaultOptionsFromHtml = [...this.menu.querySelectorAll("[data-select-option]")].map((el) => ({
        label: el.textContent.trim(),
        value: el.dataset.value ?? el.textContent.trim()
      }));
  
      if (Array.isArray(options.items) && options.items.length) {
        this.setOptions(options.items);
      } else if (defaultOptionsFromHtml.length) {
        this.setOptions(defaultOptionsFromHtml);
      }
  
      this._bindEvents();
  
      if (options.defaultOpen) this.open();
      else this.close(false);
    }
  
    _bindEvents() {
      this._onTriggerClick = (e) => {
        e.preventDefault();
        this.toggle();
      };
  
      this._onMenuClick = (e) => {
        const optionEl = e.target.closest("[data-select-option]");
        if (!optionEl) return;
  
        const idx = Number(optionEl.dataset.index);
        if (Number.isNaN(idx)) return;
  
        this.selectIndex(idx, { close: true, focusTrigger: true });
      };
  
      this._onDocumentClick = (e) => {
        if (!this.root.contains(e.target)) {
          this.close();
        }
      };
  
      this._onKeyDown = (e) => {
        const activeInside = this.root.contains(document.activeElement);
        if (!activeInside) return;
  
        if (e.key === "Escape") {
          e.preventDefault();
          this.close();
          this.trigger.focus();
          return;
        }
  
        if (e.key === "Enter" || e.key === " ") {
          // trigger에서 Enter/Space 누르면 열기/닫기
          if (document.activeElement === this.trigger) {
            e.preventDefault();
            this.toggle();
            return;
          }
  
          // option에서 Enter/Space 선택
          const optionEl = document.activeElement?.closest?.("[data-select-option]");
          if (optionEl) {
            e.preventDefault();
            const idx = Number(optionEl.dataset.index);
            if (!Number.isNaN(idx)) {
              this.selectIndex(idx, { close: true, focusTrigger: true });
            }
          }
        }
  
        // 방향키 이동
        if (e.key === "ArrowDown") {
          e.preventDefault();
          if (!this.isOpen) {
            this.open();
            this._focusOption(this.selectedIndex >= 0 ? this.selectedIndex : 0);
          } else {
            this._focusNextOption();
          }
        }
  
        if (e.key === "ArrowUp") {
          e.preventDefault();
          if (!this.isOpen) {
            this.open();
            this._focusOption(this.selectedIndex >= 0 ? this.selectedIndex : 0);
          } else {
            this._focusPrevOption();
          }
        }
      };
  
      this.trigger.addEventListener("click", this._onTriggerClick);
      this.menu.addEventListener("click", this._onMenuClick);
      document.addEventListener("click", this._onDocumentClick);
      this.root.addEventListener("keydown", this._onKeyDown);
    }
  
    _getOptionEls() {
      return [...this.menu.querySelectorAll("[data-select-option]")];
    }
  
    _focusOption(index) {
      const optionEls = this._getOptionEls();
      if (!optionEls.length) return;
  
      const safeIndex = Math.max(0, Math.min(index, optionEls.length - 1));
      optionEls.forEach((el, i) => {
        el.tabIndex = i === safeIndex ? 0 : -1;
      });
      optionEls[safeIndex].focus();
    }
  
    _focusNextOption() {
      const optionEls = this._getOptionEls();
      if (!optionEls.length) return;
  
      const current = document.activeElement?.closest?.("[data-select-option]");
      let idx = optionEls.findIndex((el) => el === current);
      idx = idx < 0 ? 0 : Math.min(idx + 1, optionEls.length - 1);
      this._focusOption(idx);
    }
  
    _focusPrevOption() {
      const optionEls = this._getOptionEls();
      if (!optionEls.length) return;
  
      const current = document.activeElement?.closest?.("[data-select-option]");
      let idx = optionEls.findIndex((el) => el === current);
      idx = idx < 0 ? 0 : Math.max(idx - 1, 0);
      this._focusOption(idx);
    }
  
    /**
     * 옵션 목록 재설정 (추가/수정 쉬움)
     * @param {Array<{label:string,value:string}>} items
     */
    setOptions(items = []) {
      this.items = items.map((item, idx) => ({
        label: String(item.label ?? `옵션 ${idx + 1}`),
        value: String(item.value ?? `option${idx + 1}`)
      }));
  
      this.menu.innerHTML = "";
      this.selectedIndex = -1;
  
      this.items.forEach((item, idx) => {
        const li = document.createElement("li");
        li.className = "select__option";
        li.setAttribute("data-select-option", "");
        li.setAttribute("data-value", item.value);
        li.setAttribute("data-index", String(idx));
        li.setAttribute("role", "option");
        li.setAttribute("aria-selected", "false");
        li.tabIndex = -1;
        li.textContent = item.label;
        this.menu.appendChild(li);
      });
  
      // 옵션 초기 상태 = 미선택
      this.resetSelection();
    }
  
    /**
     * 옵션 추가
     * @param {{label:string,value:string}} item
     */
    addOption(item) {
      const next = [...this.items, item];
      this.setOptions(next);
    }
  
    /**
     * 특정 인덱스 선택
     * @param {number} index
     * @param {{close?:boolean, focusTrigger?:boolean}} opts
     */
    selectIndex(index, opts = {}) {
      const { close = true, focusTrigger = false } = opts;
  
      if (!this.items.length) return;
      if (index < 0 || index >= this.items.length) return;
  
      this.selectedIndex = index;
      const selectedItem = this.items[index];
  
      this.valueEl.textContent = selectedItem.label;
      this.root.classList.remove("is-placeholder");
  
      const optionEls = this._getOptionEls();
      optionEls.forEach((el, i) => {
        const selected = i === index;
        el.classList.toggle("is-selected", selected);
        el.setAttribute("aria-selected", String(selected));
        el.tabIndex = selected ? 0 : -1;
      });
  
      if (close) this.close();
      if (focusTrigger) this.trigger.focus();
  
      if (this.onChange) {
        this.onChange(selectedItem, this);
      }
    }
  
    /**
     * value로 선택
     * @param {string} value
     */
    selectValue(value) {
      const idx = this.items.findIndex((item) => item.value === value);
      if (idx >= 0) this.selectIndex(idx);
    }
  
    /**
     * 선택 초기화
     */
    resetSelection() {
      this.selectedIndex = -1;
      this.valueEl.textContent = this.placeholder;
      this.root.classList.add("is-placeholder");
  
      const optionEls = this._getOptionEls();
      optionEls.forEach((el) => {
        el.classList.remove("is-selected");
        el.setAttribute("aria-selected", "false");
        el.tabIndex = -1;
      });
    }
  
    /**
     * 현재 선택값 반환
     * @returns {{label:string,value:string}|null}
     */
    getValue() {
      if (this.selectedIndex < 0) return null;
      return this.items[this.selectedIndex] ?? null;
    }
  
    open() {
      if (this.isOpen) return;
      this.isOpen = true;
      this.root.classList.add("is-open");
      this.trigger.setAttribute("aria-expanded", "true");
      this.menu.setAttribute("aria-hidden", "false");
    }
  
    close(restoreFocus = false) {
      if (!this.isOpen) return;
      this.isOpen = false;
      this.root.classList.remove("is-open");
      this.trigger.setAttribute("aria-expanded", "false");
      this.menu.setAttribute("aria-hidden", "true");
      if (restoreFocus) this.trigger.focus();
    }
  
    toggle() {
      this.isOpen ? this.close() : this.open();
    }
  
    destroy() {
      this.trigger.removeEventListener("click", this._onTriggerClick);
      this.menu.removeEventListener("click", this._onMenuClick);
      document.removeEventListener("click", this._onDocumentClick);
      this.root.removeEventListener("keydown", this._onKeyDown);
    }
  }

  export function initSelect(el){
  console.log("select mounted", el);
}