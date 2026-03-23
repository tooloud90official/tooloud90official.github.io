// login4.js
import { supabase } from '/_ignore/supabase.js';

document.addEventListener("DOMContentLoaded", async () => {

  const MAX_SELECT = 5;

  const toolGrid      = document.getElementById('toolGrid');
  const selectedIcons = document.getElementById('selectedIcons');
  const selectedCount = document.getElementById('selectedCount');
  const progressFill  = document.getElementById('progressFill');
  const finishBtn     = document.getElementById('finishBtn');

  let selectedTools = [];
  let TOOLS = [];

  const { data, error } = await supabase
    .from("tools")
    .select("tool_ID, tool_name, icon")
    .order("tool_ID", { ascending: true });

  if (error || !data) {
    console.error("툴 로드 실패:", error);
    return;
  }

  TOOLS = data.map(t => ({
    id:   t.tool_ID,
    name: t.tool_name,
    img:  t.icon,
  }));

  function renderGrid() {
    toolGrid.innerHTML = '';
    TOOLS.forEach(tool => {
      const card = document.createElement('div');
      card.className = 'tool-icon-card';
      card.dataset.toolId = tool.id;
      card.innerHTML = `
        <span class="tool-icon-card__icon">
          <img src="${tool.img}" alt="${tool.name}" onerror="this.style.display='none'">
        </span>
        <span class="tool-icon-card__title">${tool.name}</span>
      `;
      if (selectedTools.includes(tool.id)) card.classList.add('is-selected');
      card.addEventListener('click', () => toggleTool(tool.id, card));
      toolGrid.appendChild(card);
    });
    updateMaxClass();
  }

  function toggleTool(id, cardEl) {
    const isSelected = selectedTools.includes(id);
    if (isSelected) {
      selectedTools = selectedTools.filter(t => t !== id);
      cardEl.classList.remove('is-selected');
    } else {
      if (selectedTools.length >= MAX_SELECT) return;
      selectedTools.push(id);
      cardEl.classList.add('is-selected');
    }
    updateMaxClass();
    renderSelected();
    updateCount();
  }

  function updateMaxClass() {
    toolGrid.classList.toggle('is-max', selectedTools.length >= MAX_SELECT);
  }

  function renderSelected() {
    selectedIcons.innerHTML = '';
    selectedTools.forEach(id => {
      const tool = TOOLS.find(t => t.id === id);
      if (!tool) return;
      const card = document.createElement('div');
      card.className = 'tool-icon-card';
      card.innerHTML = `
        <span class="tool-icon-card__icon">
          <img src="${tool.img}" alt="${tool.name}" onerror="this.style.display='none'">
        </span>
        <span class="tool-icon-card__title">${tool.name}</span>
      `;
      selectedIcons.appendChild(card);
    });
  }

  function updateCount() {
    const count = selectedTools.length;
    selectedCount.textContent = `${count}/${MAX_SELECT}`;
    progressFill.style.width = `${(count / MAX_SELECT) * 100}%`;
  }

  finishBtn.addEventListener('click', async () => {
    if (selectedTools.length === 0) {
      alert('최소 1개 이상의 툴을 선택해주세요.');
      return;
    }

    finishBtn.disabled = true;
    finishBtn.textContent = '처리 중...';

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        alert('로그인 정보가 없습니다. 처음부터 다시 진행해주세요.');
        window.location.href = '/login2/login2.html';
        return;
      }

      const nickname = sessionStorage.getItem('signup_nickname');
      const age      = sessionStorage.getItem('signup_age');
      const job      = sessionStorage.getItem('signup_job');
      const country  = sessionStorage.getItem('signup_country');

      if (!nickname) {
        alert('입력 정보가 없습니다. 처음부터 다시 진행해주세요.');
        window.location.href = '/login2/login2.html';
        return;
      }

      // ✅ avatar 랜덤 선택
      const avatarNum = Math.floor(Math.random() * 8) + 1;  // 4 → 8개
      const { data: avatarData } = supabase.storage
        .from("user_img")
        .getPublicUrl(`avatar${avatarNum}.jpg`);  // .jpg 추가
        
      const avatarUrl = avatarData?.publicUrl ?? null;

      const { error } = await supabase.from('users').insert({
        user_id        : session.user.id,
        user_name      : nickname,
        user_img       : avatarUrl,
        user_country   : country,
        user_age       : age,
        user_job       : job,
        favorite_tools : selectedTools,
      });

      if (error) throw error;

      ['signup_email', 'signup_password', 'signup_uid',
       'signup_nickname', 'signup_age', 'signup_job', 'signup_country']
        .forEach(k => sessionStorage.removeItem(k));

      window.location.href = '/login5/login5.html';

    } catch (err) {
      console.error('[users insert 오류]', err);
      alert('오류가 발생했습니다. 다시 시도해주세요.');
      finishBtn.disabled = false;
      finishBtn.textContent = '완료';
    }
  });

  renderGrid();
  renderSelected();
  updateCount();

});