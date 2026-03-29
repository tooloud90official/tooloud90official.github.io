import { supabase } from '/_ignore/supabase.js';
import { searchCategories } from '/_ignore/groq.js';

/* ===== 문자열 정규화 (유사도 계산용) ===== */
function normalize(str) {
  return (str || '')
    .toLowerCase()
    .replace(/\s/g, '')
    .replace(/[^a-z0-9가-힣]/g, '');
}

/* ===== 자연어 → 핵심 토큰 분해 ===== */
// "고양이 사진을 그리는 AI 툴" → ["고양이", "사진", "그리는"]
const STOP_WORDS = new Set([
  '을', '를', '이', '가', '은', '는', '의', '에', '서', '로', '으로',
  '와', '과', '도', '만', '에서', '한', '하는', '해주는', '위한',
  '수', '있는', '있어요', '줘', '주는', '하고', '싶은', '좋은',
  'ai', 'AI', '툴', '도구', '앱', '프로그램', '소프트웨어',
]);

function tokenize(text) {
  return text
    .split(/\s+/)
    .map(t => t.replace(/[^a-zA-Z0-9가-힣]/g, ''))
    .filter(t => t.length >= 2 && !STOP_WORDS.has(t));
}

/* ===== Levenshtein 유사도 ===== */
function similarity(a, b) {
  const normA = normalize(a);
  const normB = normalize(b);

  if (!normA || !normB) return 0;
  if (normA.includes(normB) || normB.includes(normA)) return 0.95;

  const la = normA.length;
  const lb = normB.length;
  const matrix = Array.from({ length: lb + 1 }, (_, i) =>
    Array.from({ length: la + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= lb; i++) {
    for (let j = 1; j <= la; j++) {
      matrix[i][j] =
        normB[i - 1] === normA[j - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1]     + 1,
              matrix[i - 1][j]     + 1
            );
    }
  }

  return 1 - matrix[lb][la] / Math.max(la, lb);
}

/* ===== 토큰 기반 최대 유사도 ===== */
// 토큰 각각을 대상 필드와 비교해 가장 높은 점수 반환
function tokenSimilarity(tokens, target) {
  if (!tokens.length || !target) return 0;
  return Math.max(...tokens.map(t => similarity(t, target)));
}

/* ===== 카테고리 코드 → 한글 레이블 ===== */
const CAT_LABEL = {
  media: '이미지/오디오/영상', res: '리서치', doc: '문서',
  dev: '개발/코딩', edu: '학습/교육', ast: '챗봇/어시스턴트',
};
const SUBCAT_LABEL = {
  img_gen: '이미지 생성',  img_edit: '이미지 편집',
  vid_gen: '영상 생성',    vid_edit: '영상 편집',
  aud_gen: '음성 생성',    aud_edit: '오디오 편집',
  res_paper: '논문 리서치', res_img: '이미지 리서치', res_shop: '쇼핑 리서치',
  doc_gen: '문서 생성',    doc_sum: '문서 요약',     doc_edit: '문서 편집',
  dev_gen: '코드 생성',    dev_bld: '웹/앱 빌더',
  edu_lan: '언어',         edu_supp: '학습 보조',
  ast_gen: '생성형 AI',    ast_work: '협업',
};

/* ===== 툴 1개의 유사도 종합 점수 계산 ===== */
// 자연어는 토큰 분해 후 각 컬럼과 토큰별 최대 유사도로 계산
// tool_name(0.45) + tool_des(0.2) + tool_key(0.15) + tool_cat(0.1) + tool_subcat(0.1)
function calcToolScore(keyword, tool, tags) {
  const tokens = tokenize(keyword);
  const effectiveTokens = tokens.length > 0 ? tokens : [keyword]; // 단일 단어면 그대로 사용

  const nameScore   = tokenSimilarity(effectiveTokens, tool.tool_name);
  const descScore   = tokenSimilarity(effectiveTokens, tool.tool_des);
  const keyScore    = tokenSimilarity(effectiveTokens, tool.tool_key);
  const catScore    = tokenSimilarity(effectiveTokens, CAT_LABEL[tool.tool_cat]       || '');
  const subcatScore = tokenSimilarity(effectiveTokens, SUBCAT_LABEL[tool.tool_subcat] || '');

  const directScore =
    nameScore   * 0.45 +
    descScore   * 0.2  +
    keyScore    * 0.15 +
    catScore    * 0.1  +
    subcatScore * 0.1;

  if (!tags) return directScore;

  // Groq 태그 기반 추가 점수
  let tagBonus = 0;

  const simScore = tags._similarityMap?.[tool.tool_name] || 0;
  if (simScore > 0) tagBonus = Math.max(tagBonus, simScore * 0.5);

  if ((tags.recommended_cats    || []).includes(tool.tool_cat))    tagBonus += 0.2;
  if ((tags.recommended_subcats || []).includes(tool.tool_subcat)) tagBonus += 0.2;

  const normKey = normalize(tool.tool_key || '');
  const normDes = normalize(tool.tool_des  || '');
  for (const k of (tags.keywords || [])) {
    const nk = normalize(k);
    if (nk && (normKey.includes(nk) || normDes.includes(nk))) {
      tagBonus += 0.1;
      break;
    }
  }

  return directScore * 0.5 + Math.min(tagBonus, 1) * 0.5;
}

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
        { value: 'similarity', label: '관련도순' },
        { value: 'name',       label: '이름순'   },
        { value: 'rating',     label: '별점순'   },
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
    if (sortVal === 'similarity') {
      return Number(b.dataset.similarity || 0) - Number(a.dataset.similarity || 0);
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

/* ===== 데이터 조회 + 유사도 정렬 ===== */
async function fetchTools(groqResult, keyword) {

  const toolNames = groqResult?.tool_names || [];

  let toolQuery = supabase
    .from('tools')
    .select('tool_ID, tool_name, icon, tool_cat, tool_subcat, tool_link, tool_des, tool_key');

  if (groqResult) {
    const filters = [
      ...toolNames.map(n => `tool_name.ilike.%${n}%`),
      ...(groqResult.recommended_cats    || []).map(c => `tool_cat.eq.${c}`),
      ...(groqResult.recommended_subcats || []).map(s => `tool_subcat.eq.${s}`),
      ...(groqResult.keywords            || []).map(k => `tool_key.ilike.%${k}%`),
    ].join(',');

    if (filters) toolQuery = toolQuery.or(filters);
  } else {
    toolQuery = toolQuery.or(
      `tool_name.ilike.%${keyword}%,tool_key.ilike.%${keyword}%`
    );
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

  // 유사도 점수 계산 후 높은 순 정렬
  const withScore = tools.map(tool => ({
    ...tool,
    avg_rating: ratingMap[tool.tool_ID]
      ? Math.round(
          ratingMap[tool.tool_ID].reduce((a, b) => a + b, 0) /
          ratingMap[tool.tool_ID].length
        )
      : 0,
    similarity_score: calcToolScore(keyword, tool, groqResult),
  }));

  withScore.sort((a, b) => b.similarity_score - a.similarity_score);

  return withScore;
}

/* ===== 헤더 ===== */
function updateHeader(keyword, count) {
  document.getElementById('result-keyword').textContent = `"${keyword}"`;
  document.getElementById('result-count').textContent   = count;
}

/* ===== 최근 사용한 툴 저장 (슬라이딩 윈도우 8개) ===== */
async function saveRecentTool(toolId) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.warn('[recentTools] 로그인 유저 없음, 저장 생략');
      return;
    }

    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('recent_tools')
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      console.error('[recentTools] 유저 데이터 조회 실패:', fetchError.message);
      return;
    }

    const current = Array.isArray(userData?.recent_tools) ? userData.recent_tools : [];

    // 중복 제거 후 맨 앞에 추가, 8개 초과 시 오래된 것 삭제
    const updated = [toolId, ...current.filter(id => id !== toolId)].slice(0, 8);

    const { error: updateError } = await supabase
      .from('users')
      .update({ recent_tools: updated })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('[recentTools] 저장 실패:', updateError.message);
    }

  } catch (e) {
    console.error('[recentTools] 예외 발생:', e.message);
  }
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
    card.className          = 'tool-card';
    card.dataset.url        = `/detail_AI/detail_AI.html?tool_ID=${tool.tool_ID}`;
    card.dataset.link       = tool.tool_link || '';
    card.dataset.toolId     = tool.tool_ID;
    card.dataset.rating     = rating;
    card.dataset.similarity = tool.similarity_score || 0;

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

    // 🔥 외부 링크 클릭 시 최근 사용한 툴 저장
    card.querySelector('.tool-icon')?.addEventListener('click', () => {
      const link   = card.dataset.link;
      const toolId = card.dataset.toolId;

      if (link) {
        saveRecentTool(toolId);
        window.open(link, '_blank');
      }
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