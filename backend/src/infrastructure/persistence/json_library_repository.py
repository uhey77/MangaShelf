from __future__ import annotations

import json
from pathlib import Path
from typing import List, Optional

from domain.models import LibraryItem
from domain.repositories import LibraryRepository
from domain.series_identity import build_series_key, extract_volume_number


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

        items = [
            normalize_library_item(self._from_dict(item))
            for item in data
            if isinstance(item, dict)
        ]
        merged_items = merge_library_items(items)

        source_dicts = [self._to_dict(item) for item in items]
        merged_dicts = [self._to_dict(item) for item in merged_items]
        if len(items) != len(data) or source_dicts != merged_dicts:
            self._save(merged_dicts)

        return merged_items

    def upsert(self, item: LibraryItem) -> LibraryItem:
        item = normalize_library_item(item)
        items = self.list()

        for index, existing in enumerate(items):
            if existing.id == item.id:
                items[index] = item
                self._save([self._to_dict(stored) for stored in items])
                return item

        incoming_key = build_series_key(item.title, item.author)
        for index, existing in enumerate(items):
            existing_key = build_series_key(existing.title, existing.author)
            if existing_key != incoming_key:
                continue

            merged = merge_library_item(existing, item)
            items[index] = merged
            self._save([self._to_dict(stored) for stored in items])
            return merged

        items.append(item)
        self._save([self._to_dict(stored) for stored in items])
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
        owned_volumes = data.get("ownedVolumes", [])
        if not isinstance(owned_volumes, list):
            owned_volumes = []

        genre = data.get("genre", [])
        if not isinstance(genre, list):
            genre = []

        return LibraryItem(
            id=str(data.get("id", "")),
            title=str(data.get("title", "")),
            author=str(data.get("author", "")),
            publisher=to_optional_string(data.get("publisher")),
            published_date=to_optional_string(data.get("publishedDate")),
            latest_volume=to_non_negative_int(data.get("latestVolume", 1)),
            owned_volumes=[to_non_negative_int(value) for value in owned_volumes],
            next_release_date=to_optional_string(data.get("nextReleaseDate")),
            is_favorite=bool(data.get("isFavorite", False)),
            notes=str(data.get("notes", "")),
            cover_url=str(data.get("coverUrl", "")),
            genre=[str(value) for value in genre],
            isbn=to_optional_string(data.get("isbn")),
            source=to_optional_string(data.get("source")),
            source_url=to_optional_string(data.get("sourceUrl")),
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


def merge_library_items(items: List[LibraryItem]) -> List[LibraryItem]:
    merged: List[LibraryItem] = []
    id_index: dict[str, int] = {}
    series_index: dict[str, int] = {}

    for item in items:
        normalized_item = normalize_library_item(item)
        existing_index = id_index.get(normalized_item.id)
        item_series_key = build_series_key(
            normalized_item.title, normalized_item.author
        )
        if existing_index is None:
            existing_index = series_index.get(item_series_key)

        if existing_index is None:
            merged.append(normalized_item)
            index = len(merged) - 1
            id_index[normalized_item.id] = index
            series_index[item_series_key] = index
            continue

        merged_item = merge_library_item(merged[existing_index], normalized_item)
        merged[existing_index] = merged_item

        merged_series_key = build_series_key(merged_item.title, merged_item.author)
        id_index[merged_item.id] = existing_index
        id_index[normalized_item.id] = existing_index
        series_index[item_series_key] = existing_index
        series_index[merged_series_key] = existing_index

    return merged


def normalize_library_item(item: LibraryItem) -> LibraryItem:
    extracted_volume = extract_volume_number(item.title) or 0
    owned_candidates = [to_non_negative_int(value) for value in item.owned_volumes]
    if extracted_volume > 0:
        owned_candidates.append(extracted_volume)

    max_owned = max(owned_candidates, default=0)
    latest_volume = max(
        1, to_non_negative_int(item.latest_volume), extracted_volume, max_owned
    )

    return LibraryItem(
        id=item.id,
        title=item.title,
        author=item.author,
        publisher=item.publisher,
        published_date=item.published_date,
        latest_volume=latest_volume,
        owned_volumes=normalize_owned_volumes(owned_candidates, latest_volume),
        next_release_date=item.next_release_date,
        is_favorite=item.is_favorite,
        notes=item.notes,
        cover_url=item.cover_url,
        genre=item.genre,
        isbn=item.isbn,
        source=item.source,
        source_url=item.source_url,
    )


def merge_library_item(existing: LibraryItem, incoming: LibraryItem) -> LibraryItem:
    existing_volume = extract_volume_number(existing.title) or 0
    incoming_volume = extract_volume_number(incoming.title) or 0

    latest_volume = max(
        to_non_negative_int(existing.latest_volume),
        to_non_negative_int(incoming.latest_volume),
        existing_volume,
        incoming_volume,
    )

    owned_candidates = [*existing.owned_volumes, *incoming.owned_volumes]
    if existing_volume > 0:
        owned_candidates.append(existing_volume)
    if incoming_volume > 0:
        owned_candidates.append(incoming_volume)

    return normalize_library_item(
        LibraryItem(
            id=existing.id,
            title=pick_existing_required(existing.title, incoming.title),
            author=pick_existing_required(existing.author, incoming.author),
            publisher=pick_existing_optional(existing.publisher, incoming.publisher),
            published_date=pick_existing_optional(
                existing.published_date, incoming.published_date
            ),
            latest_volume=latest_volume,
            owned_volumes=normalize_owned_volumes(owned_candidates, latest_volume),
            next_release_date=pick_existing_optional(
                existing.next_release_date, incoming.next_release_date
            ),
            is_favorite=existing.is_favorite or incoming.is_favorite,
            notes=pick_existing_required(existing.notes, incoming.notes),
            cover_url=pick_existing_required(existing.cover_url, incoming.cover_url),
            genre=merge_genre(existing.genre, incoming.genre),
            isbn=pick_existing_optional(existing.isbn, incoming.isbn),
            source=pick_existing_optional(existing.source, incoming.source),
            source_url=pick_existing_optional(existing.source_url, incoming.source_url),
        )
    )


def merge_genre(primary: List[str], secondary: List[str]) -> List[str]:
    merged = list(primary)
    for value in secondary:
        if value in merged:
            continue
        merged.append(value)
    return merged


def normalize_owned_volumes(volumes: List[int], latest_volume: int) -> List[int]:
    unique: set[int] = set()
    for raw in volumes:
        volume = to_non_negative_int(raw)
        if volume <= 0:
            continue
        if latest_volume > 0 and volume > latest_volume:
            continue
        unique.add(volume)
    return sorted(unique)


def pick_existing_required(primary: str, fallback: str) -> str:
    if has_text(primary):
        return primary
    return fallback


def pick_existing_optional(
    primary: Optional[str], fallback: Optional[str]
) -> Optional[str]:
    if has_text(primary):
        return primary
    if has_text(fallback):
        return fallback
    return None


def has_text(value: Optional[str]) -> bool:
    return isinstance(value, str) and value.strip() != ""


def to_optional_string(value: object) -> Optional[str]:
    if value is None:
        return None
    text = str(value)
    if text.strip() == "":
        return None
    return text


def to_non_negative_int(value: object) -> int:
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, int):
        return max(0, value)
    if isinstance(value, float):
        return max(0, int(value))
    if isinstance(value, (str, bytes, bytearray)):
        try:
            number = int(value)
        except ValueError:
            return 0
        return max(0, number)
    return 0
