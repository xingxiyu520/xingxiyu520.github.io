from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router
from app.core.config import ensure_runtime_dirs, get_settings
from app.db.session import SessionLocal
from app.services.admin_auth import ensure_initial_admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_runtime_dirs(get_settings())
    with SessionLocal() as db:
        ensure_initial_admin(db)
    yield


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        lifespan=lifespan,
        docs_url=f"{settings.api_prefix}/docs",
        openapi_url=f"{settings.api_prefix}/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router, prefix=settings.api_prefix)
    app.mount(
        settings.public_upload_base_url,
        StaticFiles(directory=settings.upload_path),
        name="uploads",
    )
    return app


app = create_app()
