@echo off
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
  echo [migrate] .venv 없음. 루트에서 npm install 을 실행하세요.
  exit /b 1
)
".venv\Scripts\python.exe" -m alembic upgrade head
exit /b %ERRORLEVEL%
