import { SUPABASE_URL} from "/_ignore/supabase.js"; // ✅ Groq

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
    dev_gen:  '코드 스크립트 생성',
    dev_bld:  '웹/앱 빌더',
    edu_lan:  '언어',
    edu_supp: '학습 보조',
    ast_gen:  '범용적 생성형 AI',
    ast_work: '워크플로우/협업'
  }
};

async function callGroq(prompt) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/groq-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const raw = await response.text();
  console.log('[groq] raw 응답:', raw);

  let data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('[groq] JSON 파싱 실패:', e);
    throw new Error('Groq 응답 JSON 파싱 실패');
  }

  console.log('[groq] API 응답:', JSON.stringify(data));

  if (!response.ok) {
    throw new Error(data?.error || 'Groq 요청 실패');
  }

  const text = data?.choices?.[0]?.message?.content ?? '';
  const clean = text.replace(/```json|```/g, '').trim();

  if (!clean) {
    throw new Error('Groq 응답 내용 없음');
  }

  try {
    return JSON.parse(clean);
  } catch (e) {
    console.error('[groq] 모델 응답 JSON 파싱 실패:', clean);
    throw new Error('모델 응답이 JSON 형식이 아님');
  }
}

async function matchCategories(userInput) {
  let favoriteTools = [];
  try {
    favoriteTools = JSON.parse(userInput.favorite_tools.replace(/'/g, '"'));
  } catch {
    favoriteTools = [userInput.favorite_tools];
  }

  const prompt = `
당신은 AI 툴 추천 전문가입니다.
아래 사용자 정보를 바탕으로 가장 적합한 AI 툴 카테고리를 추천해주세요.

사용자 정보:
- 연령대: ${userInput.user_age}
- 직군: ${userInput.user_job}
- 국적: ${userInput.user_country}
- 관심 있는 툴: ${favoriteTools.join(', ')}

사용 가능한 대분류(tool_cat) 목록과 의미: ${JSON.stringify(categories.대분류)}
사용 가능한 소분류(tool_subcat) 목록과 의미: ${JSON.stringify(categories.소분류)}

위 목록에서만 선택해서 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.
{
  "recommended_cats": ["cat1", "cat2"],
  "recommended_subcats": ["subcat1", "subcat2", "subcat3"]
}
  `.trim();

  try {
    return await callGroq(prompt);
  } catch (e) {
    console.error('[groq] matchCategories 실패:', e.message);
    return null;
  }
}

async function searchCategories(keyword) {
  const prompt = `
당신은 AI 툴 검색 전문가입니다.
사용자가 입력한 자연어 검색어를 분석해서 가장 관련 있는 AI 툴 카테고리와 키워드를 추출해주세요.

검색어: "${keyword}"

사용 가능한 대분류(tool_cat) 목록과 의미: ${JSON.stringify(categories.대분류)}
사용 가능한 소분류(tool_subcat) 목록과 의미: ${JSON.stringify(categories.소분류)}

위 목록에서만 선택하고, keywords는 검색어에서 추출한 핵심 단어 1~3개를 작성하세요. 단, 툴 이름이 언급된 경우 반드시 영문 정식 명칭으로 변환해서 포함하세요. 예: "챗지피티"→"ChatGPT", "리무브"→"remove.bg", "미드저니"→"Midjourney", "클로드"→"Claude"
아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.
{
  "recommended_cats": ["cat1"],
  "recommended_subcats": ["subcat1", "subcat2"],
  "keywords": ["키워드1", "키워드2"]
}
  `.trim();

  try {
    return await callGroq(prompt);
  } catch (e) {
    console.error('[groq] searchCategories 실패:', e.message);
    return null;
  }
}

export { matchCategories, searchCategories };