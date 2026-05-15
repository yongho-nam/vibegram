from fastapi import APIRouter

from app.routers import admin, auth, health, messages, notifications, posts, search, stories, users

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router)
api_router.include_router(admin.router)
api_router.include_router(users.router)
api_router.include_router(posts.router)
api_router.include_router(stories.router)
api_router.include_router(messages.router)
api_router.include_router(notifications.router)
api_router.include_router(search.router)
