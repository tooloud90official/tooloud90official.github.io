import { supabase } from '/_ignore/supabase.js';

function renderMainWorkMedia(container, data) {
  if (!container) return;
  const url = data.img || "";
  const ext = url.split(".").pop().toLowerCase().split("?")[0];

  const moreBtn = container.querySelector(".work-card__more-btn");
  container.innerHTML = "";
  if (moreBtn) container.appendChild(moreBtn);

  if (["jpg","jpeg","png","gif","webp"].includes(ext)) {
    const img = document.createElement("img");
    img.src = url;
    img.alt = "작업물";
  
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.justifyContent = "center";
    container.style.overflow = "hidden";
    container.style.background = "linear-gradient(160deg, #a8b8cc 0%, #8fa3bc 50%, #7d95b0 100%)";
  
    img.style.cssText = `
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      object-fit: contain;
      display: block;
    `;
  
    img.onerror = () => {
      container.style.background = "#e8eef5";
    };
  
    container.appendChild(img);
    return;
  }

  if (["mp4","webm","mov"].includes(ext)) {
    const wrap = document.createElement("div");
    wrap.className = "main-work-video-wrap";
    wrap.innerHTML = `
      <video class="main-work-video" muted playsinline preload="metadata">
        <source src="${url}">
      </video>
      <canvas class="main-work-thumb"></canvas>
      <button class="main-work-playbtn" aria-label="재생">
        <svg viewBox="0 0 24 24" fill="white" width="48" height="48"
          style="filter:drop-shadow(0 2px 8px rgba(0,0,0,0.5))">
          <path d="M8 5v14l11-7z"></path>
        </svg>
      </button>
      <div class="main-work-video-controls">
        <span class="main-work-video-time">0:00 / 0:00</span>
        <div class="main-work-video-seekbar">
          <div class="main-work-video-seekbar__fill"></div>
        </div>
      </div>`;
    container.appendChild(wrap);

    const video    = wrap.querySelector(".main-work-video");
    const canvas   = wrap.querySelector(".main-work-thumb");
    const playBtn  = wrap.querySelector(".main-work-playbtn");
    const controls = wrap.querySelector(".main-work-video-controls");
    const timeEl   = wrap.querySelector(".main-work-video-time");
    const seekbar  = wrap.querySelector(".main-work-video-seekbar");
    const fill     = wrap.querySelector(".main-work-video-seekbar__fill");

    const pauseSvg = `<svg viewBox="0 0 24 24" fill="white" width="36" height="36" style="filter:drop-shadow(0 2px 8px rgba(0,0,0,0.4))"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>`;
    const playSvg  = `<svg viewBox="0 0 24 24" fill="white" width="48" height="48" style="filter:drop-shadow(0 2px 8px rgba(0,0,0,0.5))"><path d="M8 5v14l11-7z"></path></svg>`;

    function formatVideoTime(sec) {
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return `${m}:${String(s).padStart(2, "0")}`;
    }

    video.addEventListener("loadeddata", () => { video.currentTime = 0.5; });
    video.addEventListener("seeked", () => {
      if (video.paused) {
        const ctx = canvas.getContext("2d");
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.style.display = "block";
        video.style.display  = "none";
      }
    });
    video.addEventListener("loadedmetadata", () => {
      timeEl.textContent = `0:00 / ${formatVideoTime(video.duration)}`;
    });
    video.addEventListener("timeupdate", () => {
      if (!video.duration) return;
      const pct = (video.currentTime / video.duration) * 100;
      fill.style.width = `${pct}%`;
      timeEl.textContent = `${formatVideoTime(video.currentTime)} / ${formatVideoTime(video.duration)}`;
    });
    playBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (video.paused) {
        canvas.style.display = "none";
        video.style.display  = "block";
        video.play();
        playBtn.innerHTML = pauseSvg;
      } else {
        video.pause();
        playBtn.innerHTML = playSvg;
      }
    });
    seekbar.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!video.duration) return;
      const rect = seekbar.getBoundingClientRect();
      const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      video.currentTime = pct * video.duration;
    });
    controls.addEventListener("click", (e) => e.stopPropagation());
    video.addEventListener("ended", () => {
      canvas.style.display = "block";
      video.style.display  = "none";
      playBtn.innerHTML = playSvg;
    });
    return;
  }

  if (["mp3","wav","ogg","m4a"].includes(ext)) {
    const audioId = `mainAudio_${Date.now()}`;
    const wrap = document.createElement("div");
    wrap.className = "main-work-audio-wrap";
    wrap.innerHTML = `
      <div class="main-work-audio-card">
        <div class="main-work-audio-thumb">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="1.8"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 18V5l12-2v13"></path>
            <circle cx="6" cy="18" r="3"></circle>
            <circle cx="18" cy="16" r="3"></circle>
          </svg>
          <button class="main-work-audio-playbtn" id="${audioId}_btn" aria-label="재생">
            <svg viewBox="0 0 24 24" fill="white" width="48" height="48"
              style="filter:drop-shadow(0 2px 6px rgba(0,0,0,0.3))">
              <path d="M8 5v14l11-7z"></path>
            </svg>
          </button>
        </div>
        <div class="main-work-audio-controls" id="${audioId}_controls">
          <span class="main-work-audio-time" id="${audioId}_time">0:00 / 0:00</span>
          <div class="main-work-audio-seekbar" id="${audioId}_seekbar">
            <div class="main-work-audio-seekbar__fill" id="${audioId}_fill"></div>
          </div>
        </div>
      </div>
      <audio id="${audioId}" preload="metadata">
        <source src="${url}">
      </audio>`;
    container.appendChild(wrap);

    const audio   = wrap.querySelector(`#${audioId}`);
    const playBtn = wrap.querySelector(`#${audioId}_btn`);
    const timeEl  = wrap.querySelector(`#${audioId}_time`);
    const seekbar = wrap.querySelector(`#${audioId}_seekbar`);
    const fill    = wrap.querySelector(`#${audioId}_fill`);

    const pauseSvg = `<svg viewBox="0 0 24 24" fill="white" width="36" height="36"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>`;
    const playSvg  = `<svg viewBox="0 0 24 24" fill="white" width="48" height="48" style="filter:drop-shadow(0 2px 6px rgba(0,0,0,0.3))"><path d="M8 5v14l11-7z"></path></svg>`;

    function formatTime(sec) {
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return `${m}:${String(s).padStart(2, "0")}`;
    }

    playBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (audio.paused) { audio.play(); playBtn.innerHTML = pauseSvg; }
      else              { audio.pause(); playBtn.innerHTML = playSvg; }
    });
    seekbar?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!audio.duration) return;
      const rect = seekbar.getBoundingClientRect();
      const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      audio.currentTime = pct * audio.duration;
    });
    audio?.addEventListener("loadedmetadata", () => {
      timeEl.textContent = `0:00 / ${formatTime(audio.duration)}`;
    });
    audio?.addEventListener("timeupdate", () => {
      if (!audio.duration) return;
      const pct = (audio.currentTime / audio.duration) * 100;
      fill.style.width = `${pct}%`;
      timeEl.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
    });
    audio?.addEventListener("ended", () => { playBtn.innerHTML = playSvg; });
    return;
  }

  if (ext === "pdf" && window.pdfjsLib) {
    const wrap = document.createElement("div");
    wrap.className = "main-work-pdf-wrap";
    wrap.innerHTML = `
      <div class="main-work-pdf-stage">
        <canvas class="main-work-pdf-canvas"></canvas>
      </div>
      <div class="main-work-pdf-controls">
        <button type="button" class="main-work-pdf-btn" id="mainPdfPrev">이전</button>
        <div class="main-work-pdf-page" id="mainPdfPage">1 / 1</div>
        <button type="button" class="main-work-pdf-btn" id="mainPdfNext">다음</button>
      </div>`;
    container.appendChild(wrap);

    const canvas  = wrap.querySelector(".main-work-pdf-canvas");
    const pageEl  = wrap.querySelector("#mainPdfPage");
    const prevBtn = wrap.querySelector("#mainPdfPrev");
    const nextBtn = wrap.querySelector("#mainPdfNext");
    const pdfState = { doc: null, page: 1, total: 1 };

    async function drawPage() {
      if (!canvas || !pdfState.doc) return;
      const page  = await pdfState.doc.getPage(pdfState.page);
      const vp    = page.getViewport({ scale: 1 });
      const stage = canvas.parentElement;
      const scale = Math.min((stage.clientWidth || 300) / vp.width, (stage.clientHeight || 220) / vp.height);
      const svp   = page.getViewport({ scale });
      canvas.width  = svp.width;
      canvas.height = svp.height;
      await page.render({ canvasContext: canvas.getContext("2d"), viewport: svp }).promise;
      if (pageEl) pageEl.textContent = `${pdfState.page} / ${pdfState.total}`;
      if (prevBtn) prevBtn.disabled = pdfState.page <= 1;
      if (nextBtn) nextBtn.disabled = pdfState.page >= pdfState.total;
    }

    window.pdfjsLib.getDocument(url).promise.then(async pdf => {
      pdfState.doc   = pdf;
      pdfState.total = pdf.numPages;
      await drawPage();
    });

    prevBtn?.addEventListener("click", async (e) => { e.stopPropagation(); if (pdfState.page > 1) { pdfState.page--; await drawPage(); } });
    nextBtn?.addEventListener("click", async (e) => { e.stopPropagation(); if (pdfState.page < pdfState.total) { pdfState.page++; await drawPage(); } });
    return;
  }

  const fallback = document.createElement("div");
  fallback.style.cssText = "width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:rgba(0,0,0,.35);font-size:13px;font-weight:600;";
  fallback.textContent = "미리보기 없음";
  container.appendChild(fallback);
}

document.addEventListener("DOMContentLoaded", async () => {

  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

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

  const CATEGORY_LABELS = {
    media: '이미지·오디오·영상 AI 툴',
    res:   '리서치 AI 툴',
    doc:   '문서 생성·요약·편집 AI 툴',
    dev:   '개발·코딩 AI 툴',
    edu:   '학습·교육 AI 툴',
    ast:   '챗봇·어시스턴트 AI 툴',
  };

  let WORK_DATA = {};

  try {
    const { data: worksData, error: worksError } = await supabase
      .from('works')
      .select('work_id, tool_id, work_link, user_id');

    if (worksError) {
      console.error('[works] Supabase 에러:', worksError.message);
    } else if (worksData && worksData.length > 0) {

      const toolIds = [...new Set(worksData.map(w => w.tool_id).filter(Boolean))];

      const { data: toolsForWorks, error: toolsError } = await supabase
        .from('tools')
        .select('tool_ID, tool_name, icon, tool_link, tool_cat')
        .in('tool_ID', toolIds);

      if (toolsError) console.error('[tools for works] 에러:', toolsError.message);

      const { data: reviewsData, error: reviewsError } = await supabase
        .from('tool_reviews')
        .select('tool_id, rating')
        .in('tool_id', toolIds);

      if (reviewsError) console.error('[tool_reviews] 에러:', reviewsError.message);

      // ✅ 툴별 평균 평점 계산 (반올림 없이 실수값 유지 — 정렬 정확도를 위해)
      const ratingMap = {};
      (reviewsData || []).forEach(r => {
        if (!ratingMap[r.tool_id]) ratingMap[r.tool_id] = { sum: 0, count: 0 };
        ratingMap[r.tool_id].sum += r.rating;
        ratingMap[r.tool_id].count += 1;
      });
      const avgRatingMap = {};
      Object.keys(ratingMap).forEach(id => {
        avgRatingMap[id] = ratingMap[id].sum / ratingMap[id].count;
      });

      const toolMap = {};
      (toolsForWorks || []).forEach(t => { toolMap[t.tool_ID] = t; });

      // ✅ 카테고리별로 작업물을 모두 수집한 뒤 평점 높은 순으로 정렬해서 1위만 채택
      const catCandidates = {}; // { cat: [ { work, tool, rating } ] }

      worksData.forEach(work => {
        const tool = toolMap[work.tool_id];
        if (!tool || !tool.tool_cat) return;

        const cat    = tool.tool_cat;
        const rating = avgRatingMap[tool.tool_ID] ?? 0;

        if (!catCandidates[cat]) catCandidates[cat] = [];
        catCandidates[cat].push({ work, tool, rating });
      });

      // ✅ 카테고리별로 평점 내림차순 정렬 후 1위 작업물 선택
      Object.entries(catCandidates).forEach(([cat, candidates]) => {
        candidates.sort((a, b) => b.rating - a.rating);
        const best   = candidates[0];
        const tool   = best.tool;
        const rating = best.rating;

        const roundedRating = Math.round(rating);
        const stars = `<span style="color:orange;">${'★'.repeat(roundedRating)}</span><span style="color:#ccc;">${'★'.repeat(Math.max(0, 5 - roundedRating))}</span>`;

        let iconUrl = tool.icon;
        if (!iconUrl && tool.tool_link) {
          try {
            const domain = new URL(tool.tool_link).hostname.replace('www.', '');
            iconUrl = `https://logo.clearbit.com/${domain}`;
          } catch { }
        }
        if (!iconUrl) {
          iconUrl = `https://logo.clearbit.com/${tool.tool_name.toLowerCase().replace(/\s/g, '')}.com`;
        }

        WORK_DATA[cat] = {
          img:    best.work.work_link || '',
          workId: best.work.work_id,
          tool:   { id: tool.tool_ID, name: tool.tool_name, img: iconUrl },
          stars,
          rating,
          userId: best.work.user_id,
        };
      });

      const workUserIds = [...new Set(Object.values(WORK_DATA).map(w => w.userId).filter(Boolean))];
      if (workUserIds.length > 0) {
        const { data: workUsers, error: workUsersError } = await supabase
          .from('users')
          .select('user_id, user_name')
          .in('user_id', workUserIds);

        if (workUsersError) console.error('[users for works] 에러:', workUsersError.message);

        const userNameMap = {};
        (workUsers || []).forEach(u => { userNameMap[u.user_id] = u.user_name; });

        Object.values(WORK_DATA).forEach(w => {
          w.userName = userNameMap[w.userId] ?? null;
        });
      }

      console.log('[works] WORK_DATA 로드 완료 (평점순):', Object.keys(WORK_DATA));
    }
  } catch (e) {
    console.error('[works] 예외 발생:', e.message);
  }

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
    }
  } catch (e) {
    console.error('[tools] 예외 발생:', e.message);
  }

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

  async function getRecommendCatsFromGroq(userData, allToolsFlat) {
    let favoriteTools = [];
    try {
      favoriteTools = JSON.parse(userData.favorite_tools.replace(/'/g, '"'));
    } catch {
      console.warn('[groq] favorite_tools 파싱 실패:', userData.favorite_tools);
    }

    const catSet    = [...new Set(allToolsFlat.map(t => t.tool_cat).filter(Boolean))];
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
      const res = await fetch(`${SUPABASE_URL}/functions/v1/groq-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
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

  async function renderRecommend() {
    const section = document.getElementById('recommendSection');
    const grid    = document.getElementById('recommendGrid');
    if (!section || !grid) return;

    if (!userData) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';
    grid.innerHTML = '<p class="loading-text">AI가 추천 툴을 분석 중입니다...</p>';

    const allToolsFlat = Object.values(TOOLS_DATA).flat();
    const groqResult   = await getRecommendCatsFromGroq(userData, allToolsFlat);

    let recommendedTools = [];

    if (groqResult) {
      const { recommended_cats = [], recommended_subcats = [] } = groqResult;
      recommendedTools = allToolsFlat.filter(tool =>
        recommended_cats.includes(tool.tool_cat) ||
        recommended_subcats.includes(tool.tool_subcat)
      );
    }

    if (recommendedTools.length === 0) {
      recommendedTools = allToolsFlat.sort(() => Math.random() - 0.5).slice(0, 8);
    } else {
      recommendedTools = recommendedTools.slice(0, 8);
    }

    try {
      const toolIdsToSave = recommendedTools.map(tool => tool.tool_ID);
      const { error: saveError } = await supabase
        .from('users')
        .update({ recommended_tools: toolIdsToSave })
        .eq('user_id', user.id);
      if (saveError) console.error('[groq] recommended_tools 저장 실패:', saveError.message);
    } catch (e) {
      console.error('[groq] recommended_tools 저장 중 예외:', e.message);
    }

    grid.innerHTML = '';
    grid.className = 'tool-grid';

    recommendedTools.forEach(tool => {
      let iconUrl = tool.icon;
      if (!iconUrl && tool.tool_link) {
        try {
          const domain = new URL(tool.tool_link).hostname.replace('www.', '');
          iconUrl = `https://logo.clearbit.com/${domain}`;
        } catch { }
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
        window.location.href = `/detail_AI/detail_AI.html?tool_ID=${tool.tool_ID}`;
      });
      grid.appendChild(card);
    });
  }

  function renderWorkCard(category) {
    const container = document.getElementById('workCardImage');
    const toolEl    = document.getElementById('workCardTool');
    const nameEl    = document.getElementById('workCardUserName');
    const moreBtn   = document.getElementById('workCardMoreBtn');
    const data      = WORK_DATA[category];

    if (!data) {
      if (container) {
        container.innerHTML = `<div style="width:100%;height:100%;background:#e8eef5;"></div>`;
        if (moreBtn) { moreBtn.style.display = "none"; container.appendChild(moreBtn); }
      }
      if (nameEl) nameEl.textContent = '님의 작업물';
      if (toolEl) toolEl.innerHTML = '<p style="color:#aaa; font-size:13px; padding:16px;">등록된 작업물이 없습니다.</p>';
      return;
    }

    if (nameEl) {
      nameEl.textContent = data.userName ? `${data.userName} 님의 작업물` : '님의 작업물';
    }

    if (moreBtn && moreBtn.parentElement === container) {
      container.removeChild(moreBtn);
    }

    renderMainWorkMedia(container, data);

    if (moreBtn) {
      container.appendChild(moreBtn);
      moreBtn.style.display = "flex";
      moreBtn.onclick = (e) => {
        e.stopPropagation();
        window.location.href = `/artwork/artwork_post/artwork_post.html?work_id=${encodeURIComponent(data.workId)}`;
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
        window.location.href = `/detail_AI/detail_AI.html?tool_ID=${data.tool.id}`;
      });
    }
  }

  function renderTools(category) {
    const toolsSection = document.getElementById('toolsSection');
    if (!toolsSection) return;

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
          } catch { }
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
          window.location.href = `/detail_AI/detail_AI.html?tool_ID=${tool.tool_ID}`;
        });
        grid.appendChild(card);
      });

      group.appendChild(label);
      group.appendChild(grid);
      toolsSection.appendChild(group);
    });
  }

  document.getElementById('categoryTabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.category-tab');
    if (!tab) return;

    document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('is-active'));
    tab.classList.add('is-active');

    renderWorkCard(tab.dataset.category);
    renderTools('all');
  });

  renderWorkCard('media');
  renderTools('all');

  if (isLoggedIn) {
    await renderRecommend();
  } else {
    document.getElementById('recommendSection').style.display = 'none';
  }

});