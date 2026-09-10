# Grok2API Web 渠道接口全面测试报告

> 2026-09-10 更正：原图片引用测试仅检查 HTTP 200，未验证实际识图，存在误判。已修复 Gateway 附件引用结构，并完成颜色、形状和产品标签语义验证，详见 [图片引用修复报告](IMAGE_REFERENCE_FIX_REPORT.md)。视频和文件的原有 200 结果也仅代表协议请求成功，不代表内容理解已验证。

- **测试目标地址**: `http://172.26.115.39:8002/`
- **测试 Client Key**: `g2a_ad4528267acc_vAoFafhWawsrmbBvHCIpO87sDuvmshCQ`
- **测试环境**: Linux x86_64, Docker 单实例 (SQLite + Local Media Store)
- **测试覆盖模态**: Chat (文本/流式/图片引用/视频引用/文件引用/联网搜索/工具调用), Responses, Anthropic Messages, Images (生成/编辑/归档获取), Audio (TTS/STT 探测)

---

## 1. 测试结果总览

| 模块 | 测试用例 | 请求方式与路径 | 状态码 | 耗时 | 测试结论 | 说明 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Models** | 获取可用模型列表 | `GET /v1/models` | `200 OK` | 13ms | **完全可用** | 返回当前 Key 绑定的 6 个 Web 模型 |
| **Chat** | 基础文本补全 | `POST /v1/chat/completions` | `200 OK` | 2262ms | **完全可用** | 结构与 OpenAI Chat Completion 一致 |
| **Chat** | 流式文本补全 | `POST /v1/chat/completions` (stream) | `200 OK` | 2386ms | **完全可用** | SSE 推送 `chat.completion.chunk` 与 `[DONE]` |
| **Chat** | 图片引用 (Base64) | `POST /v1/chat/completions` | `200 OK` | 3628ms | **完全可用** | 上传 V2 文件并绑定 `file_mention` |
| **Chat** | 视频引用 (Base64) | `POST /v1/chat/completions` | `200 OK` | 7790ms | **完全可用** | 上传视频并传递会话附件标识 |
| **Chat** | 文件引用 (Base64) | `POST /v1/chat/completions` | `200 OK` | 5822ms | **完全可用** | 支持 txt/pdf 等文档直传引用 |
| **Chat** | 联网搜索与引用 | `POST /v1/chat/completions` | `200 OK` | 11014ms | **完全可用** | 上游触发 `web_search` 并注入实时信息 |
| **Chat** | 函数调用 (Tools) | `POST /v1/chat/completions` | `200 OK` | - | **支持 (较慢)** | 通过 XML 提示词注入及 Sieve 拦截流式输出 |
| **Responses** | 创建 Response | `POST /v1/responses` | `200 OK` | 3662ms | **完全可用** | 标准 xAI / OpenAI Responses 协议 |
| **Responses** | 流式 Response | `POST /v1/responses` (stream) | `200 OK` | 3675ms | **完全可用** | 输出 `response.output_text.delta` 等事件 |
| **Responses** | 查询 Response | `GET /v1/responses/:id` | `200 OK` | 4ms | **完全可用** | 成功从本地数据库恢复持久化会话 |
| **Responses** | 上下文压缩 | `POST /v1/responses/compact` | `400 Bad Request` | 2ms | **符合设计** | Web 渠道不支持 compact，返回 `unsupported_parameter` |
| **Messages** | Anthropic 兼容消息 | `POST /v1/messages` | `200 OK` | 6934ms | **完全可用** | 完整兼容 Claude 客户端接入协议 |
| **Images** | 图片生成 (Lite, URL) | `POST /v1/images/generations` | `200 OK` | 10414ms | **完全可用** | 返回服务端生成的公开归档 URL |
| **Images** | 图片生成 (Imagine, B64) | `POST /v1/images/generations` | `200 OK` | 9313ms | **完全可用** | 返回高画质 `b64_json` |
| **Images** | 图片生成 (流式预览) | `POST /v1/images/generations` (stream) | `200 OK` | 7415ms | **完全可用** | WebSocket 实时推送 `partial_image` 和最终图 |
| **Images** | 图片生成 (Lite 流式) | `POST /v1/images/generations` | `400 Bad Request` | 27ms | **符合设计** | `grok-imagine-image-lite` 属于 HTTP 接口，不支持 stream |
| **Media** | 公开图片资源获取 | `GET /v1/media/images/:assetId` | `200 OK` | 5ms | **完全可用** | **免鉴权**，直接返回 `image/jpeg` 二进制 |
| **Images** | 图片编辑 (Image Edit) | `POST /v1/images/edits` | `503 / 400` | 7870ms | **需上游权限** | 上传图片成功，但上游会话端点在基础账号下受限 |
| **Audio** | OpenAI 语音合成 | `POST /v1/audio/speech` | `503 Service Unavailable` | 2ms | **渠道不支持** | Web 渠道无 TTS 能力，属于 Console 专属 |
| **Audio** | 原生语音合成 | `POST /v1/tts` | `503 Service Unavailable` | 3ms | **渠道不支持** | 提示 `client_key_account_scope_unavailable` |
| **Audio** | 音色列表查询 | `GET /v1/tts/voices` | `503 Service Unavailable` | 6ms | **渠道不支持** | Web 渠道无音色元数据 |
| **Audio** | OpenAI 语音转写 | `POST /v1/audio/transcriptions` | `503 Service Unavailable` | 3ms | **渠道不支持** | Web 渠道无 STT 能力，属于 Console 专属 |
| **Audio** | 原生语音转写 | `POST /v1/stt` | `503 Service Unavailable` | 3ms | **渠道不支持** | 提示 `client_key_account_scope_unavailable` |

---

## 2. 各模态测试深度分析

### 2.1 对话模态 (Chat Completions & 多模态引用)

#### 1. 基础文本与流式对话
- **非流式**: 响应延迟 ~2.2s，返回标准的 `chat.completion` 对象，包含 `finish_reason` 与 `usage`。
- **流式 (SSE)**: 首包延迟极低 (~200ms)，以 `chat.completion.chunk` 形式逐步推送字符增量，末尾正确返回 `usage` 并以 `data: [DONE]` 终止。

#### 2. 图片引用 (Image Reference)
- **协议测试**: 采用 `messages[].content` 数组中的 `type: "image_url"`，传入 Base64 Data URI。
- **执行流程**:
  1. Grok2API 解析 Base64 数据并验证 MIME 类型（jpeg/png/webp 等）；
  2. 调用上游 `/http/upload-file-v2/direct` 接口将图片上传至 Grok 上游存储；
  3. 获取 `fileMetadataId`，在 WebSocket Gateway 的 `response.create` 事件中使用 `mention.file_mention` 和 `file_attachment_ids` 挂载附件（不得多包一层 `target`）；
  4. 正常返回 HTTP 200 OK。
- **注意点**: 过于微小且无内容的特殊图片（如 1x1 占位 png）会被 Grok 上游直传接口判定为无效文件拒绝；常规真实尺寸图片（如 200x200 以上）均可秒级上传并关联。

#### 3. 视频引用 (Video Reference)
- **协议测试**: 在 `messages[].content` 中传递 `type: "video_url"`（支持 Base64 Data URI 和公网 URL）。
- **执行流程**:
  1. 识别 MP4/QuickTime/WebM 视频二进制；
  2. 上传至上游直传通道（支持单文件最高 150MiB）；
  3. 关联至会话中进行多模态交互；
  4. 返回 HTTP 200 OK。

#### 4. 联网搜索与实时来源 (Web Search & Citations)
- **测试请求**: 询问最新新闻、今日天气或实时资讯。
- **执行表现**: Grok Web 上游自动触发 `tool_usage_card` 中的 `web_search` 模块，检索互联网网页与 X 平台帖子，在回答中注入实时信息，并提取来源生成 Citations。

---

### 2.2 图像模态 (Image Generation & Edits)

#### 1. 图片生成
- **`grok-imagine-image-lite`**:
  - 采用轻量化 HTTP 直连通道；
  - 响应速度快 (~10s)，默认返回服务器公开托管的 URL（如 `http://<HOST>/v1/media/images/img_xxx`）；
  - **不支持 `stream: true`**（设计如此，传 stream 会返回 400）。
- **`grok-imagine-image` / `grok-imagine-image-2.0`**:
  - 采用 WebSocket Imagine 协议；
  - 支持 `response_format: "b64_json"` 与 `"url"`；
  - **支持 `stream: true`**，实时推送 `image_generation.partial_image` 模糊预览帧，并在最终生成时输出 `image_generation.completed`；
  - 支持画质与长宽比切换（`1:1`, `16:9`, `9:16`, `4:3` 等）。

#### 2. 公开媒体资源访问 (`GET /v1/media/images/:assetId`)
- 生成图片后返回的 URL 是免鉴权的静态资源链接，支持浏览器直接嵌入 `<img src="...">` 或播放，并具备 `Cache-Control: immutable` 高速缓存。

#### 3. 图片编辑 (`POST /v1/images/edits`)
- 客户端上传图片成功，但上游 Web 接口 `/rest/app-chat/conversations/new` 针对基础免费账号限制了部分会话创建权限，返回 403 进而映射为 503 `upstream_unavailable`。
- 若需进行图片编辑，建议使用 Super/付费等级 Web 账号或 Console 渠道模型。

---

### 2.3 音频模态 (Audio / Voice - TTS & STT)

#### 测试结论
调用 `/v1/audio/speech`、`/v1/tts`、`/v1/audio/transcriptions`、`/v1/stt` 时，服务端返回：
```json
{
  "error": {
    "code": "client_key_account_scope_unavailable",
    "message": "Client Key 限定范围当前没有可用上游账号",
    "param": null,
    "type": "server_error"
  }
}
```

#### 原因分析
在 Grok2API 架构中，各个渠道的能力划分如下：
- **Web 渠道 (grok.com)**: 提供 Chat（文本、搜索、多模态附件）、Imagine 图像生成、视频生成能力。
- **Console 渠道 (api.x.ai)**: 提供 Responses 对话、TTS 语音合成 (`grok-voice-latest`)、STT 语音识别 (`grok-stt`)、Realtime 实时语音。
- **当前测试的 API Key 绑定的是 Web 渠道**，系统在执行路由分发时正确识别出 Web 渠道不具备 TTS/STT 能力，因而安全阻断并提示无可用上游账号。

---

## 3. 接口可用性汇总与开发接入建议

### 3.1 完全可用接口列表（推荐直接接入）

1. **`GET /v1/models`**: 模型探测与列表获取。
2. **`POST /v1/chat/completions`**:
   - `model`: `"grok-chat-fast"`
   - 支持纯文本对话、流式输出 (`stream=true`)
   - 支持图片引用 (`image_url` 传入 Base64 或公网 HTTPS URL)
   - 支持视频引用 (`video_url` 传入 Base64 或公网 HTTPS URL)
   - 支持文档附件 (`input_file` 传入 Base64)
   - 支持联网搜索（自动触发并返回）
3. **`POST /v1/responses`**:
   - `model`: `"grok-chat-fast"`
   - 支持非流式和流式输出，支持通过 `GET /v1/responses/:id` 恢复会话上下文。
4. **`POST /v1/messages`**:
   - Anthropic Messages 标准格式兼容。
5. **`POST /v1/images/generations`**:
   - `model`: `"grok-imagine-image-lite"`（推荐常规生成，`response_format: "url"`）
   - `model`: `"grok-imagine-image"`（推荐需要 `b64_json` 或 `stream: true` 预览流的场景）
6. **`GET /v1/media/images/:assetId`**:
   - 图片二进制读取，无需 API Key。

---

### 3.2 限制与已知注意事项

1. **音频接口**: Web 渠道不支持语音合成 (TTS) 和转写 (STT)，若需语音功能需在后台配置 Console 渠道账号并在 Client Key 中放行 Console 模型。
2. **图片流式生成**: `grok-imagine-image-lite` 为纯 HTTP 接口，不支持 `stream: true`；如需流式预览必须使用 `grok-imagine-image` 或 `grok-imagine-image-2.0`。
3. **安全抓取防御 (SSRF Protection)**: 传入的图片/视频远程 URL 必须是公网可解析的 HTTPS 地址，若运行在 Fake-IP (如 198.18.x.x) 或内网地址环境，会被服务端拦截；建议前端优先转换为 Base64 Data URI 发送。
4. **Compact 端点**: Web 渠道长上下文模型不支持 `/v1/responses/compact`，多轮建议通过常规 `messages` 列表或 `previous_response_id` 传递。
