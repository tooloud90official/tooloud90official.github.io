async function loadTopBanner() {
  const target = document.getElementById("top-banner");
  if (!target) return;

  try {
    const res = await fetch("/common/top-banner/top-banner.html");

    if (!res.ok) {
      throw new Error(`배너 파일 로드 실패: ${res.status}`);
    }

    target.innerHTML = await res.text();

  } catch (e) {
    console.error("배너 불러오기 실패:", e);
  }
}

document.addEventListener("DOMContentLoaded", loadTopBanner);