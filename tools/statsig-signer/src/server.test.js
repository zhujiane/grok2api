import assert from "node:assert/strict";
import test from "node:test";

import { STATSIG_SEED_BYTES, validStatsigID } from "./statsig.js";
import { createServer } from "./server.js";
import { createStore } from "./store.js";

test("POST /sign returns a 70-byte x-statsig-id", async () => {
  const store = createStore("/tmp/statsig-signer-test");
  const hex = "388bf10d70a3d70a3d70808cccccccccccd08cccccccccccd0d70a3d70a3d70800";
  const session = {
    resolveEnvironment: async ({ metaContent }) => ({ metaContent, hex }),
    status: async () => ({ hexReady: true }),
    enqueueRefresh: async () => {},
  };
  const server = createServer({ token: "" }, store, session);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const metaContent = Buffer.alloc(STATSIG_SEED_BYTES, 0x21).toString("base64").replace(/=+$/u, "");
  const response = await fetch(`http://127.0.0.1:${port}/sign`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      method: "POST",
      path: "/rest/app-chat/conversations/new",
      environment: { metaContent },
    }),
  });
  const body = await response.json();
  server.close();
  assert.equal(response.status, 200);
  assert.equal(validStatsigID(body["x-statsig-id"]), true);
});

test("POST /sign is 503 when environment is unavailable", async () => {
  const store = createStore("/tmp/statsig-signer-test");
  const session = { resolveEnvironment: async () => { throw new Error("unavailable"); } };
  const server = createServer({ token: "" }, store, session);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/sign`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      method: "POST",
      path: "/rest/app-chat/conversations/new",
      environment: { metaContent: Buffer.alloc(STATSIG_SEED_BYTES, 1).toString("base64") },
    }),
  });
  server.close();
  assert.equal(response.status, 503);
});
