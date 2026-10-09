# Web Basic 参考图生视频实测

测试日期：2026-10-09（北京时间）。本次直接请求 Grok Web 上游，绕过项目现有参考图拒绝逻辑；未修改运行服务或生产代码。

## 结论

一个现有 Basic Web 账号成功完成单张三宫格参考图生成 5 秒视频。Web 原生协议是 `mediaGenInput.referenceToVideo.inputAssets`，本次没有验证将官方 API 的 `reference_images` 字段原样发送给 Web 是否有效。项目可以将该公共字段转换为 Web 原生结构。

## 输入与请求

使用自制的红、绿、蓝圆形三宫格测试图，并非用户提供的厨房分镜图。提示词要求根据图中的颜色和顺序生成 0–1.6、1.6–3.4、3.4–5 秒的三个镜头，不显示分镜纸、边框或文字。提示词没有直接告知红、绿、蓝颜色。

图片上传到 `/http/upload-file-v2/direct`，取得 `fileMetadata.fileMetadataId`。向 `/rest/app-chat/conversations/new` 提交：

```json
{
  "modelName": "imagine-video-gen",
  "mediaGenInput": {
    "referenceToVideo": {
      "prompt": "<分镜描述>",
      "inputAssets": ["<上传后的 fileMetadataId>"],
      "aspectRatio": "16:9",
      "duration": 5,
      "resolutionName": "480p"
    }
  },
  "kind": "CONVERSATION_KIND_IMAGINE"
}
```

请求还使用了项目现有模式的签名和 Imagine 请求元数据。没有设置首帧字段，也没有使用 `imageToVideo`。

## 上游证据与成片

- 图片上传、签名、视频生成、成片下载均返回 HTTP 200。
- 返回的 `videoGenModelConfig.isReferenceToVideo` 为 `true`，`videoLength` 为 `5`，`imageReferences` 包含上传图片。
- 返回的 `mediaGenInput` 保留 `referenceToVideo` 及对应 `inputAssets`。
- 视频生成流返回 `mode: "reference"`，进度达到 100，提供成片 URL。
- 下载 MP4 为 209565 字节；解析得到总容器时长约 5.042 秒，24 fps，752 × 416。
- 抽帧显示单个圆形依次由红变绿再变蓝，没有把三宫格原图作为完整首帧展示。过渡是颜色渐变，因此不能据此承诺精确硬切镜头或复杂电影分镜的执行质量。

本机测试产物：

- `/tmp/grok-web-reference-probe/storyboard-test.png`
- `/tmp/grok-web-reference-probe/reference-video.mp4`
- `/tmp/grok-web-reference-probe/video-contact-sheet.jpg`

当前网页脚本还包含 `imageToVideo.useFirstFrame=false`，但本次没有对该备用结构进行生成实测。仅确认单账号、单张参考图、5 秒、480p；多图上限和其他账号覆盖情况未验证。

## 项目兼容实现与复测

随后已为项目 Web 适配器接入 `ReferenceURLs` → V2 图片上传 → `referenceToVideo.inputAssets`，移除网关的 Web 参考图禁用规则。`image` 首帧模式保持独立，参考音频仍不支持。未更新运行中的 Docker 容器。

- Web、gateway、HTTP inference 三个包的测试全部通过，主程序编译通过。
- 新增的模拟上游集成测试覆盖单张/多张参考图、顺序、非首帧协议、Basic 时长限制与错误参数。
- 修改后的 Go 适配器用另一个 Basic 账号成功生成 5 秒、480p 的参考图视频，并通过适配器下载 220182 字节 MP4。前两个复测账号返回 429；其中一个数据库记录的剩余额度为零。
- 实测成片：`/tmp/grok-web-reference-probe/adapter-reference-video.mp4`。
- `web_reference_video.sh` 的 Base64 编码、创建任务、查询和下载流程通过本地模拟服务验证。
