import { SyncLibraryToGoogleDrive } from '@application/commands/SyncLibraryToGoogleDrive';
import { RestoreLibraryFromGoogleDrive } from '@application/commands/RestoreLibraryFromGoogleDrive';
import { SaveAppSettings } from '@application/commands/SaveAppSettings';
import { DeleteLibraryItem } from '@application/commands/DeleteLibraryItem';
import { SyncLibraryBidirectionallyWithGoogleDrive } from '@application/commands/SyncLibraryBidirectionallyWithGoogleDrive';
import { UpsertLibraryItem } from '@application/commands/UpsertLibraryItem';
import { GetAppSettings } from '@application/queries/GetAppSettings';
import { GetLibrary } from '@application/queries/GetLibrary';
import { SearchBooks } from '@application/queries/SearchBooks';
import { AppSettingsRepository } from '@domain/repositories/AppSettingsRepository';
import { GoogleDriveBackupRepository } from '@domain/repositories/GoogleDriveBackupRepository';
import { LibraryRepository } from '@domain/repositories/LibraryRepository';
import { SearchRepository } from '@domain/repositories/SearchRepository';
import { GoogleDriveBackupApiRepository } from '@infrastructure/repositories/GoogleDriveBackupApiRepository';
import { LocalStorageAppSettingsRepository } from '@infrastructure/repositories/LocalStorageAppSettingsRepository';
import { LibraryApiRepository } from '@infrastructure/repositories/LibraryApiRepository';
import { SearchApiRepository } from '@infrastructure/repositories/SearchApiRepository';

export interface AppContainer {
  appSettingsRepository: AppSettingsRepository;
  googleDriveBackupRepository: GoogleDriveBackupRepository;
  libraryRepository: LibraryRepository;
  searchRepository: SearchRepository;
  getAppSettings: GetAppSettings;
  getLibrary: GetLibrary;
  searchBooks: SearchBooks;
  syncLibraryToGoogleDrive: SyncLibraryToGoogleDrive;
  restoreLibraryFromGoogleDrive: RestoreLibraryFromGoogleDrive;
  syncLibraryBidirectionallyWithGoogleDrive: SyncLibraryBidirectionallyWithGoogleDrive;
  saveAppSettings: SaveAppSettings;
  upsertLibraryItem: UpsertLibraryItem;
  deleteLibraryItem: DeleteLibraryItem;
}

export const createAppContainer = (): AppContainer => {
  const appSettingsRepository = new LocalStorageAppSettingsRepository();
  const googleDriveBackupRepository = new GoogleDriveBackupApiRepository();
  const libraryRepository = new LibraryApiRepository();
  const searchRepository = new SearchApiRepository();

  return {
    appSettingsRepository,
    googleDriveBackupRepository,
    libraryRepository,
    searchRepository,
    getAppSettings: new GetAppSettings(appSettingsRepository),
    getLibrary: new GetLibrary(libraryRepository),
    searchBooks: new SearchBooks(searchRepository),
    syncLibraryToGoogleDrive: new SyncLibraryToGoogleDrive(googleDriveBackupRepository),
    restoreLibraryFromGoogleDrive: new RestoreLibraryFromGoogleDrive(
      googleDriveBackupRepository,
      libraryRepository
    ),
    syncLibraryBidirectionallyWithGoogleDrive: new SyncLibraryBidirectionallyWithGoogleDrive(
      googleDriveBackupRepository,
      libraryRepository
    ),
    saveAppSettings: new SaveAppSettings(appSettingsRepository),
    upsertLibraryItem: new UpsertLibraryItem(libraryRepository),
    deleteLibraryItem: new DeleteLibraryItem(libraryRepository)
  };
};
