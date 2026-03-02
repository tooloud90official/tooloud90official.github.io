// /_common/confirm/include.js

window.includeHTML = async function(targetSelector, filePath) {
  const target = document.querySelector(targetSelector);
  if (!target) {
    throw new Error(`[includeHTML] target not found: ${targetSelector}`);
  }

  const res = await fetch(filePath);
  if (!res.ok) {
    throw new Error(`[includeHTML] failed to load: ${filePath} (${res.status})`);
  }

  const html = await res.text();
  target.insertAdjacentHTML('beforeend', html);

  return target;
};