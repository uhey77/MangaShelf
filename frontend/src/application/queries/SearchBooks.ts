import { SearchQuery, SearchResult } from '@domain/search';
import { SearchRepository } from '@domain/repositories/SearchRepository';

export class SearchBooks {
  constructor(private repository: SearchRepository) {}

  async handle(query: SearchQuery): Promise<SearchResult> {
    const hasCondition = [
      query.q,
      query.title,
      query.author,
      query.publisher,
      query.from,
      query.until
    ].some((value) => (value ?? '').trim().length > 0);

    if (!hasCondition) {
      return { items: [], total: 0, page: query.page, limit: query.limit };
    }

    return this.repository.search(query);
  }
}
