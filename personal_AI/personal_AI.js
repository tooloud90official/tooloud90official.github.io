import { supabase } from "/_ignore/supabase.js";

async function requireLogin() {
  const { data: { user }, error } = await supabase.auth.getUser();
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

async function fetchUserProfile(authUser) {
  const { data, error } = await supabase
    .from("users")
    .select("user_id, recommended_tools, recent_tools, favorite_tools")
    .eq("user_id", authUser.id)
    .single();

  if (error) {
    console.error("[DEBUG] users 조회 실패:", error);
    throw error;
  }

  return data;
}

async function fetchToolsByIds(toolIds = []) {
  if (!Array.isArray(toolIds) || toolIds.length === 0) return [];
  const cleanIds = toolIds.filter(Boolean).map((id) => String(id).trim());
  if (cleanIds.length === 0) return [];

  const { data, error } = await supabase
    .from("tools")
    .select("tool_ID, tool_name, icon")
    .in("tool_ID", cleanIds);

  if (error) {
    console.error("[DEBUG] tools 조회 실패:", error);
    throw error;
  }

  const toolMap = new Map((data || []).map((tool) => [tool.tool_ID, tool]));
  return cleanIds.map((id) => toolMap.get(id)).filter(Boolean);
}

function renderEmptyMessage(container, message = "등록된 툴이 없습니다.") {
  if (!container) return;
  container.innerHTML = `<p class="tool-board__empty">${message}</p>`;
}

async function renderToolIcons(targetSelector, tools) {
  const container = document.querySelector(targetSelector);
  if (!container) return;

  if (typeof window.loadToolIconCard !== "function") {
    console.warn("[DEBUG] loadToolIconCard 없음 — icon.js 로드 안됨");
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

    const detailUrl = `/detail_AI/detail_AI.html?tool_ID=${encodeURIComponent(tool.tool_ID)}`;

    await window.loadToolIconCard(`#${mount.id}`, {
      toolName: tool.tool_name || "툴",
      iconUrl:  tool.icon || "",
      url:      detailUrl,
    });
  }
}

function scrollToHash() {
  const hash = window.location.hash?.replace("#", "");
  if (!hash) return;
  const target = document.getElementById(hash);
  if (target) {
    const top = target.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top, behavior: "smooth" });
  }
}

async function initPersonalAIPage() {
  try {
    const authUser = await requireLogin();
    if (!authUser) return;

    const userProfile = await fetchUserProfile(authUser);

    const recommendedIds = userProfile?.recommended_tools || [];
    const recentIds      = userProfile?.recent_tools      || [];
    const favoriteIds    = userProfile?.favorite_tools    || [];

    const [recommendedTools, recentTools, favoriteTools] = await Promise.all([
      fetchToolsByIds(recommendedIds),
      fetchToolsByIds(recentIds),
      fetchToolsByIds(favoriteIds),
    ]);

    await renderToolIcons("#recommendedTools", recommendedTools);
    await renderToolIcons("#recentTools",      recentTools);
    await renderToolIcons("#favoriteTools",    favoriteTools);

    setTimeout(scrollToHash, 400);
  } catch (err) {
    console.error("[personal_AI] 초기화 실패:", err);
    renderEmptyMessage(document.querySelector("#recommendedTools"), "추천 툴을 불러오지 못했습니다.");
    renderEmptyMessage(document.querySelector("#recentTools"),      "최근 사용 툴을 불러오지 못했습니다.");
    renderEmptyMessage(document.querySelector("#favoriteTools"),    "관심 툴을 불러오지 못했습니다.");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await initPersonalAIPage();
});