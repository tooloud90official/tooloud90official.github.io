// login5.js
// 경로: minju/login5/login5.js

document.addEventListener("DOMContentLoaded", () => {

  // ===== 메인페이지로 버튼 =====
  document.getElementById('goMainBtn').addEventListener('click', () => {
    localStorage.setItem('isLoggedIn', 'true');
    window.location.href = '/main1/main1.html';

  });

});