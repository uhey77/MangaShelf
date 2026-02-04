from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class LibraryItem:
    id: str
    title: str
    author: str
    publisher: Optional[str] = None
    published_date: Optional[str] = None
    latest_volume: int = 1
    owned_volumes: List[int] = field(default_factory=list)
    next_release_date: Optional[str] = None
    is_favorite: bool = False
    notes: str = ""
    cover_url: str = ""
    genre: List[str] = field(default_factory=list)
    isbn: Optional[str] = None
    source: Optional[str] = None
    source_url: Optional[str] = None
