async function loadTopBanner() {
  const target = document.getElementById("top-banner");
  if (!target) return;

  try {
    const res = await fetch("/common/top-banner/top-banner.html");
    const html = await res.text();
    target.innerHTML = html;
  } catch (e) {
    console.error(e);
  }
}

document.addEventListener("DOMContentLoaded", loadTopBanner);