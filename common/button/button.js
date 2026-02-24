async function loadButton({
  target,
  text = "버튼",
  variant = "primary",
  onClick = null
}) {
  const res = await fetch('/common/button/button.html');
  const html = await res.text();

  const container = document.querySelector(target);
  container.innerHTML = html;

  const btn = container.querySelector('.btn');

  /* 텍스트 */
  btn.textContent = text;

  /* variant */
  btn.classList.add(`btn-${variant}`);

  /* 클릭 이벤트 */
  if (onClick) {
    btn.addEventListener('click', onClick);
  }
}