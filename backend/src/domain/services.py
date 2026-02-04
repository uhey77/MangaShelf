from __future__ import annotations

from abc import ABC, abstractmethod

from .search import SearchQuery, SearchResult


class BookSearchService(ABC):
    @abstractmethod
    def search(self, query: SearchQuery) -> SearchResult:
        raise NotImplementedError
