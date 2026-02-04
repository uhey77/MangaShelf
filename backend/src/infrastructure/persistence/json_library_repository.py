from __future__ import annotations

import json
from pathlib import Path
from typing import List

from domain.models import LibraryItem
from domain.repositories import LibraryRepository


class JsonLibraryRepository(LibraryRepository):
    def __init__(self, data_file: Path) -> None:
        self._data_file = data_file

    def list(self) -> List[LibraryItem]:
        if not self._data_file.exists():
            return []
        try:
            with self._data_file.open("r", encoding="utf-8") as file:
                data = json.load(file)
        except json.JSONDecodeError:
            return []
        if not isinstance(data, list):
            return []
        return [self._from_dict(item) for item in data]

    def upsert(self, item: LibraryItem) -> LibraryItem:
        items = self.list()
        stored = [self._to_dict(existing) for existing in items]
        for index, existing in enumerate(stored):
            if existing.get("id") == item.id:
                stored[index] = {**existing, **self._to_dict(item)}
                break
        else:
            stored.append(self._to_dict(item))
        self._save(stored)
        return item

    def delete(self, item_id: str) -> None:
        items = self.list()
        stored = [self._to_dict(existing) for existing in items]
        next_items = [item for item in stored if item.get("id") != item_id]
        self._save(next_items)

    def _save(self, items: List[dict]) -> None:
        self._data_file.parent.mkdir(parents=True, exist_ok=True)
        temp_path = self._data_file.with_suffix(".tmp")
        with temp_path.open("w", encoding="utf-8") as file:
            json.dump(items, file, ensure_ascii=False, indent=2)
        temp_path.replace(self._data_file)

    @staticmethod
    def _from_dict(data: dict) -> LibraryItem:
        return LibraryItem(
            id=data.get("id", ""),
            title=data.get("title", ""),
            author=data.get("author", ""),
            publisher=data.get("publisher"),
            published_date=data.get("publishedDate"),
            latest_volume=data.get("latestVolume", 1),
            owned_volumes=data.get("ownedVolumes", []),
            next_release_date=data.get("nextReleaseDate"),
            is_favorite=data.get("isFavorite", False),
            notes=data.get("notes", ""),
            cover_url=data.get("coverUrl", ""),
            genre=data.get("genre", []),
            isbn=data.get("isbn"),
            source=data.get("source"),
            source_url=data.get("sourceUrl"),
        )

    @staticmethod
    def _to_dict(item: LibraryItem) -> dict:
        return {
            "id": item.id,
            "title": item.title,
            "author": item.author,
            "publisher": item.publisher,
            "publishedDate": item.published_date,
            "latestVolume": item.latest_volume,
            "ownedVolumes": item.owned_volumes,
            "nextReleaseDate": item.next_release_date,
            "isFavorite": item.is_favorite,
            "notes": item.notes,
            "coverUrl": item.cover_url,
            "genre": item.genre,
            "isbn": item.isbn,
            "source": item.source,
            "sourceUrl": item.source_url,
        }
