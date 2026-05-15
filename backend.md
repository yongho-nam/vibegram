# 백엔드 개발 명세서 (프론트엔드 정합 · SQLite 전용)

본 문서는 **현재 React 프론트**(`frontend/src`, 특히 `App.tsx` 라우트·`data/types.ts`)와 **`db.md` + `backend/app/models/`** 스키마를 기준으로 API를 검증·한정한다.  
데이터베이스는 **개발·프로덕션 모두 SQLite**만 사용한다.

**원본 스키마**: `db.md`, Alembic 리비전 `backend/alembic/versions/`. 명세의 **응답 JSON 필드명**은 프론트 목업과 맞추되, **저장 컬럼이 없는 필드**는 §5.10에 따른 **조합·집계 필드**로 명시한다.

---

## 1. 목표와 비범위

### 1.1 목표

- 프론트 **실제 라우트·버튼·폼**에 필요한 JSON만 제공한다.
- `ProtectedRoute` 구간은 **JWT Access**(또는 동등 세션) 필수.
- 바이너리 미디어는 **`UPLOAD_DIR`** 로컬 저장 후, 응답에는 **공개 URL**(예: `/media/...`)만 실은 문자열로 넣는다.

### 1.2 구현하지 않음 (UI 없음·명세 제외)

| 항목 | 이유 |
|------|------|
| 소셜 로그인 | 화면 없음 |
| 비밀번호 찾기 API | 로그인의 링크만 있음 |
| 게시물 ⋯ 메뉴(신고·편집 등) | 버튼만 있고 후속 화면 없음 |
| 공유·푸시 APNs/FCM 전용 API | 클라 처리 또는 범위 외 |
| DM 새 메시지 모달·사용자 검색 | UI 없음 |
| DM「요청」수락/거절 | 카운트 UI만 있음 → v1 **엔드포인트 없음** |
| WebSocket 필수 | 폴링·조회로 충분 |
| S3·다중 DB | SQLite + 로컬 디스크만 |

---

## 2. 기술 스택·실행

| 구분 | 선택 |
|------|------|
| 런타임 | Python 3.11+ |
| 프레임워크 | FastAPI + Uvicorn |
| 검증 | Pydantic v2 |
| ORM | SQLAlchemy 2.0 |
| DB | SQLite 3, `PRAGMA foreign_keys=ON`, WAL(앱 `engine`과 동일) |
| 비밀번호 | bcrypt 또는 argon2 |
| 인증 | JWT Access 한 종류(Refresh 선택) |
| 스키마 변경 | **Alembic** (`alembic upgrade head`) |

### 2.1 권장 라우터 구성(파일 수 최소화)

`likes`·`saved_posts`·`comments`·`comment_likes` 는 모두 게시물 종속이므로 **`posts.py` 한 모듈**에 서브 경로로 묶어도 된다.

```
app/routers/
  auth.py
  users.py          # 공개 프로필 + /users/me/* (차단·세션·비밀번호·privacy·security·notification-settings)
  posts.py          # 피드·탐색·CRUD(선택)·likes·saved_posts·comments
  stories.py
  messages.py
  notifications.py
  search.py
  media.py          # 정적 파일 또는 스트리밍
```

---

## 3. 공통 규격

- **베이스**: `/api/v1`
- **목록**: `{ "items": [...], "next_cursor": null | string }`, `limit` 기본 20·최대 50
- **시간(저장)**: UTC ISO 8601 (`users`, `posts`, … 의 DateTime 컬럼과 일치)
- **에러**: HTTP 상태 + `{ "detail": "..." }`
- **CORS**: `FRONTEND_ORIGIN`, 자격 증명 사용 시 명시

---

## 4. 엔드포인트 카탈로그 (프론트 라우트 기준)

아래가 **v1 필수 구현 집합**이다. `🔹`는 UI 없으나 데이터/목업과의 정합을 위해 **권장(선택)**.

| 메서드 | 경로 | 인증 | 프론트 근거 |
|--------|------|------|-------------|
| POST | `/auth/register` | ❌ | `/signup` |
| POST | `/auth/login` | ❌ | `/login` |
| GET | `/users/me` | ✅ | 헤더 아바타·`/accounts/edit` |
| PATCH | `/users/me` | ✅ | 프로필 편집(JSON: `display_name`, `bio`, `username`, `website` 등 → `users`) |
| POST | `/users/me/avatar` | ✅ | `multipart` 파일 → 파일 저장 + `users.avatar_url` |
| POST | `/users/me/password` | ✅ | `/accounts/password` |
| GET | `/users/me/privacy` | ✅ | `/accounts/privacy` |
| PATCH | `/users/me/privacy` | ✅ | `is_private`, `show_activity_status`, `allow_tags` → `users` |
| GET | `/users/me/security` | ✅ | `/accounts/security` |
| PATCH | `/users/me/security` | ✅ | `two_factor_enabled`, `login_alerts_enabled` → `users` |
| GET | `/users/me/sessions` | ✅ | 세션 목록 → `sessions` |
| DELETE | `/users/me/sessions/{session_id}` | ✅ | `sessions.id`, `is_current=true` 인 행은 거부 |
| GET | `/users/me/blocks` | ✅ | `/accounts/blocked` |
| POST | `/users/me/blocks` | ✅ | body: `blocked_user_id` → `blocks` |
| DELETE | `/users/me/blocks/{user_id}` | ✅ | `blocks` PK (blocker=me, blocked=user_id) |
| GET | `/users/me/notification-settings` | ✅ | `/accounts/notification-settings` |
| PATCH | `/users/me/notification-settings` | ✅ | → `notification_settings` (한 행) |
| GET | `/users/{username}` | △ | 프로필(비공개 시 팔로워만 등 정책은 앱에서) |
| GET | `/users/{username}/posts` | △ | 프로필 그리드 |
| GET | `/users/{username}/followers` | △ | `/:username/followers` |
| GET | `/users/{username}/following` | △ | `/:username/following` |
| DELETE | `/users/{username}/followers/{user_id}` | ✅ | **팔로워 제거** — 본인 프로필일 때만. `follows` 에서 `follower_id=user_id` AND `followee_id=me` 삭제 |
| POST | `/users/{username}/follow` | ✅ | 프로필 **팔로우** → `follows` |
| DELETE | `/users/{username}/follow` | ✅ | 팔로잉 탭 **팔로잉** 버튼·프로필 언팔 → 동일 행 삭제(me=follower) |
| GET | `/posts/feed` | △ | `/` 홈 |
| GET | `/posts/explore` | △ | `/explore` |
| GET | `/posts/{post_id}` | △ | `/p/:postId` — 댓글에 `likes` 개수 → `comment_likes` COUNT |
| POST | `/posts` | ✅ | `/create` `multipart` → `posts` + `post_media` (+ 캡션 파싱 시 `hashtags` / `post_hashtags`) |
| POST | `/posts/{post_id}/like` | ✅ | 좋아요 → `likes` |
| DELETE | `/posts/{post_id}/like` | ✅ | `likes` |
| POST | `/posts/{post_id}/save` | ✅ | 저장 → `saved_posts` |
| DELETE | `/posts/{post_id}/save` | ✅ | `saved_posts` |
| GET | `/posts/{post_id}/comments` | △ | 상세 패널(커서) → `comments` |
| POST | `/posts/{post_id}/comments` | ✅ | 댓글 작성 폼 → `comments` |
| GET | `/stories/feed` | △ | 홈 스토리 트레이 + `story_views` 로 `hasUnseen` |
| POST | `/stories/{story_id}/seen` | ✅ | 스토리 링 조회 → `story_views` |
| GET | `/stories/archive` | ✅ | `/accounts/story-archive` → `stories` where `is_archived` (및 정책) |
| GET | `/messages/threads` | ✅ | `/direct` |
| POST | `/messages/threads` | ✅ | 상대와 스레드 생성/반환 → `message_threads` + `thread_participants` |
| GET | `/messages/threads/{thread_id}/messages` | ✅ | `/direct/t/:threadId` |
| POST | `/messages/threads/{thread_id}/messages` | ✅ | 메시지 전송 → `messages` |
| PATCH | `/messages/threads/{thread_id}/read` | ✅ | **미읽음 해제** — 현재 사용자의 `thread_participants.last_read_at` 갱신 |
| GET | `/notifications` | ✅ | `/notifications` |
| PATCH | `/notifications/read-all` | ✅ | `notifications.is_read` |
| PATCH | `/notifications/{notification_id}/read` | ✅ | 단건 읽음 |
| GET | `/search/users` | △ | `?q=` `/search` 계정 탭 |
| GET | `/search/tags` | △ | `?q=` `/search` 태그 탭 → `hashtags`·`post_hashtags` 집계 |

**인증 범례**: ✅ 필수 · △ 선택(비로그인 허용 시 공개 데이터만, 비공개·좋아요 등은 401 후 프론트가 `/login` 처리).

### 4.1 선택(백오피스·시드·후속 UI)

| 메서드 | 경로 | DB | 비고 |
|--------|------|-----|------|
| PATCH | `/posts/{post_id}` | `posts` | 현재 UI에 편집 화면 없음 |
| DELETE | `/posts/{post_id}` | CASCADE | 현재 UI에 삭제 없음 |
| POST | `/stories` | `stories` | 트레이에 업로드 UI 없음·시드용 |
| POST/DELETE | `/posts/{post_id}/comments/{comment_id}/like` | `comment_likes` | 목업에 댓글 좋아요 **수**만 있고 버튼 없음 → **GET 게시물**에서 COUNT로 충분 |

---

## 5. 엔드포인트 ↔ DB 컬럼 매핑

### 5.1 `POST /auth/register` · `POST /auth/login`

| 동작 | 테이블·컬럼 |
|------|-------------|
| register | `users`: `email`, `username`, `password_hash`, `display_name`(선택), boolean 기본값 컬럼 전부 |
| login | `users` 조회 후 JWT 발급; `sessions` 행 생성은 선택(보안 화면과 맞출 경우) |

### 5.2 `GET` · `PATCH /users/me` · `POST /users/me/avatar`

| JSON / 입력 | `users` 컬럼 |
|---------------|----------------|
| `username` | `username` |
| `email` | `email` (일반적으로 PATCH 제한 또는 별 정책) |
| `display_name` | `display_name` |
| `bio` | `bio` |
| `website` | `website` |
| `avatar_url` (응답) | `avatar_url` |
| 파일 업로드 | 저장 후 `avatar_url` 문자열 갱신 |

### 5.3 `GET` · `PATCH /users/me/privacy` 및 `GET` · `PATCH /users/me/security`

| JSON | `users` |
|------|---------|
| `is_private`, `show_activity_status`, `allow_tags` | 동명 컬럼 |
| `two_factor_enabled`, `login_alerts_enabled` | 동명 컬럼 |

### 5.4 `GET` · `DELETE /users/me/sessions/{session_id}`

| API | `sessions` |
|-----|------------|
| 목록 | `id`, `user_id`, `jti`, `user_agent`, `ip_hash`, `is_current`, `created_at`, `last_seen_at` — **라벨·위치 문자열은 API가 조합**해도 됨(DB에 없음) |
| DELETE | PK `id` 삭제, JWT `jti` 무효화 정책은 구현체에 따름 |

### 5.5 `blocks` · `notification_settings`

| API | 테이블 |
|-----|--------|
| `GET/POST/DELETE .../blocks` | `blocks(blocker_id, blocked_id, created_at)` — blocker는 항상 현재 사용자 |
| `GET/PATCH .../notification-settings` | `notification_settings` 한 행: `push_like`, `push_comment`, `push_follow`, `push_mention`, `push_direct`, `email_digest`, `updated_at` |

### 5.6 `GET /users/{username}` · posts · followers

| 응답 필드(예) | 출처 |
|----------------|------|
| 게시 수 / 팔로워 / 팔로잉 | `posts` COUNT, `follows` COUNT |
| `is_following` | `follows` 존재 여부(me→username) |
| `is_own` | `username` == JWT 주체 |
| 그리드 썸네일 | `post_media.storage_path` → 공개 URL |

`DELETE /users/{username}/followers/{user_id}`: `follows` 행 `(follower_id=user_id, followee_id=me)`.

`POST/DELETE /users/{username}/follow`: `follows` 행 `(follower_id=me, followee_id=상대 user id)` — `username`으로 상대 id 해석.

### 5.7 게시물 `posts` · `post_media` · `likes` · `saved_posts` · `comments` · `comment_likes`

| API | 테이블 |
|-----|--------|
| `POST /posts` | `posts` + `post_media`(1..n) + (선택) 캡션에서 `hashtags`/`post_hashtags` |
| like/save | `likes`, `saved_posts` 복합 PK |
| comments GET/POST | `comments` (`parent_id` 대댓글 선택) |
| 댓글 `likes` 수(목업 `Comment.likes`) | **`comment_likes` COUNT** — 별도 토글 API 없이 GET 게시물에 포함 가능 |

### 5.8 `stories` · `story_views`

| API | 테이블 |
|-----|--------|
| feed / seen | `stories`, `story_views` PK `(story_id, viewer_id)` |
| archive | `stories.is_archived` + (선택) `expires_at` 정책 |

### 5.9 `messages` · `message_threads` · `thread_participants`

| API | 테이블 |
|-----|--------|
| threads 목록 | `message_threads.updated_at`, 마지막 메시지·unread는 `messages` + **참가자 `last_read_at`** 로 계산 |
| `PATCH .../read` | 본인 `thread_participants.last_read_at` |

### 5.10 `notifications`

| DB 컬럼 | 용도 |
|---------|------|
| `recipient_id`, `actor_id`, `type`, `post_id`, `comment_id`, `thumbnail_url`, `is_read`, `created_at` | 저장 |

| 응답 전용(프론트 `NotificationItem`) | 출처 |
|-------------------------------------|------|
| `text` | **DB 컬럼 없음** — `type`·`actor`·`post_id`·`comment_id`로 서버가 한국어/영어 문장 조합 |
| `actorUsername`, `actorAvatar` | `users` 조인(actor_id) |
| `timeAgo` | 선택: `created_at` 기반 생성 또는 ISO만 내려 클라 계산 |

---

## 6. 응답·타입 정합 (`types.ts`)

- `Post.id`, `Comment.id` 등 프론트는 **문자열** 목업 — API는 **정수 PK를 문자열로 직렬화**해도 됨.
- `Post.imageUrl` ↔ `post_media` 공개 URL.
- `ThreadPreview` ↔ 스레드 + 상대 `users` + 마지막 `messages.body` + unread 계산.
- `Message.fromMe` ↔ `messages.sender_id` 와 현재 사용자 비교.

---

## 7. 비즈니스 규칙(최소)

- `users.username`, `users.email` UNIQUE(이메일 정규화 정책 통일 권장).
- 게시물 삭제 시 `post_media`, `likes`, `comments`, `saved_posts`, 관련 `notifications` 등 **FK CASCADE**(`db.md`와 Alembic 일치).
- `blocks`에 있으면 상대의 팔로우·댓글·DM 생성 등 제한(MVP는 팔로우·DM·댓글 정도).
- 알림 행 생성: 좋아요·댓글·팔로우 시 `notifications`(중복 억제는 간단 규칙으로 선택).

---

## 8. 관측·환경

- `GET /health` — `SELECT 1` 등.
- 스키마: `alembic upgrade head` 또는 `python scripts/init_sqlite.py`.
- `.env`: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_MIN`, `UPLOAD_DIR`, `FRONTEND_ORIGIN`.

---

## 9. 테스트(권장)

- `pytest`: register → login → `POST /posts` → `GET /posts/feed` → `POST .../comments` → `PATCH /messages/threads/{id}/read`.

---

**관련 문서**: `db.md`, `front.md`, `guide.md`
