# Codex 修复与验证（2026-09-15）

已修复纯 JS 动画的 seed 索引，保留下面的原始排查记录供追溯。
原记录中的“尚未实现修复”和第 8 节待办已被本节取代。

- 实际前端：`https://cdn.grok.com/_next/static/chunks/1_8k8gs54nr81.js`。
- SVG 组仍为 `seed[5] % 4`；行应为 `seed[10] % 16`。
- seek 应为 `round((seed[36]%16)*(seed[5]%16)*(seed[24]%16)/10)*10`。
- Bézier、颜色、旋转及 SHA-256/XOR 组装无需修改。
- 原记录“任何行都无法复现 RGB”的推断不成立：Bézier 的 y 控制点可为负，
  插值 progress 可以越过 [0,1]，只搜索区间内的 RGB 会漏掉结果。

验证证据：

1. `src/fixtures/browser-vectors.json` 保存 5 组独立浏览器样本，全部逐字一致。
   `browser_capture`、`browser2` 从原排查 `/tmp/opencode` 产物补齐，
   `browser3`、`browser_final` 来自本目录已有产物，`trace-codex` 为新增实时捕获。
2. 新样本 hook 到的动画为颜色 `#259e20` → `#5d499c`、旋转 321°、
   easing `cubic-bezier(0.46,-0.96,0.02,0.42)`，currentTime 为 310ms；
   浏览器输出 `rgb(28,171,13)`，矩阵 `matrix(0.657837,-0.75316,0.75316,0.657837,0,0)`。
3. `npm test`：18 项通过。分组/选行测试现在独立覆盖全部 4 × 16 种组合。
4. 已重建运行中的 `grok2api-statsig-signer`，状态为 `javascript`，曲线来源 `remote`。
5. 同一 SSO、同一新鲜 meta、同一视频 payload 的在线对照：
   - 旧算法签名：HTTP 403 / code 7 / This page is out of date。
   - 修复后运行服务 `/sign` 的签名：HTTP 429 / code 8 / Too many requests。
   当前视频请求遇到上游限流，尚未验证生成完成，也不能由 429 确认账号配额原因。

服务没有增加 Playwright 或 Chromium 依赖；诊断使用了机器上已有的浏览器。
曲线自动刷新不能自动更新算法索引，后续前端更换算法时仍需重新核对。

---

# Statsig 签名 HEX 计算偏差 —— 视频 403 code 7 根因报告

> 状态：**根因已定位到 `computeAnimationHex` 的计算结果与真实浏览器不一致**。
> 尚未实现修复。本文档给 codex 提供全部证据、复现脚本与待办。
>
> 结论先行：**签名组装（SHA-256/XOR/70 字节布局）是对的；错的只有 HEX（SVG 动画指纹）这一段。**
> 用真实浏览器抓到的 HEX 直接请求 Grok → HTTP 200；用我们 JS 算出的 HEX 请求 → HTTP 403 code 7。

---

## 1. 现象

- Basic（free）Web 账号生成视频，`POST /v1/videos/generations` 后轮询到失败：
  ```json
  {"error":{"code":"service_unavailable","message":"Grok Web 媒体上游返回 403: 7: This page is out of date. Reload to continue."},"status":"failed"}
  ```
- 后端日志（`grok2api`）：
  ```
  web_media_upstream_rejected stage=video_generation status=403 body_kind=json cloudflare_challenge=false
  video_generation_failed account_id=... error="Grok Web 媒体上游返回 403: 7: This page is out of date. Reload to continue."
  ```
- 同一个账号池下 **chat 正常**（`/v1/chat/completions` 返回 OK），说明 SSO、出口代理、账号都没问题，**只有视频/严格校验的接口被拒**。
- 签名服务本身：`/healthz`、`/readyz`、`/sign` 都返回 200，返回的 `x-statsig-id` 是合法的 70 字节。

## 2. 已排除的因素

| 假设 | 结论 | 证据 |
| --- | --- | --- |
| 签名算法（SHA-256/XOR 布局）错 | **否** | 与参考实现 `statsig.py` 逐字节一致，`statsig.test.js` 通过 |
| 曲线快照过期 | **否（曲线数据本身对）** | 从浏览器实际加载的 HTML 提取 `curves`，与仓库 `curves.js` 快照 **完全相同** |
| 后端签名协议/metaContent 传递错 | **否** | 后端传的 `metaContent` 与页面 `<meta name="grok-site…verification">` 一致 |
| 出口代理 / WARP | **否** | 同一代理下 chat 成功；换号换出口无效 |
| 账号被风控封禁 | **否** | 换成浏览器抓的 HEX 后同一路径 HTTP 200 |
| `x-statsig-id` 时间戳/随机 key | **否** | 用浏览器 HEX + 我们自己的组装，请求成功 |

## 3. 决定性证据

### 3.1 浏览器 HEX vs 我们 JS 算出的 HEX（同一 seed、同一 curves）

复现脚本：`artifacts/capture-browser-hex.mjs`（Playwright，注入 `crypto.subtle.digest` 钩子抓取真实签名输入）。

真实浏览器抓到的 digest 原文（节选）：
```
GET!/rest/products!106556541obfiowerehiring9aebff06e147ae147ae140e66666666666680e666666666666806e147ae147ae1400
```

对比（seed 来自页面 meta，curves 来自浏览器实际加载的 HTML）：

| # | seed[5] | 组/行 (我们规则) | 浏览器 HEX | 我们 HEX | 一致 |
| --- | --- | --- | --- | --- | --- |
| 1 | 119 | 3 / 7 | `5692100fd70a3d70a3d701c28f5c28f5c2901c28f5c28f5c290fd70a3d70a3d700` | `e7d01b0cf5c28f5c28f60970a3d70a3d7080970a3d70a3d7080cf5c28f5c28f600` | ❌ |
| 2 | 70 | 2 / 6 | `9aebff06e147ae147ae140e66666666666680e666666666666806e147ae147ae1400` | `df67e10f851eb851eb8504040f851eb851eb8500` | ❌ |
| 3 | 206 | 2 / 14 | `e1e1e90d70a3d70a3d70808a3d70a3d70a408a3d70a3d70a40d70a3d70a3d70800` | `6561bc0ca3d70a3d70a409c28f5c28f5c2809c28f5c28f5c280ca3d70a3d70a400` | ❌ |
| 4 | 95 | 3 / 15 | `e8ca1e0828f5c28f5c290dc28f5c28f5c280dc28f5c28f5c280828f5c28f5c2900` | `70ae800eb851eb851eb88063d70a3d70a3d8063d70a3d70a3d80eb851eb851eb8800` | ❌ |

### 3.2 用浏览器 HEX 直接重放（关键）

用抓到的浏览器 HEX 组装签名（其余组装逻辑用我们自己的），直接请求 Grok：

```
POST https://grok.com/rest/app-chat/conversations/new
x-statsig-id: <用浏览器 HEX 组装的签名>
→ HTTP 200  {"result":{"conversation":{"conversationId":"0df7a700-..."}}}
```

同一路径、同一 SSO、同一代理，换成我们 JS 算的 HEX：

```
→ HTTP 403  {"error":{"code":7,"message":"This page is out of date. Reload to continue."}}
```

**结论：组装逻辑没问题，问题 100% 在 HEX 计算。**

### 3.3 解码浏览器 HEX，反推它实际用的颜色/角度

浏览器 HEX 结构 = `[r,g,b, cos, sin, -sin, cos, 0, 0]` 每个值经 `Number(v.toFixed(2)).toString(16)` 再拼接、去掉 `.` 和 `-`。

| # | seed[5] | 浏览器 rgb | 浏览器 cos/sin | 浏览器角度 | 我们 rgb | 我们角度 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 119 | 86,146,16 | 0.99 / 0.11 | 6.34° | 231,208,27 | 36.30° |
| 2 | 70 | 154,235,255 | 0.43 / 0.90 | 64.46° | 223,103,225 | -14.32° |
| 3 | 206 | 225,225,233 | 0.84 / 0.54 | 32.74° | 101,97,188 | 37.51° |
| 4 | 95 | 232,202,30 | 0.51 / 0.86 | 59.33° | 112,174,128 | 23.09° |

### 3.4 浏览器用的行 ≠ 我们规则选的行

我们当前规则（`src/animation.js`）：
```js
const rows = curves[seed[5] % curves.length];
const { color, deg, bezier } = rows[seed[5] % rows.length];
```
即 **组 = seed[5] % 4，行 = seed[5] % 16**。

暴力搜索“哪个 (组,行,progress) 能精确复现浏览器 RGB”：

| # | seed[5] | 浏览器 rgb | 能复现的 (组,行,progress) | 我们规则选的行 |
| --- | --- | --- | --- | --- |
| 1 | 119 | 86,146,16 | **无任何行能复现** | 3 / 7 |
| 2 | 70 | 154,235,255 | **无任何行能复现** | 2 / 6 |
| 3 | 206 | 225,225,233 | (2, 11, p≈0.097) | 2 / 14 |
| 4 | 95 | 232,202,30 | (3, 7, p≈0.186) | 3 / 15 |

注意样本 3、4：浏览器实际用的行（11、7）和 `seed[5]%16`（14、15）**不一致**。
样本 1、2 甚至在任何一行里都找不到对应的 RGB 插值 → 说明浏览器**不只是选行规则不同，而是插值/取色方式也不同**（或用了另一套 `curves` 数据源）。

## 4. 代码位置

### 4.1 待修：`tools/statsig-signer/src/animation.js`
```js
export function computeAnimationHex(metaContent, curves) {
  const seed = decodeMetaSeed(metaContent);
  validateCurves(curves);
  const rows = curves[seed[5] % curves.length];
  const { color, deg, bezier } = rows[seed[5] % rows.length];   // ← 行选择可疑
  const controls = bezier.map((v, i) => Number((v * ((i % 2 ? 2 : 1) / 255) - (i % 2 ? 1 : 0)).toFixed(2)));
  const seek = Math.round((seed[24] % 16) * (seed[22] % 16) * (seed[23] % 16) / 10) * 10;  // ← seek 公式可疑
  const progress = cubicBezier(...controls, seek / 4096);
  const rgb = color.slice(0, 3).map((v, i) => Math.max(0, Math.min(255, Math.round(v + (color[i + 3] - v) * progress))));
  const angle = Math.floor(deg * (300 / 255) + 60) * progress * Math.PI / 180;  // ← 角度公式可疑
  ...
}
```

### 4.2 正确的部分：`tools/statsig-signer/src/statsig.js`
70 字节布局、SHA-256、XOR、base64 均与参考实现一致，**不要改**。

## 5. 真实浏览器算法的线索

- Grok 前端把签名函数命名为 **`botoxSign`**，定义在动态 chunk 里（入口 `static/chunks/1_8k8gs54nr81.js`，加载后注册到 module `4629918`）。
- 调用点（已从 chunk 反混淆）：
  ```js
  o = (new URL(e.url).pathname || "").split("?")[0]?.trim() || "";
  t = await botoxSign(o, e.init.method ?? "");
  // 失败时 fallback: btoa(`x0:${e}`.replace(/[^\x20-\xff]/g,"?"))
  ```
- `botoxSign` 本体在按需加载的 chunk 中，直接抓 `1_8k8gs54nr81.js` 得到的是 loader 壳，需继续追它 `s.l()` 拉取的子 chunk（或运行时断点）。
- **建议 codex 的方向**：在真实浏览器里 hook `botoxSign`（而不是只 hook `crypto.subtle.digest`），打印它对 `(path, method)` 的入参与中间 SVG/动画计算；或直接在 `computeAnimationHex` 下断点，观察 `getComputedStyle` / `DOMMatrix` / 动画 seek 的真实取值。

## 6. 复现步骤

```bash
# 1) 依赖：宿主机已装 playwright（/root/.nvm/.../node_modules/playwright）与 chromium
# 2) 准备 SSO（从 signer 容器读取）
docker exec grok2api-statsig-signer cat /data/sso.json > /tmp/sso.json
# 3) 抓真实浏览器 HEX
node artifacts/capture-browser-hex.mjs   # 需先按脚本顶部配置 SSO 路径与代理
# 4) 对比
node -e "import('./src/animation.js').then(...)"   # 见 ground truth 表
# 5) 重放验证（浏览器 HEX → 200；我们 HEX → 403）
```

参考实现（与我们的组装一致、但 HEX 同样来自页面）：`artifacts/reference_statsig.py`。

## 7. 相关改动（本次会话已做）

| 文件 | 改动 | 说明 |
| --- | --- | --- |
| `tools/statsig-signer/src/curves.js` | 用实时快照替换 | 数据本身正确，但**不能解决本问题** |
| `tools/statsig-signer/Dockerfile` | 加 `NODE_USE_ENV_PROXY=1` | 让 Node fetch 走 Docker 注入的代理 |
| `docker-compose.yml` | signer 加 `REFRESH_REMOTE=true` | 曲线可自动刷新（仍不解决 HEX 算法偏差） |
| `tools/statsig-signer/README.md` | 文档 | 说明轻量刷新（无 Playwright） |
| `tools/statsig-signer/src/animation.test.js` | 更新测试向量 | 随快照更新，**注意：该向量并不能证明算法正确** |

> ⚠️ 注意：`animation.test.js` 的期望值是从“我们的实现 + 快照”生成的，**不是**从真实浏览器抓的。它只能防回归，不能验证正确性。修 `computeAnimationHex` 时必须以浏览器实测 HEX 为准重建向量。

## 8. 给 codex 的待办清单

1. **逆向 `botoxSign` 的 HEX 计算**：确定
   - 组/行的选择索引（是否 `seed[5]%4` / `seed[5]%16`，还是别的字节/位运算）；
   - `seek` 的字节来源与公式（当前用 `seed[22..24]`）；
   - bezier 控制点的缩放公式与采样精度；
   - 角度公式（当前 `floor(deg*300/255+60) * progress`）与 `cos/sin` 的 `toFixed(2)` / 6 位有效数字处理。
2. 用第 3 节的 4 组 **浏览器实测 (seed, HEX)** 作为硬性测试向量，逐一对齐。
3. 修好后回归：
   - `npm test`（重写 `animation.test.js` 向量为浏览器实测值）；
   - 用 `/sign` 输出直接重放 `POST https://grok.com/rest/app-chat/conversations/new`（video payload），要求 HTTP 200。
4. 确认 backend 侧 codex 正在做的 `IsRequestScopedError` 归类（code 7 → 请求级拒绝、不再无意义轮询账号池）与本修复不冲突。

## 9. 附：抓包产物

| 文件 | 内容 |
| --- | --- |
| `artifacts/capture-browser-hex.mjs` | Playwright 注入 `crypto.subtle.digest` 抓真实 digest 输入 |
| `artifacts/browser3.json` | 一次抓包：meta、digest 原文、SVG path |
| `artifacts/browser_final.json` | 一次抓包：meta、digest 原文 |
| `artifacts/browser_curves.json` | 从浏览器实际加载 HTML 提取的 `curves`（与 `src/curves.js` 相同） |
| `artifacts/reference_statsig.py` | 参考实现（组装逻辑校验用） |
