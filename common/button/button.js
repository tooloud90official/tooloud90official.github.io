async function loadButton({
  target,
  text = "버튼",
  variant = "primary",
  onClick = null
}) {
  const res = await fetch('/common/button/button.html');
  const html = await res.text();

  const container =
    typeof target === "string"
      ? document.querySelector(target)
      : target;

  container.innerHTML = html;

  const btn = container.querySelector('.btn');

  btn.textContent = text;
  btn.classList.add(`btn-${variant}`);

  if (onClick) btn.addEventListener('click', onClick);
}

export function initButton(el){
  console.log("button mounted", el);
}