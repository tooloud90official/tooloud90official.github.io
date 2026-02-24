// components/confirm/include.js

/**
 * HTML 조각 파일을 target에 로드
 * @param {string} targetSelector - 삽입할 대상 셀렉터 (예: "#modal-root")
 * @param {string} filePath - html 파일 경로 (예: "/components/confirm/confirm.html")
 */
export async function includeHTML(targetSelector, filePath) {
    const target = document.querySelector(targetSelector);
    if (!target) {
      throw new Error(`[includeHTML] target not found: ${targetSelector}`);
    }
  
    const res = await fetch(filePath);
    if (!res.ok) {
      throw new Error(`[includeHTML] failed to load: ${filePath} (${res.status})`);
    }
  
    const html = await res.text();
    target.insertAdjacentHTML("beforeend", html);
  
    return target;
  }