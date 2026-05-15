"""회원가입·로그인·게시·탐색·좋아요·댓글·알림 등 핵심 API 흐름."""

from __future__ import annotations

import io
import random
import string

import pytest
from fastapi.testclient import TestClient

from app.main import app


def _rand(prefix: str) -> str:
    suf = "".join(random.choices(string.ascii_lowercase, k=6))
    return f"{prefix}_{suf}"


@pytest.fixture()
def client() -> TestClient:
    return TestClient(app)


def test_health_db(client: TestClient) -> None:
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_register_login_me_feed_explore_like_comment_notifications(client: TestClient) -> None:
    ua, ub = _rand("alice"), _rand("bob")
    ea, eb = f"{ua}@example.com", f"{ub}@example.com"
    pw = "secret123"

    r = client.post("/api/v1/auth/register", json={"email": ea, "username": ua, "password": pw})
    assert r.status_code == 200, r.text
    ja = r.json()
    assert "access_token" in ja and ja["user"]["username"] == ua
    ta = ja["access_token"]

    r = client.post("/api/v1/auth/login", json={"login": ea, "password": pw})
    assert r.status_code == 200, r.text
    ta2 = r.json()["access_token"]
    assert ta2

    r = client.post("/api/v1/auth/register", json={"email": eb, "username": ub, "password": pw})
    assert r.status_code == 200, r.text
    tb = r.json()["access_token"]

    ha = {"Authorization": f"Bearer {ta}"}
    hb = {"Authorization": f"Bearer {tb}"}

    r = client.get("/api/v1/users/me", headers=ha)
    assert r.status_code == 200
    assert r.json()["username"] == ua

    files = {"files": ("a.jpg", io.BytesIO(b"\xff\xd8\xff\xd9"), "image/jpeg")}
    data = {"caption": "hello #testtag", "location": "Seoul"}
    r = client.post("/api/v1/posts", files=files, data=data, headers=ha)
    assert r.status_code == 201, r.text
    post = r.json()
    pid = int(post["id"])
    assert post["username"] == ua
    assert post["likes"] == 0

    r = client.get("/api/v1/posts/explore", headers=hb)
    assert r.status_code == 200
    ex = r.json()
    assert any(int(p["id"]) == pid for p in ex["items"])

    r = client.get("/api/v1/posts/feed", headers=hb)
    assert r.status_code == 200
    fd = r.json()
    assert not any(int(p["id"]) == pid for p in fd["items"]), "팔로우 전에는 상대 글이 피드에 없어야 함"

    r = client.post(f"/api/v1/users/{ua}/follow", headers=hb)
    assert r.status_code in (200, 201)

    r = client.get("/api/v1/posts/feed", headers=hb)
    assert r.status_code == 200
    fd2 = r.json()
    assert any(int(p["id"]) == pid for p in fd2["items"]), "팔로우 후 피드에 상대 게시물 포함"

    r = client.get(f"/api/v1/posts/{pid}", headers=hb)
    assert r.status_code == 200
    assert int(r.json()["id"]) == pid

    r = client.post(f"/api/v1/posts/{pid}/like", headers=hb)
    assert r.status_code == 201

    r = client.get(f"/api/v1/posts/{pid}", headers=ha)
    assert r.status_code == 200
    assert r.json()["likes"] >= 1

    r = client.post(f"/api/v1/posts/{pid}/comments", headers=hb, json={"body": "nice shot"})
    assert r.status_code == 201, r.text
    cj = r.json()
    assert cj["body"] == "nice shot"

    r = client.get(f"/api/v1/posts/{pid}/comments", headers=hb)
    assert r.status_code == 200
    assert len(r.json()["items"]) >= 1

    r = client.get("/api/v1/notifications", headers=ha)
    assert r.status_code == 200
    notifs = r.json()
    types = {n["type"] for n in notifs}
    assert "like" in types or "comment" in types or "follow" in types

    r = client.delete(f"/api/v1/posts/{pid}/like", headers=hb)
    assert r.status_code == 204

    r = client.get(f"/api/v1/posts/{pid}", headers=ha)
    assert r.status_code == 200
    assert r.json()["likes"] == 0

    r = client.post(f"/api/v1/posts/{pid}/save", headers=hb)
    assert r.status_code == 201
    r = client.delete(f"/api/v1/posts/{pid}/save", headers=hb)
    assert r.status_code == 204

    r = client.patch("/api/v1/notifications/read-all", headers=ha)
    assert r.status_code == 204


def test_register_duplicate_and_login_invalid(client: TestClient) -> None:
    u = _rand("dup")
    e = f"{u}@example.com"
    body = {"email": e, "username": u, "password": "pw12345"}
    assert client.post("/api/v1/auth/register", json=body).status_code == 200
    r = client.post("/api/v1/auth/register", json=body)
    assert r.status_code == 400

    r = client.post("/api/v1/auth/login", json={"login": e, "password": "wrong"})
    assert r.status_code == 401


def test_search_users_tags(client: TestClient) -> None:
    u = _rand("searchu")
    r = client.post("/api/v1/auth/register", json={"email": f"{u}@x.com", "username": u, "password": "pw12345"})
    assert r.status_code == 200
    t = r.json()["access_token"]
    h = {"Authorization": f"Bearer {t}"}
    files = {"files": ("p.jpg", io.BytesIO(b"\xff\xd8\xff\xd9"), "image/jpeg")}
    client.post("/api/v1/posts", files=files, data={"caption": "#uniquepytesttag"}, headers=h)

    r = client.get("/api/v1/search/users", params={"q": u[:4]})
    assert r.status_code == 200
    assert any(x["username"] == u for x in r.json())

    r = client.get("/api/v1/search/tags", params={"q": "uniquepytest"})
    assert r.status_code == 200
    tags = r.json()
    assert any("uniquepytest" in x["tag"].lower() for x in tags)


def test_forgot_and_reset_password(client: TestClient) -> None:
    from urllib.parse import parse_qs, urlparse

    u = _rand("pwreset")
    e = f"{u}@example.com"
    pw = "oldpw123"
    r = client.post("/api/v1/auth/register", json={"email": e, "username": u, "password": pw})
    assert r.status_code == 200

    r = client.post("/api/v1/auth/forgot-password", json={"login": e})
    assert r.status_code == 200
    j = r.json()
    assert "message" in j
    assert j.get("reset_url")

    token = parse_qs(urlparse(j["reset_url"]).query)["token"][0]
    r2 = client.post("/api/v1/auth/reset-password", json={"token": token, "new_password": "newpw456"})
    assert r2.status_code == 204

    assert client.post("/api/v1/auth/login", json={"login": e, "password": pw}).status_code == 401
    r3 = client.post("/api/v1/auth/login", json={"login": e, "password": "newpw456"})
    assert r3.status_code == 200
