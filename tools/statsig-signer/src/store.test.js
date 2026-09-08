import assert from "node:assert/strict";
import test from "node:test";

import { parseSsoInput, publicSsoView } from "./store.js";

test("parseSsoInput accepts a raw cookie header", () => {
  const parsed = parseSsoInput({
    cookies: "sso=abc123; sso-rw=abc123; cf_clearance=clear",
    userAgent: "Mozilla/5.0",
  });
  assert.equal(parsed.sso, "abc123");
  assert.equal(parsed.ssoRw, "abc123");
  assert.equal(parsed.extraCookies.cf_clearance, "clear");
  assert.equal(parsed.userAgent, "Mozilla/5.0");
});

test("publicSsoView never returns the raw token", () => {
  const view = publicSsoView({ sso: "super-secret-token", extraCookies: { cf_clearance: "x" }, updatedAt: "now" });
  assert.equal(view.configured, true);
  assert.equal(view.hasClearance, true);
  assert.equal(String(view.ssoPreview).includes("super-secret-token"), false);
});
