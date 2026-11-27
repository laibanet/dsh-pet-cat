@echo off
setlocal
set "DIR=%~dp0"
set "HTML=%DIR%pet-cat.html"
set "URL=file:///%HTML:\=/%"
set "URL=%URL: =%20%"

set "BROWSER=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%BROWSER%" set "BROWSER=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%BROWSER%" set "BROWSER=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if not exist "%BROWSER%" set "BROWSER=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not exist "%BROWSER%" (
  echo Chrome or Edge was not found.
  pause
  exit /b 1
)

start "" "%BROWSER%" --app="%URL%" --window-size=540,480 --window-position=900,500 --user-data-dir="%LOCALAPPDATA%\dsh-pet-cat-window"
ping -n 3 127.0.0.1 >nul
powershell -NoProfile -ExecutionPolicy Bypass -File "%DIR%pin.ps1"
