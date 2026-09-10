# Chat 图片引用故障修复与回归报告

日期：2026-09-10。测试地址：`http://172.26.115.39:8002`，模型：`grok-chat-fast`。

## 现象与审计核对

用户截图对应请求 `JtSyRsjoNy-VsIgs`（审计 ID 187，UTC 02:59:56）：HTTP 200、媒体输入 1 张。排查开始时还有三条更晚的带图 Chat 请求（审计 ID 193–195），也均为 200。

审计只保存输入图片计数，并没有保存这次成功请求的原始消息和完整上游附件载荷，因此不能从“1 张”推断模型实际收到图片。用户提供的两个本地文件是诊断页和接口文档截图，不是原始产品图。本次用内容确定的测试图片复现和验证。

修复前上传红色圆形，模型回答没有看到图片；HTTP 状态仍为 200。原报告仅据请求成功和上传链路判断图片“完全可用”，缺少语义断言，结论需要更正。

## 根因与修改

1. **图片引用 JSON 结构错误。** Gateway 输入块误用了 `mention.target.file_mention`。Grok 网页采用 protobuf JSON 序列化，`target` 是 oneof 名称，不是 JSON 容器字段，正确结构是 `mention.file_mention`。错误字段被上游忽略，文本仍正常生成。
2. **同步当前网页发送协议。** 将消息、附件列表和父响应 ID 合并到同一个 `response.create` 事件，替代分开发送 `conversation.item.create` 与空的 `response.create`。仅做此调整的中间版本仍无法识图；修正第 1 项后，实际识图通过。
3. **修正异步上传的潜在丢图路径。** `uploadId` 是上传任务 ID，不应当作文件 ID。仅返回任务 ID 时轮询 `/rest/app-chat/upload-file-v2/status`，取得最终 `fileMetadataId` 后才继续；失败、终止、过期、无效响应和超时会返回错误。本次现场诊断返回了最终 metadata，因此异步路径不是这次复现的直接根因。

修复后的发送结构（示意）：

```json
{
  "session_id": "conversation-id",
  "event": {
    "type": "response.create",
    "event_id": "event-id",
    "file_attachment_ids": ["final-file-id"],
    "item": {
      "type": "message",
      "role": "user",
      "x_grok": {
        "client_message_id": "message-id",
        "input_chunks": [
          {"mention": {"file_mention": {"file_id": "final-file-id"}}},
          {"text": {"text": "参考图像，生成一段产品介绍文章，200字"}}
        ]
      }
    }
  }
}
```

## 验证

| 用例 | 结果 |
| --- | --- |
| 红色圆形，Chat 非流式 | 200，4.07 秒；明确回答 solid red circle |
| 蓝色正方形，Chat 流式 | 200，3.59 秒；明确回答 square、blue；收到 `[DONE]` |
| 绿色瓶身、黑色瓶盖、AURORA / 500 mL 标签测试图，用户原提示词 | 200；文章提到了 Aurora、500 毫升、绿色瓶身、白底标签 |
| Responses 图片输入 | 200；正确回答红色圆形；携带 previous_response_id 的后续请求也正常返回 |
| Go Web provider、HTTP inference、application gateway 测试 | 全部通过 |
| 上传处理回归 | 覆盖 PROCESSING → SUCCESS、ERROR、ABORTED、EXPIRED、超时、HTTP 错误、无效 JSON |

重复运行三场景脚本时，红色圆形和蓝色正方形再次通过，产品用例出现一次 HTTP 200 但 content 为空，脚本正确判为失败。随后单独重试产品请求，恢复为包含 AURORA、500ml、绿色的回答；空回答尚未定位，不能宣称所有重复请求稳定通过。

产品文案测试确认图像内容已经进入回答，未验证商品事实或严格字数；模型还自行编造了“试剂”“食品级材料”等图片未提供的属性。这个结果不能用来证明这些属性真实。

## 复测

新增 `image_reference_regression.py`：分别验证红色圆形、蓝色正方形和带标签瓶子，不再只断言 HTTP 200。依赖 `requests`、`Pillow`，瓶子标签使用 DejaVuSans 字体。原 `test_suite.py` 的图片用例也增加颜色和形状断言。

```bash
export GROK2API_BASE_URL=http://172.26.115.39:8002
export GROK2API_API_KEY='<你的 Client Key>'
python3 grok2api-test/image_reference_regression.py

cd backend
go test ./internal/infra/provider/web ./internal/transport/http/inference ./internal/application/gateway
```

## 当前服务

已将修复后的后端更新到当前 Docker 服务 `grok2api`，沿用本地镜像标签 `grok2api:local`。原镜像保留为 `grok2api:before-image-fix-20260910`，以便回滚。代码修改保留在工作区，未提交 Git。
