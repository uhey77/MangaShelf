from __future__ import annotations

import re
import unicodedata
from typing import Iterable, List, Sequence

from domain.errors import SearchServiceError
from domain.models import LibraryItem
from domain.search import SearchQuery, SearchResult
from domain.services import BookSearchService


class CompositeBookSearchService(BookSearchService):
    def __init__(self, services: Sequence[BookSearchService]) -> None:
        self._services = list(services)

    def search(self, query: SearchQuery) -> SearchResult:
        page = max(query.page, 1)
        limit = max(query.limit, 1)
        fetch_limit = limit * page

        results: List[LibraryItem] = []
        total = 0
        succeeded = 0

        for service in self._services:
            try:
                result = service.search(
                    SearchQuery(
                        q=query.q,
                        title=query.title,
                        author=query.author,
                        publisher=query.publisher,
                        from_date=query.from_date,
                        until=query.until,
                        page=1,
                        limit=fetch_limit,
                    )
                )
            except SearchServiceError:
                continue

            succeeded += 1
            total += result.total
            results.extend(result.items)

        if succeeded == 0:
            raise SearchServiceError("検索APIに接続できませんでした。")

        deduped = deduplicate(results)
        start = (page - 1) * limit
        sliced = deduped[start : start + limit]
        return SearchResult(items=sliced, total=total, page=page, limit=limit)


def deduplicate(items: Iterable[LibraryItem]) -> List[LibraryItem]:
    seen: set[str] = set()
    unique: List[LibraryItem] = []
    for item in items:
        key = build_dedupe_key(item)
        if key in seen:
            continue
        seen.add(key)
        unique.append(item)
    return unique


def build_dedupe_key(item: LibraryItem) -> str:
    if item.isbn:
        isbn = normalize_isbn(item.isbn)
        if isbn:
            return f"isbn:{isbn}"
    title = normalize_text(item.title)
    author = normalize_text(item.author)
    return f"title:{title}|author:{author}"


def normalize_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKC", value or "")
    normalized = re.sub(r"\s+", " ", normalized).strip().lower()
    return normalized


def normalize_isbn(value: str) -> str:
    return re.sub(r"[^0-9xX]", "", value or "").upper()
