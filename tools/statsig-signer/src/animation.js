import { decodeMetaSeed } from "./statsig.js";

// Protocol reference: https://github.com/anojndr/grok.com-to-openai/blob/master/statsig.py
// Reproduce the color/rotation animation numerically; no DOM or remote code execution.
export function computeAnimationHex(metaContent, curves) {
  const seed = decodeMetaSeed(metaContent);
  validateCurves(curves);
  const rows = curves[seed[5] % curves.length];
  const { color, deg, bezier } = rows[seed[5] % rows.length];
  const controls = bezier.map((v, i) => Number((v * ((i % 2 ? 2 : 1) / 255) - (i % 2 ? 1 : 0)).toFixed(2)));
  const seek = Math.round((seed[24] % 16) * (seed[22] % 16) * (seed[23] % 16) / 10) * 10;
  const progress = cubicBezier(...controls, seek / 4096);
  const rgb = color.slice(0, 3).map((v, i) => Math.max(0, Math.min(255, Math.round(v + (color[i + 3] - v) * progress))));
  const angle = Math.floor(deg * (300 / 255) + 60) * progress * Math.PI / 180;
  // getComputedStyle serializes the matrix with six significant digits before
  // the fingerprint rounds it to two decimal places.
  const cos = Number(Math.cos(angle).toPrecision(6));
  const sin = Number(Math.sin(angle).toPrecision(6));
  return [...rgb, cos, sin, -sin, cos, 0, 0]
    .map((v) => Number(v.toFixed(2)).toString(16)).join("").replace(/[.\-]/gu, "");
}

export function validateCurves(curves) {
  if (!Array.isArray(curves) || !curves.length || curves.length > 64) throw new Error("缺少有效 Statsig curves");
  for (const rows of curves) {
    if (!Array.isArray(rows) || !rows.length || rows.length > 256) throw new Error("Statsig curves 行无效");
    for (const row of rows) {
      if (!row || !Array.isArray(row.color) || row.color.length !== 6 || !Array.isArray(row.bezier) || row.bezier.length !== 4 ||
          ![...row.color, row.deg, ...row.bezier].every((v) => Number.isFinite(v) && v >= 0 && v <= 255)) {
        throw new Error("Statsig curves 数据无效");
      }
    }
  }
  return curves;
}

export function extractPage(html) {
  let metaContent = "";
  for (const tag of html.match(/<meta\b[^>]*>/giu) || []) {
    const attrs = Object.fromEntries([...tag.matchAll(/([\w-]+)\s*=\s*["']([^"']*)["']/gu)].map((m) => [m[1].toLowerCase(), m[2]]));
    if (/^grok[-\u2010-\u2015]site[-\u2010-\u2015]verification$/iu.test(attrs.name || "")) metaContent = attrs.content || "";
  }
  const blob = html.replace(/\\"/gu, '"');
  const marker = /"curves"\s*:\s*\[/u.exec(blob);
  if (!marker) throw new Error("页面缺少 Statsig curves（可能是 Cloudflare 验证页或上游格式变化）");
  const start = marker.index + marker[0].length - 1;
  let depth = 0, quoted = false, escaped = false;
  for (let i = start; i < blob.length; i += 1) {
    const ch = blob[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') quoted = false;
    } else if (ch === '"') quoted = true;
    else if (ch === "[") depth += 1;
    else if (ch === "]" && --depth === 0) {
      const curves = validateCurves(JSON.parse(blob.slice(start, i + 1)));
      if (metaContent) decodeMetaSeed(metaContent);
      return { metaContent, curves };
    }
  }
  throw new Error("Statsig curves 不完整");
}

export function cubicBezier(x1, y1, x2, y2, x) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const sample = (t, a, b) => ((1 - 3 * b + 3 * a) * t + (3 * b - 6 * a)) * t * t + 3 * a * t;
  let lo = 0, hi = 1;
  for (let i = 0; i < 60; i += 1) {
    const t = (lo + hi) / 2;
    const value = sample(t, x1, x2);
    if (Math.abs(value - x) < 1e-7) return sample(t, y1, y2);
    if (value < x) lo = t; else hi = t;
  }
  return sample((lo + hi) / 2, y1, y2);
}
