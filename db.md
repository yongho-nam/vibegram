# 데이터베이스 설계 명세서 (Instagram 클론 · SQLite)

## 1. 설계 원칙

- **엔진**: SQLite 3, 외래키 `PRAGMA foreign_keys = ON` 필수.
- **ID**: 정수 PK `AUTOINCREMENT` 권장(간단함). 공개 노출용 `uuid` 컬럼은 선택.
- **시간**: `created_at`, `updated_at` — `TEXT`(ISO8601) 또는 `INTEGER`(Unix ms); 팀 내 하나로 통일.
- **소프트 삭제**: 초기에는 **하드 삭제**로 단순화 가능.

## 2. ER 개요

```
users ──┬── posts ──┬── post_media
        │           ├── comments ─── comment_likes
        │           ├── likes (게시물)
        │           └── saved_posts
        ├── follows (follower → followee)
        ├── stories ─── story_views
        ├── notifications
        ├── notification_settings (1:1)
        ├── sessions (로그인 세션)
        ├── blocks
        └── message_threads ─── thread_participants (참가자별 last_read_at)
                            └── messages
hashtags ─── post_hashtags ─── posts
```

**구현 참고**: 실제 DDL은 `backend/app/models/` 아래 SQLAlchemy 2.0 모델과 **동일하게 유지**한다. 앱 기동 시 또는 `backend/scripts/init_sqlite.py` 실행 시 `DATABASE_URL` 기본값(`sqlite:///./instagram.db`, `app.config`)에 테이블이 생성된다. 스키마 변경 시 본 문서와 모델을 함께 수정한다.

## 3. 테이블 정의

### 3.1 `users`

| 컬럼 | 타입 | 제약 |
|------|------|------|
| id | INTEGER | PK |
| username | TEXT | UNIQUE NOT NULL |
| email | TEXT | UNIQUE NOT NULL |
| password_hash | TEXT | NOT NULL |
| display_name | TEXT | |
| bio | TEXT | |
| avatar_url | TEXT | |
| website | TEXT | (선택) 프로필 웹사이트 |
| is_private | BOOLEAN / INTEGER | DEFAULT 0 |
| show_activity_status | BOOLEAN / INTEGER | DEFAULT 1 |
| allow_tags | BOOLEAN / INTEGER | DEFAULT 1 |
| two_factor_enabled | BOOLEAN / INTEGER | DEFAULT 0 |
| login_alerts_enabled | BOOLEAN / INTEGER | DEFAULT 1 |
| created_at | DATETIME (TZ) | NOT NULL |
| updated_at | DATETIME (TZ) | NOT NULL |

**인덱스**: `username`, `email`.

> 구현(SQLAlchemy): `DateTime(timezone=True)` — SQLite에는 ISO8601 문자열로 저장된다.

### 3.2 `follows`

| 컬럼 | 타입 | 제약 |
|------|------|------|
| follower_id | INTEGER | FK → users.id ON DELETE CASCADE, PK 일부 |
| followee_id | INTEGER | FK → users.id ON DELETE CASCADE, PK 일부 |
| created_at | DATETIME (TZ) | NOT NULL |

**PK**: `(follower_id, followee_id)`. **CHECK**: `follower_id <> followee_id`(구현: `ck_follows_not_self`).

### 3.3 `posts`

| 컬럼 | 타입 | 제약 |
|------|------|------|
| id | INTEGER | PK |
| author_id | INTEGER | FK → users.id NOT NULL |
| caption | TEXT | |
| location | TEXT | (선택) |
| created_at | DATETIME (TZ) | NOT NULL |
| updated_at | DATETIME (TZ) | (nullable) |

**인덱스**: `(author_id, created_at DESC)`.

> 구현(SQLAlchemy): `users`와 동일하게 `DateTime(timezone=True)` — SQLite에는 ISO8601 문자열로 저장된다.

### 3.4 `post_media`

| 컬럼 | 타입 | 제약 |
|------|------|------|
| id | INTEGER | PK |
| post_id | INTEGER | FK → posts.id ON DELETE CASCADE |
| storage_path | TEXT | NOT NULL (서버 내부 경로 또는 키) |
| mime_type | TEXT | |
| width | INTEGER | (선택) |
| height | INTEGER | (선택) |
| sort_order | INTEGER | DEFAULT 0 |

**인덱스**: `(post_id, sort_order)`.

### 3.5 `likes` (게시물)

| 컬럼 | 타입 | 제약 |
|------|------|------|
| user_id | INTEGER | FK → users.id ON DELETE CASCADE, PK 일부 |
| post_id | INTEGER | FK → posts.id ON DELETE CASCADE, PK 일부 |
| created_at | DATETIME (TZ) | NOT NULL |

**PK**: `(user_id, post_id)`.

### 3.6 `comments`

| 컬럼 | 타입 | 제약 |
|------|------|------|
| id | INTEGER | PK |
| post_id | INTEGER | FK → posts.id ON DELETE CASCADE |
| user_id | INTEGER | FK → users.id ON DELETE CASCADE |
| parent_id | INTEGER | FK → comments.id NULL (대댓글 선택) |
| body | TEXT | NOT NULL |
| created_at | DATETIME (TZ) | NOT NULL |
| updated_at | DATETIME (TZ) | (nullable) |

**인덱스**: `(post_id, created_at)`.

### 3.7 `comment_likes`

| 컬럼 | 타입 | 제약 |
|------|------|------|
| user_id | INTEGER | FK → users.id ON DELETE CASCADE, PK 일부 |
| comment_id | INTEGER | FK → comments.id ON DELETE CASCADE, PK 일부 |
| created_at | DATETIME (TZ) | NOT NULL |

**PK**: `(user_id, comment_id)`.

### 3.8 `saved_posts`

| 컬럼 | 타입 | 제약 |
|------|------|------|
| user_id | INTEGER | FK → users.id ON DELETE CASCADE, PK 일부 |
| post_id | INTEGER | FK → posts.id ON DELETE CASCADE, PK 일부 |
| created_at | DATETIME (TZ) | NOT NULL |

**PK**: `(user_id, post_id)`.

### 3.9 `hashtags` · `post_hashtags` (선택)

- `hashtags(id, tag UNIQUE)`
- `post_hashtags(post_id, hashtag_id)` PK 복합

검색은 `LIKE` 또는 FTS5 확장으로 확장 가능.

### 3.10 `stories`

| 컬럼 | 타입 | 제약 |
|------|------|------|
| id | INTEGER | PK |
| author_id | INTEGER | FK → users.id ON DELETE CASCADE |
| media_path | TEXT | NOT NULL |
| mime_type | TEXT | |
| expires_at | DATETIME (TZ) | NOT NULL |
| created_at | DATETIME (TZ) | NOT NULL |
| is_archived | BOOLEAN / INTEGER | DEFAULT 0 — 보관함(`/accounts/story-archive`) 표시용 |

**인덱스**: `(author_id, expires_at)`. 만료 행은 주기적 삭제(Job) 또는 조회 시 `expires_at > now`.

### 3.11 `story_views`

| 컬럼 | 타입 | 제약 |
|------|------|------|
| story_id | INTEGER | FK → stories.id ON DELETE CASCADE, PK 일부 |
| viewer_id | INTEGER | FK → users.id ON DELETE CASCADE, PK 일부 |
| viewed_at | DATETIME (TZ) | NOT NULL |

**PK**: `(story_id, viewer_id)`.

### 3.12 `message_threads`

| 컬럼 | 타입 | 제약 |
|------|------|------|
| id | INTEGER | PK |
| created_at | DATETIME (TZ) | NOT NULL |
| updated_at | DATETIME (TZ) | (nullable) |

### 3.13 `thread_participants`

| 컬럼 | 타입 | 제약 |
|------|------|------|
| thread_id | INTEGER | FK → message_threads.id ON DELETE CASCADE, PK 일부 |
| user_id | INTEGER | FK → users.id ON DELETE CASCADE, PK 일부 |
| last_read_at | DATETIME (TZ) | NULL 허용 — 참가자별 읽음 시각. DM 목록 `unread`·배지 계산에 사용 |

**PK**: `(thread_id, user_id)`.

1:1 DM은 두 사용자 조합 유일성은 애플리케이션에서 보장하거나 `(min_user_id, max_user_id)` 유니크 테이블(선택).

### 3.14 `messages`

| 컬럼 | 타입 | 제약 |
|------|------|------|
| id | INTEGER | PK |
| thread_id | INTEGER | FK → message_threads.id ON DELETE CASCADE |
| sender_id | INTEGER | FK → users.id ON DELETE CASCADE |
| body | TEXT | |
| media_path | TEXT | (선택) |
| created_at | DATETIME (TZ) | NOT NULL |
| read_at | DATETIME (TZ) | (nullable) — 1:1 등 단순 시나리오에서 “상대가 이 메시지를 읽음” 표시용. **그룹 DM**에서는 참가자별 읽음이 필요하면 별도 `message_reads` 테이블을 두는 편이 정확함(MVP는 1:1 가정으로 `read_at`만으로도 동작 가능). |

**인덱스**: `(thread_id, created_at DESC)`.

### 3.15 `notifications`

| 컬럼 | 타입 | 제약 |
|------|------|------|
| id | INTEGER | PK |
| recipient_id | INTEGER | FK → users.id ON DELETE CASCADE |
| actor_id | INTEGER | FK → users.id ON DELETE CASCADE |
| type | TEXT | NOT NULL (`like`, `comment`, `follow`, `mention` …) |
| post_id | INTEGER | FK → posts.id ON DELETE CASCADE, NULL |
| comment_id | INTEGER | FK → comments.id ON DELETE CASCADE, NULL |
| thumbnail_url | TEXT | (선택) 알림 썸네일 URL |
| is_read | BOOLEAN / INTEGER | DEFAULT 0 |
| created_at | DATETIME (TZ) | NOT NULL |

**인덱스**: `(recipient_id, created_at DESC)`, `(recipient_id, is_read)`.

### 3.16 `blocks` (차단)

| 컬럼 | 타입 | 제약 |
|------|------|------|
| blocker_id | INTEGER | FK → users.id ON DELETE CASCADE, PK 일부 |
| blocked_id | INTEGER | FK → users.id ON DELETE CASCADE, PK 일부 |
| created_at | DATETIME (TZ) | NOT NULL |

**PK**: `(blocker_id, blocked_id)`. **CHECK**: `blocker_id <> blocked_id`(구현: `ck_blocks_not_self`).

### 3.17 `notification_settings` (알림 설정, 사용자당 1행)

| 컬럼 | 타입 | 제약 |
|------|------|------|
| user_id | INTEGER | PK, FK → users.id ON DELETE CASCADE |
| push_like | BOOLEAN / INTEGER | DEFAULT 1 |
| push_comment | BOOLEAN / INTEGER | DEFAULT 1 |
| push_follow | BOOLEAN / INTEGER | DEFAULT 1 |
| push_mention | BOOLEAN / INTEGER | DEFAULT 1 |
| push_direct | BOOLEAN / INTEGER | DEFAULT 1 |
| email_digest | BOOLEAN / INTEGER | DEFAULT 0 |
| updated_at | DATETIME (TZ) | NOT NULL |

### 3.18 `sessions` (로그인 세션)

| 컬럼 | 타입 | 제약 |
|------|------|------|
| id | INTEGER | PK |
| user_id | INTEGER | FK → users.id ON DELETE CASCADE |
| jti | TEXT | UNIQUE NULL (JWT ID) |
| user_agent | TEXT | |
| ip_hash | TEXT | |
| is_current | BOOLEAN / INTEGER | DEFAULT 0 |
| created_at | DATETIME (TZ) | NOT NULL |
| last_seen_at | DATETIME (TZ) | NOT NULL |

**인덱스**: `user_id`.

## 4. 마이그레이션 (Alembic)

- **도구**: Alembic 1.x — `backend/alembic/`, `backend/alembic.ini`, 초기 리비전 `backend/alembic/versions/548db34ab012_initial_schema.py`.
- **환경**: `alembic/env.py`가 `app.config.settings.database_url`과 `app.database.engine`(FK pragma·WAL 동일)을 사용한다.
- **앱 기동**: `uvicorn`은 `create_all`을 호출하지 않는다. 스키마는 **`alembic upgrade head`** 로만 적용한다.

### 4.1 자주 쓰는 명령 (`backend/` 에서)

```bash
alembic upgrade head
alembic downgrade -1
alembic revision --autogenerate -m "설명"
```

### 4.2 npm 설치 시

- `npm install` → `postinstall`의 `scripts/install-backend.mjs`가 `pip install` 후 **`python -m alembic upgrade head`** 를 실행한다.

### 4.3 스키마만 적용 (API 서버 없이)

```bash
cd backend
python scripts/init_sqlite.py
```

### 4.4 SQLite 제약

- Alembic `env.py`에서 `render_as_batch=True`로 ALTER 시 테이블 재생성 패턴을 사용한다.
- **기존 `instagram.db`가 `create_all`로만 만들어진 경우** Alembic `alembic_version` 테이블이 없을 수 있다. 그때는 백업 후 DB 파일을 삭제하고 `alembic upgrade head`로 새로 맞추거나, `alembic stamp head`로 현재 파일을 리비전에 맞출지(데이터 보존 시 주의) 선택한다.

## 5. 시드 데이터(선택)

- 테스트 사용자 2~3명, 포스트·팔로우·댓글 소량으로 E2E에 활용.

---

**관련 문서**: `front.md`, `backend.md`, `guide.md`
