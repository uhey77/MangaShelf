import { SearchQuery, SearchResult } from '@domain/search';

export interface SearchRepository {
  search(query: SearchQuery): Promise<SearchResult>;
}
