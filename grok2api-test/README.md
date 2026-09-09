# Grok2API OpenAI 兼容接口规范与全模态实测套件

本目录包含对 Grok2API 的 OpenAI 兼容接口 (`/v1/*`) 的完整规范文档、Web 渠道接口实测报告、Console 渠道 Audio (语音) 接口实测报告与自动化测试脚本。

## 📄 文档与代码索引

1. **[OPENAI_API_SPECIFICATION.md](file:///root/work/grok2api/test/OPENAI_API_SPECIFICATION.md)**
   - Grok2API 全部 `/v1/*` 接口的详细规范文档。
   - 包含 Models, Chat Completions (多模态图片/视频/文件引用/搜索/工具调用), Responses API, Anthropic Messages API, Images API (生成/编辑), Media Assets API, Videos API, Audio API (TTS/STT)。
   - 列出所有请求 Header、Query、Body 字段定义、约束规则、非流式与流式返回值结构及标准错误码。

2. **[AUDIO_TEST_REPORT.md](file:///root/work/grok2api/test/AUDIO_TEST_REPORT.md)**
   - Console 渠道启用后，针对 Audio 全套接口（TTS 语音合成、STT 语音转写、音色列表查询、格式转换等）的深度实测报告。
   - 包含完整可运行的 Python (OpenAI SDK) 与 cURL 接入示例。

3. **[WEB_CHANNEL_TEST_REPORT.md](file:///root/work/grok2api/test/WEB_CHANNEL_TEST_REPORT.md)**
   - Web 渠道实测报告（Chat 文本/流式/多模态图片/视频/文件/搜索、Responses、Images、Media）。
   - 包含测试数据、延迟、多模态引用流程分析与边界排查。

4. **[test_suite.py](file:///root/work/grok2api/test/test_suite.py)**
   - 开箱即用的 Python 自动化回归测试脚本。
   - 运行方式：
     ```bash
     python3 /root/work/grok2api/test/test_suite.py
     ```
