from __future__ import annotations

import hashlib
import re
import xml.etree.ElementTree as ET
from typing import List, Optional

import requests

from domain.errors import SearchServiceError
from domain.models import LibraryItem
from domain.search import SearchQuery, SearchResult
from domain.services import BookSearchService

NS = {
    "dc": "http://purl.org/dc/elements/1.1/",
    "dcterms": "http://purl.org/dc/terms/",
    "dcndl": "http://ndl.go.jp/dcndl/terms/",
    "openSearch": "http://a9.com/-/spec/opensearchrss/1.0/",
}
XSI_NS = "http://www.w3.org/2001/XMLSchema-instance"


class NDLOpenSearchService(BookSearchService):
    def __init__(self, endpoint: str, thumbnail_base: str, timeout_seconds: int = 10) -> None:
        self._endpoint = endpoint
        self._thumbnail_base = thumbnail_base
        self._timeout_seconds = timeout_seconds

    def search(self, query: SearchQuery) -> SearchResult:
        page = max(query.page, 1)
        limit = max(1, min(query.limit, 50))
        start_index = (page - 1) * limit + 1

        params = {
            "cnt": str(limit),
            "idx": str(start_index),
            "dpgroupid": "book",
            "mediatype": "books",
        }
        if query.q:
            params["any"] = query.q
        if query.title:
            params["title"] = query.title
        if query.author:
            params["creator"] = query.author
        if query.publisher:
            params["publisher"] = query.publisher
        if query.from_date:
            params["from"] = query.from_date.isoformat()
        if query.until:
            params["until"] = query.until.isoformat()

        try:
            response = requests.get(self._endpoint, params=params, timeout=self._timeout_seconds)
        except requests.RequestException as exc:
            raise SearchServiceError("検索APIに接続できませんでした。") from exc

        if response.status_code != 200:
            raise SearchServiceError("検索APIからの応答が不正です。")

        items, total = parse_opensearch(response.content, self._thumbnail_base)
        return SearchResult(items=items, total=total, page=page, limit=limit)


def parse_opensearch(xml_bytes: bytes, thumbnail_base: str) -> tuple[List[LibraryItem], int]:
    root = ET.fromstring(xml_bytes)
    channel = root.find("channel")
    if channel is None:
        return [], 0

    total_text = channel.findtext("openSearch:totalResults", default="0", namespaces=NS)
    try:
        total = int(total_text)
    except ValueError:
        total = 0

    items: List[LibraryItem] = []
    for item in channel.findall("item"):
        title = find_text(item, "dc:title") or find_text(item, "title")
        if not title:
            continue
        author = find_text(item, "dc:creator")
        publisher = find_text(item, "dc:publisher")
        issued = find_text(item, "dcterms:issued")
        link = find_text(item, "link")
        subjects = [
            node.text.strip()
            for node in item.findall("dc:subject", NS)
            if node.text and node.text.strip()
        ]
        isbn = extract_isbn(item)
        seed = link or isbn or f"{title}|{author}|{publisher}|{issued}"
        item_id = build_ndl_id(seed)

        items.append(
            LibraryItem(
                id=item_id,
                title=title,
                author=author or "",
                publisher=publisher or None,
                published_date=issued or None,
                latest_volume=1,
                owned_volumes=[],
                next_release_date=None,
                is_favorite=False,
                notes="",
                cover_url=build_cover_url(thumbnail_base, isbn),
                genre=subjects,
                isbn=isbn,
                source="ndl",
                source_url=link or None,
            )
        )

    return items, total


def clean_isbn(value: str) -> str:
    return re.sub(r"[^0-9Xx]", "", value)


def extract_isbn(item: ET.Element) -> Optional[str]:
    identifiers = item.findall("dc:identifier", NS)
    for node in identifiers:
        raw = (node.text or "").strip()
        if not raw:
            continue
        node_type = node.attrib.get(f"{{{XSI_NS}}}type", "")
        if "ISBN" in node_type:
            isbn = clean_isbn(raw)
            if isbn:
                return isbn
    for node in identifiers:
        raw = (node.text or "").strip()
        if not raw:
            continue
        if raw.upper().startswith("ISBN"):
            isbn = clean_isbn(raw.replace("ISBN", ""))
            if isbn:
                return isbn
        isbn = clean_isbn(raw)
        if len(isbn) in {10, 13}:
            return isbn
    return None


def build_cover_url(thumbnail_base: str, isbn: Optional[str]) -> str:
    if not isbn:
        return ""
    return f"{thumbnail_base}{isbn}.jpg"


def build_ndl_id(seed: str) -> str:
    digest = hashlib.sha1(seed.encode("utf-8")).hexdigest()
    return f"ndl:{digest}"


def find_text(element: ET.Element, tag: str) -> str:
    node = element.find(tag, NS)
    if node is None or node.text is None:
        return ""
    return node.text.strip()
