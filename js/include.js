async function loadTopBanner() {
    const target = document.getElementById("top-banner");
    if (!target) return;
  
    try {
      // index.html이 html 폴더 안에 있으므로 같은 폴더의 top-banner.html
      const res = await fetch("./top-banner.html");
  
      if (!res.ok) {
        throw new Error(`배너 파일 로드 실패: ${res.status} ${res.statusText}`);
      }
  
      const html = await res.text();
      target.innerHTML = html;
    } catch (e) {
      console.error("배너 불러오기 실패:", e);
    }
  }
  
  // DOM이 준비된 뒤 실행 (안전)
  document.addEventListener("DOMContentLoaded", loadTopBanner);