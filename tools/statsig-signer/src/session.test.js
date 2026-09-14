import assert from "node:assert/strict";
import test from "node:test";
import { createSession } from "./session.js";
import { createServer } from "./server.js";
import { computeAnimationHex } from "./animation.js";
import { DEFAULT_CURVES } from "./curves.js";
import { generateStatsigID, STATSIG_EPOCH } from "./statsig.js";

const store = { load: async () => ({ sso: "", extraCookies: {} }) };
const metaContent = Buffer.alloc(48, 33).toString("base64");

test("default service signs offline, including requests with SSO, without fetching", async (t) => {
  const session = createSession({}, store, () => { assert.fail("must not fetch"); });
  const server = createServer({}, store, session);
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(async () => { await session.close(); await new Promise(resolve => server.close(resolve)); });
  await session.enqueueRefresh("startup");
  const base = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await fetch(`${base}/readyz`)).status, 200);
  for (const value of [metaContent, Buffer.alloc(48, 45).toString("base64")]) {
    const response = await fetch(`${base}/sign`, { method: "POST", body: JSON.stringify({
      method: "POST", path: "/rest/app-chat/conversations/new", sso: "ignored-account-token", environment: { metaContent: value },
    }) });
    assert.equal(response.status, 200);
    const id = (await response.json())["x-statsig-id"];
    const raw = Buffer.from(id, "base64");
    const number = Buffer.from(raw.subarray(49, 53).map(v => v ^ raw[0])).readUInt32LE();
    assert.equal(id, generateStatsigID({ method: "POST", path: "/rest/app-chat/conversations/new", metaContent: value,
      hex: computeAnimationHex(value, DEFAULT_CURVES), nowUnix: STATSIG_EPOCH + number, xorKey: raw[0] }));
  }
  const bad = await fetch(`${base}/sign`, { method: "POST", body: JSON.stringify({ method: "POST", path: "/", metaContent: "bad" }) });
  assert.equal(bad.status, 400);
});

test("remote refresh coalesces and a 403 preserves usable curves", async () => {
  let calls = 0;
  const session = createSession({ refreshRemote: true, grokBaseURL: "https://example.test" }, store, async () => {
    calls += 1;
    return new Response("blocked", { status: 403 });
  });
  await Promise.all([session.enqueueRefresh("test"), session.enqueueRefresh("test")]);
  assert.equal(calls, 1);
  assert.match((await session.status()).lastError, /403/);
  assert.ok((await session.resolveEnvironment({ metaContent })).hex);
  await session.close();
  await assert.rejects(session.resolveEnvironment({ metaContent }), /已关闭/);
});

test("explicit missing page file does not silently use bundled data", async () => {
  const session = createSession({ pageFile: "/nonexistent/statsig-test-page.html" }, store);
  await assert.rejects(session.resolveEnvironment({ metaContent }), /ENOENT/);
  await session.close();
});
