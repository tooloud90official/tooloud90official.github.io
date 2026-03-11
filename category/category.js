import { loadNativeSelect } from '/_common/select/select.js';

const CATEGORY_DATA = {
  "이미지·오디오·영상": [
    { id: "img-gen", title: "이미지 생성", tools: [
      { name: "Midjourney", rating: 5, desc: "예술적인 고퀄리티 이미지 생성이 가능한 AI 툴입니다." },
      { name: "DALL-E 3", rating: 4, desc: "프롬프트 이해력이 뛰어난 OpenAI의 이미지 모델입니다." },
      { name: "Stable Diffusion", rating: 4, desc: "자유도 높은 오픈소스 이미지 생성 도구입니다." },
      { name: "Adobe Firefly", rating: 5, desc: "상업적 이용에 안전한 어도비의 AI 모델입니다." },
      { name: "Leonardo.ai", rating: 4, desc: "다양한 모델과 설정을 제공하는 웹 기반 생성 도구입니다." },
      { name: "Bing Image Creator", rating: 3, desc: "무료로 쉽게 이미지를 생성할 수 있는 도구입니다." }
    ]},
    { id: "img-edit", title: "이미지 편집", tools: [] },
    { id: "vid-gen", title: "영상 생성", tools: [] },
    { id: "vid-edit", title: "영상 편집", tools: [] },
    { id: "aud-gen", title: "음성 생성", tools: [
      { name: "ElevenLabs", rating: 5, desc: "가장 자연스러운 AI 음성 합성 및 클로닝 서비스를 제공합니다." },
      { name: "Murf AI", rating: 4, desc: "전문적인 성우 톤의 음성을 생성하는 스튜디오 도구입니다." },
      { name: "Play.ht", rating: 4, desc: "다양한 언어와 감정 표현이 가능한 음성 생성기입니다." },
      { name: "Lovo.ai", rating: 4, desc: "콘텐츠 제작에 최적화된 차세대 AI 보이스 플랫폼입니다." },
      { name: "Resemble AI", rating: 3, desc: "실시간 음성 복제 및 맞춤형 보이스 제작 툴입니다." },
      { name: "Speechify", rating: 4, desc: "텍스트를 읽어주는 오디오북 스타일의 AI 음성 도구입니다." }
    ]},
    { id: "aud-edit", title: "오디오 편집", tools: [] }
  ],
  "리서치": [
    { id: "paper", title: "논문 리서치", tools: [
      { name: "Consensus", rating: 5, desc: "과학적 연구 기반의 신뢰할 수 있는 답변을 제공합니다." },
      { name: "Elicit", rating: 4, desc: "논문 요약 및 리서치 보조 전문 AI입니다." },
      { name: "Perplexity", rating: 5, desc: "실시간 웹 검색 기반의 지능형 검색 엔진입니다." },
      { name: "Semantic Scholar", rating: 4, desc: "논문 검색과 인용 분석을 도와주는 도구입니다." },
      { name: "ResearchRabbit", rating: 4, desc: "논문 간의 관계를 시각화해주는 리서치 툴입니다." },
      { name: "SciSpace", rating: 3, desc: "논문 읽기와 이해를 돕는 코파일럿 서비스입니다." }
    ]},
    { id: "img-res", title: "이미지 리서치", tools: [] },
    { id: "shop-res", title: "쇼핑 리서치", tools: [
      { name: "Klarna AI", rating: 4, desc: "개인화된 쇼핑 추천 및 가격 비교를 돕는 AI 비서입니다." },
      { name: "Shopify Magic", rating: 4, desc: "이커머스 운영 및 제품 설명을 자동화하는 도구입니다." },
      { name: "Amazon Rufus", rating: 3, desc: "아마존 쇼핑 경험을 개선하는 대화형 AI 가이드입니다." },
      { name: "Price.com", rating: 4, desc: "AI 기반으로 최저가와 캐시백 정보를 찾아주는 리서치 툴입니다." },
      { name: "Visual Search AI", rating: 3, desc: "이미지로 동일하거나 유사한 상품을 찾아주는 기술입니다." },
      { name: "Honey", rating: 5, desc: "자동으로 쿠폰을 찾고 가격 변동을 추적하는 쇼핑 보조 도구입니다." }
    ]}
  ],
  "문서 생성·요약·편집": [
    { id: "doc-gen", title: "문서 생성", tools: [
      { name: "Jasper", rating: 5, desc: "마케팅 문구 및 블로그 포스팅 최적화 툴입니다." },
      { name: "Copy.ai", rating: 4, desc: "다양한 템플릿을 활용한 텍스트 생성 도구입니다." },
      { name: "Writesonic", rating: 4, desc: "SEO 최적화된 기사 작성을 지원하는 AI입니다." },
      { name: "Rytr", rating: 3, desc: "가성비 좋은 다목적 작문 보조 도구입니다." },
      { name: "Notion AI", rating: 5, desc: "노션 워크스페이스 내에서 작동하는 문서 편집 AI입니다." },
      { name: "Claude 3", rating: 5, desc: "긴 문맥 이해와 자연스러운 문장 생성이 강점입니다." }
    ]},
    { id: "doc-sum", title: "문서 요약", tools: [] },
    { id: "doc-edit", title: "문서 편집", tools: [
      { name: "Grammarly", rating: 5, desc: "실시간 문법 교정 및 문체 개선을 위한 필수 도구입니다." },
      { name: "Hemingway Editor", rating: 4, desc: "가독성이 높고 간결한 문장을 쓰도록 돕는 편집기입니다." },
      { name: "Quillbot", rating: 5, desc: "문장 재구성과 패러프레이징에 탁월한 AI 도구입니다." },
      { name: "DeepL Write", rating: 4, desc: "번역 수준의 정확도로 문장을 세련되게 다듬어줍니다." },
      { name: "ProWritingAid", rating: 4, desc: "전문 작가들을 위한 심층적인 문서 분석 및 편집 툴입니다." },
      { name: "LanguageTool", rating: 3, desc: "다양한 언어를 지원하는 오픈소스 맞춤형 교정기입니다." }
    ]}
  ],
  "개발·코딩": [
    { id: "code", title: "코드 생성", tools: [
      { name: "GitHub Copilot", rating: 5, desc: "가장 널리 쓰이는 실시간 코드 완성 도구입니다." },
      { name: "Cursor", rating: 5, desc: "AI 기반의 코드 편집기로 개발 효율을 높여줍니다." },
      { name: "Replit Ghostwriter", rating: 4, desc: "브라우저 기반 IDE에서 제공하는 코딩 비서입니다." },
      { name: "Tabnine", rating: 4, desc: "프라이버시 중심의 자동 코드 완성 서비스입니다." },
      { name: "Amazon CodeWhisperer", rating: 3, desc: "AWS 최적화 코딩을 지원하는 무료 도구입니다." },
      { name: "Codiga", rating: 3, desc: "코드 분석 및 정적 검사를 도와주는 툴입니다." }
    ]},
    { id: "web", title: "웹/앱 빌더", tools: [
      { name: "Framer AI", rating: 5, desc: "텍스트만으로 고퀄리티 웹사이트 디자인을 생성합니다." },
      { name: "10Web", rating: 4, desc: "워드프레스 웹사이트를 AI로 빠르게 구축해주는 서비스입니다." },
      { name: "Bubble", rating: 4, desc: "노코드 기반으로 복잡한 웹 앱을 제작할 수 있는 플랫폼입니다." },
      { name: "Softr", rating: 4, desc: "에어테이블 데이터를 기반으로 비즈니스 앱을 즉시 만듭니다." },
      { name: "Dora AI", rating: 5, desc: "3D 애니메이션이 포함된 놀라운 웹사이트를 생성하는 툴입니다." },
      { name: "FlutterFlow", rating: 4, desc: "AI 보조를 통해 모바일 앱을 시각적으로 빌드하는 도구입니다." }
    ]}
  ],
  "학습·교육": [
    { id: "lang", title: "언어", tools: [
      { name: "Duolingo Max", rating: 5, desc: "AI 튜터와 함께하는 언어 학습 서비스입니다." },
      { name: "ELSA Speak", rating: 4, desc: "영어 발음 교정을 위한 특화 AI입니다." },
      { name: "Speak", rating: 4, desc: "자연스러운 회화 연습을 도와주는 AI 스피킹 앱입니다." },
      { name: "Memrise", rating: 3, desc: "영상 기반의 생생한 언어 학습을 지원합니다." },
      { name: "Rosetta Stone AI", rating: 4, desc: "전통적인 학습법에 AI 기술을 접목한 언어 툴입니다." },
      { name: "HelloTalk AI", rating: 3, desc: "실제 원어민 대화 스타일을 학습하는 AI 채팅 비서입니다." }
    ]},
    { id: "study", title: "학습 보조", tools: [
      { name: "Khan Academy (Khanmigo)", rating: 5, desc: "학생들에게 정답이 아닌 '방법'을 가르쳐주는 AI 튜터입니다." },
      { name: "Quizlet AI", rating: 4, desc: "학습 자료를 기반으로 맞춤형 퀴즈와 플래시카드를 만듭니다." },
      { name: "Brainly", rating: 4, desc: "학생들의 질문에 명확한 답변과 설명을 제공하는 커뮤니티형 AI입니다." },
      { name: "Gradescope", rating: 3, desc: "시험 채점과 피드백 과정을 자동화하여 교사를 돕는 툴입니다." },
      { name: "Socratic", rating: 4, desc: "구글이 만든 학습 보조 앱으로 문제 풀이 과정을 시각화합니다." },
      { name: "Coursera Coach", rating: 4, desc: "온라인 강의 수강 중 궁금한 점을 즉시 해결해주는 AI 가이드입니다." }
    ]}
  ],
  "챗봇·어시스턴트": [
    { id: "general", title: "범용적 AI", tools: [
      { name: "ChatGPT Plus", rating: 5, desc: "가장 대중적이고 강력한 성능의 챗봇 서비스입니다." },
      { name: "Claude 3.5 Sonnet", rating: 5, desc: "매우 지능적이고 논리적인 대화 경험을 제공합니다." },
      { name: "Google Gemini", rating: 4, desc: "멀티모달 기능과 구글 생태계 연동이 뛰어납니다." },
      { name: "Poe", rating: 4, desc: "다양한 AI 봇을 한데 모아 사용할 수 있는 플랫폼입니다." },
      { name: "Wrtn (뤼튼)", rating: 4, desc: "국내 환경에 최적화된 올인원 AI 플랫폼입니다." },
      { name: "Character.ai", rating: 3, desc: "다양한 캐릭터와 대화할 수 있는 커뮤니티형 AI입니다." }
    ]},
    { id: "workflow", title: "워크플로우/협업", tools: [
      { name: "Zapier Central", rating: 5, desc: "AI를 통해 수천 개의 앱을 자동화하고 업무 흐름을 관리합니다." },
      { name: "Monday.com AI", rating: 4, desc: "팀 프로젝트 관리와 워크플로우를 최적화하는 협업 비서입니다." },
      { name: "ClickUp AI", rating: 4, desc: "문서 작성부터 작업 요약까지 지원하는 올인원 생산성 도구입니다." },
      { name: "Asana Intelligence", rating: 4, desc: "팀의 목표 달성을 위해 작업을 자동으로 우선순위화합니다." },
      { name: "Slack AI", rating: 4, desc: "채널 메시지 요약 및 사내 지식 검색을 돕는 협업 AI입니다." },
      { name: "Fireflies.ai", rating: 5, desc: "화상 회의 내용을 자동으로 기록하고 분석하는 협업 도구입니다." }
    ]}
  ]
};

let sortSelectInstance = null;

document.addEventListener("DOMContentLoaded", async () => {
  const tabs = document.querySelectorAll('.tab-item');
  const modal = document.getElementById('modalOverlay');
  const closeBtn = document.getElementById('closeModal');

  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
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
  const tabParam = urlParams.get('tab');

  if (tabParam) {
    const matchedTab = [...tabs].find(
      tab => tab.textContent.trim() === decodeURIComponent(tabParam)
    );
    if (matchedTab) {
      tabs.forEach(t => t.classList.remove('active'));
      matchedTab.classList.add('active');
      renderFolders(matchedTab.textContent.trim());
    } else {
      renderFolders("이미지·오디오·영상");
    }
  } else {
    renderFolders("이미지·오디오·영상");
  }
});

function renderFolders(categoryName) {
  const toolGrid = document.getElementById('toolGrid');
  if (!toolGrid) return;
  toolGrid.innerHTML = "";

  const folders = CATEGORY_DATA[categoryName] || [];

  folders.forEach(folder => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'tool-group';
    groupDiv.innerHTML = `
      <div class="tool-icon-box">
        <div class="mini-icon"></div><div class="mini-icon"></div>
        <div class="mini-icon"></div><div class="mini-icon"></div>
      </div>
      <span class="group-title">${folder.title}</span>
    `;
    groupDiv.addEventListener('click', () => openModal(folder));
    toolGrid.appendChild(groupDiv);
  });
}

function renderToolList(tools, sortValue) {
  let sorted = [...tools];

  if (sortValue === 'name') {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
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
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <div style="width:70px; height:70px; background:#eee; border-radius:20px; flex-shrink:0;"></div>
      <div style="flex:1;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="item-badge">${tool.name}</span>
          <span style="color:#ffcc00; font-size:14px;">${'★'.repeat(tool.rating)}</span>
        </div>
        <p class="item-desc">${tool.desc}</p>
        <a href="/detail_AI/detail_AI.html" class="item-detail-btn">상세 ></a>
      </div>
    `;
    toolListEl.appendChild(item);
  });
}

async function openModal(folderData) {
  const modal = document.getElementById('modalOverlay');
  const modalTitle = document.getElementById('modalTitle');
  const modalCount = document.getElementById('modalTotalCount');

  if (!modal || !folderData) return;

  modalTitle.textContent = folderData.title;
  const tools = folderData.tools || [];
  modalCount.textContent = `전체 (${tools.length})`;

  // ✅ loadNativeSelect로 교체 - onChange를 초기화 시 전달
  sortSelectInstance = await loadNativeSelect({
    target: '#modalSortSelect',
    placeholder: '이름 순',
    value: 'name',
    options: [
      { label: '이름 순', value: 'name' },
      { label: '평점 순', value: 'rating' }
    ],
    onChange: (item) => {
      renderToolList(tools, item.value);
    }
  });

  renderToolList(tools, 'name');

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}