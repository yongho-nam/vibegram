# 바이브그램 (React + FastAPI)

인스타그램 클론 풀스택 프로젝트.

**프로덕션 URL**: https://vibe.onadn.co.kr

로컬: **SQLite** · 서버: **PostgreSQL** (`APP_ENV` / `DATABASE_URL`로 자동 선택, Alembic 마이그레이션)

명세: 루트의 `front.md`, `backend.md`, `db.md`, `guide.md` 참고.

---

## 프로덕션 환경 (현재 배포 상태)

| 항목 | 내용 |
|------|------|
| 서버 | Amazon Linux 2023 (EC2) |
| 도메인 | https://vibe.onadn.co.kr |
| 프론트엔드 | Vite 빌드 → nginx 정적 서빙 (`frontend/dist/`) |
| 백엔드 | FastAPI + uvicorn, systemd 서비스로 상시 운영 |
| DB | SQLite (`backend/instagram.db`) — 다중 워커 시 PostgreSQL 전환 권장 |
| 리버스 프록시 | nginx (HTTP→HTTPS 리다이렉트, SPA 라우팅, `/api` 프록시) |
| SSL | Let's Encrypt |

### 트래픽 흐름

```
사용자 → HTTPS:443 → nginx → /api/*  → uvicorn(127.0.0.1:8000)
                            → /media/* → uvicorn(127.0.0.1:8000)
                            → /*       → frontend/dist/index.html
```

### 서비스 관리

```bash
# 백엔드 상태 확인 / 재시작
sudo systemctl status vibegram-backend
sudo systemctl restart vibegram-backend

# nginx 재로드
sudo systemctl reload nginx

# 헬스 체크
curl https://vibe.onadn.co.kr/health
curl https://vibe.onadn.co.kr/api/v1/health
```

### 코드 업데이트 후 재배포

```bash
git pull

# 프론트엔드 재빌드
cd frontend && npm run build && cd ..

# 백엔드 의존성 변경 시
cd backend && .venv/bin/pip install -r requirements.txt && cd ..

# DB 마이그레이션 (venv Python 사용)
cd backend && .venv/bin/python -m alembic upgrade head && cd ..

# 백엔드 재시작
sudo systemctl restart vibegram-backend
```

---

## 로컬 개발 환경

### 요구사항

- Node.js 18+
- Python 3.11+ (Windows는 64-bit 권장)

### 빠른 시작 (권장)

프로젝트 **루트**에서:

```bash
npm install
npm run dev
```

- `npm install`: 프론트 의존성 + 백엔드 venv·pip·`alembic upgrade head` (SQLite)
- `npm run dev`: Vite(5173) + Uvicorn(8000) 동시 실행

### 수동 설정 (backend)

```bash
cd backend
python -m venv .venv
# Windows
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
.\migrate.ps1
# 또는: .\.venv\Scripts\python.exe -m alembic upgrade head

# Linux / macOS
# python3.11 -m venv .venv && source .venv/bin/activate
# pip install -r requirements.txt && cp .env.example .env
# python -m alembic upgrade head

uvicorn app.main:app --reload --port 8000
```

> 전역 `alembic` 명령은 PATH에 없을 수 있습니다. **venv의 `python -m alembic`** 또는 **`.\migrate.ps1`** 을 사용하세요.

서버(PostgreSQL): `copy .env.production.example .env` 후 `APP_ENV=production`과 `POSTGRES_*`(또는 `DATABASE_URL`) 설정 → 동일하게 `alembic upgrade head`.

루트에서 마이그레이션만: `npm run migrate`

- 프론트: http://localhost:5173
- 백엔드: http://localhost:8000

**테스트 계정**: `test@gmail.com` / `12345` (또는 `test_user` + 동일 비밀번호)

### 환경 변수

**`backend/.env` (로컬)**

```
APP_ENV=development
DATABASE_URL=sqlite:///./instagram.db
JWT_SECRET=<strong-random-secret>
JWT_ALGORITHM=HS256
JWT_EXPIRES_MINUTES=10080
UPLOAD_DIR=./uploads
FRONTEND_ORIGIN=http://localhost:5173
API_PUBLIC_BASE=http://localhost:8000
EXPOSE_PASSWORD_RESET_LINK=true
```

**`frontend/.env`**

```
VITE_API_BASE_URL=/api/v1
```

---

## 프로젝트 구조

```
frontend/     Vite + React + TypeScript
backend/      FastAPI + SQLAlchemy (SQLite / PostgreSQL)
uploads/      미디어 저장용 (gitignore됨)
scripts/      개발·마이그레이션 스크립트
```

## 엔드포인트

- `GET /health` — 서버 헬스 체크
- `GET /api/v1/health` — API 헬스 체크
- `POST /api/v1/auth/register` — 회원가입
- `POST /api/v1/auth/login` — 로그인
