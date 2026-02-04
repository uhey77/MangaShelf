from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import List, Optional

from .models import LibraryItem


@dataclass(frozen=True)
class SearchQuery:
    q: Optional[str] = None
    title: Optional[str] = None
    author: Optional[str] = None
    publisher: Optional[str] = None
    from_date: Optional[date] = None
    until: Optional[date] = None
    page: int = 1
    limit: int = 20


@dataclass(frozen=True)
class SearchResult:
    items: List[LibraryItem]
    total: int
    page: int
    limit: int
