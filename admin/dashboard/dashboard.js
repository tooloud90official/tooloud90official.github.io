import { supabase } from '/_ignore/supabase.js';

// ─────────────────────────────────────────────────────────
// 관리자 권한 체크
// ─────────────────────────────────────────────────────────
let adminUserId = null;

(async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    window.location.href = '/admin/admin.html';
    return;
  }

  const { data, error } = await supabase
    .from('users')
    .select('role, user_id')
    .eq('user_id', user.id)
    .single();

  if (error || data?.role !== 'admin') {
    await supabase.auth.signOut();
    window.location.href = '/admin/admin.html';
    return;
  }

  adminUserId = data.user_id;
})();

// ─────────────────────────────────────────────────────────
// 상단 메인 탭 전환
// ─────────────────────────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('is-active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('is-active'));

    btn.classList.add('is-active');
    document.getElementById(`tab-${btn.dataset.tab}`)?.classList.add('is-active');

    if (btn.dataset.tab === 'stats') loadStats();
    if (btn.dataset.tab === 'tools') loadTools();
    if (btn.dataset.tab === 'users') loadUsers();
    if (btn.dataset.tab === 'inquiries') loadInquiries();
  });
});

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.href = '/admin/admin.html';
});

// ─────────────────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────────────────
const formatDate = str =>
  str ? new Date(str).toLocaleDateString('ko-KR') : '-';

const esc = str =>
  str
    ? String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
    : '';

const SLIDER_LABELS = ["$0", "$1–19.99", "$20–39.99", "$40–59.99", "$60+"];

// 가격 문자열 → USD 숫자 변환
function parsePriceToUSD(value) {
  if (!value) return null;

  const raw = String(value).trim().replace(/,/g, '');

  if (raw === '$0' || raw === '₩0' || /free|무료/i.test(raw)) {
    return 0;
  }

  if (raw.includes('$')) {
    const num = parseFloat(raw.replace(/[^0-9.]/g, ''));
    return Number.isFinite(num) ? num : null;
  }

  if (raw.includes('₩') || raw.includes('원')) {
    const krw = parseFloat(raw.replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(krw)) return null;
    return krw / 1500;
  }

  const num = parseFloat(raw.replace(/[^0-9.]/g, ''));
  return Number.isFinite(num) ? num : null;
}

// USD → class index
function getPriceClassIndex(usd) {
  if (usd == null || Number.isNaN(usd)) return null;
  if (usd === 0) return 1;
  if (usd < 20) return 2;
  if (usd < 40) return 3;
  if (usd < 60) return 4;
  return 5;
}

// plan 가격들 → class 값 세트 생성
function getAutoPriceClasses(...prices) {
  const classSet = new Set();

  prices.forEach(price => {
    const usd = parsePriceToUSD(price);
    const idx = getPriceClassIndex(usd);
    if (idx) classSet.add(idx);
  });

  return {
    tool_class1: classSet.has(1) ? SLIDER_LABELS[0] : null,
    tool_class2: classSet.has(2) ? SLIDER_LABELS[1] : null,
    tool_class3: classSet.has(3) ? SLIDER_LABELS[2] : null,
    tool_class4: classSet.has(4) ? SLIDER_LABELS[3] : null,
    tool_class5: classSet.has(5) ? SLIDER_LABELS[4] : null,
  };
}

// 마지막 탭 체크박스 UI 동기화
function syncClassCheckboxesFromPrices() {
  const plan1Price = document.getElementById('f_plan1_price')?.value.trim() || '';
  const plan2Price = document.getElementById('f_plan2_price')?.value.trim() || '';
  const plan3Price = document.getElementById('f_plan3_price')?.value.trim() || '';

  const autoClasses = getAutoPriceClasses(plan1Price, plan2Price, plan3Price);

  for (let i = 1; i <= 5; i++) {
    const el = document.getElementById(`f_class${i}`);
    if (!el) continue;

    el.value = SLIDER_LABELS[i - 1];
    el.checked = !!autoClasses[`tool_class${i}`];
    el.disabled = true;
  }
}

// ─────────────────────────────────────────────────────────
// 1. 통계
// ─────────────────────────────────────────────────────────
async function loadStats() {
  const [
    { count: uc },
    { count: tc },
    { count: wc },
    { count: ic },
    { data: usersChart }
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('tools').select('*', { count: 'exact', head: true }),
    supabase.from('works').select('*', { count: 'exact', head: true }),
    supabase.from('inquiries').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('users').select('created_at').order('created_at', { ascending: true }),
  ]);

  document.getElementById('statUsers').textContent = uc ?? 0;
  document.getElementById('statTools').textContent = tc ?? 0;
  document.getElementById('statWorks').textContent = wc ?? 0;
  document.getElementById('statInquiries').textContent = ic ?? 0;

  renderChart(usersChart || []);
}

function renderChart(users) {
  const container = document.getElementById('chartContainer');
  if (!container) return;

  const now = new Date();

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      label: `${d.getMonth() + 1}월`,
      year: d.getFullYear(),
      month: d.getMonth(),
    };
  });

  const counts = months.map(m =>
    users.filter(u => {
      if (!u.created_at) return false;
      const d = new Date(u.created_at);
      if (isNaN(d)) return false;
      return d.getFullYear() === m.year && d.getMonth() === m.month;
    }).length
  );

  const max = Math.max(...counts, 1);

  container.innerHTML = counts.map((c, i) => `
    <div class="chart-bar-wrap">
      <div class="chart-bar-outer">
        <div class="chart-tooltip">${c}명</div>
        <div class="chart-bar" style="height:${Math.max((c / max) * 140, 4)}px"></div>
      </div>
      <span class="chart-label">${months[i].label}</span>
    </div>
  `).join('');
}

// ─────────────────────────────────────────────────────────
// 2. 툴 관리 + 모달 탭
// ─────────────────────────────────────────────────────────
let allTools = [];
let currentStep = 0;
const TOTAL_STEPS = 4;

async function loadTools() {
  const { data, error } = await supabase
    .from('tools')
    .select('tool_ID, tool_name, tool_company, tool_cat, tool_key, tool_link')
    .order('tool_name', { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  allTools = data || [];
  renderToolsTable(allTools);
}

function renderToolsTable(tools) {
  const tbody = document.getElementById('toolsBody');
  if (!tbody) return;

  if (!tools.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-sub);padding:32px;">데이터 없음</td></tr>';
    return;
  }

  tbody.innerHTML = tools.map(t => `
    <tr>
      <td>${esc(t.tool_name)}</td>
      <td>${esc(t.tool_company) || '-'}</td>
      <td>${esc(t.tool_cat) || '-'}</td>
      <td>${esc(t.tool_key) || '-'}</td>
      <td>${t.tool_link ? `<a href="${esc(t.tool_link)}" target="_blank">링크 ↗</a>` : '-'}</td>
      <td>
        <button class="btn-icon" onclick="openEditTool('${esc(t.tool_ID)}')">수정</button>
        <button class="btn-icon danger" onclick="deleteTool('${esc(t.tool_ID)}')">삭제</button>
      </td>
    </tr>
  `).join('');
}

document.getElementById('toolSearch')?.addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  renderToolsTable(allTools.filter(t => t.tool_name?.toLowerCase().includes(q)));
});

// step 이동
function goToStep(step) {
  const normalizedStep = Math.max(0, Math.min(step, TOTAL_STEPS - 1));

  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('is-active'));
  document.querySelectorAll('.step-dot').forEach(d => d.classList.remove('is-active'));
  document.querySelectorAll('.step-label').forEach(l => l.classList.remove('is-active'));

  document.querySelector(`.step-panel[data-step="${normalizedStep}"]`)?.classList.add('is-active');
  document.querySelector(`.step-dot[data-step="${normalizedStep}"]`)?.classList.add('is-active');
  document.querySelector(`.step-label[data-step="${normalizedStep}"]`)?.classList.add('is-active');

  const prevBtn = document.getElementById('toolStepPrev');
  const nextBtn = document.getElementById('toolStepNext');
  const saveBtn = document.getElementById('toolModalSave');

  if (prevBtn) prevBtn.style.display = normalizedStep > 0 ? 'inline-flex' : 'none';
  if (nextBtn) nextBtn.style.display = normalizedStep < TOTAL_STEPS - 1 ? 'inline-flex' : 'none';
  if (saveBtn) saveBtn.style.display = normalizedStep === TOTAL_STEPS - 1 ? 'inline-flex' : 'none';

  currentStep = normalizedStep;

  if (normalizedStep === 3) {
    syncClassCheckboxesFromPrices();
  }
}

// 모달 탭/점 클릭 가능
function bindToolModalStepTabs() {
  document.querySelectorAll('.step-label').forEach(label => {
    label.style.cursor = 'pointer';
    label.addEventListener('click', () => {
      const step = Number(label.dataset.step);
      if (Number.isInteger(step)) goToStep(step);
    });
  });

  document.querySelectorAll('.step-dot').forEach(dot => {
    dot.style.cursor = 'pointer';
    dot.addEventListener('click', () => {
      const step = Number(dot.dataset.step);
      if (Number.isInteger(step)) goToStep(step);
    });
  });
}

document.getElementById('toolStepNext')?.addEventListener('click', () => {
  if (currentStep === 0 && !document.getElementById('f_tool_name')?.value.trim()) {
    alert('툴 이름을 입력해주세요.');
    return;
  }

  if (currentStep < TOTAL_STEPS - 1) {
    goToStep(currentStep + 1);
  }
});

document.getElementById('toolStepPrev')?.addEventListener('click', () => {
  if (currentStep > 0) {
    goToStep(currentStep - 1);
  }
});

// 모달 열기
function openToolModal(tool = null) {
  document.getElementById('toolModalTitle').textContent = tool ? '툴 수정' : '툴 추가';
  document.getElementById('toolId').value = tool?.tool_ID || '';

  // 1. 기본 정보
  document.getElementById('f_tool_name').value = tool?.tool_name || '';
  document.getElementById('f_tool_company').value = tool?.tool_company || '';
  document.getElementById('f_tool_cat').value = tool?.tool_cat || 'media';
  document.getElementById('f_tool_subcat').value = tool?.tool_subcat || '';
  document.getElementById('f_tool_key').value = tool?.tool_key || '';

  // 2. 소개 · 링크
  document.getElementById('f_icon').value = tool?.icon || '';
  document.getElementById('f_tool_des').value = tool?.tool_des || '';
  document.getElementById('f_tool_link').value = tool?.tool_link || '';

  document.getElementById('f_iframe').value =
    tool?.iframe === true ? 'true'
    : tool?.iframe === false ? 'false'
    : '';

  // 3. 요금제
// 3. 요금제
document.getElementById('f_pricing').value = tool?.pricing || '';

document.getElementById('f_plan1_name').value = tool?.tool_plan1_name || '';
document.getElementById('f_plan1_price').value = tool?.tool_plan1_price_krw || '';
document.getElementById('f_plan1_des').value = tool?.tool_plan1_des || '';

document.getElementById('f_plan2_name').value = tool?.tool_plan2_name || '';
document.getElementById('f_plan2_price').value = tool?.tool_plan2_price_krw || '';
document.getElementById('f_plan2_des').value = tool?.tool_plan2_des || '';

document.getElementById('f_plan3_name').value = tool?.tool_plan3_name || '';
document.getElementById('f_plan3_price').value = tool?.tool_plan3_price_krw || '';
document.getElementById('f_plan3_des').value = tool?.tool_plan3_des || '';

  // 4. 가격대 · 기타
  document.getElementById('f_tool_prom').value = tool?.tool_prom || '';
  document.getElementById('f_tool_plan_etc').value = tool?.tool_plan_etc || '';

  for (let i = 1; i <= 5; i++) {
    const el = document.getElementById(`f_class${i}`);
    if (!el) continue;
    el.value = SLIDER_LABELS[i - 1];
    el.checked = !!tool?.[`tool_class${i}`];
    el.disabled = true;
  }

  syncClassCheckboxesFromPrices();
  goToStep(0);
  document.getElementById('toolModal').style.display = 'flex';
}

document.getElementById('addToolBtn')?.addEventListener('click', () => openToolModal());

window.openEditTool = async (id) => {
  const { data, error } = await supabase
    .from('tools')
    .select('*')
    .eq('tool_ID', id)
    .single();

  if (error) {
    alert('불러오기 실패: ' + error.message);
    return;
  }

  openToolModal(data);
};

// plan 가격 입력 시 class 자동 반영
['f_plan1_price', 'f_plan2_price', 'f_plan3_price'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;

  el.addEventListener('input', syncClassCheckboxesFromPrices);
  el.addEventListener('change', syncClassCheckboxesFromPrices);
});

// 모달 닫기
['toolModalClose', 'toolModalCancel'].forEach(id => {
  document.getElementById(id)?.addEventListener('click', () => {
    document.getElementById('toolModal').style.display = 'none';
  });
});

// 툴 저장
document.getElementById('toolModalSave')?.addEventListener('click', async () => {
  const id = document.getElementById('toolId').value;
  const iframeValue = document.getElementById('f_iframe').value;

  const plan1Price = document.getElementById('f_plan1_price').value.trim();
  const plan2Price = document.getElementById('f_plan2_price').value.trim();
  const plan3Price = document.getElementById('f_plan3_price').value.trim();

  const autoClasses = getAutoPriceClasses(plan1Price, plan2Price, plan3Price);

  const payload = {
    tool_name: document.getElementById('f_tool_name').value.trim(),
    tool_company: document.getElementById('f_tool_company').value.trim(),
    tool_cat: document.getElementById('f_tool_cat').value,
    tool_subcat: document.getElementById('f_tool_subcat').value.trim(),
    tool_key: document.getElementById('f_tool_key').value.trim(),

    icon: document.getElementById('f_icon').value.trim(),
    tool_des: document.getElementById('f_tool_des').value.trim(),
    tool_link: document.getElementById('f_tool_link').value.trim(),

    iframe:
      iframeValue === 'true' ? true :
      iframeValue === 'false' ? false :
      null,

    pricing: document.getElementById('f_pricing').value.trim(),

    tool_plan1_name: document.getElementById('f_plan1_name').value.trim(),
    tool_plan1_price_krw: plan1Price,
    tool_plan1_des: document.getElementById('f_plan1_des').value.trim(),

    tool_plan2_name: document.getElementById('f_plan2_name').value.trim(),
    tool_plan2_price_krw: plan2Price,
    tool_plan2_des: document.getElementById('f_plan2_des').value.trim(),

    tool_plan3_name: document.getElementById('f_plan3_name').value.trim(),
    tool_plan3_price_krw: plan3Price,
    tool_plan3_des: document.getElementById('f_plan3_des').value.trim(),

    tool_prom: document.getElementById('f_tool_prom').value.trim(),
    tool_plan_etc: document.getElementById('f_tool_plan_etc').value.trim(),

    ...autoClasses,
  };

  if (!payload.tool_name) {
    alert('툴 이름을 입력해주세요.');
    return;
  }

  const { error } = id
    ? await supabase.from('tools').update(payload).eq('tool_ID', id)
    : await supabase.from('tools').insert(payload);

  if (error) {
    alert('저장 실패: ' + error.message);
    return;
  }

  document.getElementById('toolModal').style.display = 'none';
  await loadTools();
});

window.deleteTool = async (id) => {
  if (!confirm('정말 삭제하시겠습니까?')) return;

  const { error } = await supabase
    .from('tools')
    .delete()
    .eq('tool_ID', id);

  if (error) {
    alert('삭제 실패: ' + error.message);
    return;
  }

  await loadTools();
};

// ─────────────────────────────────────────────────────────
// 3. 사용자 관리
// ─────────────────────────────────────────────────────────
let allUsers = [];

async function loadUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('user_id, user_name, user_country, user_age, user_job, role')
    .order('user_name', { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  allUsers = data || [];
  renderUsersTable(allUsers);
}

function renderUsersTable(users) {
  const tbody = document.getElementById('usersBody');
  if (!tbody) return;

  if (!users.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-sub);padding:32px;">데이터 없음</td></tr>';
    return;
  }

  tbody.innerHTML = users.map(u => `
    <tr>
      <td>${esc(u.user_name) || '-'}</td>
      <td>${esc(u.user_job) || '-'}</td>
      <td>${esc(u.user_country) || '-'}</td>
      <td>${esc(u.user_age) || '-'}</td>
      <td><span class="badge ${u.role === 'admin' ? 'badge-admin' : 'badge-user'}">${u.role === 'admin' ? '관리자' : '일반'}</span></td>
      <td>
        <button class="btn-icon" onclick="toggleUserRole('${esc(u.user_id)}','${u.role}')">
          ${u.role === 'admin' ? '권한 해제' : '관리자 지정'}
        </button>
      </td>
    </tr>
  `).join('');
}

document.getElementById('userSearch')?.addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  renderUsersTable(allUsers.filter(u => u.user_name?.toLowerCase().includes(q)));
});

window.toggleUserRole = async (userId, currentRole) => {
  const newRole = currentRole === 'admin' ? 'user' : 'admin';

  if (!confirm(`${newRole === 'admin' ? '관리자로 지정' : '일반 사용자로 변경'}하시겠습니까?`)) return;

  const { error } = await supabase
    .from('users')
    .update({ role: newRole })
    .eq('user_id', userId);

  if (error) {
    alert('변경 실패: ' + error.message);
    return;
  }

  await loadUsers();
};

// ─────────────────────────────────────────────────────────
// 4. 문의 관리
// ─────────────────────────────────────────────────────────
let allInquiries = [];
let currentFilter = 'all';

async function loadInquiries() {
  const { data, error } = await supabase
    .from('inquiries')
    .select('inquiry_id, user_id, question, question_created_at, status, answer, answer_created_at')
    .order('question_created_at', { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  allInquiries = data || [];
  renderInquiriesTable(allInquiries);
}

function renderInquiriesTable(list) {
  const filtered =
    currentFilter === 'all'
      ? list
      : list.filter(i => i.status === currentFilter);

  const tbody = document.getElementById('inquiriesBody');
  if (!tbody) return;

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-sub);padding:32px;">데이터 없음</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(i => `
    <tr>
      <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(i.question)}">
        ${esc(i.question)}
      </td>
      <td>
        <span class="badge ${i.status === 'answered' ? 'badge-answered' : 'badge-pending'}">
          ${i.status === 'answered' ? '답변완료' : '미답변'}
        </span>
      </td>
      <td>${formatDate(i.question_created_at)}</td>
      <td>${formatDate(i.answer_created_at)}</td>
      <td>
        <button class="btn-icon" onclick="openAnswerModal('${esc(i.inquiry_id)}')">
          ${i.status === 'answered' ? '답변 수정' : '답변하기'}
        </button>
      </td>
    </tr>
  `).join('');
}

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    currentFilter = btn.dataset.status;
    renderInquiriesTable(allInquiries);
  });
});

window.openAnswerModal = (id) => {
  const item = allInquiries.find(i => i.inquiry_id === id);
  if (!item) return;

  document.getElementById('inquiryId').value = item.inquiry_id;
  document.getElementById('inquiryUserId').value = item.user_id;
  document.getElementById('inquiryQuestion').value = item.question || '';
  document.getElementById('inquiryAnswer').value = item.answer || '';
  document.getElementById('inquiryModal').style.display = 'flex';
};

['inquiryModalClose', 'inquiryModalCancel'].forEach(id => {
  document.getElementById(id)?.addEventListener('click', () => {
    document.getElementById('inquiryModal').style.display = 'none';
  });
});

document.getElementById('inquiryModalSave')?.addEventListener('click', async () => {
  const inquiryId = document.getElementById('inquiryId').value;
  const userId = document.getElementById('inquiryUserId').value;
  const answer = document.getElementById('inquiryAnswer').value.trim();

  if (!answer) {
    alert('답변을 입력해주세요.');
    return;
  }

  const { error: answerError } = await supabase
    .from('inquiries')
    .update({
      answer,
      status: 'answered',
      answer_created_at: new Date().toISOString(),
    })
    .eq('inquiry_id', inquiryId);

  if (answerError) {
    alert('저장 실패: ' + answerError.message);
    return;
  }

  if (userId) {
    const { error: notiError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        sender_id: adminUserId,
        type: 'inquiry',
        reference_id: inquiryId,
        is_read: false,
        created_at: new Date().toISOString(),
      });

    if (notiError) {
      console.warn('알림 발송 실패:', notiError.message);
    }
  }

  document.getElementById('inquiryModal').style.display = 'none';
  await loadInquiries();
  alert('답변이 저장되고 유저에게 알림이 발송되었습니다.');
});

// ─────────────────────────────────────────────────────────
// 초기 실행
// ─────────────────────────────────────────────────────────
bindToolModalStepTabs();
goToStep(0);
loadStats();