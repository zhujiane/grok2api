import { log } from "./log.js";

const CLOUDFLARE_COOKIE_NAMES = new Set(["cf_clearance", "__cf_bm", "_cfuvid"]);

export async function solveClearance({ flareSolverrURL, targetURL, proxyURL, timeoutMs = 60_000 }) {
  const endpoint = flaresolverrEndpoint(flareSolverrURL);
  const payload = {
    cmd: "request.get",
    url: targetURL,
    maxTimeout: timeoutMs,
  };
  if (proxyURL) {
    payload.proxy = { url: proxyURL };
  }
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs + 15_000),
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`FlareSolverr 返回 HTTP ${response.status}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new Error("FlareSolverr 响应不是 JSON");
  }
  if (parsed.status !== "ok") {
    throw new Error(`FlareSolverr 求解失败: ${parsed.message || "unknown error"}`);
  }
  const cookies = {};
  for (const cookie of parsed.solution?.cookies || []) {
    const name = String(cookie?.name || "").trim();
    const value = String(cookie?.value || "").trim();
    if (!name || !value) {
      continue;
    }
    if (isCloudflareCookie(name)) {
      cookies[name] = value;
    }
  }
  const userAgent = String(parsed.solution?.userAgent || "").trim();
  if (!userAgent) {
    throw new Error("FlareSolverr 未返回 User-Agent");
  }
  log.info("flaresolverr_ok", { cookies: Object.keys(cookies), userAgent });
  return { cookies, userAgent };
}

function isCloudflareCookie(name) {
  const lower = name.toLowerCase();
  return CLOUDFLARE_COOKIE_NAMES.has(lower) || lower.startsWith("cf_chl_");
}

function flaresolverrEndpoint(value) {
  const parsed = new URL(String(value || "").trim());
  const path = parsed.pathname.replace(/\/+$/u, "");
  parsed.pathname = !path || path === "/" ? "/v1" : path.endsWith("/v1") ? path : `${path}/v1`;
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString();
}
