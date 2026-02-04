from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field

from domain.models import LibraryItem
from domain.search import SearchResult


class LibraryItemSchema(BaseModel):
    id: str
    title: str
    author: str
    publisher: Optional[str] = None
    publishedDate: Optional[str] = None
    latestVolume: int = 1
    ownedVolumes: List[int] = Field(default_factory=list)
    nextReleaseDate: Optional[str] = None
    isFavorite: bool = False
    notes: str = ""
    coverUrl: str = ""
    genre: List[str] = Field(default_factory=list)
    isbn: Optional[str] = None
    source: Optional[str] = None
    sourceUrl: Optional[str] = None

    def to_domain(self) -> LibraryItem:
        return LibraryItem(
            id=self.id,
            title=self.title,
            author=self.author,
            publisher=self.publisher,
            published_date=self.publishedDate,
            latest_volume=self.latestVolume,
            owned_volumes=self.ownedVolumes,
            next_release_date=self.nextReleaseDate,
            is_favorite=self.isFavorite,
            notes=self.notes,
            cover_url=self.coverUrl,
            genre=self.genre,
            isbn=self.isbn,
            source=self.source,
            source_url=self.sourceUrl,
        )

    @classmethod
    def from_domain(cls, item: LibraryItem) -> "LibraryItemSchema":
        return cls(
            id=item.id,
            title=item.title,
            author=item.author,
            publisher=item.publisher,
            publishedDate=item.published_date,
            latestVolume=item.latest_volume,
            ownedVolumes=item.owned_volumes,
            nextReleaseDate=item.next_release_date,
            isFavorite=item.is_favorite,
            notes=item.notes,
            coverUrl=item.cover_url,
            genre=item.genre,
            isbn=item.isbn,
            source=item.source,
            sourceUrl=item.source_url,
        )


class SearchResponseSchema(BaseModel):
    items: List[LibraryItemSchema]
    total: int
    page: int
    limit: int

    @classmethod
    def from_domain(cls, result: SearchResult) -> "SearchResponseSchema":
        return cls(
            items=[LibraryItemSchema.from_domain(item) for item in result.items],
            total=result.total,
            page=result.page,
            limit=result.limit,
        )
