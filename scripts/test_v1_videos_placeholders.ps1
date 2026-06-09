param(
    [string]$BaseUrl = "http://localhost:8000",
    [string]$ApiKey = $(if ($env:GROK2API_API_KEY) { $env:GROK2API_API_KEY } else { "grok2api" }),
    [string]$Output = "placeholder_result.mp4",
    [int]$PollIntervalSeconds = 10,
    [int]$TimeoutSeconds = 900,
    [switch]$NoDownload
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$testScript = Join-Path $PSScriptRoot "test_v1_videos.ps1"
$womenImage = Join-Path $repoRoot "data\files\images\women_720.jpg"
$envImage = Join-Path $repoRoot "data\files\images\env_720.jpg"

& $testScript `
    -BaseUrl $BaseUrl `
    -ApiKey $ApiKey `
    -Model "grok-imagine-video" `
    -Prompt "@IMAGE1 人物在场景 @IMAGE2 中起舞，跳跃" `
    -Seconds 6 `
    -Size "1280x720" `
    -ResolutionName "480p" `
    -Preset "custom" `
    -Ref $womenImage, $envImage `
    -Output $Output `
    -PollIntervalSeconds $PollIntervalSeconds `
    -TimeoutSeconds $TimeoutSeconds `
    -NoDownload:$NoDownload
