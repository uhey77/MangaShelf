from __future__ import annotations

from abc import ABC, abstractmethod
from typing import List

from .models import LibraryItem


class LibraryRepository(ABC):
    @abstractmethod
    def list(self) -> List[LibraryItem]:
        raise NotImplementedError

    @abstractmethod
    def upsert(self, item: LibraryItem) -> LibraryItem:
        raise NotImplementedError

    @abstractmethod
    def delete(self, item_id: str) -> None:
        raise NotImplementedError
