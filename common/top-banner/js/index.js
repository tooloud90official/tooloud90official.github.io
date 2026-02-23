// 배너가 include.js로 나중에 들어오므로, 이벤트는 "위임" 방식으로 처리
document.addEventListener("click", (e) => {
    const toggle = e.target.closest("#menuToggle");
    const authBtn = e.target.closest("#authBtn");
    const logo = e.target.closest("#logo");
  
    if (toggle) {
      const navMenu = document.getElementById("navMenu");
      if (navMenu) {
        navMenu.classList.toggle("open");
      }
    }
  
    if (authBtn) {
      alert("로그인 / 회원가입 버튼 클릭");
    }
  
    if (logo) {
      alert("로고 클릭");
    }
  });
  
  // 키보드 접근성(엔터/스페이스로 모바일 메뉴)
  document.addEventListener("keydown", (e) => {
    const toggle = e.target.closest("#menuToggle");
    if (!toggle) return;
  
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const navMenu = document.getElementById("navMenu");
      if (navMenu) {
        navMenu.classList.toggle("open");
      }
    }
  });