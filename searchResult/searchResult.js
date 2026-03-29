import { supabase } from '/_ignore/supabase.js';
import { searchCategories } from '/_ignore/groq.js';

/* ===== URL에서 키워드 추출 ===== */
function getKeyword() {
  const params = new URLSearchParams(window.location.search);
  return decodeURIComponent(params.get('keyword') || '').trim();
}

/* ===== 검색바 초기화 ===== */
function initSearchBar(keyword) {
  if (typeof window.loadSearchBar !== 'function') {
    console.error('[searchBar] loadSearchBar 없음');
    return;
  }

  window.loadSearchBar({
    target: '#searchbar-container',
    placeholder: keyword || '검색어를 입력하세요',
    onSearch: (value) => {
      const encoded = encodeURIComponent(value.trim());
      window.location.href = `/searchResult/searchResult.html?keyword=${encoded}`;
    }
  });
}

/* ===== 필터 초기화 ===== */
async function initFilters() {
  try {
    const { loadNativeSelect } = await import('/_common/select/select.js');

    await loadNativeSelect({
      target: '#filterSelect-sort',
      placeholder: '정렬',
      options: [
        { value: 'name',   label: '이름순' },
        { value: 'rating', label: '별점순' },
      ],
      onChange: ({ value }) => applySort(value),
    });

  } catch (e) {
    console.error('[filter] 초기화 실패:', e.message);
  }
}

/* ===== 정렬 ===== */
function applySort(sortVal) {
  const list  = document.querySelector('.result-list');
  const cards = Array.from(list.querySelectorAll('.tool-card'));

  cards.sort((a, b) => {
    if (sortVal === 'name') {
      const nameA = a.querySelector('.tool-name')?.textContent || '';
      const nameB = b.querySelector('.tool-name')?.textContent || '';
      return nameA.localeCompare(nameB, 'ko');
    }

    if (sortVal === 'rating') {
      return Number(b.dataset.rating || 0) - Number(a.dataset.rating || 0);
    }

    return 0;
  });

  cards.forEach(card => list.appendChild(card));
}

/* ===== Groq ===== */
async function extractTags(keyword) {
  try {
    return await searchCategories(keyword);
  } catch (e) {
    console.error('[groq] 실패:', e.message);
    return null;
  }
}

/* ===== 데이터 ===== */
async function fetchTools(groqResult, keyword) {

  const toolNames = groqResult?.tool_names || [];

  let toolQuery = supabase
    .from('tools')
    .select('tool_ID, tool_name, icon, tool_cat, tool_subcat, tool_link, tool_des, tool_key');

  if (groqResult) {
    const filters = [
      ...toolNames.map(n => `tool_name.ilike.%${n}%`),
      ...(groqResult.recommended_cats || []).map(c => `tool_cat.eq.${c}`),
      ...(groqResult.recommended_subcats || []).map(s => `tool_subcat.eq.${s}`),
      ...(groqResult.keywords || []).map(k => `tool_key.ilike.%${k}%`),
    ].join(',');

    if (filters) toolQuery = toolQuery.or(filters);
  } else {
    toolQuery = toolQuery.or(`tool_name.ilike.%${keyword}%,tool_key.ilike.%${keyword}%`);
  }

  const { data: tools } = await toolQuery;
  if (!tools) return [];

  // ⭐ 별점 가져오기
  const toolIds = tools.map(t => t.tool_ID);

  const { data: reviews } = await supabase
    .from('tool_reviews')
    .select('tool_id, rating')
    .in('tool_id', toolIds);

  const ratingMap = {};
  (reviews || []).forEach(r => {
    if (!ratingMap[r.tool_id]) ratingMap[r.tool_id] = [];
    ratingMap[r.tool_id].push(r.rating);
  });

  return tools.map(tool => ({
    ...tool,
    avg_rating: ratingMap[tool.tool_ID]
      ? Math.round(
          ratingMap[tool.tool_ID].reduce((a, b) => a + b, 0) /
          ratingMap[tool.tool_ID].length
        )
      : 0,
  }));
}

/* ===== 헤더 ===== */
function updateHeader(keyword, count) {
  document.getElementById('result-keyword').textContent = `"${keyword}"`;
  document.getElementById('result-count').textContent   = count;
}

/* ===== 렌더링 ===== */
function renderResults(tools, keyword) {
  const list = document.querySelector('.result-list');
  if (!list) return;

  updateHeader(keyword, tools.length);
  list.innerHTML = '';

  tools.forEach(tool => {

    const rating = tool.avg_rating || 0;
    const starFull  = '★'.repeat(Math.min(rating, 5));
    const starEmpty = '★'.repeat(Math.max(5 - rating, 0));

    const card = document.createElement('div');
    card.className      = 'tool-card';
    card.dataset.url    = `/detail_AI/detail_AI.html?tool_ID=${tool.tool_ID}`;
    card.dataset.link   = tool.tool_link || '';
    card.dataset.toolId = tool.tool_ID;
    card.dataset.rating = rating; // ⭐ 정렬용

    card.innerHTML = `
      <div class="tool-icon">
        <img src="${tool.icon || ''}">
      </div>
      <div class="tool-info">
        <div class="tool-top">
          <span class="tool-name">${tool.tool_name}</span>
          <span class="rating">
            <span style="color: orange;">${starFull}</span>
            <span style="color: #ccc;">${starEmpty}</span>
          </span>
        </div>
        <p class="tool-desc">${tool.tool_des || ''}</p>
      </div>
      <div class="tool-action">
        <span class="detail">상세 ></span>
      </div>
    `;

    list.appendChild(card);
  });

  bindDetailNavigation();
}

/* ===== 클릭 ===== */
function bindDetailNavigation() {
  document.querySelectorAll('.tool-card').forEach(card => {

    card.querySelector('.detail')?.addEventListener('click', () => {
      window.location.href = card.dataset.url;
    });

    card.querySelector('.tool-icon')?.addEventListener('click', () => {
      const link = card.dataset.link;
      if (link) window.open(link, '_blank');
    });
  });
}

/* ===== 메인 ===== */
async function initPage() {
  const keyword = getKeyword();

  initSearchBar(keyword);
  await initFilters();

  if (!keyword) {
    updateHeader('', 0);
    return;
  }

  const groqResult = await extractTags(keyword);
  const tools      = await fetchTools(groqResult, keyword);

  renderResults(tools, keyword);
}

document.addEventListener('DOMContentLoaded', initPage);