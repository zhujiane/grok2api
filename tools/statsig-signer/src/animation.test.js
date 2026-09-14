import assert from "node:assert/strict";
import test from "node:test";
import { computeAnimationHex, cubicBezier, extractPage } from "./animation.js";
import { DEFAULT_CURVES } from "./curves.js";

const seed = "t2ODAFY4ozXd0K2Y8MdI2XfxTDiJoakZPuoaKfcQn8VuasZMcKliyhA1pJ+o1oMf";

test("animation matches published browser capture (see curves.js provenance)", () => {
  assert.equal(computeAnimationHex(seed, DEFAULT_CURVES), "3bab9506b851eb851eb840e8f5c28f5c28f80e8f5c28f5c28f806b851eb851eb8400");
});

test("zero seek selects each SVG group and all 16 rows", () => {
  for (let i = 0; i < 256; i += 1) {
    const bytes = Buffer.alloc(48);
    bytes[5] = i;
    const row = DEFAULT_CURVES[i % 4][i % 16];
    const expected = row.color.slice(0, 3).map(v => v.toString(16)).join("") + "100100";
    assert.equal(computeAnimationHex(bytes.toString("base64"), DEFAULT_CURVES), expected);
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
