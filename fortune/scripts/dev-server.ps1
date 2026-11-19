$ErrorActionPreference = "SilentlyContinue"
$appUrl = "http://localhost:3210"
function Test-App {
    try {
        $r = Invoke-WebRequest -Uri $appUrl -UseBasicParsing -TimeoutSec 3
        return ($r.StatusCode -eq 200)
    } catch { return $false }
}

if (Test-App) {
    Write-Output "server already up"
} else {
    Remove-Item Env:ZHIPU_API_KEY -ErrorAction SilentlyContinue
    $fortuneDir = Split-Path -Parent $PSScriptRoot
    $inner = "cd /d ""$fortuneDir"" && node ""node_modules\next\dist\bin\next"" dev --port 3210"
    Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
        CommandLine = "cmd /c $inner"
        CurrentDirectory = $fortuneDir
    } | Out-Null
    $deadline = (Get-Date).AddSeconds(60)
    do { Start-Sleep -Milliseconds 1000; $up = Test-App } while (-not $up -and (Get-Date) -lt $deadline)
    if ($up) { Write-Output "server started" } else { Write-Output "server FAILED" }
}
