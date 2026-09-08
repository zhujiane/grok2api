import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export function createStore(dataDir) {
  const file = path.join(dataDir, "sso.json");

  return {
    async load() {
      try {
        const raw = await readFile(file, "utf8");
        const parsed = JSON.parse(raw);
        return normalizeRecord(parsed);
      } catch (error) {
        if (error && error.code === "ENOENT") {
          return emptyRecord();
        }
        throw error;
      }
    },
    async save(record) {
      await mkdir(dataDir, { recursive: true, mode: 0o700 });
      const next = { ...normalizeRecord(record), updatedAt: new Date().toISOString() };
      await writeFile(file, `${JSON.stringify(next, null, 2)}\n`, { mode: 0o600 });
      return next;
    },
    async clear() {
      const next = emptyRecord();
      await mkdir(dataDir, { recursive: true, mode: 0o700 });
      await writeFile(file, `${JSON.stringify(next, null, 2)}\n`, { mode: 0o600 });
      return next;
    },
  };
}

export function parseSsoInput(body = {}) {
  const cookieHeader = firstString(body.cookies, body.cookie, body.Cookie);
  const parsed = cookieHeader ? parseCookieHeader(cookieHeader) : {};
  const sso = firstString(body.sso, parsed.sso);
  const ssoRw = firstString(body.ssoRw, body.sso_rw, parsed["sso-rw"], sso);
  const extra = { ...parsed };
  delete extra.sso;
  delete extra["sso-rw"];
  if (body.cfClearance || body.cf_clearance) {
    extra.cf_clearance = firstString(body.cfClearance, body.cf_clearance);
  }
  if (!sso) {
    throw new Error("缺少 sso。可传 { sso } 或完整 Cookie 头");
  }
  return {
    sso,
    ssoRw: ssoRw || sso,
    extraCookies: extra,
    userAgent: firstString(body.userAgent, body.user_agent),
  };
}

export function publicSsoView(record) {
  const value = record?.sso || "";
  return {
    configured: Boolean(value),
    ssoPreview: value ? `${value.slice(0, 6)}…(${value.length})` : "",
    hasClearance: Boolean(record?.extraCookies?.cf_clearance),
    userAgent: record?.userAgent || "",
    updatedAt: record?.updatedAt || null,
  };
}

function emptyRecord() {
  return { sso: "", ssoRw: "", extraCookies: {}, userAgent: "", updatedAt: null };
}

function normalizeRecord(value) {
  const base = emptyRecord();
  if (!value || typeof value !== "object") {
    return base;
  }
  return {
    sso: firstString(value.sso),
    ssoRw: firstString(value.ssoRw, value.sso),
    extraCookies: value.extraCookies && typeof value.extraCookies === "object" ? value.extraCookies : {},
    userAgent: firstString(value.userAgent),
    updatedAt: value.updatedAt || null,
  };
}

function parseCookieHeader(header) {
  const out = {};
  for (const part of String(header).split(";")) {
    const trimmed = part.trim();
    if (!trimmed) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq <= 0) {
      continue;
    }
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return out;
}

function firstString(...values) {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) {
      return text;
    }
  }
  return "";
}
