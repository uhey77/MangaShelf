from __future__ import annotations

from functools import lru_cache

from application.commands.delete_library_item import DeleteLibraryItemHandler
from application.commands.upsert_library_item import UpsertLibraryItemHandler
from application.queries.get_library import GetLibraryHandler
from application.queries.search_books import SearchBooksHandler
from domain.repositories import LibraryRepository
from domain.services import BookSearchService
from infrastructure.config import get_settings
from infrastructure.persistence.json_library_repository import JsonLibraryRepository
from infrastructure.search.ndl_opensearch_service import NDLOpenSearchService


@lru_cache
def get_library_repository() -> LibraryRepository:
    settings = get_settings()
    return JsonLibraryRepository(settings.data_file)


@lru_cache
def get_search_service() -> BookSearchService:
    settings = get_settings()
    return NDLOpenSearchService(
        endpoint=settings.ndl_endpoint,
        thumbnail_base=settings.ndl_thumbnail_base,
        timeout_seconds=settings.search_timeout_seconds,
    )


@lru_cache
def get_get_library_handler() -> GetLibraryHandler:
    return GetLibraryHandler(get_library_repository())


@lru_cache
def get_upsert_library_handler() -> UpsertLibraryItemHandler:
    return UpsertLibraryItemHandler(get_library_repository())


@lru_cache
def get_delete_library_handler() -> DeleteLibraryItemHandler:
    return DeleteLibraryItemHandler(get_library_repository())


@lru_cache
def get_search_books_handler() -> SearchBooksHandler:
    return SearchBooksHandler(get_search_service())
