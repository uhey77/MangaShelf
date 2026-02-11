import { MangaSeries } from '@domain/entities/MangaSeries';
import { GoogleDriveBackupRepository } from '@domain/repositories/GoogleDriveBackupRepository';
import { LibraryRepository } from '@domain/repositories/LibraryRepository';
import { deduplicateSeriesByKey } from '@domain/services/seriesMerge';

export interface RestoreLibraryFromGoogleDriveResult {
  restoredItems: MangaSeries[];
  sourceFileId: string;
  sourceFileName: string;
  restoredFrom: string;
}

export class RestoreLibraryFromGoogleDrive {
  constructor(
    private googleDriveBackupRepository: GoogleDriveBackupRepository,
    private libraryRepository: LibraryRepository
  ) {}

  async handle(): Promise<RestoreLibraryFromGoogleDriveResult> {
    const backup = await this.googleDriveBackupRepository.getLatestLibraryBackup();
    if (!backup) {
      throw new Error('Google Drive に復元可能なバックアップがありません。');
    }

    const backupItems = deduplicateSeriesByKey(backup.items);
    const savedIds = new Set<string>();

    for (const item of backupItems) {
      const saved = await this.libraryRepository.upsert(item);
      savedIds.add(saved.id);
    }

    const itemsAfterUpsert = await this.libraryRepository.list();
    for (const current of itemsAfterUpsert) {
      if (!savedIds.has(current.id)) {
        await this.libraryRepository.delete(current.id);
      }
    }

    const restoredItems = await this.libraryRepository.list();
    return {
      restoredItems,
      sourceFileId: backup.fileId,
      sourceFileName: backup.fileName,
      restoredFrom: backup.syncedAt
    };
  }
}
