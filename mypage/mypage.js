// ✅ supabase 공용 클라이언트 import
import { supabase } from "/_ignore/supabase.js";

document.addEventListener('DOMContentLoaded', async () => {

  /* =====================================================
     [0] 빈 상태 플래그
     ===================================================== */
  const EMPTY_MODE = false;


  /* =====================================================
     ✅ [AUTH] 현재 로그인 유저 확인
     ===================================================== */
  const { data: { user } } = await supabase.auth.getUser();


  /* =====================================================
     ✅ [영어 → 한국어 변환 테이블]
     ===================================================== */
  const JOB_MAP = {
    'marketer':  '마케터',
    'developer': '개발자',
    'designer':  '디자이너',
    'planner':   '기획자',
    'other':     '기타',
    '마케터': '마케터', '개발자': '개발자', '디자이너': '디자이너', '기획자': '기획자', '기타': '기타',
  };

  const AGE_MAP = {
    '10s': '10대', '20s': '20대', '30s': '30대', '40s': '40대', '50s': '50대 이상',
    '10대': '10대', '20대': '20대', '30대': '30대', '40대': '40대', '50대 이상': '50대 이상',
  };

  const COUNTRY_MAP = {
    'KR':  '대한민국',
    'US':  '미국',
    'JP':  '일본',
    'CN':  '중국',
    'other': '기타',
    '대한민국': '대한민국', '미국': '미국', '일본': '일본', '중국': '중국', '기타': '기타',
  };

  const toKo = (map, val) => (val ? (map[val] ?? val) : null);


  /* =====================================================
     ✅ [WORKS] 확장자 → 필터 카테고리 변환
     ===================================================== */
  const EXT_FILTER_MAP = {
    pdf:  '문서',
    png: '이미지', jpg: '이미지', jpeg: '이미지', gif: '이미지', webp: '이미지',
    mp4: '영상', mov: '영상', avi: '영상', webm: '영상',
    mp3: '오디오', wav: '오디오', ogg: '오디오', aac: '오디오',
  };

  function getExtFilter(workPath) {
    if (!workPath) return null;
    const pathname = workPath.split('?')[0];
    const ext = pathname.split('.').pop().toLowerCase();
    return EXT_FILTER_MAP[ext] ?? null;
  }

  function getPublicUrl(workPath) {
    return workPath ?? '';
  }


  /* =====================================================
     ✅ [EMAIL] 프로필 이메일 버튼 렌더링
     ===================================================== */
  function renderProfileEmail() {
    const emailBtn = document.querySelector('.profile-email-btn');
    if (!emailBtn) return;
    const emailText = user?.email ?? '이메일 정보 없음';
    [...emailBtn.childNodes]
      .filter(n => n.nodeType === Node.TEXT_NODE)
      .forEach(n => n.remove());
    emailBtn.appendChild(document.createTextNode(emailText));
  }


  /* =====================================================
     ✅ [USER INFO] DB에서 내 정보 불러오기
     ===================================================== */
  async function fetchUserInfo() {
    if (!user) return null;

    const { data, error } = await supabase
      .from('users')
      .select('user_name, user_age, user_job, user_country')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('유저 정보 조회 실패:', error.message);
      return null;
    }
    return data;
  }

  const userInfo = await fetchUserInfo();


  /* =====================================================
     ✅ [USER INFO] 대시보드 내 정보 카드 렌더링
     ===================================================== */
  function renderUserInfoCard(info) {
    const infoItems = document.querySelectorAll('.card-info .info-list li');
    if (!infoItems.length || !info) return;

    const map = {
      '이름':   info.user_name                      ?? '-',
      '직군':   toKo(JOB_MAP,     info.user_job)     ?? '-',
      '연령대': toKo(AGE_MAP,     info.user_age)     ?? '-',
      '국가':   toKo(COUNTRY_MAP, info.user_country) ?? '-',
    };

    infoItems.forEach(li => {
      const label = li.querySelector('.info-label')?.textContent?.trim();
      const tag   = li.querySelector('.info-tag');
      if (tag && label && map[label] !== undefined) {
        tag.textContent = map[label];
      }
    });
  }


  /* =====================================================
     ✅ recent_tools DB에서 불러오기
     ===================================================== */
  async function fetchRecentTools() {
    if (!user) return [];

    const { data, error } = await supabase
      .from('users')
      .select('recent_tools')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('recent_tools 조회 실패:', error.message);
      return [];
    }

    const raw = data?.recent_tools ?? [];
    if (!Array.isArray(raw) || raw.length === 0) return [];

    const toolIds = raw.filter(id => typeof id === 'string');
    if (toolIds.length === 0) return [];

    const { data: toolsData, error: toolsError } = await supabase
      .from('tools')
      .select('tool_ID, tool_name, icon, tool_link')
      .in('tool_ID', toolIds);

    if (toolsError) {
      console.error('recent tools 조회 실패:', toolsError.message);
      return [];
    }

    const toolMap = {};
    (toolsData ?? []).forEach(t => {
      let iconUrl = t.icon;
      if (!iconUrl && t.tool_link) {
        try {
          const domain = new URL(t.tool_link).hostname.replace('www.', '');
          iconUrl = `https://logo.clearbit.com/${domain}`;
        } catch { /* 무시 */ }
      }
      if (!iconUrl) {
        iconUrl = `https://logo.clearbit.com/${t.tool_name.toLowerCase().replace(/\s/g, '')}.com`;
      }
      toolMap[t.tool_ID] = { name: t.tool_name ?? '', img: iconUrl };
    });

    return toolIds
      .filter(id => toolMap[id])
      .map(id => ({ name: toolMap[id].name, img: toolMap[id].img }));
  }


  /* =====================================================
     ✅ recommended_tools DB에서 불러오기
     ===================================================== */
  async function fetchRecommendedTools() {
    if (!user) return [];

    const { data, error } = await supabase
      .from('users')
      .select('recommended_tools')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('recommended_tools 조회 실패:', error.message);
      return [];
    }

    const raw = data?.recommended_tools ?? [];
    if (!Array.isArray(raw) || raw.length === 0) return [];

    const toolIds = raw.filter(id => typeof id === 'string');
    if (toolIds.length === 0) return [];

    const { data: toolsData, error: toolsError } = await supabase
      .from('tools')
      .select('tool_ID, tool_name, icon, tool_link')
      .in('tool_ID', toolIds);

    if (toolsError) {
      console.error('recommended tools 조회 실패:', toolsError.message);
      return [];
    }

    const toolMap = {};
    (toolsData ?? []).forEach(t => {
      let iconUrl = t.icon;
      if (!iconUrl && t.tool_link) {
        try {
          const domain = new URL(t.tool_link).hostname.replace('www.', '');
          iconUrl = `https://logo.clearbit.com/${domain}`;
        } catch { /* 무시 */ }
      }
      if (!iconUrl) {
        iconUrl = `https://logo.clearbit.com/${t.tool_name.toLowerCase().replace(/\s/g, '')}.com`;
      }
      toolMap[t.tool_ID] = { name: t.tool_name ?? '', img: iconUrl };
    });

    return toolIds
      .filter(id => toolMap[id])
      .map(id => ({ name: toolMap[id].name, img: toolMap[id].img }));
  }


  /* =====================================================
     ✅ 관심 있는 툴 조회
     ===================================================== */
  async function fetchPinnedTools() {
    if (!user) return [];

    const { data, error } = await supabase
      .from('users')
      .select('favorite_tools')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('favorite_tools 조회 실패:', error.message);
      return [];
    }

    const raw = data?.favorite_tools ?? [];
    if (!Array.isArray(raw) || raw.length === 0) return [];

    const toolIds = raw.map(item => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null) return item.tool_ID ?? item.id ?? null;
      return null;
    }).filter(Boolean);

    if (toolIds.length === 0) return [];

    const { data: toolsData, error: toolsError } = await supabase
      .from('tools')
      .select('tool_ID, tool_name, icon, tool_link')
      .in('tool_ID', toolIds);

    if (toolsError) {
      console.error('tools 조회 실패:', toolsError.message);
      return [];
    }

    const toolMap = {};
    (toolsData ?? []).forEach(t => {
      let iconUrl = t.icon;
      if (!iconUrl && t.tool_link) {
        try {
          const domain = new URL(t.tool_link).hostname.replace('www.', '');
          iconUrl = `https://logo.clearbit.com/${domain}`;
        } catch { /* 무시 */ }
      }
      if (!iconUrl) {
        iconUrl = `https://logo.clearbit.com/${t.tool_name.toLowerCase().replace(/\s/g, '')}.com`;
      }
      toolMap[t.tool_ID] = { name: t.tool_name ?? '', img: iconUrl };
    });

    const seen = new Set();
    return toolIds
      .filter(id => {
        if (seen.has(id) || !toolMap[id]) return false;
        seen.add(id);
        return true;
      })
      .map(id => ({ name: toolMap[id].name, img: toolMap[id].img }));
  }


  /* =====================================================
     ✅ [MY REVIEWS] tool_reviews DB에서 불러오기
     ===================================================== */
  async function fetchMyReviews() {
    if (!user) return [];

    const { data: reviews, error } = await supabase
      .from('tool_reviews')
      .select('review_id, tool_id, rating, review_content, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('리뷰 조회 실패:', error.message);
      return [];
    }
    if (!reviews || reviews.length === 0) return [];

    const toolIds = [...new Set(reviews.map(r => r.tool_id).filter(Boolean))];

    const { data: toolsData, error: toolsError } = await supabase
      .from('tools')
      .select('tool_ID, tool_name, icon, tool_link')
      .in('tool_ID', toolIds);

    if (toolsError) {
      console.error('tools 조회 실패:', toolsError.message);
    }

    const toolMap = {};
    (toolsData ?? []).forEach(t => {
      let iconUrl = t.icon;
      if (!iconUrl && t.tool_link) {
        try {
          const domain = new URL(t.tool_link).hostname.replace('www.', '');
          iconUrl = `https://logo.clearbit.com/${domain}`;
        } catch { /* 무시 */ }
      }
      if (!iconUrl) {
        iconUrl = `https://logo.clearbit.com/${t.tool_name.toLowerCase().replace(/\s/g, '')}.com`;
      }
      toolMap[t.tool_ID] = { name: t.tool_name ?? '', img: iconUrl };
    });

    return reviews.map(r => {
      const tool = toolMap[r.tool_id] ?? { name: '알 수 없는 툴', img: '' };
      const d    = new Date(r.created_at);
      const date = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
      return {
        reviewId: r.review_id,
        toolName: tool.name,
        toolImg:  tool.img,
        date,
        rating:   r.rating ?? 0,
        text:     r.review_content ?? '',
      };
    });
  }


  /* =====================================================
     ✅ [WORKS] works 테이블 DB에서 불러오기
     ===================================================== */
  async function fetchMyWorks() {
    if (!user) return {};

    const { data, error } = await supabase
      .from('works')
      .select('work_id, tool_id, tool_cat, work_link, work_desc, updated_at, like_count, comment_count, work_tags, work_title')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('works 조회 실패:', error.message);
      return {};
    }

    const grouped = { '문서': [], '이미지': [], '영상': [], '오디오': [] };

    (data ?? []).forEach(w => {
      const filter = getExtFilter(w.work_link);
      if (!filter) return;

      const publicUrl = getPublicUrl(w.work_link);

      const d = new Date(w.updated_at);
      const date = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;

      const fileName = w.work_link.split('?')[0].split('/').pop();
      const ext = fileName.split('.').pop().toUpperCase();

      grouped[filter].push({
        workId:    w.work_id,
        name:      w.work_title ?? fileName,
        date,
        ext,
        workPath:  publicUrl,
        img:       (filter === '이미지') ? publicUrl : undefined,
        thumb:     undefined,
        duration:  (filter === '영상' || filter === '오디오')
          ? (parseDuration(w.work_desc) ?? '0:00')
          : undefined,
        size:      undefined,
        desc:      w.work_desc ?? '',
        tags:      w.work_tags ?? [],
        likeCount:    w.like_count    ?? 0,
        commentCount: w.comment_count ?? 0,
      });
    });

    return grouped;
  }

  function parseDuration(str) {
    if (!str) return null;
    const match = str.match(/(\d+:\d{2})/);
    return match ? match[1] : null;
  }


  /* =====================================================
     [1] 데이터 로드
     ===================================================== */

  const RECENT_TOOLS   = await fetchRecentTools();
  const AI_TOOLS       = await fetchRecommendedTools();
  const FAVORITE_TOOLS = await fetchPinnedTools();
  const MY_REVIEWS     = await fetchMyReviews();
  const WORKS_DATA     = await fetchMyWorks();

  let currentWorksFilter = '문서';


  /* =====================================================
     ✅ [ARTWORK LINK] 작업물 페이지로 이동
     ===================================================== */
  function goToArtwork(workId) {
    if (!workId) return;
    window.location.href = `/artwork/artwork_post/artwork_post.html?work_id=${workId}`;
  }


  /* =====================================================
     ✅ [AVATAR] 프로필 아바타 선택 모달
     ===================================================== */

  async function fetchAvatarList() {
    const { data, error } = await supabase.storage
      .from('user_img')
      .list('', { sortBy: { column: 'name', order: 'asc' } });

    if (error) {
      console.error('아바타 목록 조회 실패:', error.message);
      return [];
    }

    return (data ?? [])
      .filter(f => !f.name.startsWith('.'))
      .map(f => {
        const { data: urlData } = supabase.storage
          .from('user_img')
          .getPublicUrl(f.name);
        return { name: f.name, url: urlData?.publicUrl ?? '' };
      });
  }

  async function fetchCurrentAvatar() {
    if (!user) return null;
    const { data, error } = await supabase
      .from('users')
      .select('user_img')
      .eq('user_id', user.id)
      .single();
    if (error) {
      console.error('user_img 조회 실패:', error.message);
      return null;
    }
    return data?.user_img ?? null;
  }

  /* =====================================================
     ✅ [AVATAR] 저장된 아바타 없으면 랜덤 배정 후 DB 저장
     ===================================================== */
  async function assignRandomAvatarIfNeeded() {
    if (!user) return null;

    // 이미 저장된 아바타가 있으면 그대로 반환
    const current = await fetchCurrentAvatar();
    if (current) return current;

    // 스토리지 목록 가져오기
    const avatarList = await fetchAvatarList();
    if (avatarList.length === 0) return null;

    // 랜덤 선택
    const randomItem = avatarList[Math.floor(Math.random() * avatarList.length)];
    const randomUrl  = randomItem.url;

    // DB에 저장
    const { error } = await supabase
      .from('users')
      .update({ user_img: randomUrl })
      .eq('user_id', user.id);

    if (error) {
      console.error('랜덤 아바타 저장 실패:', error.message);
      return null;
    }

    return randomUrl;
  }

  function applyAvatarToProfile(url) {
    if (!url) return;
    const img = document.getElementById('profileAvatarImg');
    if (img) {
      img.src = url;
      img.style.display = 'block';
    }
  }

  function openAvatarModal() {
    const backdrop = document.getElementById('avatarModalBackdrop');
    if (!backdrop) return;
    backdrop.classList.add('is-open');
    backdrop.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeAvatarModal() {
    const backdrop = document.getElementById('avatarModalBackdrop');
    if (!backdrop) return;
    backdrop.classList.remove('is-open');
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  async function initAvatarModal() {
    const grid = document.getElementById('avatarGrid');
    if (!grid) return;

    const [avatarList, currentAvatarUrl] = await Promise.all([
      fetchAvatarList(),
      fetchCurrentAvatar(),
    ]);
    let selectedUrl = currentAvatarUrl;

    await loadButton({
      target: '#avatarCancelContainer',
      text: '취소',
      variant: 'outline',
      onClick: closeAvatarModal,
    });
    const cancelBtn = document.querySelector('#avatarCancelContainer .btn');
    if (cancelBtn) {
      cancelBtn.style.cssText += 'width:auto;min-width:80px;height:42px;font-size:14px;padding:0 20px;border-radius:12px;';
    }

    await loadButton({
      target: '#avatarConfirmContainer',
      text: '확인',
      variant: 'primary',
      onClick: async () => {
        if (!selectedUrl) return;
        if (!user) { alert('로그인이 필요합니다.'); return; }

        confirmBtn.disabled = true;
        confirmBtn.textContent = '저장 중...';

        const { error } = await supabase
          .from('users')
          .update({ user_img: selectedUrl })
          .eq('user_id', user.id);

        confirmBtn.textContent = '확인';

        if (error) {
          console.error('아바타 저장 실패:', error.message);
          alert('저장 중 오류가 발생했습니다.');
          confirmBtn.disabled = false;
          return;
        }

        applyAvatarToProfile(selectedUrl);
        closeAvatarModal();
      },
    });
    const confirmBtn = document.querySelector('#avatarConfirmContainer .btn');
    if (confirmBtn) {
      confirmBtn.style.cssText += 'width:auto;min-width:80px;height:42px;font-size:14px;padding:0 20px;border-radius:12px;';
      confirmBtn.disabled = !currentAvatarUrl;
    }

    grid.innerHTML = '';
    if (avatarList.length === 0) {
      grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#aaa;font-size:13px;padding:16px 0;">등록된 아바타 이미지가 없습니다.</p>`;
      return;
    }

    avatarList.forEach(({ name, url }) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'avatar-option';
      btn.setAttribute('data-url', url);
      btn.setAttribute('aria-label', `아바타 ${name}`);

      if (currentAvatarUrl && url === currentAvatarUrl) {
        btn.classList.add('is-selected');
      }

      btn.innerHTML = `
        <img src="${url}" alt="${name}" loading="lazy"
             onerror="this.parentElement.classList.add('avatar-option--error')">
        <span class="avatar-option__check" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="3"
               stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </span>
      `;

      btn.addEventListener('click', () => {
        document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        selectedUrl = url;
        if (confirmBtn) confirmBtn.disabled = false;
      });

      grid.appendChild(btn);
    });

    document.getElementById('avatarModalClose')?.addEventListener('click', closeAvatarModal);
    document.getElementById('avatarModalBackdrop')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeAvatarModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAvatarModal();
    });
  }

  document.getElementById('profileAvatarBtn')?.addEventListener('click', openAvatarModal);


  /* =====================================================
     [2] 빈 상태 오버레이 헬퍼
     ===================================================== */

  function applyEmptyOverlay(wrapperEl, message) {
    if (!wrapperEl) return;
    wrapperEl.classList.add('empty-blurred');
    const overlay = document.createElement('div');
    overlay.className = 'empty-overlay';
    overlay.innerHTML = `
      <span class="empty-overlay__icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.8"
             stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </span>
      <span class="empty-overlay__msg">${message}</span>
    `;
    wrapperEl.style.position = 'relative';
    wrapperEl.appendChild(overlay);
  }


  /* =====================================================
     [3] 아이콘 마크업 생성 헬퍼
     ===================================================== */

  function iconCardHtml(imgUrl, sizeKey = 'lg') {
    return `<div class="mypage-icon mypage-icon--${sizeKey}"
                 style="background-image:url('${imgUrl}');"></div>`;
  }


  /* =====================================================
     ✅ [4] 내가 쓴 리뷰 카드 렌더링 (대시보드)
     ===================================================== */

  function renderReviewList() {
    const container = document.getElementById('reviewList');
    if (!container) return;

    const starsHtml = (rating) =>
      '★'.repeat(rating) + '☆'.repeat(5 - rating) + ' ' + rating + '.0';

    const dummyReviews = [
      { toolName: '툴 이름', toolImg: '', date: '----/--/--', rating: 5, text: '리뷰 내용이 표시됩니다.' },
      { toolName: '툴 이름', toolImg: '', date: '----/--/--', rating: 4, text: '리뷰 내용이 표시됩니다.' },
      { toolName: '툴 이름', toolImg: '', date: '----/--/--', rating: 3, text: '리뷰 내용이 표시됩니다.' },
    ];

    const isEmpty = EMPTY_MODE || MY_REVIEWS.length === 0;
    const source  = isEmpty ? dummyReviews : MY_REVIEWS;

    container.innerHTML = source.map(r => `
      <li class="review-item">
        <div class="review-item__header">
          <span class="review-item__tool-name">${r.toolName}</span>
          <span class="review-item__date">${r.date}</span>
        </div>
        <div class="review-item__row">
          ${iconCardHtml(r.toolImg, 'sm')}
          <div style="display:flex;flex-direction:column;flex:1;min-width:0;gap:2px;">
            <span class="review-item__stars">${starsHtml(r.rating)}</span>
            <span class="review-item__desc">${r.text}</span>
          </div>
        </div>
      </li>
    `).join('');

    if (isEmpty) {
      const card = container.closest('.dashboard-card');
      applyEmptyOverlay(card, '작성한 리뷰가 없습니다');
    }
  }


  /* =====================================================
     ✅ [5] 리뷰 관리 섹션 렌더링
     ===================================================== */

  function renderReviewManage() {
    const container = document.getElementById('reviewManageList');
    if (!container) return;

    if (EMPTY_MODE || MY_REVIEWS.length === 0) {
      container.innerHTML = `
        <div class="review-manage-item">
          <div class="mypage-icon mypage-icon--md" style="background-color:#e8eef5;"></div>
          <div class="review-manage-item__body">
            <div class="review-manage-item__meta">툴 이름 · ----/--/--</div>
            <div class="review-manage-item__text">리뷰 내용이 표시됩니다.</div>
          </div>
          <div class="review-manage-item__actions">
            <button class="review-action-btn" disabled>수정</button>
            <button class="review-action-btn review-action-btn--delete" disabled>삭제</button>
          </div>
        </div>
        <div class="review-manage-item">
          <div class="mypage-icon mypage-icon--md" style="background-color:#e8eef5;"></div>
          <div class="review-manage-item__body">
            <div class="review-manage-item__meta">툴 이름 · ----/--/--</div>
            <div class="review-manage-item__text">리뷰 내용이 표시됩니다.</div>
          </div>
          <div class="review-manage-item__actions">
            <button class="review-action-btn" disabled>수정</button>
            <button class="review-action-btn review-action-btn--delete" disabled>삭제</button>
          </div>
        </div>
      `;
      applyEmptyOverlay(container, '작성한 리뷰가 없습니다');
      return;
    }

    container.innerHTML = '';

    MY_REVIEWS.forEach((r, idx) => {
      const item = document.createElement('div');
      item.className = 'review-manage-item';

      const renderView = () => {
        item.innerHTML = `
          ${iconCardHtml(r.toolImg, 'md')}
          <div class="review-manage-item__body">
            <div class="review-manage-item__meta">${r.toolName} · ${r.date}</div>
            <div class="review-manage-item__text">${r.text}</div>
          </div>
          <div class="review-manage-item__actions">
            <button class="review-action-btn edit-btn">수정</button>
            <button class="review-action-btn review-action-btn--delete delete-btn">삭제</button>
          </div>
        `;
        item.querySelector('.edit-btn').onclick = renderEdit;
        item.querySelector('.delete-btn').onclick = () => {
          if (!confirm('리뷰를 삭제할까요?')) return;
          deleteReview(r.reviewId, idx);
        };
      };

      const renderEdit = () => {
        item.innerHTML = `
          ${iconCardHtml(r.toolImg, 'md')}
          <div class="review-manage-item__body">
            <div class="review-manage-item__meta">${r.toolName} · ${r.date}</div>
            <textarea class="review-edit-textarea" rows="2">${r.text}</textarea>
          </div>
          <div class="review-manage-item__actions">
            <button class="review-action-btn save-btn">저장</button>
            <button class="review-action-btn review-action-btn--cancel cancel-btn">취소</button>
          </div>
        `;
        item.querySelector('.save-btn').onclick = () => {
          const newText = item.querySelector('textarea').value;
          updateReview(r.reviewId, idx, newText);
        };
        item.querySelector('.cancel-btn').onclick = renderView;
      };

      renderView();
      container.appendChild(item);
    });
  }


  /* =====================================================
     ✅ [REVIEW CRUD] DB 수정 / 삭제
     ===================================================== */

  async function updateReview(reviewId, idx, newText) {
    const { error } = await supabase
      .from('tool_reviews')
      .update({ review_content: newText })
      .eq('review_id', reviewId);

    if (error) {
      console.error('리뷰 수정 실패:', error.message);
      alert('수정 중 오류가 발생했습니다.');
      return;
    }

    MY_REVIEWS[idx].text = newText;
    renderReviewList();
    renderReviewManage();
  }

  async function deleteReview(reviewId, idx) {
    const { error } = await supabase
      .from('tool_reviews')
      .delete()
      .eq('review_id', reviewId);

    if (error) {
      console.error('리뷰 삭제 실패:', error.message);
      alert('삭제 중 오류가 발생했습니다.');
      return;
    }

    MY_REVIEWS.splice(idx, 1);
    renderReviewList();
    renderReviewManage();
  }


  /* =====================================================
     [6] 툴 슬라이더
     ===================================================== */

  function renderToolSlider(containerId, tools, isEmpty = false, emptyMsg = '사용한 툴이 없습니다') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const actualEmpty = isEmpty || tools.length === 0;

    if (actualEmpty) {
      container.innerHTML = `
        <button class="slider-arrow prev" disabled>
          <img src="/media/next.png" alt="이전">
        </button>
        <div class="mypage-icon mypage-icon--lg" style="background-color:#e8eef5;"></div>
        <button class="slider-arrow next" disabled>
          <img src="/media/next.png" alt="다음">
        </button>
      `;
      const card = container.closest('.dashboard-card');
      applyEmptyOverlay(card, emptyMsg);
      return;
    }

    let idx = 0;
    const update = () => {
      const tool = tools[idx];
      container.innerHTML = `
        <button class="slider-arrow prev">
          <img src="/media/next.png" alt="이전">
        </button>
        ${iconCardHtml(tool.img, 'lg')}
        <button class="slider-arrow next">
          <img src="/media/next.png" alt="다음">
        </button>
      `;
      container.querySelector('.prev').onclick = () => {
        idx = (idx - 1 + tools.length) % tools.length;
        update();
      };
      container.querySelector('.next').onclick = () => {
        idx = (idx + 1) % tools.length;
        update();
      };
    };
    update();
  }


  /* =====================================================
     [7] 업로드한 작업물 렌더링
     ===================================================== */

  function initAudioPlayer(item, src) {
    const playBtn  = item.querySelector('.work-audio-play');
    const progress = item.querySelector('.work-audio-progress');
    const timeEl   = item.querySelector('.work-audio-time');
    if (!playBtn) return;

    const audio = src ? new Audio(src) : null;

    const PLAY_SVG  = `<svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><polygon points="2,1 9,5 2,9"/></svg>`;
    const PAUSE_SVG = `<svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><rect x="1" y="1" width="3" height="8"/><rect x="6" y="1" width="3" height="8"/></svg>`;

    const fmt = (s) => {
      const m  = Math.floor(s / 60);
      const ss = Math.floor(s % 60).toString().padStart(2, '0');
      return `${m}:${ss}`;
    };

    playBtn.innerHTML = PLAY_SVG;

    if (!audio) {
      playBtn.disabled = true;
      return;
    }

    audio.addEventListener('timeupdate', () => {
      const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
      progress.style.width = pct + '%';
      timeEl.textContent = fmt(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      progress.style.width = '0%';
      timeEl.textContent = '0:00';
      playBtn.innerHTML = PLAY_SVG;
    });

    audio.addEventListener('loadedmetadata', () => {
      timeEl.textContent = fmt(audio.duration);
    });

    playBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (audio.paused) {
        audio.play();
        playBtn.innerHTML = PAUSE_SVG;
      } else {
        audio.pause();
        playBtn.innerHTML = PLAY_SVG;
      }
    });

    const track = item.querySelector('.work-audio-track');
    if (track) {
      track.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!audio.duration) return;
        const rect  = track.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        audio.currentTime = ratio * audio.duration;
      });
    }
  }

  function initVideoPlayer(item, src) {
    const playBtn  = item.querySelector('.work-video-play');
    const progress = item.querySelector('.work-video-progress');
    const timeEl   = item.querySelector('.work-video-time');
    const thumb    = item.querySelector('.work-thumb--video');
    if (!playBtn || !thumb) return;

    if (!src) {
      playBtn.disabled = true;
      return;
    }

    const PLAY_SVG  = `<svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><polygon points="2,1 9,5 2,9"/></svg>`;
    const PAUSE_SVG = `<svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><rect x="1" y="1" width="3" height="8"/><rect x="6" y="1" width="3" height="8"/></svg>`;

    const fmt = (s) => {
      const m  = Math.floor(s / 60);
      const ss = Math.floor(s % 60).toString().padStart(2, '0');
      return `${m}:${ss}`;
    };

    const video = document.createElement('video');
    video.src = src;
    video.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:8px;display:block;';
    video.preload = 'metadata';
    thumb.insertBefore(video, thumb.firstChild);

    playBtn.innerHTML = PLAY_SVG;

    video.addEventListener('timeupdate', () => {
      const pct = video.duration ? (video.currentTime / video.duration) * 100 : 0;
      if (progress) progress.style.width = pct + '%';
      if (timeEl) timeEl.textContent = fmt(video.currentTime);
    });

    video.addEventListener('ended', () => {
      if (progress) progress.style.width = '0%';
      if (timeEl) timeEl.textContent = '0:00';
      playBtn.innerHTML = PLAY_SVG;
    });

    video.addEventListener('loadedmetadata', () => {
      if (timeEl) timeEl.textContent = fmt(video.duration);
    });

    playBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (video.paused) {
        video.play();
        playBtn.innerHTML = PAUSE_SVG;
      } else {
        video.pause();
        playBtn.innerHTML = PLAY_SVG;
      }
    });

    const track = item.querySelector('.work-video-track');
    if (track) {
      track.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!video.duration) return;
        const rect  = track.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        video.currentTime = ratio * video.duration;
      });
    }
  }

  function renderWorksContent(filter) {
    const container = document.getElementById('worksContent');
    if (!container) return;

    const items = WORKS_DATA[filter] || [];
    container.innerHTML = '';

    if (items.length === 0) {
      container.innerHTML = `<p style="text-align:center;color:#aaa;font-size:13px;padding:24px 0;">업로드된 파일이 없습니다.</p>`;
      return;
    }

    const list = document.createElement('div');
    list.className = 'works-list';

    items.forEach(item => {
      const div = document.createElement('div');
      div.className = 'work-item';

      let thumbHtml = '';
      let infoHtml  = '';

      if (filter === '문서') {
        thumbHtml = `
          <div class="work-thumb work-thumb--doc work-thumb--clickable"
               data-work-id="${item.workId}"
               style="cursor:pointer;">
            <span class="doc-ext">${item.ext}</span>
            <div class="doc-lines">
              <div class="doc-line"></div>
              <div class="doc-line"></div>
              <div class="doc-line" style="width:70%;"></div>
            </div>
          </div>`;
        infoHtml = `
          <div class="work-info">
            <span class="work-name">${item.name}</span>
            <span class="work-meta">${item.date}</span>
          </div>`;

      } else if (filter === '이미지') {
        thumbHtml = `
          <div class="work-thumb work-thumb--image work-thumb--clickable"
               data-work-id="${item.workId}"
               style="cursor:pointer;">
            ${item.img
              ? `<img src="${item.img}" alt="${item.name}"
                      style="width:100%;height:100%;object-fit:cover;border-radius:8px;"
                      onerror="this.style.display='none'">`
              : ''}
          </div>`;
        infoHtml = `
          <div class="work-info">
            <span class="work-name">${item.name}</span>
            <span class="work-meta">${item.date}</span>
          </div>`;

      } else if (filter === '영상') {
        thumbHtml = `
          <div class="work-thumb work-thumb--video work-thumb--clickable"
               data-work-id="${item.workId}"
               style="position:relative;cursor:pointer;">
            <button class="work-video-play" style="
              position:absolute;inset:0;margin:auto;
              width:28px;height:28px;border-radius:50%;
              background:rgba(255,255,255,0.9);border:none;
              cursor:pointer;display:flex;align-items:center;justify-content:center;
              box-shadow:0 2px 8px rgba(0,0,0,0.3);z-index:2;color:#1a1a2e;
              transition:transform 0.15s;
            "></button>
          </div>`;
        infoHtml = `
          <div class="work-info">
            <span class="work-name">${item.name}</span>
            <span class="work-meta">${item.date}</span>
            <div class="work-video-bar">
              <div class="work-video-track">
                <div class="work-video-progress"></div>
              </div>
              <span class="work-video-time">0:00</span>
            </div>
          </div>`;

      } else if (filter === '오디오') {
        thumbHtml = `
          <div class="work-thumb work-thumb--audio work-thumb--clickable"
               data-work-id="${item.workId}"
               style="cursor:pointer;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="1.8"
                 stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
          </div>`;
        infoHtml = `
          <div class="work-info">
            <span class="work-name">${item.name}</span>
            <span class="work-meta">${item.date}</span>
            <div class="work-audio-bar">
              <button class="work-audio-play"></button>
              <div class="work-audio-track">
                <div class="work-audio-progress"></div>
              </div>
              <span class="work-audio-time">0:00</span>
            </div>
          </div>`;
      }

      div.innerHTML = thumbHtml + infoHtml;
      list.appendChild(div);

      const clickable = div.querySelector('.work-thumb--clickable');
      if (clickable) {
        clickable.addEventListener('click', (e) => {
          if (e.target.closest('.work-video-play')) return;
          goToArtwork(clickable.dataset.workId);
        });
      }

      if (filter === '오디오') initAudioPlayer(div, item.workPath ?? '');
      else if (filter === '영상') initVideoPlayer(div, item.workPath ?? '');
    });

    container.appendChild(list);
  }

  function renderWorks() {
    const worksCard = document.querySelector('.works-card');

    const totalCount = Object.values(WORKS_DATA).reduce((sum, arr) => sum + arr.length, 0);
    const isEmpty = EMPTY_MODE || totalCount === 0;

    if (isEmpty) {
      applyEmptyOverlay(worksCard, '업로드한 작업물이 없습니다');
      return;
    }

    const filterTarget = document.getElementById('worksFilterSelect');
    if (filterTarget) {
      filterTarget.innerHTML = `
        <select style="
          height:36px;
          padding:0 32px 0 12px;
          border:1.5px solid #e0e8f5;
          border-radius:10px;
          font-size:13px;
          font-weight:600;
          color:#1a1a2e;
          background:#fff url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%226%22 viewBox=%220 0 10 6%22><path d=%22M0 0l5 6 5-6z%22 fill=%22%23888%22/></svg>') no-repeat right 10px center;
          background-size:10px 6px;
          appearance:none;
          -webkit-appearance:none;
          cursor:pointer;
          outline:none;
          box-sizing:border-box;
        ">
          <option value="문서">문서</option>
          <option value="이미지">이미지</option>
          <option value="영상">영상</option>
          <option value="오디오">오디오</option>
        </select>
      `;
      const sel = filterTarget.querySelector('select');

      const firstNonEmpty = ['문서', '이미지', '영상', '오디오'].find(f => WORKS_DATA[f]?.length > 0);
      if (firstNonEmpty) currentWorksFilter = firstNonEmpty;

      sel.value = currentWorksFilter;
      sel.addEventListener('change', (e) => {
        currentWorksFilter = e.target.value;
        renderWorksContent(e.target.value);
      });
    }

    renderWorksContent(currentWorksFilter);
  }


  /* =====================================================
     ✅ [8] 내 정보 수정 폼
     ===================================================== */

  async function initInfoEditForm() {
    const currentName    = userInfo?.user_name                          ?? '';
    const currentJob     = toKo(JOB_MAP,     userInfo?.user_job)        ?? null;
    const currentAge     = toKo(AGE_MAP,     userInfo?.user_age)        ?? null;
    const currentCountry = toKo(COUNTRY_MAP, userInfo?.user_country)    ?? null;

    const nicknameInput = document.getElementById('editNickname');
    if (nicknameInput) nicknameInput.value = currentName;

    const initSelect = (wrapperId, options, selectedValue) => {
      const wrap = document.getElementById(wrapperId);
      if (!wrap) return;
      const placeholderOption = selectedValue
        ? ''
        : `<option value="" disabled selected>선택해주세요</option>`;
      wrap.innerHTML = `
        <select class="edit-input">
          ${placeholderOption}
          ${options.map(o =>
            `<option${o === selectedValue ? ' selected' : ''}>${o}</option>`
          ).join('')}
        </select>
      `;
    };

    initSelect('selectJobWrap',     ['마케터', '개발자', '디자이너', '기획자', '기타'], currentJob);
    initSelect('selectAgeWrap',     ['10대', '20대', '30대', '40대', '50대 이상'],       currentAge);
    initSelect('selectCountryWrap', ['대한민국', '미국', '일본', '중국', '기타'],        currentCountry);

    await loadButton({
      target: '#nicknameCheckContainer',
      text: '중복확인',
      variant: 'outline',
      onClick: () => {
        const nick = document.getElementById('editNickname').value.trim();
        if (!nick) return alert('닉네임을 입력해주세요.');
        alert(`"${nick}"은(는) 사용 가능한 닉네임입니다.`);
      },
    });

    await loadButton({
      target: '#infoSubmitContainer',
      text: '수정',
      variant: 'primary',
      onClick: async () => {
        if (!user) return alert('로그인이 필요합니다.');

        const newName    = document.getElementById('editNickname')?.value.trim()          ?? '';
        const newJob     = document.querySelector('#selectJobWrap select')?.value          ?? '';
        const newAge     = document.querySelector('#selectAgeWrap select')?.value          ?? '';
        const newCountry = document.querySelector('#selectCountryWrap select')?.value      ?? '';

        if (!newName) return alert('이름을 입력해주세요.');

        const { error } = await supabase
          .from('users')
          .update({
            user_name:    newName,
            user_job:     newJob,
            user_age:     newAge,
            user_country: newCountry,
          })
          .eq('user_id', user.id);

        if (error) {
          console.error('정보 수정 실패:', error.message);
          alert('수정 중 오류가 발생했습니다.');
          return;
        }

        renderUserInfoCard({
          user_name:    newName,
          user_job:     newJob,
          user_age:     newAge,
          user_country: newCountry,
        });

        alert('정보가 수정되었습니다.');
      },
    });
  }


  /* =====================================================
     [9] FAQ 드롭다운
     ===================================================== */

  function initFaqItems() {
    document.querySelectorAll('[data-drop_down]').forEach(drop => {
      const trigger = drop.querySelector('[data-faq-trigger]');
      const panel   = drop.querySelector('[data-faq-panel]');
      if (!trigger || !panel) return;

      panel.style.display = 'none';

      trigger.addEventListener('click', () => {
        const isOpen = trigger.getAttribute('aria-expanded') === 'true';
        trigger.setAttribute('aria-expanded', String(!isOpen));
        panel.setAttribute('aria-hidden', String(isOpen));
        panel.style.display = isOpen ? 'none' : 'block';
      });
    });
  }


  /* =====================================================
     [10] 버튼 클릭 동작
     ===================================================== */

  function initButtonActions() {
    document.querySelectorAll('[data-scroll-to]').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = document.getElementById(btn.getAttribute('data-scroll-to'));
        if (!target) return;

        const trigger = target.querySelector('[data-faq-trigger]');
        const panel   = target.querySelector('[data-faq-panel]');
        if (trigger && panel && trigger.getAttribute('aria-expanded') !== 'true') {
          trigger.setAttribute('aria-expanded', 'true');
          panel.setAttribute('aria-hidden', 'false');
          panel.style.display = 'block';
        }

        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    document.querySelectorAll('[data-href]').forEach(btn => {
      btn.addEventListener('click', () => {
        window.location.href = btn.getAttribute('data-href');
      });
    });
  }


  /* =====================================================
     [11] 1:1 문의 버튼
     ===================================================== */

  await loadButton({
    target: '#inquiryBtnContainer',
    text: '문의하기',
    variant: 'primary',
    onClick: () => { window.location.href = '/inquiry/inquiry.html'; },
  });


  /* =====================================================
     [12] 초기화
     ===================================================== */

  initFaqItems();
  initButtonActions();
  await initInfoEditForm();
  await initAvatarModal();

  renderToolSlider('aiToolSlider',       AI_TOOLS,       false,      'AI 추천 툴이 없습니다');
  renderToolSlider('recentToolSlider',   RECENT_TOOLS,   EMPTY_MODE, '사용한 툴이 없습니다');
  renderToolSlider('favoriteToolSlider', FAVORITE_TOOLS, false,      '관심 툴이 없습니다');

  renderReviewList();
  renderReviewManage();
  renderWorks();

  // ✅ 저장된 아바타 없으면 랜덤 배정, 있으면 그대로 사용
  const savedAvatarUrl = await assignRandomAvatarIfNeeded();
  if (savedAvatarUrl) applyAvatarToProfile(savedAvatarUrl);

  renderProfileEmail();
  renderUserInfoCard(userInfo);

});