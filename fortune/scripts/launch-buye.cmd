@echo off
rem BuYe launcher v3 - logging + simple quoting
set LOG=%TEMP%\buye-launch.log
echo [%date% %time%] launcher start > "%LOG%"

set APPURL=http://localhost:3210
cd /d "%~dp0.."
echo cwd=%CD% >> "%LOG%"

rem 1) already running?
powershell -NoProfile -Command "try{(Invoke-WebRequest -Uri '%APPURL%' -UseBasicParsing -TimeoutSec 3)|Out-Null;exit 0}catch{exit 1}"
if %errorlevel%==0 goto open
echo not running, starting server >> "%LOG%"

rem 2) start server minimized
set ZHIPU_API_KEY=
start "buye-server" /min cmd /c "cd /d %~dp0.. && node node_modules\next\dist\bin\next dev --port 3210 >> %TEMP%\buye-server.log 2>&1"
echo server start issued >> "%LOG%"

rem 3) wait until ready (max ~60s)
set /a tries=0
:waitloop
timeout /t 2 /nobreak >nul
powershell -NoProfile -Command "try{(Invoke-WebRequest -Uri '%APPURL%' -UseBasicParsing -TimeoutSec 3)|Out-Null;exit 0}catch{exit 1}"
if %errorlevel%==0 goto open
set /a tries+=1
echo try %tries% failed >> "%LOG%"
if %tries% lss 30 goto waitloop

:open
echo opening browser >> "%LOG%"
start "" %APPURL%
exit /b 0
