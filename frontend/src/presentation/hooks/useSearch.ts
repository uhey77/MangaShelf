import { useCallback, useMemo, useState } from 'react';
import type { FormEvent } from 'react';

import { MangaSeries } from '@domain/entities/MangaSeries';
import { SearchQuery } from '@domain/search';
import { useAppContainer } from '@presentation/providers/AppProvider';

export type SearchFormState = {
  q: string;
  title: string;
  author: string;
  publisher: string;
  from: string;
  until: string;
};

const DEFAULT_SEARCH_FORM: SearchFormState = {
  q: '',
  title: '',
  author: '',
  publisher: '',
  from: '',
  until: ''
};

const SEARCH_ERROR_MESSAGE = '検索に失敗しました';

export function useSearch() {
  const { searchBooks } = useAppContainer();
  const [searchForm, setSearchForm] = useState<SearchFormState>(DEFAULT_SEARCH_FORM);
  const [searchResults, setSearchResults] = useState<MangaSeries[]>([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchPage, setSearchPage] = useState(1);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchLimit = 20;

  const hasSearchCondition = useMemo(
    () => Object.values(searchForm).some((value) => value.trim().length > 0),
    [searchForm]
  );

  const buildQuery = useCallback(
    (page: number): SearchQuery => ({
      q: searchForm.q.trim() || undefined,
      title: searchForm.title.trim() || undefined,
      author: searchForm.author.trim() || undefined,
      publisher: searchForm.publisher.trim() || undefined,
      from: searchForm.from.trim() || undefined,
      until: searchForm.until.trim() || undefined,
      page,
      limit: searchLimit
    }),
    [searchForm, searchLimit]
  );

  const handleSearch = useCallback(
    async (page = 1) => {
      if (!hasSearchCondition) {
        setSearchResults([]);
        setSearchTotal(0);
        setSearchPage(1);
        setSearchError(null);
        return;
      }

      setSearchLoading(true);
      setSearchError(null);

      try {
        const result = await searchBooks.handle(buildQuery(page));
        setSearchResults(result.items);
        setSearchTotal(result.total);
        setSearchPage(result.page);
      } catch {
        setSearchError(SEARCH_ERROR_MESSAGE);
      } finally {
        setSearchLoading(false);
      }
    },
    [buildQuery, hasSearchCondition, searchBooks]
  );

  const handleSearchSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      handleSearch(1);
    },
    [handleSearch]
  );

  const clearSearch = useCallback(() => {
    setSearchForm(DEFAULT_SEARCH_FORM);
    setSearchResults([]);
    setSearchTotal(0);
    setSearchPage(1);
    setSearchError(null);
  }, []);

  return {
    searchForm,
    setSearchForm,
    searchResults,
    searchTotal,
    searchPage,
    searchLoading,
    searchError,
    searchLimit,
    hasSearchCondition,
    handleSearch,
    handleSearchSubmit,
    clearSearch
  };
}
