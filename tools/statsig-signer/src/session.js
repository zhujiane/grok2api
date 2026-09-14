import { DEFAULT_CURVES } from "./curves.js";
import { readFile } from "node:fs/promises";
import { computeAnimationHex, extractPage } from "./animation.js";
import { log } from "./log.js";

export function createSession(config, store, fetchPage = fetch) {
  let page = { metaContent: "", curves: DEFAULT_CURVES };
  let source = "bundled";
  let lastRefreshAt = null;
  let lastError = "";
  let pending;
  let closed = false;
  const controller = new AbortController();

  async function enqueueRefresh(reason) {
    if (closed) return;
    if (!config.pageFile && !config.refreshRemote) return;
    if (pending) return pending;
    pending = (async () => {
      try {
        let html;
        if (config.pageFile) {
          html = await readFile(config.pageFile, "utf8");
        } else {
          const sso = await store.load();
          const cookies = { ...sso.extraCookies };
          if (sso.sso) Object.assign(cookies, { sso: sso.sso, "sso-rw": sso.ssoRw || sso.sso });
          const headers = { accept: "text/html", "user-agent": sso.userAgent || "Mozilla/5.0" };
          if (Object.keys(cookies).length) headers.cookie = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; ");
          const response = await fetchPage(`${config.grokBaseURL}/`, {
            headers, redirect: "error",
            signal: AbortSignal.any([controller.signal, AbortSignal.timeout(config.fetchTimeoutMs || 8000)]),
          });
          if (!response.ok) throw new Error(`Grok 页面返回 HTTP ${response.status}；请提供可直连出口或 STATSIG_PAGE_FILE`);
          const chunks = [];
          let size = 0;
          for await (const chunk of response.body) {
            size += chunk.length;
            if (size > 8 * 1024 * 1024) throw new Error("Grok 页面超过 8 MiB");
            chunks.push(chunk);
          }
          html = Buffer.concat(chunks).toString("utf8");
        }
        const next = extractPage(html);
        if (!closed) {
          page = next;
          source = config.pageFile ? "file" : "remote";
          lastRefreshAt = new Date().toISOString();
          lastError = "";
        }
      } catch (error) {
        lastError = error.message;
        log.warn("statsig_refresh_failed", { reason, error: lastError });
      } finally { pending = null; }
    })();
    return pending;
  }

  return {
    enqueueRefresh,
    isReady: () => Boolean(page) && !closed && (!config.pageFile || source !== "bundled"),
    async resolveEnvironment({ metaContent, curves } = {}) {
      if (curves) return { metaContent, hex: computeAnimationHex(metaContent, curves) };
      if (closed) throw new Error("签名服务已关闭");
      if (config.pageFile && source === "bundled") await enqueueRefresh("sign");
      if (config.pageFile && source === "bundled") throw new Error(lastError || "曲线文件尚未就绪");
      if (!page) throw new Error(lastError || "Statsig curves 尚未就绪");
      const seed = metaContent || page.metaContent;
      return { metaContent: seed, hex: computeAnimationHex(seed, page.curves) };
    },
    invalidateSso() { if (page) page = { ...page, metaContent: "" }; },
    async status() {
      const sso = await store.load();
      return { mode: "javascript", curvesSource: source, hexReady: Boolean(page), lastRefreshAt, lastError,
        sso: { configured: Boolean(sso.sso), hasClearance: Boolean(sso.extraCookies?.cf_clearance), updatedAt: sso.updatedAt } };
    },
    async close() { closed = true; controller.abort(); await pending; page = null; },
  };
}
