import { chromium } from "playwright";

import { solveClearance } from "./flaresolverr.js";
import { log } from "./log.js";

export function createSession(config, store) {
  let browser;
  let context;
  let page;
  let hex = "";
  let lastRefreshAt = null;
  let lastError = "";
  let browserReady = false;
  let refreshQueue = Promise.resolve();
  let closed = false;

  async function status() {
    const sso = await store.load();
    return {
      browserReady,
      hexReady: Boolean(hex),
      hexPreview: hex ? `${hex.slice(0, 12)}…(${hex.length})` : "",
      sso: publicFields(sso),
      lastRefreshAt,
      lastError,
      proxyURL: config.proxyURL,
      flareSolverrURL: config.flareSolverrURL,
    };
  }

  function currentHex() {
    return hex;
  }

  function enqueueRefresh(reason) {
    refreshQueue = refreshQueue.then(() => refresh(reason)).catch((error) => {
      lastError = error.message;
      log.error("statsig_refresh_failed", { reason, error: error.message });
    });
    return refreshQueue;
  }

  async function refresh(reason = "manual") {
    if (closed) {
      return;
    }
    let lastErrorCause = null;
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      try {
        await refreshOnce(reason, attempt);
        return;
      } catch (error) {
        lastErrorCause = error;
        log.warn("statsig_refresh_retry", { reason, attempt, error: error.message });
        await sleep(Math.min(15_000, 2000 * attempt));
      }
    }
    throw lastErrorCause || new Error("Statsig 刷新失败");
  }

  async function refreshOnce(reason, attempt) {
    log.info("statsig_refresh_start", { reason, attempt });
    const sso = await store.load();
    let clearance = { cookies: {}, userAgent: sso.userAgent || "" };
    try {
      clearance = await solveClearance({
        flareSolverrURL: config.flareSolverrURL,
        targetURL: config.grokBaseURL,
        proxyURL: config.proxyURL,
        timeoutMs: Math.max(config.navigationTimeoutMs, 60_000),
      });
    } catch (error) {
      log.warn("flaresolverr_unavailable", { error: error.message });
    }

    if (!browser) {
      browser = await chromium.launch({
        headless: config.headless,
        args: [
          "--disable-blink-features=AutomationControlled",
          "--no-sandbox",
          "--disable-dev-shm-usage",
        ],
      });
    }
    if (context) {
      await context.close().catch(() => {});
      context = null;
      page = null;
    }
    const userAgent = clearance.userAgent || sso.userAgent || undefined;
    context = await browser.newContext({
      proxy: config.proxyURL ? { server: config.proxyURL } : undefined,
      userAgent,
      locale: "en-US",
      viewport: { width: 1280, height: 800 },
    });
    await context.addInitScript(initScripts);
    await context.addCookies(buildCookies(config.grokBaseURL, sso, clearance.cookies));
    page = await context.newPage();
    page.setDefaultTimeout(config.navigationTimeoutMs);
    await page.goto(`${config.grokBaseURL}/`, { waitUntil: "domcontentloaded" });
    hex = await waitForHex(page, config.hexWaitMs);
    if (!hex) {
      await page.evaluate(async () => {
        try {
          await fetch("/rest/rate-limits", {
            method: "POST",
            credentials: "include",
            headers: { "content-type": "application/json" },
            body: "{}",
          });
        } catch {
          // Capture happens in the digest hook regardless of HTTP status.
        }
      });
      hex = await waitForHex(page, config.hexWaitMs);
    }
    if (!hex) {
      throw new Error("未能从 grok.com 捕获 Statsig HEX");
    }
    browserReady = true;
    lastRefreshAt = new Date().toISOString();
    lastError = "";
    log.info("statsig_refresh_ok", { reason, attempt, hexLength: hex.length });
  }

  async function close() {
    closed = true;
    browserReady = false;
    if (context) {
      await context.close().catch(() => {});
    }
    if (browser) {
      await browser.close().catch(() => {});
    }
  }

  return { status, currentHex, enqueueRefresh, close };
}

function publicFields(sso) {
  return {
    configured: Boolean(sso?.sso),
    hasClearance: Boolean(sso?.extraCookies?.cf_clearance),
    updatedAt: sso?.updatedAt || null,
  };
}

function initScripts() {
  Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  const original = crypto.subtle.digest.bind(crypto.subtle);
  crypto.subtle.digest = async function digest(algorithm, data) {
    try {
      const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data.buffer || data);
      const text = new TextDecoder().decode(bytes);
      const index = text.indexOf("obfiowerehiring");
      if (index >= 0) {
        window.__statsigHex = text.slice(index + "obfiowerehiring".length);
      }
    } catch {
      // Ignore probe failures; the original digest still runs.
    }
    return original(algorithm, data);
  };
}

async function waitForHex(page, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = await page.evaluate(() => window.__statsigHex || "");
    if (value && value.includes && !value.includes("\0")) {
      const trimmed = String(value).trim();
      if (trimmed.length >= 16) {
        return trimmed;
      }
    }
    await sleep(250);
  }
  return "";
}

function buildCookies(baseURL, sso, clearanceCookies) {
  const hostname = new URL(baseURL).hostname;
  const domain = hostname.startsWith(".") ? hostname : `.${hostname.replace(/^www\./u, "")}`;
  const cookies = [];
  const merged = { ...(sso.extraCookies || {}), ...(clearanceCookies || {}) };
  if (sso.sso) {
    merged.sso = sso.sso;
    merged["sso-rw"] = sso.ssoRw || sso.sso;
  }
  for (const [name, value] of Object.entries(merged)) {
    if (!name || !value) {
      continue;
    }
    cookies.push({
      name,
      value: String(value),
      domain,
      path: "/",
      secure: true,
      httpOnly: name === "sso" || name === "sso-rw" || name.startsWith("cf_"),
      sameSite: "Lax",
    });
  }
  return cookies;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
