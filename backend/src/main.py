from __future__ import annotations

import hashlib
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import List, Optional

import requests
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

NDL_ENDPOINT = "https://ndlsearch.ndl.go.jp/api/opensearch"
NDL_THUMBNAIL_BASE = "https://ndlsearch.ndl.go.jp/thumbnail/"
DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "library.json"

NS = {
    "dc": "http://purl.org/dc/elements/1.1/",
    "dcterms": "http://purl.org/dc/terms/",
    "dcndl": "http://ndl.go.jp/dcndl/terms/",
    "openSearch": "http://a9.com/-/spec/opensearchrss/1.0/",
}
XSI_NS = "http://www.w3.org/2001/XMLSchema-instance"


class LibraryItem(BaseModel):
    id: str
    title: str
    author: str
    publisher: Optional[str] = None
    publishedDate: Optional[str] = None
    latestVolume: int = 1
    ownedVolumes: List[int] = Field(default_factory=list)
    nextReleaseDate: Optional[str] = None
    isFavorite: bool = False
    notes: str = ""
    coverUrl: str = ""
    genre: List[str] = Field(default_factory=list)
    isbn: Optional[str] = None
    source: Optional[str] = None
    sourceUrl: Optional[str] = None


class SearchResponse(BaseModel):
    items: List[LibraryItem]
    total: int
    page: int
    limit: int


app = FastAPI(title="MangaShelf API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def load_library() -> List[dict]:
    if not DATA_FILE.exists():
        return []
    try:
        with DATA_FILE.open("r", encoding="utf-8") as file:
            data = json.load(file)
    except json.JSONDecodeError:
        return []
    if isinstance(data, list):
        return data
    return []


def save_library(items: List[dict]) -> None:
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    temp_path = DATA_FILE.with_suffix(".tmp")
    with temp_path.open("w", encoding="utf-8") as file:
        json.dump(items, file, ensure_ascii=False, indent=2)
    temp_path.replace(DATA_FILE)


def upsert_item(items: List[dict], payload: dict) -> dict:
    for index, existing in enumerate(items):
        if existing.get("id") == payload.get("id"):
            merged = {**existing, **payload}
            items[index] = merged
            return merged
    items.append(payload)
    return payload


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


def build_cover_url(isbn: Optional[str]) -> str:
    if not isbn:
        return ""
    return f"{NDL_THUMBNAIL_BASE}{isbn}.jpg"


def build_ndl_id(seed: str) -> str:
    digest = hashlib.sha1(seed.encode("utf-8")).hexdigest()
    return f"ndl:{digest}"


def find_text(element: ET.Element, tag: str) -> str:
    node = element.find(tag, NS)
    if node is None or node.text is None:
        return ""
    return node.text.strip()


def parse_opensearch(xml_bytes: bytes) -> tuple[List[dict], int]:
    root = ET.fromstring(xml_bytes)
    channel = root.find("channel")
    if channel is None:
        return [], 0

    total_text = channel.findtext("openSearch:totalResults", default="0", namespaces=NS)
    try:
        total = int(total_text)
    except ValueError:
        total = 0

    items: List[dict] = []
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
            {
                "id": item_id,
                "title": title,
                "author": author or "",
                "publisher": publisher or None,
                "publishedDate": issued or None,
                "latestVolume": 1,
                "ownedVolumes": [],
                "nextReleaseDate": None,
                "isFavorite": False,
                "notes": "",
                "coverUrl": build_cover_url(isbn),
                "genre": subjects,
                "isbn": isbn,
                "source": "ndl",
                "sourceUrl": link or None,
            }
        )

    return items, total


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/library", response_model=List[LibraryItem])
def get_library() -> List[LibraryItem]:
    return [LibraryItem(**item) for item in load_library()]


@app.post("/api/library", response_model=LibraryItem)
def upsert_library(item: LibraryItem) -> LibraryItem:
    library = load_library()
    updated = upsert_item(library, item.model_dump())
    save_library(library)
    return LibraryItem(**updated)


@app.delete("/api/library/{item_id}", status_code=204)
def delete_library(item_id: str) -> None:
    library = load_library()
    next_items = [item for item in library if item.get("id") != item_id]
    save_library(next_items)


@app.get("/api/search", response_model=SearchResponse)
def search(
    q: Optional[str] = None,
    title: Optional[str] = None,
    author: Optional[str] = None,
    publisher: Optional[str] = None,
    from_: Optional[str] = Query(None, alias="from"),
    until: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
) -> SearchResponse:
    if not any([q, title, author, publisher, from_, until]):
        return SearchResponse(items=[], total=0, page=page, limit=limit)

    page = max(page, 1)
    limit = max(1, min(limit, 50))
    start_index = (page - 1) * limit + 1

    params = {
        "cnt": str(limit),
        "idx": str(start_index),
        "dpgroupid": "book",
        "mediatype": "books",
    }
    if q:
        params["any"] = q
    if title:
        params["title"] = title
    if author:
        params["creator"] = author
    if publisher:
        params["publisher"] = publisher
    if from_:
        params["from"] = from_
    if until:
        params["until"] = until

    try:
        response = requests.get(NDL_ENDPOINT, params=params, timeout=10)
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail="検索APIに接続できませんでした。") from exc

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="検索APIからの応答が不正です。")

    items, total = parse_opensearch(response.content)
    return SearchResponse(items=[LibraryItem(**item) for item in items], total=total, page=page, limit=limit)
