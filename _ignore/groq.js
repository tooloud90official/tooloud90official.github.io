import { SUPABASE_URL } from "/_ignore/supabase.js";
import { supabase } from "/_ignore/supabase.js";

// ===== 카테고리 =====
const categories = {
  대분류: {
    media: '이미지/오디오/영상',
    res:   '리서치',
    doc:   '문서',
    dev:   '개발/코딩',
    edu:   '학습/교육',
    ast:   '챗봇/어시스턴트'
  },
  소분류: {
    img_gen:  '이미지 생성',
    img_edit: '이미지 편집',
    vid_gen:  '영상 생성',
    vid_edit: '영상 편집',
    aud_gen:  '음성 생성',
    aud_edit: '오디오 편집',
    res_paper:'논문 리서치',
    res_img:  '이미지 리서치',
    res_shop: '쇼핑 리서치',
    doc_gen:  '문서 생성',
    doc_sum:  '문서 요약',
    doc_edit: '문서 편집',
    dev_gen:  '코드 생성',
    dev_bld:  '웹/앱 빌더',
    edu_lan:  '언어',
    edu_supp: '학습 보조',
    ast_gen:  '생성형 AI',
    ast_work: '협업'
  }
};

//////////////////////////////
// ===== 시맨틱 키워드 확장 맵 =====
// 토큰 → [연관 카테고리 키, 확장 키워드들]
// 의미적으로 연결되지만 글자가 달라 Levenshtein으로 못 잡는 케이스 커버
//////////////////////////////

const SEMANTIC_MAP = {
  // 언어/학습
  '일본어':   { cats: ['edu_lan', 'edu'],  keywords: ['언어', '학습'] },
  '영어':     { cats: ['edu_lan', 'edu'],  keywords: ['언어', '학습'] },
  '중국어':   { cats: ['edu_lan', 'edu'],  keywords: ['언어', '학습'] },
  '스페인어': { cats: ['edu_lan', 'edu'],  keywords: ['언어', '학습'] },
  '프랑스어': { cats: ['edu_lan', 'edu'],  keywords: ['언어', '학습'] },
  '독일어':   { cats: ['edu_lan', 'edu'],  keywords: ['언어', '학습'] },
  '한국어':   { cats: ['edu_lan', 'edu'],  keywords: ['언어', '학습'] },
  '외국어':   { cats: ['edu_lan', 'edu'],  keywords: ['언어', '학습'] },
  '번역':     { cats: ['edu_lan', 'edu'],  keywords: ['언어', '번역'] },
  '회화':     { cats: ['edu_lan', 'edu'],  keywords: ['언어', '말하기'] },
  '공부':     { cats: ['edu_supp', 'edu'], keywords: ['학습', '교육'] },
  '학습':     { cats: ['edu_supp', 'edu'], keywords: ['교육', '공부'] },
  '교육':     { cats: ['edu_supp', 'edu'], keywords: ['학습', '공부'] },
  '수학':     { cats: ['edu_supp', 'edu'], keywords: ['학습', '교육'] },
  '과학':     { cats: ['edu_supp', 'edu'], keywords: ['학습', '교육'] },

  // 이미지
  '그림':     { cats: ['img_gen', 'media'],  keywords: ['이미지', '생성', '그리기'] },
  '그리기':   { cats: ['img_gen', 'media'],  keywords: ['이미지', '생성', '그림'] },
  '사진':     { cats: ['img_gen', 'media'],  keywords: ['이미지', '편집'] },
  '이미지':   { cats: ['img_gen', 'media'],  keywords: ['생성', '그림', '사진'] },
  '삽화':     { cats: ['img_gen', 'media'],  keywords: ['이미지', '생성'] },
  '디자인':   { cats: ['img_edit', 'media'], keywords: ['이미지', '편집'] },
  '배경':     { cats: ['img_edit', 'media'], keywords: ['이미지', '편집'] },
  '포토샵':   { cats: ['img_edit', 'media'], keywords: ['이미지', '편집'] },

  // 영상
  '영상':     { cats: ['vid_gen', 'media'],  keywords: ['비디오', '생성', '편집'] },
  '비디오':   { cats: ['vid_gen', 'media'],  keywords: ['영상', '생성', '편집'] },
  '유튜브':   { cats: ['vid_edit', 'media'], keywords: ['영상', '편집'] },
  '쇼츠':     { cats: ['vid_edit', 'media'], keywords: ['영상', '편집', '짧은'] },
  '애니':     { cats: ['vid_gen', 'media'],  keywords: ['영상', '생성'] },
  '애니메이션':{ cats: ['vid_gen', 'media'], keywords: ['영상', '생성'] },

  // 오디오
  '음악':     { cats: ['aud_gen', 'media'],  keywords: ['오디오', '생성', '음성'] },
  '노래':     { cats: ['aud_gen', 'media'],  keywords: ['오디오', '생성', '음성'] },
  '목소리':   { cats: ['aud_gen', 'media'],  keywords: ['음성', '생성', 'TTS'] },
  '음성':     { cats: ['aud_gen', 'media'],  keywords: ['오디오', '생성'] },
  'tts':      { cats: ['aud_gen', 'media'],  keywords: ['음성', '생성'] },
  '팟캐스트': { cats: ['aud_edit', 'media'], keywords: ['오디오', '편집'] },

  // 문서
  '글쓰기':   { cats: ['doc_gen', 'doc'],  keywords: ['문서', '생성', '작성'] },
  '작성':     { cats: ['doc_gen', 'doc'],  keywords: ['문서', '생성'] },
  '보고서':   { cats: ['doc_gen', 'doc'],  keywords: ['문서', '생성'] },
  '요약':     { cats: ['doc_sum', 'doc'],  keywords: ['문서', '요약'] },
  '정리':     { cats: ['doc_sum', 'doc'],  keywords: ['문서', '요약'] },
  '편집':     { cats: ['doc_edit', 'doc'], keywords: ['문서', '편집'] },
  '교정':     { cats: ['doc_edit', 'doc'], keywords: ['문서', '편집'] },
  '블로그':   { cats: ['doc_gen', 'doc'],  keywords: ['문서', '글쓰기', '생성'] },
  '이메일':   { cats: ['doc_gen', 'doc'],  keywords: ['문서', '작성'] },

  // 개발
  '코드':     { cats: ['dev_gen', 'dev'],  keywords: ['코딩', '개발', '프로그래밍'] },
  '코딩':     { cats: ['dev_gen', 'dev'],  keywords: ['코드', '개발'] },
  '프로그래밍':{ cats: ['dev_gen', 'dev'], keywords: ['코드', '개발'] },
  '웹':       { cats: ['dev_bld', 'dev'],  keywords: ['개발', '빌더', '웹사이트'] },
  '앱':       { cats: ['dev_bld', 'dev'],  keywords: ['개발', '모바일'] },
  '자동화':   { cats: ['dev_gen', 'dev'],  keywords: ['코드', '스크립트'] },
  '버그':     { cats: ['dev_gen', 'dev'],  keywords: ['코드', '디버깅'] },

  // 리서치
  '검색':     { cats: ['res_paper', 'res'], keywords: ['리서치', '조사'] },
  '논문':     { cats: ['res_paper', 'res'], keywords: ['리서치', '학술'] },
  '조사':     { cats: ['res_paper', 'res'], keywords: ['리서치', '검색'] },
  '쇼핑':     { cats: ['res_shop', 'res'],  keywords: ['리서치', '상품'] },
  '상품':     { cats: ['res_shop', 'res'],  keywords: ['쇼핑', '리서치'] },

  // 챗봇/어시스턴트
  '챗봇':     { cats: ['ast_gen', 'ast'],  keywords: ['AI', '어시스턴트'] },
  '대화':     { cats: ['ast_gen', 'ast'],  keywords: ['챗봇', '어시스턴트'] },
  '질문':     { cats: ['ast_gen', 'ast'],  keywords: ['챗봇', '어시스턴트'] },
  '협업':     { cats: ['ast_work', 'ast'], keywords: ['팀', '공유', '협력'] },
  '업무':     { cats: ['ast_work', 'ast'], keywords: ['협업', '자동화'] },
};

/**
 * 토큰 배열을 시맨틱 맵으로 확장
 * ["일본어", "학습"] → ["일본어", "학습", "언어", "교육", "공부"] + 매칭 카테고리 키 반환
 */
function expandTokensSemantically(tokens) {
  const expandedTokens = [...tokens];
  const matchedCats    = new Set();

  for (const token of tokens) {
    const entry = SEMANTIC_MAP[token];
    if (entry) {
      expandedTokens.push(...entry.keywords);
      entry.cats.forEach(c => matchedCats.add(c));
    }
  }

  return {
    tokens: [...new Set(expandedTokens)],
    cats:   matchedCats,
  };
}

//////////////////////////////
// ===== 한국어 ↔ 영어 툴명 매핑 =====
//////////////////////////////

const KO_EN_TOOL_MAP = {
  '챗지피티': 'chatgpt',
  '챗gpt':    'chatgpt',
  '지피티':   'chatgpt',
  '클로드':   'claude',
  '미드저니': 'midjourney',
  '미드조니': 'midjourney',
  '달리':     'dall-e',
  '달이':     'dall-e',
  '스테이블디퓨전': 'stable diffusion',
  '퍼플렉시티': 'perplexity',
  '퍼플렉서티': 'perplexity',
  '제미나이': 'gemini',
  '제미니':   'gemini',
  '코파일럿': 'copilot',
  '노션':     'notion',
  '런웨이':   'runway',
  '런웨이ml': 'runway',
  '일레븐랩스': 'elevenlabs',
  '수노':     'suno',
  '유디오':   'udio',
  '감마':     'gamma',
  '캔바':     'canva',
};

function applyKoEnMapping(text) {
  const lower = text.toLowerCase().replace(/\s/g, '');
  for (const [ko, en] of Object.entries(KO_EN_TOOL_MAP)) {
    if (lower.includes(normalize(ko))) {
      return en;
    }
  }
  return text;
}

//////////////////////////////
// ===== 문자열 정규화 =====
//////////////////////////////

function normalize(str) {
  return (str || '')
    .toLowerCase()
    .replace(/\s/g, '')
    .replace(/[^a-z0-9가-힣]/g, '');
}

//////////////////////////////
// ===== 조사/어미 제거 =====
//////////////////////////////

const JOSA_ENDINGS = [
  '에서는', '으로는', '이라고', '라고', '이라는', '라는',
  '이지만', '지만', '이고', '이며', '이면', '이나',
  '에게서', '로부터', '한테서', '에게', '한테',
  '에서', '에도', '에는', '에만',
  '으로', '로는',
  '에', '의', '로', '을', '를', '이', '가', '은', '는', '도', '만', '과', '와', '나',
];

function stripJosa(word) {
  for (const ending of JOSA_ENDINGS) {
    if (word.endsWith(ending) && word.length - ending.length >= 2) {
      return word.slice(0, word.length - ending.length);
    }
  }
  return word;
}

//////////////////////////////
// ===== 자연어 → 핵심 토큰 분해 =====
//////////////////////////////

const STOP_WORDS = new Set([
  '을', '를', '이', '가', '은', '는', '의', '에', '서', '로', '으로',
  '와', '과', '도', '만', '에서', '한', '하는', '해주는', '위한',
  '수', '있는', '있어요', '줘', '주는', '하고', '싶은', '좋은',
  '알려줘', '찾아줘', '추천해줘', '뭐가', '어떤', '되는', '도움',
  'ai', 'AI', '툴', '도구', '앱', '프로그램', '소프트웨어',
]);

function tokenize(text) {
  return text
    .split(/\s+/)
    .map(t => t.replace(/[^a-zA-Z0-9가-힣]/g, ''))
    .map(t => stripJosa(t))
    .filter(t => t.length >= 2 && !STOP_WORDS.has(t));
}

//////////////////////////////
// ===== Levenshtein =====
//////////////////////////////

function levenshtein(a, b) {
  const matrix = Array.from({ length: b.length + 1 }, () => []);

  for (let i = 0; i <= b.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] =
        b[i - 1] === a[j - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
    }
  }

  return matrix[b.length][a.length];
}

function similarity(a, b) {
  const normA = normalize(a);
  const normB = normalize(b);

  if (!normA || !normB) return 0;

  if (normA.includes(normB) || normB.includes(normA)) return 0.95;

  const distance = levenshtein(normA, normB);
  const maxLen   = Math.max(normA.length, normB.length);

  return 1 - distance / maxLen;
}

//////////////////////////////
// ===== 토큰 기반 최대 유사도 =====
//////////////////////////////

function tokenSimilarity(tokens, target) {
  if (!tokens.length || !target) return 0;
  const scores = tokens.map(t => similarity(t, target));
  return Math.max(...scores);
}

//////////////////////////////
// ===== 카테고리 매칭 =====
// semanticCats: expandTokensSemantically에서 직접 매칭된 카테고리 키 Set
//////////////////////////////

function categoryScore(tokens, tool, semanticCats = new Set()) {
  let score = 0;

  const catKey   = tool.tool_cat;
  const subcatKey = tool.tool_subcat;

  // 시맨틱 맵에서 직접 매칭된 카테고리면 보너스 점수
  if (semanticCats.has(subcatKey)) score += 0.5;
  else if (semanticCats.has(catKey)) score += 0.3;

  // 기존 레이블 유사도
  const catLabel = categories.대분류[catKey];
  if (catLabel) score += tokenSimilarity(tokens, catLabel) * 0.2;

  const subLabel = categories.소분류[subcatKey];
  if (subLabel) score += tokenSimilarity(tokens, subLabel) * 0.3;

  return score;
}

//////////////////////////////
// ===== DB 조회 =====
//////////////////////////////

async function fetchAllTools() {
  const { data, error } = await supabase
    .from('tools')
    .select(`
      tool_name,
      tool_des,
      tool_key,
      tool_cat,
      tool_subcat
    `);

  if (error) {
    console.error('[tools] fetch 실패:', error.message);
    return [];
  }

  return data;
}

//////////////////////////////
// ===== tool_name 직접 매칭 =====
//////////////////////////////

function directNameScore(keyword, toolName) {
  if (!keyword || !toolName) return 0;

  const normKeyword = normalize(keyword);
  const normTool    = normalize(toolName);

  if (normKeyword === normTool) return 1.0;
  if (normTool.includes(normKeyword) || normKeyword.includes(normTool)) return 0.95;

  const mapped = normalize(applyKoEnMapping(keyword));
  if (mapped !== normKeyword) {
    if (normTool === mapped) return 1.0;
    if (normTool.includes(mapped) || mapped.includes(normTool)) return 0.95;
  }

  return 0;
}

//////////////////////////////
// ===== 통합 유사도 =====
//////////////////////////////

async function findSimilarTools(keyword, topN = 10, extraKeywords = []) {
  const tools = await fetchAllTools();

  const mappedKeyword = applyKoEnMapping(keyword);
  const rawTokens     = tokenize(keyword);
  const mappedTokens  = tokenize(mappedKeyword);
  const extraTokens   = extraKeywords.flatMap(k => tokenize(k));

  const baseTokens = [...new Set([...rawTokens, ...mappedTokens, ...extraTokens])];

  // 시맨틱 확장: 토큰 → 연관 키워드 + 카테고리 키
  const { tokens: expandedTokens, cats: semanticCats } = expandTokensSemantically(baseTokens);
  const effectiveTokens = expandedTokens.length > 0 ? expandedTokens : [keyword];

  const scored = tools.map(tool => {
    const directScore = Math.max(
      directNameScore(keyword, tool.tool_name),
      directNameScore(mappedKeyword, tool.tool_name)
    );

    if (directScore >= 0.95) {
      return { name: tool.tool_name, score: directScore };
    }

    const nameScore = tokenSimilarity(effectiveTokens, tool.tool_name);
    const descScore = tokenSimilarity(effectiveTokens, tool.tool_des);
    const keyScore  = tokenSimilarity(effectiveTokens, tool.tool_key);
    const catScore  = categoryScore(effectiveTokens, tool, semanticCats); // semanticCats 전달

    const fuzzyScore =
      nameScore * 0.5 +
      descScore * 0.25 +
      keyScore  * 0.1 +
      catScore  * 0.15;

    return { name: tool.tool_name, score: Math.max(directScore, fuzzyScore) };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .filter(t => t.score > 0.2);
}

//////////////////////////////
// ===== Groq =====
//////////////////////////////

async function callGroq(prompt) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/groq-proxy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const raw = await response.text();

  let data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {}

  const text =
    data?.choices?.[0]?.message?.content ||
    data?.choices?.[0]?.text ||
    '';

  const clean = text.replace(/```json|```/g, '').trim();

  if (!clean) throw new Error('Groq 응답 없음');

  return JSON.parse(clean);
}

//////////////////////////////
// ===== 검색 =====
//////////////////////////////

async function searchCategories(keyword) {

  const prompt = `
사용자가 다음 자연어로 AI 툴을 검색했습니다.
검색어: "${keyword}"

아래 카테고리 중에서 이 검색 의도에 맞는 것을 골라주세요.
카테고리:
${JSON.stringify(categories)}

검색어에서 핵심 기능/목적 키워드도 추출해주세요.
예) "일본어 학습에 도움이 되는 툴 알려줘" → keywords: ["일본어", "언어", "학습", "교육"]

JSON만 반환 (다른 텍스트 없이):
{
  "tool_names": [],
  "recommended_cats": [],
  "recommended_subcats": [],
  "keywords": []
}
`;

  let groqResult   = null;
  let groqKeywords = [];

  try {
    groqResult   = await callGroq(prompt);
    groqKeywords = groqResult.keywords || [];
  } catch (e) {
    groqResult = null;
  }

  const similarTools = await findSimilarTools(keyword, 10, groqKeywords);

  const groqNames    = groqResult?.tool_names  || [];
  const similarNames = similarTools.map(t => t.name);

  return {
    tool_names:          [...new Set([...similarNames, ...groqNames])],
    recommended_cats:    groqResult?.recommended_cats    || [],
    recommended_subcats: groqResult?.recommended_subcats || [],
    keywords:            groqKeywords.length > 0 ? groqKeywords : tokenize(keyword),
    _similarityMap:      Object.fromEntries(similarTools.map(t => [t.name, t.score])),
  };
}

//////////////////////////////
// ===== 추천 =====
//////////////////////////////

async function matchCategories(userInput) {
  let favoriteTools = [];

  try {
    favoriteTools = JSON.parse(userInput.favorite_tools.replace(/'/g, '"'));
  } catch {
    favoriteTools = [userInput.favorite_tools];
  }

  const prompt = `
사용자 정보:
- 연령대: ${userInput.user_age}
- 직군: ${userInput.user_job}
- 국적: ${userInput.user_country}
- 관심 툴: ${favoriteTools.join(', ')}

카테고리:
${JSON.stringify(categories)}

JSON만 반환:
{
  "recommended_cats": [],
  "recommended_subcats": []
}
`;

  try {
    return await callGroq(prompt);
  } catch (e) {
    return null;
  }
}

export { matchCategories, searchCategories };