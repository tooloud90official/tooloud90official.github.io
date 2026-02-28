/**
 * html 조각 로드 (탑 배너용)
 */
async function includeHTML(targetSelector, filePath) {
    const target = document.querySelector(targetSelector);
    if (!target) throw new Error(`[includeHTML] target not found: ${targetSelector}`);
  
    const res = await fetch(filePath);
    if (!res.ok) throw new Error(`[includeHTML] failed to load: ${filePath} (${res.status})`);
  
    const html = await res.text();
    target.insertAdjacentHTML("beforeend", html);
  }
  
  /**
   * 아이콘 컴포넌트 mount 생성 후 loadToolIconCard 호출
   * - /common/icon/icon.js 의 전역 함수 사용
   */
  function renderToolIcons(targetSelector, tools) {
    const container = document.querySelector(targetSelector);
    if (!container) return;
  
    if (typeof window.loadToolIconCard !== "function") {
      console.warn("loadToolIconCard not found. /common/icon/icon.js 확인");
      return;
    }
  
    // 기존 내용 비우기
    container.innerHTML = "";
  
    tools.forEach((tool, index) => {
      const mount = document.createElement("div");
      mount.className = "tool-icon-mount";
  
      const mountId = `${targetSelector.replace("#", "")}-icon-${index + 1}`;
      mount.id = mountId;
  
      container.appendChild(mount);
  
      window.loadToolIconCard(`#${mountId}`, {
        toolName: tool.toolName,
        url: tool.url || "#",
        onClick: tool.onClick || undefined
      });
    });
  }
  
  /* 샘플 데이터 (나중에 바꾸기 쉽게 배열만 분리) */
  const recommendedTools = [
    { toolName: "Chat GPT", url: "#" },
    { toolName: "Claude", url: "#" },
    { toolName: "Gemini", url: "#" },
    { toolName: "툴 #1", url: "#" },
    { toolName: "Midjourney", url: "#" },
    { toolName: "Gamma", url: "#" },
    { toolName: "Perplexity AI", url: "#" },
    { toolName: "툴 #1", url: "#" }
  ];
  
  const recentTools = [
    { toolName: "Chat GPT", url: "#" },
    { toolName: "Claude", url: "#" },
    { toolName: "Gemini", url: "#" },
    { toolName: "툴 #1", url: "#" },
    { toolName: "Midjourney", url: "#" },
    { toolName: "Gamma", url: "#" },
    { toolName: "Perplexity AI", url: "#" },
    { toolName: "툴 #1", url: "#" }
  ];
  
  const favoriteTools = [
    { toolName: "Chat GPT", url: "#" },
    { toolName: "Claude", url: "#" },
    { toolName: "Gemini", url: "#" },
    { toolName: "툴 #1", url: "#" },
    { toolName: "Midjourney", url: "#" },
    { toolName: "Gamma", url: "#" },
    { toolName: "Perplexity AI", url: "#" },
    { toolName: "툴 #1", url: "#" }
  ];
  
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      // top-banner.html 경로는 personal_AI.html과 같은 폴더(yujin/html)에 있다고 가정
      await includeHTML("#top-banner", "/common/top-banner/top-banner.html");
  
      renderToolIcons("#recommendedTools", recommendedTools);
      renderToolIcons("#recentTools", recentTools);
      renderToolIcons("#favoriteTools", favoriteTools);
    } catch (err) {
      console.error("[personal_AI] 초기화 실패:", err);
    }
  });