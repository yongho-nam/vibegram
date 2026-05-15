param(
  [int]$FrontendPort = 5173
)

$ErrorActionPreference = "Stop"

function Start-Url($url) {
  try { Start-Process $url | Out-Null } catch { Write-Warning "브라우저 자동 열기에 실패했습니다: $url" }
}

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js가 필요합니다: https://nodejs.org"
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw "npm이 필요합니다."
}

Write-Host "== npm install (프론트 + 백엔드 venv/pip) ==" -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "== npm run dev (Vite + Uvicorn) ==" -ForegroundColor Cyan
Start-Job -ScriptBlock {
  Start-Sleep -Seconds 2
  Start-Process "http://localhost:$using:FrontendPort/"
} | Out-Null

npm run dev
