#!/usr/bin/env bash
# Usage: API_KEY=your_key bash grok2api-test/web_reference_video.sh ./storyboard.png
# Requires curl, jq, base64. The server must run the updated Web adapter.
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:8002}"
BASE_URL="${BASE_URL%/}"
MODEL="${MODEL:-Web/grok-imagine-video}"
IMAGE_FILE="${1:?请传入分镜图路径，例如 ./storyboard.png}"
: "${API_KEY:?请设置 API_KEY 为项目的客户端 API Key}"
OUTPUT_FILE="${OUTPUT_FILE:-reference-video.mp4}"
case "${IMAGE_FILE,,}" in
  *.png) IMAGE_MIME='image/png' ;;
  *.jpg|*.jpeg) IMAGE_MIME='image/jpeg' ;;
  *.webp) IMAGE_MIME='image/webp' ;;
  *) echo '请使用 PNG、JPEG 或 WebP 分镜图' >&2; exit 1 ;;
esac
[[ -r "$IMAGE_FILE" ]] || { echo "无法读取分镜图：$IMAGE_FILE" >&2; exit 1; }

PROMPT="${PROMPT:-参考上传的三宫格分镜，生成5秒的连续电影短片。分镜纸仅作为内容、人物、构图和镜头顺序的参考，不要把整张分镜纸当作首帧，不要展示拼图、边框、标题、文字或字幕。0–1.6秒：深夜昏暗厨房，男子站在关闭的冰箱前，一只手搭在门把手上，迟迟没有打开，墙上时钟轻微走动。1.6–3.4秒：冰箱门打开，从冰箱内部看男子，主搁架空空如也，冷蓝光照亮面部，镜头缓慢推进，他下颌微紧，肚子低鸣一声后恢复寂静。3.4–5秒：特写冰箱角落最后一根香肠，两根手指轻轻夹住，停顿半拍；冰箱门缓缓合上，冷蓝光从脸上消失。克制的现实主义电影风格，低调照明，冷蓝色调，无配乐、无对白，保留轻微时钟滴答、冰箱门声和一次肚子叫声。}"

# Read Base64 from a file descriptor to avoid shell argument size limits.
RESPONSE=$(
  jq -n --arg model "$MODEL" --arg prompt "$PROMPT" --arg mime "$IMAGE_MIME" \
    --rawfile image <(base64 < "$IMAGE_FILE") \
    '{model: $model, prompt: $prompt, duration: 5, aspect_ratio: "16:9", resolution: "480p", reference_images: [{url: ("data:" + $mime + ";base64," + ($image | gsub("\\s"; "")))}]}' |
    curl --fail-with-body --silent --show-error --max-time 120 \
      "$BASE_URL/v1/videos/generations" \
      -H "Authorization: Bearer $API_KEY" \
      -H 'Content-Type: application/json' --data-binary @-
)
REQUEST_ID=$(jq -er '.request_id | select(type == "string" and length > 0)' <<< "$RESPONSE")
echo "任务已创建：$REQUEST_ID"

for ((attempt = 0; attempt < 180; attempt++)); do
  STATUS_JSON=$(curl --fail-with-body --silent --show-error --max-time 30 \
    "$BASE_URL/v1/videos/$REQUEST_ID" -H "Authorization: Bearer $API_KEY")
  STATUS=$(jq -er '.status' <<< "$STATUS_JSON")
  echo "状态：$STATUS"
  case "$STATUS" in
    completed|done)
      curl --fail-with-body --silent --show-error --location --max-time 120 \
        "$BASE_URL/v1/videos/$REQUEST_ID/content" \
        -H "Authorization: Bearer $API_KEY" -o "$OUTPUT_FILE"
      echo "视频已保存：$OUTPUT_FILE"
      exit 0
      ;;
    failed|expired|cancelled)
      jq . <<< "$STATUS_JSON" >&2
      exit 1
      ;;
  esac
  sleep 5
done
echo "等待超时，可继续查询：$BASE_URL/v1/videos/$REQUEST_ID" >&2
exit 1
