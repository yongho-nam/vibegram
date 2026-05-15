# 전체 프로젝트 가이드 (Instagram 클론)

## 1. 비전

React 프론트엔드와 FastAPI 백엔드를 SQLite 한 개로 묶어, **피드·게시물·프로필·팔로우·좋아요·댓글·저장·스토리·DM·알림**까지 단계적으로 완성하는 풀스택 클론이다. 문서 간 역할 분담은 아래와 같다.

| 문서 | 내용 |
|------|------|
| `front.md` | 화면·라우트·상태·API 연동·UX |
| `backend.md` | API·모듈 구조·인증·파일·운영 |
| `db.md` | 테이블·관계·인덱스 |

## 2. 저장소 레이아웃(권장)

단일 레포(monorepo) 예시:

```
my_instagram/
  frontend/          # Vite + React + TS
  backend/           # FastAPI
  uploads/           # .gitignore, 로컬 미디어
  guide.md
  front.md
  backend.md
  db.md
```

프론트 `npm run dev`와 백엔드 `uvicorn app.main:app --reload`를 동시에 띄운다.

## 3. 개발 순서(MVP → 확장)

1. **DB**: Alembic으로 `users`, `posts`, `post_media`, `likes`, `comments`, `follows`까지 마이그레이션.
2. **백엔드**: 회원가입/로그인/JWT → 게시물 CRUD · 피드 · 좋아요 · 댓글 · 팔로우.
3. **프론트**: 인증 레이아웃 → 피드 → 게시 작성 → 프로필.
4. **확장**: `saved_posts`, 검색·해시태그, 스토리, 알림, DM(폴링 후 WebSocket).
5. **다듬기**: 비공개 계정, 이미지 리사이즈, 레이트 리밋, E2E.

## 4. 환경 변수

**백엔드 `backend/.env`**

```
DATABASE_URL=sqlite:////var/vibe/onadn.co.kr/backend/instagram.db
JWT_SECRET=<32바이트 이상 랜덤 문자열>
JWT_ALGORITHM=HS256
JWT_EXPIRES_MINUTES=10080
UPLOAD_DIR=/var/vibe/onadn.co.kr/uploads
FRONTEND_ORIGIN=https://vibe.onadn.co.kr
API_PUBLIC_BASE=https://vibe.onadn.co.kr
EXPOSE_PASSWORD_RESET_LINK=false
```

**프론트 `frontend/.env`** (프로덕션)

```
VITE_API_BASE_URL=/api/v1
```

로컬 개발 시 `FRONTEND_ORIGIN=http://localhost:5173`, `VITE_API_BASE_URL=http://localhost:8000/api/v1` 로 변경.

## 5. 로컬 실행 체크리스트

- [x] Python 3.11 가상환경 생성 및 `requirements.txt` 설치
- [x] `alembic upgrade head`
- [x] 백엔드 CORS에 프론트 오리진 등록
- [x] 프론트 의존성 설치 후 dev 서버
- [ ] 회원가입 → 로그인 → 이미지 업로드 게시물 1건 확인

## 6. 프로덕션 배포 (현재 적용 완료)

**환경**: Amazon Linux 2023 / EC2 / `vibe.onadn.co.kr`

### 서버 구성

| 구성 요소 | 설정 |
|-----------|------|
| Python | 3.11 (`python3.11 -m venv .venv`) |
| 백엔드 프로세스 관리 | systemd (`vibegram-backend.service`) |
| 리버스 프록시 | nginx 1.30 |
| SSL | Let's Encrypt (`/etc/letsencrypt/live/vibe.onadn.co.kr/`) |
| 정적 파일 루트 | `/var/vibe/onadn.co.kr/frontend/dist` |
| 백엔드 바인드 | `127.0.0.1:8000` (외부 직접 노출 없음) |

### nginx 라우팅 규칙

```
/api/*    → proxy_pass http://127.0.0.1:8000/api/
/media/*  → proxy_pass http://127.0.0.1:8000/media/
/health   → proxy_pass http://127.0.0.1:8000/health
/*        → try_files $uri $uri/ /index.html  (SPA)
```

### 배포 후 재시작 절차

```bash
git pull
cd frontend && npm run build && cd ..
cd backend && .venv/bin/alembic upgrade head && cd ..
sudo systemctl restart vibegram-backend
sudo systemctl reload nginx
```

### 주의사항

- SQLite는 **단일 프로세스**에 적합; uvicorn 워커를 늘릴 경우 PostgreSQL 전환 권장.
- `uploads/` 디렉토리는 `.gitignore`됨 — 서버에서 별도 관리.
- `*.db-shm`, `*.db-wal` (SQLite WAL 파일)도 `.gitignore` 처리됨.
- `JWT_SECRET`은 절대 커밋하지 않음 (`.env`는 `.gitignore`에 포함).

## 7. 이슈·우선순위 합의

- “완전한 클론”과 “MVP 출시”를 구분하고, 각 스프린트마다 **백엔드 스키마·API 경로를 먼저 고정**한 뒤 프론트를 맞추면 통합 비용이 줄어든다.
- 선택 기능(비공개 계정·대댓글·Reels류 비디오)은 `backend.md` / `db.md`에 “Phase 2”로 표시해 두고 일정에 반영한다.

---

**관련 문서**: `front.md`, `backend.md`, `db.md`
