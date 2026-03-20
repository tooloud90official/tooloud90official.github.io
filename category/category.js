// category.js
import { loadNativeSelect } from '/_common/select/select.js';
import { supabase } from '/_ignore/supabase.js';

// ─── 카테고리 매핑 테이블 ───────────────────────────────────────────
const CAT_MAP = {
  media: "이미지·오디오·영상",
  res:   "리서치",
  doc:   "문서 생성·요약·편집",
  dev:   "개발·코딩",
  edu:   "학습·교육",
  ast:   "챗봇·어시스턴트"
};

const SUBCAT_MAP = {
  img_gen:   "이미지 생성",
  img_edit:  "이미지 편집",
  vid_gen:   "영상 생성",
  vid_edit:  "영상 편집",
  aud_gen:   "음성 생성",
  audi_edit: "오디오 편집",
  res_paper: "논문 리서치",
  res_img:   "이미지 리서치",
  res_shop:  "쇼핑 리서치",
  doc_gen:   "문서 생성",
  doc_sum:   "문서 요약",
  doc_edit:  "문서 편집",
  dev_gen:   "코드 생성",
  dev_bld:   "웹/앱 빌더",
  edu_lan:   "언어",
  edu_supp:  "학습 보조",
  ast_gen:   "범용적 AI",
  ast_work:  "워크플로우/협업"
};

const CAT_CODE = Object.fromEntries(
  Object.entries(CAT_MAP).map(([code, label]) => [label, code])
);

const SUBCAT_ORDER = {
  media: ["img_gen", "img_edit", "vid_gen", "vid_edit", "aud_gen", "audi_edit"],
  res:   ["res_paper", "res_img", "res_shop"],
  doc:   ["doc_gen", "doc_sum", "doc_edit"],
  dev:   ["dev_gen", "dev_bld"],
  edu:   ["edu_lan", "edu_supp"],
  ast:   ["ast_gen", "ast_work"]
};

// ─── 전역 캐시 ─────────────────────────────────────────────────────
let allTools   = [];
let dataLoaded = false;

// ✅ 로그인 유저 + 핀 상태 전역 관리
let currentUser  = null;
let pinnedToolIds = new Set();

// ─── tool_des 단답 → 완전한 문장으로 변환 ──────────────────────────
function formatDesc(raw) {
  if (!raw || !raw.trim()) return '소개가 없습니다.';
  const trimmed = raw.trim();
  if (/[.!?。]$/.test(trimmed)) return trimmed;
  return trimmed + '입니다.';
}

// ─── tool_reviews 평균 평점 조회 ───────────────────────────────────
async function fetchAvgRatings(toolIDs) {
  if (!toolIDs.length) return {};

  const { data, error } = await supabase
    .from('tool_reviews')
    .select('tool_id, rating')
    .in('tool_id', toolIDs);

  if (error) {
    console.error('평점 조회 오류:', error);
    return {};
  }

  const map = {};
  const counts = {};
  (data || []).forEach(row => {
    if (!map[row.tool_id]) { map[row.tool_id] = 0; counts[row.tool_id] = 0; }
    map[row.tool_id] += row.rating;
    counts[row.tool_id] += 1;
  });

  const avgMap = {};
  Object.keys(map).forEach(id => {
    avgMap[id] = Math.round(map[id] / counts[id]);
  });
  return avgMap;
}

// ✅ DB에서 현재 favorite_tools 불러오기
async function fetchPinnedTools() {
  if (!currentUser) return;

  const { data, error } = await supabase
    .from('users')
    .select('favorite_tools')
    .eq('user_id', currentUser.id)
    .single();

  if (error) {
    console.error('[pin] favorite_tools 조회 실패:', error.message);
    return;
  }

  const raw = data?.favorite_tools;
  if (!Array.isArray(raw)) return;

  const parsed = raw.map(item => {
    if (typeof item === 'string') return item;
    if (typeof item === 'object' && item !== null) return item.tool_ID ?? item.id ?? null;
    return null;
  }).filter(Boolean);

  pinnedToolIds = new Set(parsed);
}

// ✅ 핀 토글 → DB 저장
async function togglePin(tool, pinIconEl) {
  if (!currentUser) {
    alert('로그인이 필요합니다.');
    return;
  }

  const toolId = tool.tool_ID;
  const isPinned = pinnedToolIds.has(toolId);

  if (isPinned) {
    pinnedToolIds.delete(toolId);
    pinIconEl.classList.remove('pinned');
  } else {
    pinnedToolIds.add(toolId);
    pinIconEl.classList.add('pinned');
  }

  const { data, error: fetchError } = await supabase
    .from('users')
    .select('favorite_tools')
    .eq('user_id', currentUser.id)
    .single();

  if (fetchError) {
    console.error('[pin] 조회 실패:', fetchError.message);
    return;
  }

  const raw = data?.favorite_tools ?? [];
  let currentIds = raw.map(item => {
    if (typeof item === 'string') return item;
    if (typeof item === 'object' && item !== null) return item.tool_ID ?? item.id ?? null;
    return null;
  }).filter(Boolean);

  if (isPinned) {
    currentIds = currentIds.filter(id => id !== toolId);
  } else {
    if (!currentIds.includes(toolId)) {
      currentIds.push(toolId);
    }
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({ favorite_tools: currentIds })
    .eq('user_id', currentUser.id);

  if (updateError) {
    console.error('[pin] 저장 실패:', updateError.message);
    if (isPinned) {
      pinnedToolIds.add(toolId);
      pinIconEl.classList.add('pinned');
    } else {
      pinnedToolIds.delete(toolId);
      pinIconEl.classList.remove('pinned');
    }
    alert('저장 중 오류가 발생했습니다.');
  } else {
    console.log('[favorite] 저장 완료. isPinned →', !isPinned, '/ tool:', tool.tool_name);
  }
}

// ─── Supabase에서 전체 툴 + 평점 로드 ─────────────────────────────
async function loadAllTools() {
  if (dataLoaded) return;

  const { data, error } = await supabase
    .from('tools')
    .select('tool_ID, tool_cat, tool_subcat, icon, tool_name, tool_des');

  if (error) {
    console.error('Supabase 조회 오류:', error);
    return;
  }

  const tools = data || [];
  const toolIDs = tools.map(t => t.tool_ID);
  const avgMap = await fetchAvgRatings(toolIDs);

  allTools = tools.map(t => ({
    ...t,
    rating: avgMap[t.tool_ID] ?? 0
  }));

  dataLoaded = true;
}

// ─── 탭 클릭 시 폴더 렌더링 ────────────────────────────────────────
function renderFolders(categoryLabel) {
  const toolGrid = document.getElementById('toolGrid');
  if (!toolGrid) return;
  toolGrid.innerHTML = '';

  const catCode = CAT_CODE[categoryLabel];
  if (!catCode) return;

  const subcatCodes = SUBCAT_ORDER[catCode] || [];

  subcatCodes.forEach(subcatCode => {
    const toolsInFolder = allTools.filter(t => t.tool_subcat === subcatCode);
    const folderTitle = SUBCAT_MAP[subcatCode] || subcatCode;

    const groupDiv = document.createElement('div');
    groupDiv.className = 'tool-group';

    const previewIcons = toolsInFolder.slice(0, 4).map(t =>
      t.icon
        ? `<div class="mini-icon" style="background-image:url('${t.icon}'); background-size:cover; background-position:center;"></div>`
        : `<div class="mini-icon"></div>`
    );
    while (previewIcons.length < 4) previewIcons.push(`<div class="mini-icon"></div>`);

    groupDiv.innerHTML = `
      <div class="tool-icon-box">
        ${previewIcons.join('')}
      </div>
      <span class="group-title">${folderTitle}</span>
    `;

    groupDiv.addEventListener('click', () => openModal({
      title: folderTitle,
      tools: toolsInFolder
    }));

    toolGrid.appendChild(groupDiv);
  });
}

// ─── 모달 내 툴 목록 렌더링 ────────────────────────────────────────
function renderToolList(tools, sortValue) {
  let sorted = [...tools];

  if (sortValue === 'name') {
    sorted.sort((a, b) => a.tool_name.localeCompare(b.tool_name));
  } else if (sortValue === 'rating') {
    sorted.sort((a, b) => b.rating - a.rating);
  }

  const toolListEl = document.getElementById('toolList');
  if (!toolListEl) return;
  toolListEl.innerHTML = '';

  if (sorted.length === 0) {
    toolListEl.innerHTML = "<p style='text-align:center; color:#888; margin-top:50px;'>등록된 툴이 없습니다.</p>";
    return;
  }

  sorted.forEach(tool => {
    const rating   = tool.rating || 0;
    const stars = `<span style="color:orange;">${'★'.repeat(rating)}</span><span style="color:#ccc;">${'★'.repeat(Math.max(0, 5 - rating))}</span>`;
    const desc     = formatDesc(tool.tool_des);
    const isPinned = pinnedToolIds.has(tool.tool_ID);

    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <div class="tool-icon-wrap" style="width:70px; height:70px; flex-shrink:0; border-radius:16px; overflow:hidden; background:#f0f0f0;">
        ${tool.icon
          ? `<img src="${tool.icon}" alt="${tool.tool_name}" style="width:100%; height:100%; object-fit:cover;" />`
          : `<div style="width:100%; height:100%; background:#dde4ef;"></div>`
        }
      </div>
      <div style="flex:1; position:relative;">
        <img class="pin-icon${isPinned ? ' pinned' : ''}" src="/media/pin.png" alt="pin" title="${isPinned ? '관심 툴 해제' : '관심 툴 추가'}" />
        <div style="display:flex; flex-direction:row; align-items:center; gap:8px;">
          <span class="item-badge">${tool.tool_name}</span>
          <span style="font-size:14px;" title="${rating}점">${stars}</span>
        </div>
        <p class="item-desc">${desc}</p>
        <a href="/detail_AI/detail_AI.html?tool_ID=${tool.tool_ID}" class="item-detail-btn">상세 ></a>
      </div>
    `;

    // 핀 클릭 → DB 저장 (버블링 차단)
    const pinEl = item.querySelector('.pin-icon');
    pinEl.addEventListener('click', async (e) => {
      e.stopPropagation();
      await togglePin(tool, pinEl);
    });

    // 상세 링크 클릭 → 버블링 차단 (카드 클릭과 중복 방지)
    const detailBtn = item.querySelector('.item-detail-btn');
    if (detailBtn) {
      detailBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = `/detail_AI/detail_AI.html?tool_ID=${tool.tool_ID}`;
      });
    }

    // 카드 전체 클릭 → 상세 페이지 이동
    item.addEventListener('click', () => {
      window.location.href = `/detail_AI/detail_AI.html?tool_ID=${tool.tool_ID}`;
    });

    toolListEl.appendChild(item);
  });
}

// ─── 모달 열기 ─────────────────────────────────────────────────────
async function openModal(folderData) {
  const modal      = document.getElementById('modalOverlay');
  const modalTitle = document.getElementById('modalTitle');
  const modalCount = document.getElementById('modalTotalCount');

  if (!modal || !folderData) return;

  modalTitle.textContent = folderData.title;
  const tools = folderData.tools || [];
  modalCount.textContent = `전체 (${tools.length})`;

  await loadNativeSelect({
    target: '#modalSortSelect',
    placeholder: '이름 순',
    value: 'name',
    options: [
      { label: '이름 순', value: 'name'   },
      { label: '평점 순', value: 'rating' }
    ],
    onChange: (item) => renderToolList(tools, item.value)
  });

  renderToolList(tools, 'name');

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// ─── DOMContentLoaded ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  const tabs     = document.querySelectorAll('.tab-item');
  const modal    = document.getElementById('modalOverlay');
  const closeBtn = document.getElementById('closeModal');

  const toolGrid = document.getElementById('toolGrid');
  if (toolGrid) {
    toolGrid.innerHTML = `<p style="color:#aaa; text-align:center; width:100%; padding:40px 0;">툴 데이터를 불러오는 중...</p>`;
  }

  const { data: { user } } = await supabase.auth.getUser();
  currentUser = user ?? null;

  await Promise.all([
    loadAllTools(),
    fetchPinnedTools(),
  ]);

  tabs.forEach(tab => {
    tab.addEventListener('click', function () {
      tabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      renderFolders(this.textContent.trim());
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  });

  const urlParams = new URLSearchParams(window.location.search);
  const tabParam  = urlParams.get('tab');

  let initialTab = "이미지·오디오·영상";
  if (tabParam) {
    const matchedTab = [...tabs].find(
      tab => tab.textContent.trim() === decodeURIComponent(tabParam)
    );
    if (matchedTab) {
      tabs.forEach(t => t.classList.remove('active'));
      matchedTab.classList.add('active');
      initialTab = matchedTab.textContent.trim();
    }
  }

  renderFolders(initialTab);
});