async function loadSearchBar({
  target,
  placeholder = "검색어를 입력하세요",
  onSearch = null
}) {
  const res = await fetch('/common/searchBar/searchBar.html');
  const html = await res.text();

  const container = document.querySelector(target);
  container.innerHTML = html;

  const input = container.querySelector('.search-input');
  const button = container.querySelector('.search-btn');

  /* placeholder 변경 */
  input.placeholder = placeholder;

  /* 검색 실행 */
  function triggerSearch() {
    if (onSearch) {
      onSearch(input.value);
    }
  }

  button.addEventListener('click', triggerSearch);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      triggerSearch();
    }
  });
}