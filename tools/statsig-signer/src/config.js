import path from "node:path";

function env(name, fallback = "") {
  const value = process.env[name];
  return value == null || value === "" ? fallback : value;
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
    refreshRemote: env("REFRESH_REMOTE", "false") === "true",
    pageFile: env("STATSIG_PAGE_FILE"),
    fetchTimeoutMs: envMs("FETCH_TIMEOUT", 8000),
    token: env("STATSIG_SIGNER_TOKEN"),
    dataDir: env("DATA_DIR", path.resolve("data")),
    refreshIntervalMs: envMs("REFRESH_INTERVAL", 10 * 60 * 1000),
  };
}
