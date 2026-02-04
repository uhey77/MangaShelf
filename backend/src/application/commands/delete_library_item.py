from __future__ import annotations

from dataclasses import dataclass

from domain.repositories import LibraryRepository


@dataclass(frozen=True)
class DeleteLibraryItemCommand:
    item_id: str


class DeleteLibraryItemHandler:
    def __init__(self, repository: LibraryRepository) -> None:
        self._repository = repository

    def handle(self, command: DeleteLibraryItemCommand) -> None:
        self._repository.delete(command.item_id)
