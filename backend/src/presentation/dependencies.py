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
from infrastructure.search.composite_search_service import CompositeBookSearchService
from infrastructure.search.google_books_service import GoogleBooksService
from infrastructure.search.ndl_opensearch_service import NDLOpenSearchService
from infrastructure.search.rakuten_books_service import RakutenBooksService


@lru_cache
def get_library_repository() -> LibraryRepository:
    settings = get_settings()
    return JsonLibraryRepository(settings.data_file)


@lru_cache
def get_search_service() -> BookSearchService:
    settings = get_settings()
    services: list[BookSearchService] = []
    if settings.rakuten_application_id:
        services.append(
            RakutenBooksService(
                endpoint=settings.rakuten_books_endpoint,
                application_id=settings.rakuten_application_id,
                timeout_seconds=settings.search_timeout_seconds,
            )
        )
    services.append(
        GoogleBooksService(
            endpoint=settings.google_books_endpoint,
            api_key=settings.google_books_api_key,
            timeout_seconds=settings.search_timeout_seconds,
        )
    )
    services.append(
        NDLOpenSearchService(
            endpoint=settings.ndl_endpoint,
            thumbnail_base=settings.ndl_thumbnail_base,
            timeout_seconds=settings.search_timeout_seconds,
        )
    )
    return CompositeBookSearchService(services)


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
