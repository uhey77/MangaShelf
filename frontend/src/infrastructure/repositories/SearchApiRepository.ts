import { SearchQuery, SearchResult } from '@domain/search';
import { SearchRepository } from '@domain/repositories/SearchRepository';
import { fetchJson } from '@infrastructure/http/fetchJson';
import { SearchResponseDto, toSearchResult } from '@infrastructure/mappers/libraryMapper';

export class SearchApiRepository implements SearchRepository {
  async search(query: SearchQuery): Promise<SearchResult> {
    const params = new URLSearchParams();
    if (query.q?.trim()) params.set('q', query.q.trim());
    if (query.title?.trim()) params.set('title', query.title.trim());
    if (query.author?.trim()) params.set('author', query.author.trim());
    if (query.publisher?.trim()) params.set('publisher', query.publisher.trim());
    if (query.from?.trim()) params.set('from', query.from.trim());
    if (query.until?.trim()) params.set('until', query.until.trim());
    params.set('page', String(query.page));
    params.set('limit', String(query.limit));

    const data = await fetchJson<SearchResponseDto>(`/api/search?${params.toString()}`);
    return toSearchResult(data);
  }
}
