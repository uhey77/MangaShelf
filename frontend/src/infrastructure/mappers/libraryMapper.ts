import { MangaSeries } from '@domain/entities/MangaSeries';
import { SearchResult } from '@domain/search';

export type LibraryItemDto = {
  id: string;
  title: string;
  author: string;
  publisher?: string | null;
  publishedDate?: string | null;
  latestVolume: number;
  ownedVolumes: number[];
  nextReleaseDate?: string | null;
  isFavorite: boolean;
  notes: string;
  coverUrl: string;
  genre: string[];
  isbn?: string | null;
  source?: string | null;
  sourceUrl?: string | null;
};

export type SearchResponseDto = {
  items: LibraryItemDto[];
  total: number;
  page: number;
  limit: number;
};

export const toDomain = (dto: LibraryItemDto): MangaSeries => ({
  id: dto.id,
  title: dto.title,
  author: dto.author,
  publisher: dto.publisher ?? null,
  publishedDate: dto.publishedDate ?? null,
  latestVolume: dto.latestVolume,
  ownedVolumes: dto.ownedVolumes,
  nextReleaseDate: dto.nextReleaseDate ?? null,
  isFavorite: dto.isFavorite,
  notes: dto.notes,
  coverUrl: dto.coverUrl,
  genre: dto.genre,
  isbn: dto.isbn ?? null,
  source: dto.source ?? null,
  sourceUrl: dto.sourceUrl ?? null
});

export const fromDomain = (item: MangaSeries): LibraryItemDto => ({
  id: item.id,
  title: item.title,
  author: item.author,
  publisher: item.publisher ?? null,
  publishedDate: item.publishedDate ?? null,
  latestVolume: item.latestVolume,
  ownedVolumes: item.ownedVolumes,
  nextReleaseDate: item.nextReleaseDate ?? null,
  isFavorite: item.isFavorite,
  notes: item.notes,
  coverUrl: item.coverUrl,
  genre: item.genre,
  isbn: item.isbn ?? null,
  source: item.source ?? null,
  sourceUrl: item.sourceUrl ?? null
});

export const toSearchResult = (dto: SearchResponseDto): SearchResult => ({
  items: dto.items.map((item) => toDomain(item)),
  total: dto.total,
  page: dto.page,
  limit: dto.limit
});
