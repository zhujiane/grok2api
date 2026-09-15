# grok2api Statsig signer

纯 JavaScript `x-statsig-id` 签名服务，零 npm 运行时依赖，不启动浏览器，
不依赖 Playwright、Chromium、WARP 或 FlareSolverr。默认完全离线运行。

从请求的 48 字节 `metaContent` seed 选择 SVG 曲线，计算 Bézier 动画的颜色和
旋转矩阵，再用 Node.js SHA-256 / XOR 生成签名。每个 seed 独立计算 HEX，
不会把一个账号或页面的 HEX 套到其他 seed 上。

## 启动 / 升级

```bash
docker compose up -d --build statsig-signer
```

管理端 **设置 → Grok Web**：x-statsig 获取方式选择 `URL`，
签名服务 URL 填 `http://statsig-signer:8788/sign`。后端已有的 metaContent
请求协议保持兼容，无需给 signer 写入 SSO。

Compose 已移除 signer 对 WARP / FlareSolverr 的 `depends_on`，以及浏览器的
1 GiB 共享内存配置。Compose 中这两个服务仍保留供主网关的出口代理和
Clearance 功能使用；如果主网关也没有使用它们，可以自行停止：

```bash
docker compose stop warp flaresolverr
```

本地运行（Node.js >= 20）：

```bash
cd tools/statsig-signer
npm ci
npm test
npm start
```

## 签名协议

```json
{
  "method": "POST",
  "path": "/rest/app-chat/conversations/new",
  "environment": { "metaContent": "页面中的 Base64 seed" }
}
```

`POST /sign` 返回 `{"x-statsig-id":"..."}`。也兼容顶层 `metaContent`。
`metaContent` 必填；旧请求中的 `sso` / `token` 接受但不用于签名或发起登录。
仅传 SSO 的旧调用方需要改为传页面 seed。grok2api 后端已经传入此字段。

## 曲线更新

内置数据是 Grok 构建相关的曲线快照，来源及固定版本见
[src/curves.js](src/curves.js)。上游更换曲线或算法后可能需要更新，
`/readyz` 表示本地可计算，不代表上游已接受签名。

可选择以下方式覆盖内置曲线：

- 单次请求提供 `environment.curves`（四组 SVG 的行数组，每行包含
  `color` 六个数、`deg` 一个数、`bezier` 四个数）。服务只解析数值，不执行远程 JS。
- 设置 `STATSIG_PAGE_FILE=/data/grok.html`，加载包含 `curves` 的 Grok HTML / RSC
  文件。启动和刷新时重新读取；显式文件首次加载失败会返回未就绪，避免悄悄使用旧快照。
- 设置 `REFRESH_REMOTE=true`，通过 Node.js HTTP 直连 `GROK_BASE_URL` 刷新曲线。
  可通过 `/v1/sso` 保存 Cookie 和 User-Agent 供此可选请求使用。
  直连遇到 Cloudflare 403 会记录错误并保留现有曲线，不会自动启动浏览器。

Compose 默认已开启 `REFRESH_REMOTE`。容器不需要 Chromium：Node 24 的 `fetch`
本身就能读取 `http_proxy` / `https_proxy`，只需 `NODE_USE_ENV_PROXY=1`
（Dockerfile 已内置）。Docker 守护进程的 `~/.docker/config.json` 代理会自动
注入容器，成功刷新后 `/v1/status` 的 `curvesSource` 为 `remote`。若出口无法直连
Grok，远程刷新失败会保留上次成功的曲线；内置快照只作为首次启动的回退。

默认不请求 Grok。离线签名本身不需要 Cloudflare clearance；主网关访问 Grok
是否需要代理或 clearance 取决于其出口网络，这不属于签名服务的依赖。

## 接口

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| POST | `/sign` | 本地签名 |
| GET | `/healthz` | 进程存活 |
| GET | `/readyz` | 曲线可用于计算 |
| GET | `/v1/status` | JS 模式、曲线来源、刷新时间及错误 |
| POST | `/v1/refresh` | 重载配置的页面来源；离线默认模式无网络操作 |
| PUT / POST | `/v1/sso` | 保存可选远程刷新的 Cookie（支持 `{sso}` 或 `{cookies}`） |
| GET / DELETE | `/v1/sso` | 查看脱敏状态 / 清除 Cookie |
| POST | `/v1/invalidate` | 兼容旧账号失效通知；HEX 每次重算，无账号缓存 |

`STATSIG_SIGNER_TOKEN` 非空时，`/v1/sso` 和 `/v1/refresh` 需要
`Authorization: Bearer <token>`。`/sign` 保持后端兼容的无鉴权协议。
主机端口仅绑定 `127.0.0.1:8788`。

## 环境变量

| 变量 | 默认 | 含义 |
| --- | --- | --- |
| LISTEN | `0.0.0.0:8788` | 监听地址 |
| STATSIG_SIGNER_TOKEN | 空 | 管理接口令牌 |
| DATA_DIR | 本地 `./data` / 容器 `/data` | 可选 Cookie 存储 |
| STATSIG_PAGE_FILE | 空 | 本地曲线页面，优先于远程刷新 |
| REFRESH_REMOTE | `false` | 开启直连页面刷新（Compose 默认 `true`） |
| GROK_BASE_URL | `https://grok.com` | 可选远程页面地址 |
| FETCH_TIMEOUT | `8s` | 远程读取总超时 |
| REFRESH_INTERVAL | `10m` | 配置页面来源的刷新间隔 |

旧 `PROXY_URL`、`WARP_PROXY_URL`、`FLARESOLVERR_URL`、`HEADLESS`、
`NAVIGATION_TIMEOUT`、`HEX_WAIT` 已移除。Compose 用户可通过 override 文件
添加上表的可选环境变量及页面挂载。

## 验证范围

`npm test` 覆盖 5 组独立浏览器 digest HEX 样本、SVG 分组 / 行独立选择、
HTML / RSC 解析、离线 HTTP 签名、不同 seed、刷新合并和失败回退。
样本保存在 `src/fixtures/browser-vectors.json`，没有登录凭据。

当前前端 `1_8k8gs54nr81.js` 使用 seed 第 5 字节选择 SVG 组、第 10 字节
选择行，动画时间为第 36、5、24 字节各取模 16 后的乘积，再取整至 10ms
（以上下标均从 0 开始）。曲线刷新只能更新数值，不能自动适配算法索引变化。

2026-09-15 在线对照：同账号、同 seed、同视频请求下，旧算法返回
403 / code 7，修复后 `/sign` 返回的签名对应请求返回 429 / code 8。
视频生成完成尚未验收，当前受上游限流阻挡；详见
[排查和修复记录](debug-video-403/FINDINGS.md)。
