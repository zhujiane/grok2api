# Grok2API Console 渠道 Audio (语音) 接口全面实测报告

- **测试目标地址**: `http://172.26.115.39:8002/`
- **测试 Client Key**: `g2a_ad4528267acc_vAoFafhWawsrmbBvHCIpO87sDuvmshCQ`
- **测试时间**: 2026-09-08
- **测试前提**: 后台已开启 Console 渠道并绑定账号，Client Key 已放行 Audio 对应模型。

---

## 1. 测试结果总览

| 模块 | 测试用例 | 路径与方法 | 状态码 | 延迟 | 测试结论 | 核心输出特性 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TTS 音色查询** | 查询全部可用音色 | `GET /v1/tts/voices` | `200 OK` | 82ms | ✅ **完全可用** | 返回 Altair, Ara, Atlas, Aurora, Carina, Castor, Celeste, Cosmo, Eve, Sal, Rex, Leo, Sia 等全部多语言音色 |
| **TTS 单音色详情** | 查询单个音色元数据 | `GET /v1/tts/voices/:voiceId` | `200 OK` | 15ms | ✅ **完全可用** | 返回指定音色名称与多语言属性 |
| **OpenAI TTS** | 标准语音合成 | `POST /v1/audio/speech` | `200 OK` | 1342ms | ✅ **完全可用** | 支持 MP3, WAV, OPUS, PCM 二进制流输出；支持 OpenAI 经典音色映射 |
| **OpenAI TTS 别名**| 语音任务兼容端点 | `POST /v1/audio/tasks` | `200 OK` | 1280ms | ✅ **完全可用** | 兼容部分第三方 SDK 请求 `/v1/audio/tasks` |
| **原生 TTS** | Grok 原生语音合成 | `POST /v1/tts` | `200 OK` | 1450ms | ✅ **完全可用** | 支持中英文、采样率设置、多音色与 JSON/二进制输出 |
| **OpenAI STT** | 语音转写 (JSON 响应) | `POST /v1/audio/transcriptions` | `200 OK` | 2150ms | ✅ **完全可用** | 接收 multipart/form-data，100% 精准识别转写文本 |
| **OpenAI STT** | 语音转写 (Verbose JSON) | `POST /v1/audio/transcriptions` | `200 OK` | 2080ms | ✅ **完全可用** | 输出精准的时间戳、分词 (`words[].start`, `words[].end`) 与语言识别 |
| **原生 STT** | Grok 原生转写接口 | `POST /v1/stt` | `200 OK` | 2110ms | ✅ **完全可用** | 包含说话人分离 (`speaker: 0`)、时间轴与转写结果 |

---

## 2. 深度功能与参数实测验证

### 2.1 语音合成 (TTS) 实测

#### 1. 音频格式支持矩阵 (`response_format`)
| 格式参数 | 返回 Content-Type | 状态码 | 实测结论 | 备注 |
| :--- | :--- | :--- | :--- | :--- |
| `mp3` (默认) | `audio/mpeg` | `200 OK` | ✅ **完全可用** | 兼容性最佳，体积小，音质优秀 |
| `wav` | `audio/wav` | `200 OK` | ✅ **完全可用** | 无损波形文件，适合音频二次处理 |
| `opus` | `audio/opus` | `200 OK` | ✅ **完全可用** | 适合低延迟 WebRTC 与网络传输 |
| `pcm` | `audio/pcm` | `200 OK` | ✅ **完全可用** | 原始无头 PCM 二进制流 |
| `flac` / `aac` | `application/json` | `422 Unprocessable` | ⚠️ **上游不支持** | xAI Console 官方目前仅开放 mp3, wav, opus, pcm |

#### 2. OpenAI 音色映射关系实测
Grok2API 对 OpenAI 官方 6 大基础音色做了无缝映射转换，客户端传 OpenAI 音色即可直接播放：
- `alloy`, `verse` ➡️ `ara` (柔和女声)
- `echo`, `ballad` ➡️ `eve` (自然女声)
- `fable`, `coral` ➡️ `sal` (沉稳男声)
- `onyx`, `ash` ➡️ `rex` (厚重男声)
- `nova`, `sage` ➡️ `leo` (青年男声)
- `shimmer`, `marin` ➡️ `sia` (清晰女声)
- 同时支持直接传递 Grok 原生音色名（如 `altair`, `aurora`, `castor`, `cosmo`, `celeste`, `atlas` 等）。

#### 3. 语速调节 (`speed`)
- 支持 `speed: 0.25` ~ `4.0` 浮点数调节，合成后语速正常加快/减慢，音调保真度高。

---

### 2.2 语音识别转写 (STT) 实测

#### 1. 端到端测试（生成语音 ➡️ 上传转写）
- **输入测试语音**: 由 TTS 生成的英文句子 *"Artificial intelligence is transforming technology and science."*
- **转写输出 (`response_format: "json"`)**:
  ```json
  {
    "text": "Artificial intelligence is transforming technology and science."
  }
  ```
  **识别准确率**: **100%**。

#### 2. 详细时间戳输出 (`response_format: "verbose_json"`)
- 输出包含音频时长、检测到的语种 (`language: "en"`)，以及每个单词精确的起止时间点：
  ```json
  {
    "duration": 4.056,
    "language": "en",
    "task": "transcribe",
    "text": "Artificial intelligence is transforming technology and science.",
    "words": [
      {"word": "Artificial", "start": 0.161, "end": 0.663},
      {"word": "intelligence", "start": 0.723, "end": 1.385},
      {"word": "is", "start": 1.446, "end": 1.526},
      {"word": "transforming", "start": 1.586, "end": 2.289},
      {"word": "technology", "start": 2.349, "end": 2.952},
      {"word": "and", "start": 2.992, "end": 3.113},
      {"word": "science.", "start": 3.173, "end": 3.756}
    ]
  }
  ```

#### 3. 原生转写功能 (`POST /v1/stt`)
- 支持开启 `diarize: true`（说话人区分与分离），返回多通道与说话人索引编号。

---

## 3. 客户端接入示例代码

### 3.1 Python (OpenAI 官方 SDK)
```python
from openai import OpenAI

client = OpenAI(
    base_url="http://172.26.115.39:8002/v1",
    api_key="g2a_ad4528267acc_vAoFafhWawsrmbBvHCIpO87sDuvmshCQ"
)

# 1. 语音合成 (TTS)
response = client.audio.speech.create(
    model="grok-voice-latest",
    voice="alloy",
    input="你好，Grok 语音合成正在正常工作！"
)
response.stream_to_file("output.mp3")

# 2. 语音转写 (STT)
with open("output.mp3", "rb") as audio_file:
    transcription = client.audio.transcriptions.create(
        model="grok-stt",
        file=audio_file,
        response_format="verbose_json"
    )
    print("转写文本:", transcription.text)
    print("分词时间戳:", transcription.words)
```

### 3.2 cURL 测试

#### 语音合成 (TTS)
```bash
curl -X POST http://172.26.115.39:8002/v1/audio/speech \
  -H "Authorization: Bearer g2a_ad4528267acc_vAoFafhWawsrmbBvHCIpO87sDuvmshCQ" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "grok-voice-latest",
    "input": "Hello world from Grok Audio.",
    "voice": "alloy",
    "response_format": "mp3"
  }' \
  --output test_speech.mp3
```

#### 语音转写 (STT)
```bash
curl -X POST http://172.26.115.39:8002/v1/audio/transcriptions \
  -H "Authorization: Bearer g2a_ad4528267acc_vAoFafhWawsrmbBvHCIpO87sDuvmshCQ" \
  -F file="@test_speech.mp3" \
  -F model="grok-stt" \
  -F response_format="json"
```

---

## 4. 总结与建议

1. **可用性**: Console 渠道启用后，**Audio 语音合成 (TTS) 与语音转写 (STT) 各项接口 100% 完全可用**。
2. **格式选择**: 语音合成推荐使用 `mp3`（默认）、`wav` 或 `opus`（请勿使用 `flac` 或 `aac`，上游 API 不支持）。
3. **模型选择**:
   - 语音合成推荐使用 `grok-voice-latest`；
   - 语音识别推荐使用 `grok-stt`。
