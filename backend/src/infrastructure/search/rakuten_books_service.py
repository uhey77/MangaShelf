from __future__ import annotations

import hashlib
from typing import Any, List, Optional

import requests

from domain.errors import SearchServiceError
from domain.models import LibraryItem
from domain.search import SearchQuery, SearchResult
from domain.series_identity import extract_volume_number
from domain.services import BookSearchService

MAX_HITS = 30
MAX_PAGE = 100


class RakutenBooksService(BookSearchService):
    def __init__(
        self,
        endpoint: str,
        application_id: str,
        timeout_seconds: int = 10,
        default_size: int = 9,
    ) -> None:
        self._endpoint = endpoint
        self._application_id = application_id
        self._timeout_seconds = timeout_seconds
        self._default_size = default_size

    def search(self, query: SearchQuery) -> SearchResult:
        if not self._application_id:
            raise SearchServiceError("楽天ブックスAPIの設定が不足しています。")

        page = clamp(query.page, 1, MAX_PAGE)
        limit = clamp(query.limit, 1, MAX_HITS)

        params: dict[str, Any] = {
            "applicationId": self._application_id,
            "formatVersion": 2,
            "size": self._default_size,
            "hits": limit,
            "page": page,
        }

        title = query.title or query.q
        if title:
            params["title"] = title
        if query.author:
            params["author"] = query.author
        if query.publisher:
            params["publisherName"] = query.publisher

        try:
            response = requests.get(
                self._endpoint, params=params, timeout=self._timeout_seconds
            )
        except requests.RequestException as exc:
            raise SearchServiceError("楽天ブックスAPIに接続できませんでした。") from exc

        if response.status_code != 200:
            raise SearchServiceError("楽天ブックスAPIからの応答が不正です。")

        try:
            data = response.json()
        except ValueError as exc:
            raise SearchServiceError("楽天ブックスAPIの応答が不正です。") from exc

        raw_items = extract_items(data)
        total = extract_total(data, len(raw_items))
        items = build_items(raw_items)
        return SearchResult(items=items, total=total, page=page, limit=limit)


def clamp(value: int, minimum: int, maximum: int) -> int:
    return max(minimum, min(value, maximum))


def extract_items(data: dict[str, Any]) -> List[dict[str, Any]]:
    raw_items = data.get("items") or data.get("Items") or []
    items: List[dict[str, Any]] = []
    for entry in raw_items:
        if not isinstance(entry, dict):
            continue
        if "Item" in entry and isinstance(entry["Item"], dict):
            items.append(entry["Item"])
            continue
        items.append(entry)
    return items


def extract_total(data: dict[str, Any], fallback: int) -> int:
    for key in ("count", "totalCount", "total", "hits"):
        value = data.get(key)
        if value is None:
            continue
        try:
            return int(value)
        except (TypeError, ValueError):
            continue
    return fallback


def build_items(raw_items: List[dict[str, Any]]) -> List[LibraryItem]:
    items: List[LibraryItem] = []
    for raw in raw_items:
        title = str(raw.get("title") or "").strip()
        if not title:
            continue
        author = str(raw.get("author") or "").strip()
        publisher = str(raw.get("publisherName") or "").strip() or None
        sales_date = str(raw.get("salesDate") or "").strip() or None
        isbn = str(raw.get("isbn") or "").strip() or None
        item_url = str(raw.get("itemUrl") or "").strip() or None
        cover_url = (
            str(raw.get("largeImageUrl") or "").strip()
            or str(raw.get("mediumImageUrl") or "").strip()
            or str(raw.get("smallImageUrl") or "").strip()
        )
        latest_volume = extract_volume_number(title) or 1

        items.append(
            LibraryItem(
                id=build_rakuten_id(isbn, item_url, title, author),
                title=title,
                author=author,
                publisher=publisher,
                published_date=sales_date,
                latest_volume=latest_volume,
                owned_volumes=[],
                next_release_date=None,
                is_favorite=False,
                notes="",
                cover_url=cover_url,
                genre=[],
                isbn=isbn,
                source="rakuten",
                source_url=item_url,
            )
        )
    return items


def build_rakuten_id(
    isbn: Optional[str], item_url: Optional[str], title: str, author: str
) -> str:
    if isbn:
        return f"rakuten:{isbn}"
    seed = item_url or f"{title}|{author}"
    digest = hashlib.sha1(seed.encode("utf-8")).hexdigest()
    return f"rakuten:{digest}"
