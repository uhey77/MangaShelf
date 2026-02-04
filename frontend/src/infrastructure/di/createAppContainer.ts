import { DeleteLibraryItem } from '@application/commands/DeleteLibraryItem';
import { UpsertLibraryItem } from '@application/commands/UpsertLibraryItem';
import { GetLibrary } from '@application/queries/GetLibrary';
import { SearchBooks } from '@application/queries/SearchBooks';
import { LibraryRepository } from '@domain/repositories/LibraryRepository';
import { SearchRepository } from '@domain/repositories/SearchRepository';
import { LibraryApiRepository } from '@infrastructure/repositories/LibraryApiRepository';
import { SearchApiRepository } from '@infrastructure/repositories/SearchApiRepository';

export interface AppContainer {
  libraryRepository: LibraryRepository;
  searchRepository: SearchRepository;
  getLibrary: GetLibrary;
  searchBooks: SearchBooks;
  upsertLibraryItem: UpsertLibraryItem;
  deleteLibraryItem: DeleteLibraryItem;
}

export const createAppContainer = (): AppContainer => {
  const libraryRepository = new LibraryApiRepository();
  const searchRepository = new SearchApiRepository();

  return {
    libraryRepository,
    searchRepository,
    getLibrary: new GetLibrary(libraryRepository),
    searchBooks: new SearchBooks(searchRepository),
    upsertLibraryItem: new UpsertLibraryItem(libraryRepository),
    deleteLibraryItem: new DeleteLibraryItem(libraryRepository)
  };
};
