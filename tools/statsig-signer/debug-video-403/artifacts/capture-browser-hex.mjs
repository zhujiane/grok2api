import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";

const proxy = "http://172.26.115.36:7897";
const sso = JSON.parse(readFileSync("/tmp/opencode/sso.json", "utf8")).sso;

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const ctx = await browser.newContext({
  proxy: { server: proxy },
  userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
});
await ctx.addCookies([
  { name: "sso", value: sso, domain: ".grok.com", path: "/", secure: true },
  { name: "sso-rw", value: sso, domain: ".grok.com", path: "/", secure: true },
]);
const page = await ctx.newPage();

const captured = [];
await page.exposeFunction("__cap", (v) => captured.push(v));
await page.addInitScript(() => {
  const orig = crypto.subtle.digest.bind(crypto.subtle);
  crypto.subtle.digest = async function (alg, data) {
    try {
      const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data.buffer || data);
      const text = new TextDecoder().decode(bytes);
      if (text.includes("obfiowerehiring")) window.__cap(text);
    } catch {}
    return orig(alg, data);
  };
});

await page.goto("https://grok.com/imagine", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(6000);
try {
  await page.evaluate(async () => {
    await fetch("/rest/rate-limits", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: "{}" }).catch(() => {});
  });
} catch {}
await page.waitForTimeout(6000);

const meta = await page.evaluate(() => {
  const el = document.querySelector('meta[name*="site"][name*="verification"]');
  return el ? el.content : "";
});

// Capture all SVG path d attributes and animate elements
const svgInfo = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll("svg path").forEach((p) => {
    out.push({ d: p.getAttribute("d"), stroke: p.getAttribute("stroke") });
  });
  return out;
});

console.log("META:", meta);
console.log("=== FULL digest inputs ===");
for (const c of captured.slice(0, 5)) console.log(JSON.stringify(c));
console.log("=== svg paths count:", svgInfo.length);
for (const s of svgInfo.slice(0, 20)) console.log(JSON.stringify(s).slice(0, 200));

writeFileSync("/tmp/opencode/browser3.json", JSON.stringify({ meta, captured, svgInfo }));
await browser.close();
