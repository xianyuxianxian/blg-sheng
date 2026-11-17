$ErrorActionPreference = "SilentlyContinue"

$appUrl = "http://localhost:3210"
$fortuneDir = "E:\默认项目\fortune"
$nextBin = Join-Path $fortuneDir "node_modules\next\dist\bin\next"

function Test-App {
    try {
        $r = Invoke-WebRequest -Uri $appUrl -UseBasicParsing -TimeoutSec 3
        return ($r.StatusCode -eq 200)
    } catch { return $false }
}

# already running -> just open browser
if (Test-App) {
    Start-Process $appUrl
    exit
}

# start dev server hidden (remove shadowing env key first)
Remove-Item Env:ZHIPU_API_KEY -ErrorAction SilentlyContinue
Start-Process -FilePath "node" -ArgumentList "`"$nextBin`" dev --port 3210" -WorkingDirectory $fortuneDir -WindowStyle Hidden

# wait until ready (max 60s for first compile)
$deadline = (Get-Date).AddSeconds(60)
do {
    Start-Sleep -Milliseconds 800
    $up = Test-App
} while (-not $up -and (Get-Date) -lt $deadline)

# open browser either way
Start-Process $appUrl
