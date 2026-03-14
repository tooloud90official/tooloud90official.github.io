import { supabase } from "/_ignore/supabase.js";

/**
 * 로그인 체크
 * - 로그인 안 되어 있으면 로그인 페이지로 이동
 */
async function requireLogin() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("[personal_AI] auth.getUser 오류:", error);
    window.location.replace("/login1/login1.html");
    return null;
  }

  if (!user) {
    window.location.replace("/login1/login1.html");
    return null;
  }

  return user;
}

/**
 * users 테이블에서 현재 유저 정보 조회
 * 현재는 users.user_id = auth.uid 라고 가정
 */
async function fetchUserProfile(authUser) {
  const { data, error } = await supabase
    .from("users")
    .select("user_id, recommended_tools, recent_tools, favorite_tools")
    .eq("user_id", authUser.id)
    .single();

  if (error) {
    console.error("[personal_AI] users 조회 실패:", error);
    throw error;
  }

  return data;
}

/**
 * users 테이블에 저장된 tool_name 배열로
 * tools 테이블 조회
 *
 * users: ["ChatGPT", "Midjourney"]
 * tools: tool_name 기준 조회
 */
async function fetchToolsByNames(toolNames = []) {
  if (!Array.isArray(toolNames) || toolNames.length === 0) return [];

  const cleanNames = toolNames
    .filter(Boolean)
    .map((name) => String(name).trim());

  if (cleanNames.length === 0) return [];

  const { data, error } = await supabase
    .from("tools")
    .select("tool_ID, tool_name, icon")
    .in("tool_name", cleanNames);

  if (error) {
    console.error("[personal_AI] tools 조회 실패:", error);
    throw error;
  }

  // users 배열 순서 유지
  const toolMap = new Map((data || []).map((tool) => [tool.tool_name, tool]));
  return cleanNames.map((name) => toolMap.get(name)).filter(Boolean);
}

/**
 * 빈 메시지
 */
function renderEmptyMessage(container, message = "등록된 툴이 없습니다.") {
  if (!container) return;
  container.innerHTML = `<p class="tool-board__empty">${message}</p>`;
}

/**
 * 아이콘 렌더링
 * - 이름은 tools.tool_name
 * - 아이콘은 tools.icon
 * - 클릭 시 tool_ID 넘김
 */
async function renderToolIcons(targetSelector, tools) {
  const container = document.querySelector(targetSelector);
  if (!container) return;

  if (typeof window.loadToolIconCard !== "function") {
    console.warn("loadToolIconCard not found. /_common/icon/icon.js 확인");
    return;
  }

  container.innerHTML = "";

  if (!tools || tools.length === 0) {
    renderEmptyMessage(container, "등록된 툴이 없습니다.");
    return;
  }

  for (let i = 0; i < tools.length; i++) {
    const tool = tools[i];

    const mount = document.createElement("div");
    mount.className = "tool-icon-mount";
    mount.id = `${targetSelector.replace("#", "")}-icon-${i + 1}`;
    container.appendChild(mount);

    const detailUrl = `/detail_AI/detail_AI.html?tool_id=${encodeURIComponent(tool.tool_ID)}`;

    await window.loadToolIconCard(`#${mount.id}`, {
      toolName: tool.tool_name || "툴",
      iconUrl: tool.icon || "",
      url: detailUrl,
    });
  }
}

/**
 * 초기화
 */
async function initPersonalAIPage() {
  try {
    const authUser = await requireLogin();
    if (!authUser) return;

    const userProfile = await fetchUserProfile(authUser);

    const recommendedNames = userProfile?.recommended_tools || [];
    const recentNames = userProfile?.recent_tools || [];
    const favoriteNames = userProfile?.favorite_tools || [];

    const [recommendedTools, recentTools, favoriteTools] = await Promise.all([
      fetchToolsByNames(recommendedNames),
      fetchToolsByNames(recentNames),
      fetchToolsByNames(favoriteNames),
    ]);

    await renderToolIcons("#recommendedTools", recommendedTools);
    await renderToolIcons("#recentTools", recentTools);
    await renderToolIcons("#favoriteTools", favoriteTools);
  } catch (err) {
    console.error("[personal_AI] 초기화 실패:", err);

    renderEmptyMessage(
      document.querySelector("#recommendedTools"),
      "추천 툴을 불러오지 못했습니다."
    );
    renderEmptyMessage(
      document.querySelector("#recentTools"),
      "최근 사용 툴을 불러오지 못했습니다."
    );
    renderEmptyMessage(
      document.querySelector("#favoriteTools"),
      "관심 툴을 불러오지 못했습니다."
    );
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await initPersonalAIPage();
});