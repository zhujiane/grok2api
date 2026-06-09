param(
    [string]$BaseUrl = "http://127.0.0.1:8000",
    [string]$ApiKey = "grok2api",
    [string]$Model = "grok-imagine-video",
    [string]$Prompt = "霓虹雨夜街头，电影感慢镜头追拍",
    [ValidateSet(6, 10, 12, 16, 20)]
    [int]$Seconds = 6,
    [ValidateSet("720x1280", "1280x720", "1024x1024", "1024x1792", "1792x1024")]
    [string]$Size = "720x1280",
    [ValidateSet("480p", "720p")]
    [string]$ResolutionName = "720p",
    [ValidateSet("fun", "normal", "spicy", "custom")]
    [string]$Preset = "normal",
    [string[]]$Ref = @(),
    [string]$Output = "result.mp4",
    [int]$PollIntervalSeconds = 10,
    [int]$TimeoutSeconds = 900,
    [switch]$NoDownload
)

$ErrorActionPreference = "Stop"

function Join-Url {
    param(
        [Parameter(Mandatory = $true)][string]$Left,
        [Parameter(Mandatory = $true)][string]$Right
    )
    return $Left.TrimEnd("/") + "/" + $Right.TrimStart("/")
}

function Require-CurlExe {
    $curl = Get-Command curl.exe -ErrorAction SilentlyContinue
    if (-not $curl) {
        throw "curl.exe not found in PATH"
    }
}

function New-VideoJob {
    param([string]$Url)

    $args = @(
        "-sS",
        "-X", "POST", $Url,
        "-H", "Authorization: Bearer $ApiKey",
        "--form-string", "model=$Model",
        "--form-string", "prompt=$Prompt",
        "--form-string", "seconds=$Seconds",
        "--form-string", "size=$Size",
        "--form-string", "resolution_name=$ResolutionName",
        "--form-string", "preset=$Preset"
    )

    foreach ($path in $Ref) {
        $resolved = (Resolve-Path -LiteralPath $path).Path
        $args += @("-F", "input_reference[]=@$resolved")
    }

    Write-Host "Create request:"
    Write-Host ("curl.exe " + (($args | ForEach-Object { "'$_'" }) -join " "))

    $raw = & curl.exe @args
    if ($LASTEXITCODE -ne 0) {
        throw "curl.exe failed with exit code $LASTEXITCODE"
    }
    return $raw | ConvertFrom-Json
}

function Get-VideoJob {
    param([string]$Url)
    return Invoke-RestMethod -Uri $Url -Headers @{ Authorization = "Bearer $ApiKey" }
}

Require-CurlExe

foreach ($path in $Ref) {
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        throw "Reference image not found: $path"
    }
}

$videosUrl = Join-Url $BaseUrl "/v1/videos"
$job = New-VideoJob -Url $videosUrl

Write-Host ""
Write-Host ("video_id: {0}" -f $job.id)
Write-Host ("initial_status: {0}, progress: {1}" -f $job.status, $job.progress)

$jobUrl = Join-Url $videosUrl $job.id
$contentUrl = Join-Url $jobUrl "content"
$deadline = (Get-Date).AddSeconds($TimeoutSeconds)

while ($true) {
    if ((Get-Date) -gt $deadline) {
        throw "Timed out waiting for video job: $($job.id)"
    }

    $job = Get-VideoJob -Url $jobUrl
    Write-Host ("{0} status={1} progress={2}" -f (Get-Date).ToString("HH:mm:ss"), $job.status, $job.progress)

    if ($job.status -in @("completed", "failed", "cancelled")) {
        break
    }

    Start-Sleep -Seconds $PollIntervalSeconds
}

Write-Host ""
Write-Host "Final job:"
$job | ConvertTo-Json -Depth 10

Write-Host ""
Write-Host "Video URL:"
Write-Host $contentUrl

Write-Host ""
Write-Host "Download curl:"
Write-Host "curl.exe -L '$contentUrl' -H 'Authorization: Bearer $ApiKey' -o '$Output'"

if ($job.status -ne "completed") {
    exit 1
}

if (-not $NoDownload) {
    & curl.exe -sS -L $contentUrl -H "Authorization: Bearer $ApiKey" -o $Output
    if ($LASTEXITCODE -ne 0) {
        throw "video download failed with exit code $LASTEXITCODE"
    }
    $file = Get-Item -LiteralPath $Output
    Write-Host ("Downloaded: {0} ({1} bytes)" -f $file.FullName, $file.Length)
}
