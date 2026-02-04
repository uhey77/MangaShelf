from __future__ import annotations

from domain.search import SearchQuery, SearchResult
from domain.services import BookSearchService


class SearchBooksHandler:
    def __init__(self, service: BookSearchService) -> None:
        self._service = service

    def handle(self, query: SearchQuery) -> SearchResult:
        has_condition = any(
            [
                query.q,
                query.title,
                query.author,
                query.publisher,
                query.from_date,
                query.until,
            ]
        )
        if not has_condition:
            return SearchResult(items=[], total=0, page=query.page, limit=query.limit)
        return self._service.search(query)
