# Grok2API OpenAI 兼容接口规范文档（v1/*）

本文档详细梳理 Grok2API 提供的所有 `/v1/*` 兼容接口，包括请求路径、HTTP 方法、鉴权方式、请求参数（Header / Query / Body）、数据类型、约束条件、返回值结构及错误码规范。

---

## 目录

1. [通用协议规范与鉴权](#1-通用协议规范与鉴权)
2. [模型接口 (Models API)](#2-模型接口-models-api)
   - [GET /v1/models](#21-获取可用模型列表-get-v1models)
3. [对话接口 (Chat Completions API)](#3-对话接口-chat-completions-api)
   - [POST /v1/chat/completions](#31-创建对话补全-post-v1chatcompletions)
4. [Responses 接口 (xAI / OpenAI Responses API)](#4-responses-接口-xai--openai-responses-api)
   - [POST /v1/responses](#41-创建-response-post-v1responses)
   - [POST /v1/responses/compact](#42-压缩-response-上下文-post-v1responsescompact)
   - [GET /v1/responses/:responseId](#43-查询已保存的-response-get-v1responsesresponseid)
   - [DELETE /v1/responses/:responseId](#44-删除已保存的-response-delete-v1responsesresponseid)
5. [Anthropic Messages 兼容接口](#5-anthropic-messages-兼容接口)
   - [POST /v1/messages](#51-创建-message-post-v1messages)
6. [图像接口 (Images API)](#6-图像接口-images-api)
   - [POST /v1/images/generations](#61-图片生成-post-v1imagesgenerations)
   - [POST /v1/images/edits](#62-图片编辑-post-v1imagesedits)
7. [媒体资源接口 (Media Asset API)](#7-媒体资源接口-media-asset-api)
   - [GET /v1/media/images/:assetId](#71-获取归档图片-get-v1mediaimagesassetid)
   - [GET /v1/media/videos/:assetId](#72-获取归档视频-get-v1mediavideosassetid)
   - [PUT /v1/media/uploads/:token](#73-接收视频直传-put-v1mediauploadstoken)
8. [视频接口 (Videos API - 异步任务模式)](#8-视频接口-videos-api---异步任务模式)
   - [POST /v1/videos/generations](#81-创建视频生成任务-post-v1videosgenerations)
   - [POST /v1/videos/edits](#82-创建视频编辑任务-post-v1videosedits)
   - [POST /v1/videos/extensions](#83-创建视频延长任务-post-v1videosextensions)
   - [GET /v1/videos/:requestId](#84-查询视频任务状态-get-v1videosrequestid)
   - [GET /v1/videos/:requestId/content](#85-获取视频内容流-get-v1videosrequestidcontent)
9. [音频接口 (Audio / Voice API)](#9-音频接口-audio--voice-api)
   - [POST /v1/audio/speech (OpenAI TTS)](#91-openai-语音合成-post-v1audiospeech)
   - [POST /v1/audio/tasks (OpenAI TTS 别名)](#92-openai-语音任务-post-v1audiotasks)
   - [POST /v1/tts (原生 TTS)](#93-原生语音合成-post-v1tts)
   - [GET /v1/tts/voices](#94-获取可用音色列表-get-v1ttsvoices)
   - [GET /v1/tts/voices/:voiceId](#95-获取指定音色详情-get-v1ttsvoicesvoiceid)
   - [POST /v1/audio/transcriptions (OpenAI STT)](#96-openai-语音识别-post-v1audiotranscriptions)
   - [POST /v1/stt (原生 STT)](#97-原生语音识别-post-v1stt)
   - [GET /v1/stt (WebSocket STT)](#98-实时流式语音识别-get-v1stt-ws)
   - [GET /v1/realtime (Realtime Voice WebSocket)](#99-实时双向语音-get-v1realtime-ws)
10. [统一错误码与异常响应格式](#10-统一错误码与异常响应格式)

---

## 1. 通用协议规范与鉴权

### 1.1 鉴权方式
所有受保护的 `/v1/*` 接口（除 `/v1/media/images/*`、`/v1/media/videos/*`、`/v1/media/uploads/*` 外）均需携带 Client API Key 进行鉴权。

支持以下两种形式：
- **Header Authorization**: `Authorization: Bearer <API_KEY>`
- **Header x-api-key**: `x-api-key: <API_KEY>`

> 密钥格式通常为 `g2a_...`。

### 1.2 通用请求 Header
- `Content-Type`: `application/json`（STT 支持 `multipart/form-data`）
- `x-grok-turn-idx` (可选): 用于 Grok Web 多轮对话轮次标记
- `anthropic-version` (仅 `/v1/messages` 必须): `2023-06-01`

---

## 2. 模型接口 (Models API)

### 2.1 获取可用模型列表 (GET /v1/models)

查询当前 API Key 允许访问且已启用的模型列表。

#### 请求参数
- **Query 参数**:
  - `client_version` (string, 可选): 携带时按 OpenAI Codex/IDE 目录格式输出。

#### 返回值 (200 OK)
```json
{
  "object": "list",
  "data": [
    {
      "id": "grok-chat-fast",
      "object": "model",
      "created": 1788767011,
      "owned_by": "grok2api"
    },
    {
      "id": "grok-imagine-image",
      "object": "model",
      "created": 1788767011,
      "owned_by": "grok2api"
    }
  ]
}
```

---

## 3. 对话接口 (Chat Completions API)

### 3.1 创建对话补全 (POST /v1/chat/completions)

OpenAI 兼容对话接口，支持文本生成、流式推送 (SSE)、多模态输入（图片、视频、文件引用）、联网搜索来源（Citations）与函数调用（Tool Calling）。

#### 请求体参数 (JSON)

| 字段 | 类型 | 是否必填 | 默认值 | 说明与约束 |
| :--- | :--- | :--- | :--- | :--- |
| `model` | string | **是** | - | 模型名称，如 `grok-chat-fast`, `grok-chat-auto`, `grok-chat-expert`, `grok-chat-heavy` |
| `messages` | array | **是** | - | 消息上下文列表，至少包含一条消息 |
| `messages[].role` | string | **是** | - | 角色：`"system"`, `"user"`, `"assistant"`, `"tool"` |
| `messages[].content` | string \| array | **是** | - | 文本字符串，或多模态内容数组 |
| `stream` | boolean | 否 | `false` | 是否开启 SSE 流式输出 |
| `tools` | array | 否 | `null` | 函数工具定义列表，单次最多 128 个 |
| `tool_choice` | string \| object | 否 | `"auto"` | 可选 `"auto"`, `"none"`, `"required"` 或 `{"type":"function","function":{"name":"..."}}` |
| `parallel_tool_calls`| boolean | 否 | `true` | 是否允许并行工具调用 |
| `prompt_cache_key` | string | 否 | - | 服务端提示词缓存键 |

#### `messages[].content` 多模态结构支持

1. **纯文本 (Text)**:
   ```json
   {"type": "text", "text": "你好，请介绍一下你自己"}
   ```
2. **图片引用 (Image)**:
   - 支持 Base64 Data URI（如 `data:image/jpeg;base64,...`，支持 jpeg/png/webp/gif，上限 32MiB）
   - 支持公网 HTTPS URL
   ```json
   {
     "type": "image_url",
     "image_url": {
       "url": "data:image/jpeg;base64,..."
     }
   }
   ```
   *(亦兼容 `type: "input_image"` 或 `type: "image"`)*
3. **视频引用 (Video)**:
   - 支持 Base64 Data URI（如 `data:video/mp4;base64,...`，支持 mp4/quicktime/webm，单文件上限 150MiB）
   - 支持公网 HTTPS URL
   ```json
   {
     "type": "video_url",
     "video_url": {
       "url": "https://example.com/video.mp4"
     },
     "filename": "demo.mp4"
   }
   ```
   *(亦兼容 `type: "input_video"` 或 `type: "video"`)*
4. **文件/文档引用 (File / Document)**:
   - 支持 PDF、TXT、Markdown、DOCX、XLSX、CSV、JSON、XML、RTF 等，单次对话附件总大小不超过 64MiB
   ```json
   {
     "type": "input_file",
     "file_data": "data:application/pdf;base64,...",
     "filename": "paper.pdf"
   }
   ```

#### 返回值 - 非流式 (`stream: false`) (200 OK)
```json
{
  "id": "chatcmpl_07fa2b481a6289a7621667afe14b6176",
  "object": "chat.completion",
  "created": 1788875827,
  "model": "grok-chat-fast",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "回答正文内容",
        "reasoning_content": "",
        "tool_calls": []
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 14,
    "completion_tokens": 5,
    "total_tokens": 19
  }
}
```

#### 返回值 - 流式 (`stream: true`) (200 OK, `text/event-stream`)
```
data: {"id":"chatcmpl_...","object":"chat.completion.chunk","created":1788875836,"model":"grok-chat-fast","choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}]}
data: {"id":"chatcmpl_...","object":"chat.completion.chunk","created":1788875838,"model":"grok-chat-fast","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}
data: {"id":"chatcmpl_...","object":"chat.completion.chunk","created":1788875838,"model":"grok-chat-fast","choices":[{"index":0,"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":3,"completion_tokens":4,"total_tokens":7}}
data: [DONE]
```

---

## 4. Responses 接口 (xAI / OpenAI Responses API)

### 4.1 创建 Response (POST /v1/responses)
支持通过统一输入格式创建对话或任务，并持久化会话状态。

#### 请求体参数 (JSON)
| 字段 | 类型 | 是否必填 | 说明 |
| :--- | :--- | :--- | :--- |
| `model` | string | **是** | 模型名称 |
| `input` | string \| array | **是** | 提示词字符串或消息数组 |
| `instructions` | string | 否 | 系统指令 |
| `previous_response_id` | string | 否 | 关联的上一轮 Response ID（用于多轮上下文延续） |
| `include` | array | 否 | 输出包含项，如 `["inline_citations"]` |
| `stream` | boolean | 否 | 是否启用 SSE 流式输出 |

#### 返回值 (200 OK)
```json
{
  "id": "resp_3e0cbdd6a8ca7f19f003805ad6b8ba87",
  "object": "response",
  "created_at": 1788876114,
  "model": "grok-chat-fast",
  "status": "completed",
  "output": [
    {
      "id": "item_1",
      "type": "message",
      "role": "assistant",
      "content": [
        {
          "type": "output_text",
          "text": "量子计算利用量子力学原理...",
          "annotations": []
        }
      ]
    }
  ],
  "usage": {
    "input_tokens": 12,
    "output_tokens": 28,
    "total_tokens": 40
  }
}
```

### 4.2 压缩 Response 上下文 (POST /v1/responses/compact)
- **说明**: 压缩长会话上下文。
- **Web 模式**: 返回 `400 Bad Request` (`unsupported_operation`，Web 渠道不支持压缩端点)。

### 4.3 查询已保存的 Response (GET /v1/responses/:responseId)
- **Path 参数**: `responseId` (string, 必填)
- **返回值 (200 OK)**: 返回此前保存的完整 Response JSON。

### 4.4 删除已保存的 Response (DELETE /v1/responses/:responseId)
- **Path 参数**: `responseId` (string, 必填)
- **返回值 (200 OK)**:
```json
{
  "id": "resp_3e0cbdd6a8ca7f19f003805ad6b8ba87",
  "object": "response.deleted",
  "deleted": true
}
```

---

## 5. Anthropic Messages 兼容接口

### 5.1 创建 Message (POST /v1/messages)

#### 请求 Header
- `anthropic-version`: `2023-06-01` (必填)

#### 请求体参数 (JSON)
| 字段 | 类型 | 是否必填 | 说明 |
| :--- | :--- | :--- | :--- |
| `model` | string | **是** | 模型名称 |
| `max_tokens` | integer | **是** | 最大生成 Token 数，必须大于 0 |
| `messages` | array | **是** | 消息数组 |
| `system` | string | 否 | 系统提示词 |
| `stream` | boolean | 否 | 是否启用流式输出 |

#### 返回值 (200 OK)
```json
{
  "id": "msg_f9b0811e56926955a5b51458d689b147",
  "type": "message",
  "role": "assistant",
  "model": "grok-chat-fast",
  "content": [
    {
      "type": "text",
      "text": "Hello! How can I help you today?"
    }
  ],
  "stop_reason": "end_turn",
  "usage": {
    "input_tokens": 15,
    "output_tokens": 10
  }
}
```

---

## 6. 图像接口 (Images API)

### 6.1 图片生成 (POST /v1/images/generations)

#### 请求体参数 (JSON)

| 字段 | 类型 | 是否必填 | 默认值 | 说明与约束 |
| :--- | :--- | :--- | :--- | :--- |
| `model` | string | **是** | - | 可选 `grok-imagine-image-lite`, `grok-imagine-image`, `grok-imagine-image-2.0` |
| `prompt` | string | **是** | - | 图像生成提示词描述 |
| `n` | integer | 否 | 1 | 生成张数，范围 1 ~ 10（流式模式仅支持 `n=1`） |
| `aspect_ratio` | string | 否 | `"1:1"` | 比例：`"1:1"`, `"16:9"`, `"9:16"`, `"4:3"`, `"3:4"`, `"3:2"`, `"2:3"` 等 |
| `size` | string | 否 | - | 分辨率别名，如 `"1024x1024"`, `"1280x720"` |
| `resolution` | string | 否 | `"1k"` | 分辨率等级：`"1k"` 或 `"2k"` |
| `quality` | string | 否 | `"medium"` | 画质等级：`"low"`, `"medium"` |
| `response_format` | string | 否 | `"url"` | 响应格式：`"url"` 或 `"b64_json"` |
| `stream` | boolean | 否 | `false` | 是否开启流式生成（仅 `grok-imagine-image`/`2.0` 支持，`lite` 不支持） |
| `partial_images` | integer | 否 | 0 | 流式返回预览中间帧数量，范围 0 ~ 3 |

#### 返回值 - `response_format: "url"` (200 OK)
```json
{
  "created": 1788875852,
  "data": [
    {
      "url": "http://<SERVER_HOST>/v1/media/images/img_3jyTnVj9X_TO0LJ1BXRDibeqljREnP_C",
      "mime_type": "image/jpeg",
      "revised_prompt": ""
    }
  ]
}
```

#### 返回值 - `response_format: "b64_json"` (200 OK)
```json
{
  "created": 1788875852,
  "data": [
    {
      "b64_json": "/9j/4AAQSkZJRg...",
      "mime_type": "image/jpeg",
      "revised_prompt": ""
    }
  ]
}
```

#### 返回值 - 流式 (`stream: true`) (200 OK, `text/event-stream`)
```
event: image_generation.partial_image
data: {"type":"image_generation.partial_image","b64_json":"/9j/...","partial_image_index":0,"size":"auto","quality":"auto"}

event: image_generation.completed
data: {"type":"image_generation.completed","b64_json":"/9j/...","size":"auto","quality":"auto"}
```

---

### 6.2 图片编辑 (POST /v1/images/edits)

#### 请求体参数 (JSON)
| 字段 | 类型 | 是否必填 | 说明与约束 |
| :--- | :--- | :--- | :--- |
| `model` | string | **是** | 必须为 `grok-imagine-image-edit` |
| `prompt` | string | **是** | 图像编辑修改要求 |
| `image` | object | **是** | 输入参考图片 `{"url": "<Base64 Data URI 或公网 HTTPS URL>"}` |
| `images` | array | 否 | 多张输入参考图，`image` 与 `images` 总数 1 ~ 8 张 |
| `n` | integer | 否 | 生成张数，1 ~ 10 |
| `aspect_ratio` | string | 否 | 比例设置 |
| `response_format`| string | 否 | `"url"` 或 `"b64_json"` |
| `stream` | boolean | 否 | 是否流式生成 |

---

## 7. 媒体资源接口 (Media Asset API)

### 7.1 获取归档图片 (GET /v1/media/images/:assetId)
- **权限**: **公开接口（无需携带 API Key）**
- **Path 参数**: `assetId` (string, 如 `img_3jyTnVj9X_TO0LJ1BXRDibeqljREnP_C`)
- **HTTP 方法**: `GET`, `HEAD`
- **返回值 (200 OK)**:
  - Header: `Content-Type: image/jpeg` (或 `image/png`)
  - Header: `Cache-Control: public, max-age=31536000, immutable`
  - Body: 二进制图片流。

### 7.2 获取归档视频 (GET /v1/media/videos/:assetId)
- **权限**: **公开接口（无需携带 API Key）**
- **Path 参数**: `assetId` (string, 视频资源 ID)
- **返回值 (200 OK)**: 二进制视频流，支持 HTTP 206 Range 分段播放。

### 7.3 接收视频直传 (PUT /v1/media/uploads/:token)
- **权限**: 内部凭据 Token 签名校验
- **说明**: 接收上游 xAI ZDR 视频上传流。

---

## 8. 视频接口 (Videos API - 异步任务模式)

### 8.1 创建视频生成任务 (POST /v1/videos/generations)
- **请求体 (JSON)**:
  ```json
  {
    "model": "grok-imagine-video",
    "prompt": "A cinematic drone shot of a futuristic city at sunset",
    "duration": 8,
    "aspect_ratio": "16:9",
    "resolution": "720p",
    "image": {"url": "https://... (可选首帧图)"}
  }
  ```
- **返回值 (200 OK)**:
  ```json
  {"request_id": "job_01jxxxxxxxxx"}
  ```

### 8.2 查询视频任务状态 (GET /v1/videos/:requestId)
- **返回值 (200 OK)**:
  ```json
  {
    "status": "done",
    "model": "grok-imagine-video",
    "progress": 100,
    "video": {
      "url": "http://<SERVER_HOST>/v1/media/videos/vid_xxxx",
      "duration": 8,
      "respect_moderation": true
    }
  }
  ```

---

## 9. 音频接口 (Audio / Voice API)

> **注意**：音频接口属于 **Console 渠道能力**（模型如 `grok-voice-latest`, `grok-stt`）。在仅配置 Web 渠道账号时，请求音频接口将返回 `503 Service Unavailable` (`client_key_account_scope_unavailable`)。

### 9.1 OpenAI 语音合成 (POST /v1/audio/speech)
- **请求体 (JSON)**:
  ```json
  {
    "model": "grok-voice-latest",
    "input": "Hello from Grok TTS",
    "voice": "alloy",
    "response_format": "mp3",
    "speed": 1.0
  }
  ```
- **返回值 (200 OK)**: 二进制音频流 (`audio/mpeg`)。

### 9.2 原生语音合成 (POST /v1/tts)
- **请求体 (JSON)**:
  ```json
  {
    "model": "grok-voice-latest",
    "text": "你好，世界",
    "language": "zh",
    "voice_id": "eve",
    "output_format": {"codec": "mp3", "sample_rate": 24000}
  }
  ```

### 9.3 获取可用音色列表 (GET /v1/tts/voices)
- **返回值 (200 OK)**:
  ```json
  {
    "voices": [
      {"voice_id": "ara", "name": "Ara", "language": "en"},
      {"voice_id": "eve", "name": "Eve", "language": "en"},
      {"voice_id": "sal", "name": "Sal", "language": "en"},
      {"voice_id": "rex", "name": "Rex", "language": "en"},
      {"voice_id": "leo", "name": "Leo", "language": "en"},
      {"voice_id": "sia", "name": "Sia", "language": "en"}
    ]
  }
  ```

### 9.4 OpenAI 语音识别 (POST /v1/audio/transcriptions)
- **请求格式**: `multipart/form-data`
- **字段**:
  - `file`: 音频文件（wav, mp3, m4a, ogg, flac 等）
  - `model`: `"grok-stt"`
  - `response_format`: `"json"`, `"verbose_json"`, `"text"`
- **返回值 (200 OK)**:
  ```json
  {
    "text": "语音识别转写的文本内容"
  }
  ```

---

## 10. 统一错误码与异常响应格式

当请求失败时，API 返回符合 OpenAI / Anthropic 标准的 JSON 错误结构。

### 10.1 标准 OpenAI 错误响应
```json
{
  "error": {
    "type": "invalid_request_error" | "server_error" | "upstream_error",
    "code": "invalid_api_key" | "invalid_parameter" | "upstream_unavailable" | "unsupported_parameter",
    "message": "具体的错误描述信息",
    "param": null
  }
}
```

### 10.2 常见 HTTP 状态码与 Code 对照表

| HTTP 状态码 | Error Code | 触发原因与解决方案 |
| :--- | :--- | :--- |
| `400 Bad Request` | `invalid_request` / `invalid_parameter` | 参数缺失、格式错误、或传递了不支持的参数 |
| `400 Bad Request` | `unsupported_parameter` | 当前模型或渠道不支持该特定参数（如 Web 渠道调用 `/responses/compact`） |
| `401 Unauthorized` | `invalid_api_key` | 请求未携带有效 Client API Key，或 Key 已被禁用 |
| `403 Forbidden` | `anti_bot_rejected` | 上游 Web 会话被反机器人风控拦截，需更换节点或刷新 SSO 凭据 |
| `404 Not Found` | `model_not_found` | 调用的模型不存在或当前 API Key 无权访问 |
| `413 Payload Too Large` | `request_too_large` | 上传图片、文件或请求体超过配置上限 (32MiB) |
| `415 Unsupported Media Type` | `invalid_request` | Content-Type 必须为 `application/json` 或 `multipart/form-data` |
| `502 Bad Gateway` | `upstream_network_error` / `stream_interrupted` | 连接上游 Grok 服务超时或网络中断 |
| `503 Service Unavailable` | `client_key_account_scope_unavailable` | 当前 Client Key 绑定的渠道无可用账号（如 Web Key 请求 Console 音频） |
| `503 Service Unavailable` | `upstream_unavailable` | 上游 Grok 账号池额度耗尽或暂时处于冷却恢复期 |
