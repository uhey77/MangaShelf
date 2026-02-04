from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from infrastructure.config import get_settings
from presentation.routers.health import router as health_router
from presentation.routers.library import router as library_router
from presentation.routers.search import router as search_router


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(title="MangaShelf API")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router)
    app.include_router(library_router)
    app.include_router(search_router)

    return app
