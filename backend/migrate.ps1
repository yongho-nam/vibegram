# backend/ 에서 마이그레이션 (venv Python 사용 — 전역 alembic 불필요)
$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$py = Join-Path $here ".venv\Scripts\python.exe"
if (-not (Test-Path $py)) {
    Write-Host "가상환경이 없습니다. 프로젝트 루트에서 npm install 을 먼저 실행하세요." -ForegroundColor Yellow
    exit 1
}
Set-Location $here
if ($args.Count -gt 0) {
    & $py scripts/migrate.py @args
} else {
    & $py -m alembic upgrade head
}
exit $LASTEXITCODE
