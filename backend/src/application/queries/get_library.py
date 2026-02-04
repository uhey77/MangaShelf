from __future__ import annotations

from dataclasses import dataclass
from typing import List

from domain.models import LibraryItem
from domain.repositories import LibraryRepository


@dataclass(frozen=True)
class GetLibraryQuery:
    pass


class GetLibraryHandler:
    def __init__(self, repository: LibraryRepository) -> None:
        self._repository = repository

    def handle(self, _query: GetLibraryQuery) -> List[LibraryItem]:
        return self._repository.list()
