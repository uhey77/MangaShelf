import { SaveAppSettings } from '@application/commands/SaveAppSettings';
import { DeleteLibraryItem } from '@application/commands/DeleteLibraryItem';
import { UpsertLibraryItem } from '@application/commands/UpsertLibraryItem';
import { GetAppSettings } from '@application/queries/GetAppSettings';
import { GetLibrary } from '@application/queries/GetLibrary';
import { SearchBooks } from '@application/queries/SearchBooks';
import { AppSettingsRepository } from '@domain/repositories/AppSettingsRepository';
import { LibraryRepository } from '@domain/repositories/LibraryRepository';
import { SearchRepository } from '@domain/repositories/SearchRepository';
import { LocalStorageAppSettingsRepository } from '@infrastructure/repositories/LocalStorageAppSettingsRepository';
import { LibraryApiRepository } from '@infrastructure/repositories/LibraryApiRepository';
import { SearchApiRepository } from '@infrastructure/repositories/SearchApiRepository';

export interface AppContainer {
  appSettingsRepository: AppSettingsRepository;
  libraryRepository: LibraryRepository;
  searchRepository: SearchRepository;
  getAppSettings: GetAppSettings;
  getLibrary: GetLibrary;
  searchBooks: SearchBooks;
  saveAppSettings: SaveAppSettings;
  upsertLibraryItem: UpsertLibraryItem;
  deleteLibraryItem: DeleteLibraryItem;
}

export const createAppContainer = (): AppContainer => {
  const appSettingsRepository = new LocalStorageAppSettingsRepository();
  const libraryRepository = new LibraryApiRepository();
  const searchRepository = new SearchApiRepository();

  return {
    appSettingsRepository,
    libraryRepository,
    searchRepository,
    getAppSettings: new GetAppSettings(appSettingsRepository),
    getLibrary: new GetLibrary(libraryRepository),
    searchBooks: new SearchBooks(searchRepository),
    saveAppSettings: new SaveAppSettings(appSettingsRepository),
    upsertLibraryItem: new UpsertLibraryItem(libraryRepository),
    deleteLibraryItem: new DeleteLibraryItem(libraryRepository)
  };
};
