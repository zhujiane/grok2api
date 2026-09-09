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

  let lastClearance = { cookies: {}, userAgent: "" };
  let lastClearanceAt = 0;
  const CLEARANCE_MAX_AGE_MS = 25 * 60 * 1000;
  const accountHexCache = new Map();
  const inFlightSsoPromises = new Map();
  const ACCOUNT_HEX_TTL_MS = 30 * 60 * 1000;

  async function status() {
    const sso = await store.load();
    return {
      browserReady,
      hexReady: Boolean(hex),
      hexPreview: hex ? `${hex.slice(0, 12)}…(${hex.length})` : "",
      cachedAccountsCount: accountHexCache.size,
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

  async function getHexForSso(ssoString) {
    if (!ssoString) {
      return { hex, metaContent: "" };
    }
    const now = Date.now();
    const cached = accountHexCache.get(ssoString);
    if (cached && cached.expiresAt > now && cached.hex) {
      return cached;
    }
    if (inFlightSsoPromises.has(ssoString)) {
      return inFlightSsoPromises.get(ssoString);
    }
    const promise = (async () => {
      try {
        const ssoResult = await fetchHexForSso(ssoString);
        if (ssoResult && ssoResult.hex) {
          const entry = {
            hex: ssoResult.hex,
            metaContent: ssoResult.metaContent || "",
            expiresAt: Date.now() + ACCOUNT_HEX_TTL_MS,
          };
          accountHexCache.set(ssoString, entry);
          return entry;
        }
      } catch (err) {
        log.warn("fetch_sso_hex_failed", { error: err.message });
      } finally {
        inFlightSsoPromises.delete(ssoString);
      }
      return { hex, metaContent: "" };
    })();
    inFlightSsoPromises.set(ssoString, promise);
    return promise;
  }

  async function fetchHexForSso(ssoString) {
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

    let clearance = lastClearance;
    const clearanceAge = Date.now() - lastClearanceAt;
    if (!clearance || !clearance.cookies || Object.keys(clearance.cookies).length === 0 || clearanceAge > CLEARANCE_MAX_AGE_MS) {
      try {
        clearance = await solveClearance({
          flareSolverrURL: config.flareSolverrURL,
          targetURL: config.grokBaseURL,
          proxyURL: config.proxyURL,
          timeoutMs: Math.max(config.navigationTimeoutMs, 60_000),
        });
        lastClearance = clearance;
        lastClearanceAt = Date.now();
      } catch (err) {
        log.warn("flaresolverr_unavailable_for_sso", { error: err.message });
      }
    }

    const userAgent = clearance?.userAgent || undefined;
    const userContext = await browser.newContext({
      proxy: config.proxyURL ? { server: config.proxyURL } : undefined,
      userAgent,
      locale: "en-US",
      viewport: { width: 1280, height: 800 },
    });

    try {
      await userContext.addInitScript(initScripts);
      const cookies = buildCookies(config.grokBaseURL, { sso: ssoString, ssoRw: ssoString }, clearance?.cookies);
      await userContext.addCookies(cookies);

      const userPage = await userContext.newPage();
      userPage.setDefaultTimeout(config.navigationTimeoutMs);
      await userPage.goto(`${config.grokBaseURL}/imagine`, { waitUntil: "domcontentloaded" });

      let captured = await waitForHex(userPage, 35000);
      if (!captured) {
        await userPage.evaluate(async () => {
          try {
            await fetch("/rest/rate-limits", {
              method: "POST",
              credentials: "include",
              headers: { "content-type": "application/json" },
              body: "{}",
            });
          } catch {}
        });
        captured = await waitForHex(userPage, 10000);
      }

      let metaContent = "";
      try {
        metaContent = await userPage.evaluate(() => {
          const el = document.querySelector('meta[name*="site"][name*="verification"]');
          return el ? el.content : "";
        });
      } catch {}

      if (captured) {
        log.info("sso_hex_captured", {
          hexLength: captured.length,
          hasMeta: Boolean(metaContent),
          metaLength: metaContent.length,
          ssoPrefix: ssoString.slice(0, 15),
        });
      }
      return { hex: captured, metaContent };
    } finally {
      await userContext.close().catch(() => {});
    }
  }

  function invalidateSso(ssoString) {
    if (ssoString) {
      accountHexCache.delete(ssoString);
    }
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
      lastClearance = clearance;
      lastClearanceAt = Date.now();
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
    accountHexCache.clear();
    inFlightSsoPromises.clear();
    if (context) {
      await context.close().catch(() => {});
    }
    if (browser) {
      await browser.close().catch(() => {});
    }
  }

  return { status, currentHex, getHexForSso, invalidateSso, enqueueRefresh, close };
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
