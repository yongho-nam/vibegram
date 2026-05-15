# Vibegram (React + FastAPI + SQLite)

인스타그램 클론 풀스택 프로젝트.

**프로덕션 URL**: https://vibe.onadn.co.kr

명세: 루트의 `front.md`, `backend.md`, `db.md`, `guide.md` 참고.

---

## 프로덕션 환경 (현재 배포 상태)

| 항목 | 내용 |
|------|------|
| 서버 | Amazon Linux 2023 (EC2) |
| 도메인 | https://vibe.onadn.co.kr |
| 프론트엔드 | Vite 빌드 → nginx 정적 서빙 (`frontend/dist/`) |
| 백엔드 | FastAPI + uvicorn, systemd 서비스로 상시 운영 |
| DB | SQLite (`backend/instagram.db`) |
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

# DB 마이그레이션
cd backend && .venv/bin/alembic upgrade head && cd ..

# 백엔드 재시작
sudo systemctl restart vibegram-backend
```

---

## 로컬 개발 환경

### 요구사항

- Node.js 18+
- Python 3.11+

### 빠른 시작

```bash
# 1. 프론트엔드 의존성 설치
cd frontend && npm install && cd ..

# 2. 백엔드 가상환경 + 의존성
cd backend
python3.11 -m venv .venv
.venv/bin/pip install -r requirements.txt

# 3. 환경 변수 설정
cp .env.example .env   # 내용 수정

# 4. DB 초기화
.venv/bin/alembic upgrade head
cd ..

# 5. 개발 서버 동시 실행 (루트에서)
npm run dev
```

- 프론트: http://localhost:5173
- 백엔드: http://localhost:8000

**테스트 계정**: `test@gmail.com` / `12345` (또는 `test_user` + 동일 비밀번호)

### 환경 변수

**`backend/.env`**

```
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
backend/      FastAPI + SQLAlchemy + SQLite
uploads/      미디어 저장용 (gitignore됨)
scripts/      개발용 실행 스크립트
```

## 엔드포인트

- `GET /health` — 서버 헬스 체크
- `GET /api/v1/health` — API 헬스 체크
- `POST /api/v1/auth/register` — 회원가입
- `POST /api/v1/auth/login` — 로그인
