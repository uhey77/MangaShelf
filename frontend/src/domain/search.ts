import { MangaSeries } from './entities/MangaSeries';

export interface SearchQuery {
  q?: string | null;
  title?: string | null;
  author?: string | null;
  publisher?: string | null;
  from?: string | null;
  until?: string | null;
  page: number;
  limit: number;
}

export interface SearchResult {
  items: MangaSeries[];
  total: number;
  page: number;
  limit: number;
}
