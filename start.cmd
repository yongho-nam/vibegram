@echo off
setlocal

REM One-click launcher for Windows.
REM It runs the PowerShell script with ExecutionPolicy bypassed for this process.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run.ps1"
if errorlevel 1 (
  echo.
  echo Launcher failed. See messages above.
  pause
)

endlocal

