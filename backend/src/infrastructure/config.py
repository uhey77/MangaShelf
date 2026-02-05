from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
import os
from pathlib import Path
from typing import Optional, Tuple

from dotenv import load_dotenv


@dataclass(frozen=True)
class AppSettings:
    data_file: Path
    ndl_endpoint: str
    ndl_thumbnail_base: str
    cors_origins: Tuple[str, ...]
    search_timeout_seconds: int
    rakuten_application_id: Optional[str]
    rakuten_books_endpoint: str
    google_books_api_key: Optional[str]
    google_books_endpoint: str


@lru_cache
def get_settings() -> AppSettings:
    root = Path(__file__).resolve().parents[2]
    load_dotenv(root / ".env")
    return AppSettings(
        data_file=root / "data" / "library.json",
        ndl_endpoint="https://ndlsearch.ndl.go.jp/api/opensearch",
        ndl_thumbnail_base="https://ndlsearch.ndl.go.jp/thumbnail/",
        cors_origins=("http://localhost:5173", "http://127.0.0.1:5173"),
        search_timeout_seconds=10,
        rakuten_application_id=os.getenv("RAKUTEN_APPLICATION_ID"),
        rakuten_books_endpoint=os.getenv(
            "RAKUTEN_BOOKS_ENDPOINT",
            "https://app.rakuten.co.jp/services/api/BooksBook/Search/20170404",
        ),
        google_books_api_key=os.getenv("GOOGLE_BOOKS_API_KEY"),
        google_books_endpoint=os.getenv(
            "GOOGLE_BOOKS_ENDPOINT",
            "https://www.googleapis.com/books/v1/volumes",
        ),
    )
