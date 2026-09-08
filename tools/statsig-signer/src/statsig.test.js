import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import {
  STATSIG_EPOCH,
  STATSIG_ID_BYTES,
  STATSIG_MARK,
  STATSIG_SALT,
  STATSIG_SEED_BYTES,
  decodeMetaSeed,
  generateStatsigID,
  normalizePath,
  validStatsigID,
} from "./statsig.js";

test("normalizePath keeps grok2api escaped paths", () => {
  assert.equal(normalizePath("/rest/app-chat/conversations/new"), "/rest/app-chat/conversations/new");
  assert.equal(normalizePath("https://grok.com/rest/rate-limits"), "/rest/rate-limits");
  assert.equal(normalizePath(""), "/");
});

test("generateStatsigID matches the 70-byte XOR layout", () => {
  const seed = Buffer.alloc(STATSIG_SEED_BYTES, 0x11);
  const metaContent = seed.toString("base64").replace(/=+$/u, "");
  const hex = "388bf10d70a3d70a3d70808cccccccccccd08cccccccccccd0d70a3d70a3d70800";
  const nowUnix = STATSIG_EPOCH + 78_721_673;
  const xorKey = 0x5a;
  const id = generateStatsigID({
    method: "post",
    path: "/rest/app-chat/conversations/new",
    metaContent,
    hex,
    nowUnix,
    xorKey,
  });
  assert.equal(validStatsigID(id), true);

  const raw = Buffer.from(id, "base64");
  assert.equal(raw.length, STATSIG_ID_BYTES);
  assert.equal(raw[0], xorKey);
  for (let i = 0; i < STATSIG_SEED_BYTES; i += 1) {
    assert.equal(raw[1 + i] ^ xorKey, 0x11);
  }
  const number = nowUnix - STATSIG_EPOCH;
  assert.equal(raw[49] ^ xorKey, number & 0xff);
  assert.equal(raw[50] ^ xorKey, (number >>> 8) & 0xff);
  assert.equal(raw[51] ^ xorKey, (number >>> 16) & 0xff);
  assert.equal(raw[52] ^ xorKey, (number >>> 24) & 0xff);
  const payload = `POST!/rest/app-chat/conversations/new!${number}${STATSIG_SALT}${hex}`;
  const digest = createHash("sha256").update(payload, "utf8").digest();
  for (let i = 0; i < 16; i += 1) {
    assert.equal(raw[53 + i] ^ xorKey, digest[i]);
  }
  assert.equal(raw[69] ^ xorKey, STATSIG_MARK);
});

test("decodeMetaSeed rejects the wrong size", () => {
  assert.throws(() => decodeMetaSeed("YQ"), /48 字节/);
});
