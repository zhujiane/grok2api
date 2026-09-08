import { createHash, randomInt } from "node:crypto";

export const STATSIG_EPOCH = 1_682_924_400;
export const STATSIG_SALT = "obfiowerehiring";
export const STATSIG_MARK = 0x03;
export const STATSIG_SEED_BYTES = 48;
export const STATSIG_ID_BYTES = 70;

export function decodeMetaSeed(metaContent) {
  const value = String(metaContent ?? "").trim();
  if (!value) {
    throw new Error("metaContent 为空");
  }
  const seed = decodeBase64(value);
  if (seed.length !== STATSIG_SEED_BYTES) {
    throw new Error(`metaContent 解码后必须是 ${STATSIG_SEED_BYTES} 字节，当前为 ${seed.length}`);
  }
  return seed;
}

export function validStatsigID(value) {
  try {
    return decodeBase64(String(value ?? "").trim()).length === STATSIG_ID_BYTES;
  } catch {
    return false;
  }
}

export function generateStatsigID({ method, path, metaContent, hex, nowUnix, xorKey } = {}) {
  const seed = decodeMetaSeed(metaContent);
  const fingerprint = normalizeHex(hex);
  if (!fingerprint) {
    throw new Error("尚未捕获 grok.com 的 Statsig HEX");
  }
  const pathname = normalizePath(path);
  const verb = String(method ?? "POST").trim().toUpperCase() || "POST";
  const ts = Number.isFinite(nowUnix) ? Math.trunc(nowUnix) : Math.floor(Date.now() / 1000);
  const number = (ts - STATSIG_EPOCH) >>> 0;
  const payload = `${verb}!${pathname}!${number}${STATSIG_SALT}${fingerprint}`;
  const digest = createHash("sha256").update(payload, "utf8").digest();
  const key = xorKey == null ? randomInt(256) : xorKey & 0xff;
  const out = Buffer.alloc(STATSIG_ID_BYTES);
  out[0] = key;
  for (let i = 0; i < STATSIG_SEED_BYTES; i += 1) {
    out[1 + i] = seed[i] ^ key;
  }
  out[49] = (number & 0xff) ^ key;
  out[50] = ((number >>> 8) & 0xff) ^ key;
  out[51] = ((number >>> 16) & 0xff) ^ key;
  out[52] = ((number >>> 24) & 0xff) ^ key;
  for (let i = 0; i < 16; i += 1) {
    out[53 + i] = digest[i] ^ key;
  }
  out[69] = STATSIG_MARK ^ key;
  return out.toString("base64").replace(/=+$/u, "");
}

export function normalizePath(value) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return "/";
  }
  try {
    if (/^https?:\/\//iu.test(raw)) {
      const parsed = new URL(raw);
      return parsed.pathname || "/";
    }
  } catch {
    // Fall through to slash-prefix handling.
  }
  return raw.startsWith("/") ? raw : `/${raw}`;
}

function normalizeHex(value) {
  return String(value ?? "").trim();
}

function decodeBase64(value) {
  const normalized = value.replace(/-/gu, "+").replace(/_/gu, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const decoded = Buffer.from(padded, "base64");
  if (!decoded.length && value.length) {
    throw new Error("metaContent 不是有效 Base64");
  }
  return decoded;
}
