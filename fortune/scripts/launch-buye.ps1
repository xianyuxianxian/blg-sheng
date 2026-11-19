Add-Content -Path "$env:TEMP\buye-trace.log" -Value "=== launcher run $(Get-Date -Format 'HH:mm:ss') ==="
Add-Content -Path "$env:TEMP\buye-trace.log" -Value "scriptRoot: $PSScriptRoot"
$ErrorActionPreference = "SilentlyContinue"

$appUrl = "http://localhost:3210"
$fortuneDir = Split-Path -Parent $PSScriptRoot
$nextBin = Join-Path $fortuneDir "node_modules\next\dist\bin\next"

Add-Content -Path "$env:TEMP\buye-trace.log" -Value "fortuneDir: $fortuneDir"
Add-Content -Path "$env:TEMP\buye-trace.log" -Value "nextBin exists: $(Test-Path $nextBin)"

function Test-App {
    try {
        $r = Invoke-WebRequest -Uri $appUrl -UseBasicParsing -TimeoutSec 3
        return ($r.StatusCode -eq 200)
    } catch { return $false }
}

if (Test-App) {
    Add-Content -Path "$env:TEMP\buye-trace.log" -Value "server already up, opening browser"
} else {
    Add-Content -Path "$env:TEMP\buye-trace.log" -Value "server down, spawning via WMI"
    # User 级杂牌 ZHIPU_API_KEY 会被子进程继承并遮蔽 .env.local 的讯飞 key
    # （Next.js 的 .env.local 不覆盖已存在的环境变量），必须在 cmd 内部清掉。
    Remove-Item Env:ZHIPU_API_KEY -ErrorAction SilentlyContinue
    $inner = "set ZHIPU_API_KEY=&& cd /d ""$fortuneDir"" && node ""node_modules\next\dist\bin\next"" dev --port 3210"
    $wmi = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
        CommandLine = "cmd /c $inner"
        CurrentDirectory = $fortuneDir
    }
    Add-Content -Path "$env:TEMP\buye-trace.log" -Value "spawn ret $($wmi.ReturnValue) pid $($wmi.ProcessId)"
    $deadline = (Get-Date).AddSeconds(60)
    do { Start-Sleep -Milliseconds 1000; $up = Test-App } while (-not $up -and (Get-Date) -lt $deadline)
    Add-Content -Path "$env:TEMP\buye-trace.log" -Value "wait done, up=$up"
}

Start-Process $appUrl
Add-Content -Path "$env:TEMP\buye-trace.log" -Value "browser opened"
