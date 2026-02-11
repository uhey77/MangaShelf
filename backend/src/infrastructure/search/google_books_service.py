from __future__ import annotations

import hashlib
from typing import Any, List, Optional

import requests

from domain.errors import SearchServiceError
from domain.models import LibraryItem
from domain.search import SearchQuery, SearchResult
from domain.series_identity import extract_volume_number
from domain.services import BookSearchService

MAX_RESULTS = 40


class GoogleBooksService(BookSearchService):
    def __init__(
        self, endpoint: str, api_key: Optional[str], timeout_seconds: int = 10
    ) -> None:
        self._endpoint = endpoint
        self._api_key = api_key
        self._timeout_seconds = timeout_seconds

    def search(self, query: SearchQuery) -> SearchResult:
        page = max(query.page, 1)
        limit = clamp(query.limit, 1, MAX_RESULTS)
        start_index = (page - 1) * limit

        q = build_query(query)
        if not q:
            return SearchResult(items=[], total=0, page=page, limit=limit)

        params: dict[str, Any] = {
            "q": q,
            "printType": "books",
            "startIndex": start_index,
            "maxResults": limit,
        }
        if self._api_key:
            params["key"] = self._api_key

        try:
            response = requests.get(
                self._endpoint, params=params, timeout=self._timeout_seconds
            )
        except requests.RequestException as exc:
            raise SearchServiceError(
                "Google Books APIに接続できませんでした。"
            ) from exc

        if response.status_code != 200:
            raise SearchServiceError("Google Books APIからの応答が不正です。")

        try:
            data = response.json()
        except ValueError as exc:
            raise SearchServiceError("Google Books APIの応答が不正です。") from exc

        total = parse_total(data)
        items = build_items(data.get("items") or [])
        return SearchResult(items=items, total=total, page=page, limit=limit)


def clamp(value: int, minimum: int, maximum: int) -> int:
    return max(minimum, min(value, maximum))


def build_query(query: SearchQuery) -> str:
    parts: List[str] = []
    if query.q:
        parts.append(query.q)
    if query.title:
        parts.append(f'intitle:"{query.title}"')
    if query.author:
        parts.append(f'inauthor:"{query.author}"')
    if query.publisher:
        parts.append(f'inpublisher:"{query.publisher}"')
    return " ".join(part for part in parts if part).strip()


def parse_total(data: dict[str, Any]) -> int:
    value = data.get("totalItems")
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)
    if isinstance(value, str):
        raw = value.strip()
        if not raw:
            return 0
        try:
            return int(raw)
        except ValueError:
            return 0
    if isinstance(value, (bytes, bytearray)):
        try:
            return int(value)
        except ValueError:
            return 0
    return 0


def build_items(raw_items: List[dict[str, Any]]) -> List[LibraryItem]:
    items: List[LibraryItem] = []
    for raw in raw_items:
        if not isinstance(raw, dict):
            continue
        volume = raw.get("volumeInfo") or {}
        title = str(volume.get("title") or "").strip()
        if not title:
            continue
        authors = volume.get("authors") or []
        author = " / ".join([str(a).strip() for a in authors if str(a).strip()])
        publisher = str(volume.get("publisher") or "").strip() or None
        published_date = str(volume.get("publishedDate") or "").strip() or None
        isbn = extract_isbn(volume.get("industryIdentifiers") or [])
        cover_url = extract_cover_url(volume.get("imageLinks") or {})
        categories = volume.get("categories") or []
        genre = [str(c).strip() for c in categories if str(c).strip()]
        info_link = str(volume.get("infoLink") or "").strip() or None
        item_id = build_google_id(raw, title, author)
        latest_volume = extract_volume_number(title) or 1

        items.append(
            LibraryItem(
                id=item_id,
                title=title,
                author=author,
                publisher=publisher,
                published_date=published_date,
                latest_volume=latest_volume,
                owned_volumes=[],
                next_release_date=None,
                is_favorite=False,
                notes="",
                cover_url=cover_url,
                genre=genre,
                isbn=isbn,
                source="google",
                source_url=info_link,
            )
        )
    return items


def extract_isbn(identifiers: List[dict[str, Any]]) -> Optional[str]:
    isbn10 = None
    isbn13 = None
    for raw in identifiers:
        if not isinstance(raw, dict):
            continue
        kind = str(raw.get("type") or "").upper()
        value = str(raw.get("identifier") or "").strip()
        if not value:
            continue
        if kind == "ISBN_13":
            isbn13 = value
        elif kind == "ISBN_10":
            isbn10 = value
    return isbn13 or isbn10


def extract_cover_url(image_links: dict[str, Any]) -> str:
    for key in (
        "extraLarge",
        "large",
        "medium",
        "small",
        "thumbnail",
        "smallThumbnail",
    ):
        value = str(image_links.get(key) or "").strip()
        if value:
            return value
    return ""


def build_google_id(raw: dict[str, Any], title: str, author: str) -> str:
    raw_id = str(raw.get("id") or "").strip()
    if raw_id:
        return f"google:{raw_id}"
    seed = f"{title}|{author}"
    digest = hashlib.sha1(seed.encode("utf-8")).hexdigest()
    return f"google:{digest}"
