from __future__ import annotations

from typing import Any, cast

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from infrastructure.config import get_settings
from presentation.routers.health import router as health_router
from presentation.routers.library import router as library_router
from presentation.routers.search import router as search_router


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(title="MangaShelf API")
    # ty currently flags CORSMiddleware's type; cast keeps runtime behavior intact.
    app.add_middleware(
        cast(Any, CORSMiddleware),
        allow_origins=list(settings.cors_origins),
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router)
    app.include_router(library_router)
    app.include_router(search_router)

    return app
