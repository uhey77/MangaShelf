from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Tuple


@dataclass(frozen=True)
class AppSettings:
    data_file: Path
    ndl_endpoint: str
    ndl_thumbnail_base: str
    cors_origins: Tuple[str, ...]
    search_timeout_seconds: int


@lru_cache
def get_settings() -> AppSettings:
    root = Path(__file__).resolve().parents[2]
    return AppSettings(
        data_file=root / "data" / "library.json",
        ndl_endpoint="https://ndlsearch.ndl.go.jp/api/opensearch",
        ndl_thumbnail_base="https://ndlsearch.ndl.go.jp/thumbnail/",
        cors_origins=("http://localhost:5173", "http://127.0.0.1:5173"),
        search_timeout_seconds=10,
    )
