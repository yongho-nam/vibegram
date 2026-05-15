from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.routers.api import api_router
from app.services.media_files import ensure_upload_dirs


@asynccontextmanager
async def lifespan(_app: FastAPI):
    from app.database import SessionLocal
    from app.services.admin_bootstrap import ensure_demo_admin

    db = SessionLocal()
    try:
        ensure_demo_admin(db)
    finally:
        db.close()
    yield


ensure_upload_dirs()
Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Instagram Clone API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
app.mount("/media", StaticFiles(directory=settings.upload_dir), name="media")


@app.get("/health")
def root_health() -> dict[str, str]:
    return {"status": "ok"}
