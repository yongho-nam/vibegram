# Instagram 클론 (React + FastAPI + SQLite)

명세: 루트의 `front.md`, `backend.md`, `db.md`, `guide.md` 참고.

## 원클릭 실행 (프론트+백엔드+브라우저 자동 열기)

프로젝트 루트에서 아래 **한 줄**만 실행하세요.

```powershell
.\run.ps1
```

또는 더블클릭 실행을 원하면 `start.cmd`를 실행해도 됩니다.

> 백엔드 의존성은 Windows에서 **64-bit Python(win_amd64)** 를 권장합니다. 현재 환경이 32-bit(`win32`)면 `pip install`에서 `greenlet` 컴파일이 필요해 실패할 수 있으며, 이 경우 런처는 **프론트만 먼저 실행**합니다.

## 권장: `npm install` 한 번 → `npm run dev` 한 번

**프로젝트 루트**에서:

```bash
npm install
npm run dev
```

- `npm install`: `frontend` 워크스페이스 의존성 설치 + `postinstall`에서 **백엔드 venv + pip** 자동 설치  
- `npm run dev`: **Vite(5173) + Uvicorn(8000)** 동시 실행

**테스트 로그인 (프론트 목업)**  
- 이메일: `test@gmail.com` · 비밀번호: `12345`  
- 사용자 이름으로 로그인할 때는 `test_user` + 동일 비밀번호도 됩니다.

**`frontend` 폴더에서만** 작업하는 경우에도 동일하게:

```bash
cd frontend
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` — 기본적으로 데모 세션이 켜져 있어 홈 피드가 표시됩니다. 로그아웃 후 `/login`에서 다시 로그인할 수 있습니다.

## 백엔드 (스켈레톤)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

> `npm install`을 루트에서 실행하면 `postinstall`이 위와 같이 venv·pip·**`alembic upgrade head`** 까지 자동으로 시도합니다.
> **참고:** 백엔드 의존성(SQLAlchemy → `greenlet`)은 **Windows 64비트 Python(`win_amd64`)** 에서 미리 빌드된 휠을 받는 경우가 많습니다. 32비트(`win32`) Python이면 소스 빌드가 필요해 **Visual C++ Build Tools**가 없으면 `pip install`이 실패할 수 있습니다. 이 경우 Python 64비트로 가상환경을 다시 만들면 대부분 해결됩니다.

- `GET /health` — 헬스 체크  
- `GET /api/v1/health` — API 헬스  
- SQLite 파일(`instagram.db` 등)은 **`alembic upgrade head`** 로 스키마가 적용된 뒤 사용한다.
## 환경 변수

- `frontend/.env.example` → `VITE_API_BASE_URL`  
- `backend/.env.example` → DB, CORS, JWT 등 (JWT는 다음 단계에서 구현)

## 구조

```
frontend/     Vite + React + TypeScript
backend/      FastAPI + SQLAlchemy + SQLite (기본 뼈대)
uploads/      미디어 저장용 (예약)
```
