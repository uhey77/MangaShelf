import { MangaSeries } from '@domain/entities/MangaSeries';
import { GoogleDriveBackupRepository } from '@domain/repositories/GoogleDriveBackupRepository';
import { LibraryRepository } from '@domain/repositories/LibraryRepository';
import { deduplicateSeriesByKey, mergeSeriesCollections } from '@domain/services/seriesMerge';

export interface SyncLibraryBidirectionallyWithGoogleDriveResult {
  mergedItems: MangaSeries[];
  fileId: string;
  syncedAt: string;
  usedRemoteBackup: boolean;
  remoteBackupSyncedAt: string | null;
}

export class SyncLibraryBidirectionallyWithGoogleDrive {
  constructor(
    private googleDriveBackupRepository: GoogleDriveBackupRepository,
    private libraryRepository: LibraryRepository
  ) {}

  async handle(): Promise<SyncLibraryBidirectionallyWithGoogleDriveResult> {
    const localItems = await this.libraryRepository.list();
    const remoteBackup = await this.googleDriveBackupRepository.getLatestLibraryBackup();
    const remoteItems = remoteBackup ? deduplicateSeriesByKey(remoteBackup.items) : [];

    const mergedItems = remoteBackup
      ? mergeSeriesCollections(localItems, remoteItems)
      : deduplicateSeriesByKey(localItems);

    const savedIds = new Set<string>();
    for (const item of mergedItems) {
      const saved = await this.libraryRepository.upsert(item);
      savedIds.add(saved.id);
    }

    const itemsAfterUpsert = await this.libraryRepository.list();
    for (const item of itemsAfterUpsert) {
      if (!savedIds.has(item.id)) {
        await this.libraryRepository.delete(item.id);
      }
    }

    const persistedItems = await this.libraryRepository.list();
    const syncResult = await this.googleDriveBackupRepository.syncLibrary(persistedItems);

    return {
      mergedItems: persistedItems,
      fileId: syncResult.fileId,
      syncedAt: syncResult.syncedAt,
      usedRemoteBackup: remoteBackup !== null,
      remoteBackupSyncedAt: remoteBackup?.syncedAt ?? null
    };
  }
}
