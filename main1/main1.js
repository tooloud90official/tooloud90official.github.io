// main1/main1.js
import { supabase } from '/_ignore/supabase.js';
import { GROQ_API_KEY } from '/_ignore/groq.js';

document.addEventListener("DOMContentLoaded", async () => {

  // ===== 로그인 상태 확인 (Supabase Auth) =====
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  // ===== 검색바 초기화 =====
  try {
    loadSearchBar({
      target: '#searchbar-container',
      placeholder: '검색어를 입력하세요',
      onSearch: (value) => {
        const keyword = encodeURIComponent(value.trim());
        window.location.href = `/searchResult/searchResult.html?keyword=${keyword}`;
      }
    });
  } catch (e) {
    console.warn('[searchBar] loadSearchBar 실패:', e.message);
  }


  // ===== 카테고리별 작업물 데이터 =====
  const WORK_DATA = {
    media: { img: '/main1/media/work-image.png',    tool: { name: 'Midjourney',    img: 'https://logo.clearbit.com/midjourney.com' },  stars: '★★★★☆' },
    res:   { img: '/main1/media/work-research.png', tool: { name: 'Perplexity AI', img: 'https://logo.clearbit.com/perplexity.ai' },   stars: '★★★★★' },
    doc:   { img: '/main1/media/work-document.png', tool: { name: 'Notion AI',     img: 'https://logo.clearbit.com/notion.so' },        stars: '★★★★☆' },
    dev:   { img: '/main1/media/work-dev.png',      tool: { name: 'Cursor',        img: 'https://logo.clearbit.com/cursor.sh' },        stars: '★★★★★' },
    edu:   { img: '/main1/media/work-edu.png',      tool: { name: 'Gamma',         img: 'https://logo.clearbit.com/gamma.app' },        stars: '★★★★☆' },
    ast:   { img: '/main1/media/work-chat.png',     tool: { name: 'ChatGPT',       img: 'https://logo.clearbit.com/openai.com' },       stars: '★★★★★' },
  };

  const CATEGORY_LABELS = {
    media: '이미지·오디오·영상 AI 툴',
    res:   '리서치 AI 툴',
    doc:   '문서 생성·요약·편집 AI 툴',
    dev:   '개발·코딩 AI 툴',
    edu:   '학습·교육 AI 툴',
    ast:   '챗봇·어시스턴트 AI 툴',
  };


  // ===== Supabase tools 테이블 전체 로드 =====
  let TOOLS_DATA = {};
  try {
    const { data, error } = await supabase
      .from('tools')
      .select('tool_ID, tool_name, icon, tool_cat, tool_subcat, tool_link')
      .order('tool_name', { ascending: true });

    if (error) {
      console.error('[tools] Supabase 에러:', error.message);
    } else if (!data || data.length === 0) {
      console.warn('[tools] 데이터가 없습니다.');
    } else {
      TOOLS_DATA = data.reduce((acc, tool) => {
        const cat = tool.tool_cat;
        if (!cat) return acc;
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(tool);
        return acc;
      }, {});
      console.log('[tools] 로드 완료. 카테고리:', Object.keys(TOOLS_DATA));
    }
  } catch (e) {
    console.error('[tools] 예외 발생:', e.message);
  }


  // ===== 사용자 데이터 로드 (로그인 시) =====
  let userData = null;
  if (isLoggedIn) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('user_name, user_img, user_country, user_age, user_job, favorite_tools')
        .eq('user_id', user.id)
        .single();

      if (error) console.error('[users] 사용자 데이터 에러:', error.message);
      else userData = data;
    } catch (e) {
      console.error('[users] 예외 발생:', e.message);
    }
  }


  // ===== Groq API로 AI 추천 툴 카테고리 추출 =====
  async function getRecommendCatsFromGroq(userData, allToolsFlat) {
    // favorite_tools 파싱: "['ChatGPT','Midjourney']" → ['ChatGPT', 'Midjourney']
    let favoriteTools = [];
    try {
      favoriteTools = JSON.parse(userData.favorite_tools.replace(/'/g, '"'));
    } catch {
      console.warn('[groq] favorite_tools 파싱 실패:', userData.favorite_tools);
    }

    // tools DB의 고유 tool_cat / tool_subcat 목록 추출
    const catSet = [...new Set(allToolsFlat.map(t => t.tool_cat).filter(Boolean))];
    const subcatSet = [...new Set(allToolsFlat.map(t => t.tool_subcat).filter(Boolean))];

    const prompt = `
당신은 AI 툴 추천 전문가입니다.
아래 사용자 정보를 바탕으로 가장 적합한 AI 툴 카테고리를 추천해주세요.

사용자 정보:
- 연령대: ${userData.user_age}
- 직군: ${userData.user_job}
- 국적: ${userData.user_country}
- 관심 있는 툴: ${favoriteTools.join(', ')}

사용 가능한 tool_cat 목록: ${catSet.join(', ')}
사용 가능한 tool_subcat 목록: ${subcatSet.join(', ')}

위 목록에서만 선택해서 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.
{
  "recommended_cats": ["cat1", "cat2"],
  "recommended_subcats": ["subcat1", "subcat2", "subcat3"]
}
    `.trim();

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 200,
        }),
      });

      const json = await res.json();
      const text = json.choices?.[0]?.message?.content ?? '';
      const clean = text.replace(/```json|```/g, '').trim();
      return JSON.parse(clean);
    } catch (e) {
      console.error('[groq] API 에러:', e.message);
      return null;
    }
  }


  // ===== AI 추천 툴 렌더링 =====
  async function renderRecommend() {
    const section = document.getElementById('recommendSection');
    const grid    = document.getElementById('recommendGrid');
    if (!section || !grid) return;

    if (!userData) {
      section.style.display = 'none';
      return;
    }

    // 로딩 표시
    section.style.display = 'block';
    grid.innerHTML = '<p class="loading-text">AI가 추천 툴을 분석 중입니다...</p>';

    // tools 전체 flat 배열
    const allToolsFlat = Object.values(TOOLS_DATA).flat();

    // Groq로 추천 카테고리 받기
    const groqResult = await getRecommendCatsFromGroq(userData, allToolsFlat);

    let recommendedTools = [];

    if (groqResult) {
      const { recommended_cats = [], recommended_subcats = [] } = groqResult;
      console.log('[groq] 추천 cats:', recommended_cats, '/ subcats:', recommended_subcats);

      // tool_cat 또는 tool_subcat이 일치하는 툴 필터링
      recommendedTools = allToolsFlat.filter(tool =>
        recommended_cats.includes(tool.tool_cat) ||
        recommended_subcats.includes(tool.tool_subcat)
      );
    }

    // Groq 실패하거나 결과 없으면 전체에서 랜덤 8개 폴백
    if (recommendedTools.length === 0) {
      console.warn('[groq] 추천 결과 없음 → 랜덤 폴백');
      recommendedTools = allToolsFlat.sort(() => Math.random() - 0.5).slice(0, 8);
    } else {
      // 최대 8개로 제한
      recommendedTools = recommendedTools.slice(0, 8);
    }

    // 그리드 렌더링
    grid.innerHTML = '';
    grid.className = 'tool-grid';

    recommendedTools.forEach(tool => {
      let iconUrl = tool.icon;
      if (!iconUrl && tool.tool_link) {
        try {
          const domain = new URL(tool.tool_link).hostname.replace('www.', '');
          iconUrl = `https://logo.clearbit.com/${domain}`;
        } catch { /* 무시 */ }
      }
      if (!iconUrl) {
        iconUrl = `https://logo.clearbit.com/${tool.tool_name.toLowerCase().replace(/\s/g, '')}.com`;
      }

      const card = document.createElement('div');
      card.className = 'tool-icon-card';
      card.innerHTML = `
        <span class="tool-icon-card__icon">
          <img src="${iconUrl}" alt="${tool.tool_name}" onerror="this.style.display='none'">
        </span>
        <span class="tool-icon-card__title">${tool.tool_name}</span>
      `;
      card.addEventListener('click', () => {
        window.location.href = `/detail_AI/detail_AI.html?tool=${encodeURIComponent(tool.tool_name)}`;
      });
      grid.appendChild(card);
    });
  }


  // ===== 작업물 카드 렌더링 =====
  function renderWorkCard(category) {
    const data   = WORK_DATA[category];
    const imgEl  = document.getElementById('workCardImg');
    const toolEl = document.getElementById('workCardTool');
    if (!data) {
      console.warn('[renderWorkCard] 카테고리 없음:', category);
      return;
    }

    if (imgEl) {
      imgEl.src = data.img;
      imgEl.style.display = 'block';
      imgEl.onerror = () => {
        imgEl.parentElement.style.background = '#e8eef5';
        imgEl.style.display = 'none';
      };
    }

    if (toolEl) {
      toolEl.innerHTML = `
        <div class="tool-icon-card">
          <span class="tool-icon-card__icon">
            <img src="${data.tool.img}" alt="${data.tool.name}" onerror="this.style.display='none'">
          </span>
          <span class="tool-icon-card__title">${data.tool.name}</span>
        </div>
        <div class="work-card__stars">${data.stars}</div>
        <button type="button" class="btn-more">툴 더 알아보기</button>
      `;
      toolEl.querySelector('.btn-more').addEventListener('click', () => {
        window.location.href = `/detail_AI/detail_AI.html?tool=${encodeURIComponent(data.tool.name)}`;
      });
    }
  }


  // ===== 툴 그리드 렌더링 =====
  function renderTools(category) {
    const toolsSection = document.getElementById('toolsSection');
    if (!toolsSection) {
      console.error('[renderTools] #toolsSection 요소를 찾을 수 없습니다.');
      return;
    }

    toolsSection.innerHTML = '';
    const categories = category === 'all' ? Object.keys(TOOLS_DATA) : [category];

    if (categories.length === 0) {
      toolsSection.innerHTML = '<p style="color:#888;padding:20px;">툴 데이터를 불러오지 못했습니다.</p>';
      return;
    }

    categories.forEach(cat => {
      const tools = TOOLS_DATA[cat];
      if (!tools || tools.length === 0) return;

      const group = document.createElement('div');
      group.className = 'tool-category-group';

      const label = document.createElement('p');
      label.className = 'tool-category-label';
      label.textContent = CATEGORY_LABELS[cat] ?? cat;

      const grid = document.createElement('div');
      grid.className = 'tool-grid';

      tools.forEach(tool => {
        const card = document.createElement('div');
        card.className = 'tool-icon-card';

        let iconUrl = tool.icon;
        if (!iconUrl && tool.tool_link) {
          try {
            const domain = new URL(tool.tool_link).hostname.replace('www.', '');
            iconUrl = `https://logo.clearbit.com/${domain}`;
          } catch { /* 무시 */ }
        }
        if (!iconUrl) {
          iconUrl = `https://logo.clearbit.com/${tool.tool_name.toLowerCase().replace(/\s/g, '')}.com`;
        }

        card.innerHTML = `
          <span class="tool-icon-card__icon">
            <img src="${iconUrl}" alt="${tool.tool_name}" onerror="this.style.display='none'">
          </span>
          <span class="tool-icon-card__title">${tool.tool_name}</span>
        `;
        card.addEventListener('click', () => {
          window.location.href = `/detail_AI/detail_AI.html?tool=${encodeURIComponent(tool.tool_name)}`;
        });
        grid.appendChild(card);
      });

      group.appendChild(label);
      group.appendChild(grid);
      toolsSection.appendChild(group);
    });
  }


  // ===== 카테고리 탭 클릭 =====
  document.getElementById('categoryTabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.category-tab');
    if (!tab) return;

    document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('is-active'));
    tab.classList.add('is-active');

    renderWorkCard(tab.dataset.category);
    renderTools('all');
  });


  // ===== 초기 렌더링 =====
  renderWorkCard('media');
  renderTools('all');

  // ===== 로그인 후 전용: AI 추천 툴 =====
  if (isLoggedIn) {
    await renderRecommend();  // Groq 호출 포함
  } else {
    document.getElementById('recommendSection').style.display = 'none';
  }

});
