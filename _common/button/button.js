window.loadButton = async function({
  target,
  text = "버튼",
  variant = "primary",
  size = "md",
  onClick = null
}) {
  const res = await fetch('/_common/button/button.html');
  const html = await res.text();

  const container =
    typeof target === "string"
      ? document.querySelector(target)
      : target;

  container.innerHTML = html;

  const btn = container.querySelector('.btn');
  btn.textContent = text;
  btn.classList.add(`btn-${variant}`);
  btn.classList.add(`btn-${size}`);
   
  if (onClick) btn.addEventListener('click', onClick);
};