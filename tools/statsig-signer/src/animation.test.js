import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { computeAnimationHex, cubicBezier, extractPage } from "./animation.js";
import { DEFAULT_CURVES } from "./curves.js";

const seed = "t2ODAFY4ozXd0K2Y8MdI2XfxTDiJoakZPuoaKfcQn8VuasZMcKliyhA1pJ+o1oMf";

const vectors = JSON.parse(readFileSync(new URL("./fixtures/browser-vectors.json", import.meta.url), "utf8"));

for (const { source, meta, hex } of vectors) {
  test(`animation matches independent browser digest: ${source}`, () => {
    assert.equal(computeAnimationHex(meta, DEFAULT_CURVES), hex);
  });
}

test("zero seek selects SVG groups and rows independently", () => {
  for (let group = 0; group < 4; group += 1) {
    for (let row = 0; row < 16; row += 1) {
      const bytes = Buffer.alloc(48);
      bytes[5] = group;
      bytes[10] = row;
      const expected = DEFAULT_CURVES[group][row].color.slice(0, 3).map(v => v.toString(16)).join("") + "100100";
      assert.equal(computeAnimationHex(bytes.toString("base64"), DEFAULT_CURVES), expected);
    }
  }
});

test("curve parser accepts plain and Next.js escaped payloads and Unicode meta names", () => {
  for (const dash of ["-", "―", "‑"]) {
    for (const payload of [JSON.stringify({ curves: DEFAULT_CURVES }), JSON.stringify(JSON.stringify({ curves: DEFAULT_CURVES }))]) {
      const page = extractPage(`<meta content='${seed}' name='grok-site${dash}verification'><script>${payload}</script>`);
      assert.equal(page.metaContent, seed);
      assert.deepEqual(page.curves, DEFAULT_CURVES);
    }
  }
  assert.throws(() => extractPage('<html>Just a moment</html>'), /缺少/);
  assert.throws(() => extractPage('"curves":[{}]'), /无效/);
  assert.throws(() => extractPage('"curves":[['), /不完整/);
});

test("bezier linear endpoints and invalid curves", () => {
  assert.equal(cubicBezier(0, 0, 1, 1, 0), 0);
  assert.equal(cubicBezier(0, 0, 1, 1, 1), 1);
  assert.ok(Math.abs(cubicBezier(0, 0, 1, 1, 0.4) - 0.4) < 1e-6);
  assert.throws(() => computeAnimationHex(seed, [[{ color: [], deg: 0, bezier: [] }]]), /无效/);
});
