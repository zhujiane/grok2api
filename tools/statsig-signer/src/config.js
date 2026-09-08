import path from "node:path";

function env(name, fallback = "") {
  const value = process.env[name];
  return value == null || value === "" ? fallback : value;
}

function envInt(name, fallback) {
  const raw = Number.parseInt(env(name, String(fallback)), 10);
  return Number.isFinite(raw) ? raw : fallback;
}

function envMs(name, fallbackMs) {
  const raw = env(name, "");
  if (!raw) {
    return fallbackMs;
  }
  const match = /^(\d+(?:\.\d+)?)(ms|s|m|h)?$/u.exec(raw.trim());
  if (!match) {
    return fallbackMs;
  }
  const amount = Number(match[1]);
  const unit = match[2] || "ms";
  const factor = unit === "h" ? 3_600_000 : unit === "m" ? 60_000 : unit === "s" ? 1000 : 1;
  return Math.max(1000, Math.round(amount * factor));
}

export function loadConfig() {
  const listen = env("LISTEN", "0.0.0.0:8788");
  const [host, portText] = listen.includes(":") ? listen.split(":") : ["0.0.0.0", listen];
  return {
    host: host || "0.0.0.0",
    port: Number.parseInt(portText, 10) || 8788,
    grokBaseURL: env("GROK_BASE_URL", "https://grok.com").replace(/\/+$/u, ""),
    proxyURL: env("PROXY_URL", env("WARP_PROXY_URL", "socks5://warp:1080")),
    flareSolverrURL: env("FLARESOLVERR_URL", "http://flaresolverr:8191"),
    token: env("STATSIG_SIGNER_TOKEN"),
    dataDir: env("DATA_DIR", path.resolve("data")),
    refreshIntervalMs: envMs("REFRESH_INTERVAL", 10 * 60 * 1000),
    navigationTimeoutMs: envMs("NAVIGATION_TIMEOUT", 45_000),
    hexWaitMs: envMs("HEX_WAIT", 30_000),
    headless: env("HEADLESS", "true") !== "false",
  };
}
