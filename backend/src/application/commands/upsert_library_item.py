from __future__ import annotations

from dataclasses import dataclass

from domain.models import LibraryItem
from domain.repositories import LibraryRepository


@dataclass(frozen=True)
class UpsertLibraryItemCommand:
    item: LibraryItem


class UpsertLibraryItemHandler:
    def __init__(self, repository: LibraryRepository) -> None:
        self._repository = repository

    def handle(self, command: UpsertLibraryItemCommand) -> LibraryItem:
        return self._repository.upsert(command.item)
