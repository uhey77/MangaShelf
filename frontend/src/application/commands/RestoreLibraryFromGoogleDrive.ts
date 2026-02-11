import { MangaSeries } from '@domain/entities/MangaSeries';
import { GoogleDriveBackupRepository } from '@domain/repositories/GoogleDriveBackupRepository';
import { LibraryRepository } from '@domain/repositories/LibraryRepository';

export interface RestoreLibraryFromGoogleDriveResult {
  restoredItems: MangaSeries[];
  sourceFileId: string;
  sourceFileName: string;
  restoredFrom: string;
}

function deduplicateById(items: MangaSeries[]): MangaSeries[] {
  const uniqueMap = new Map<string, MangaSeries>();
  for (const item of items) {
    uniqueMap.set(item.id, item);
  }
  return Array.from(uniqueMap.values());
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

    const backupItems = deduplicateById(backup.items);
    const currentItems = await this.libraryRepository.list();
    const backupIds = new Set(backupItems.map((item) => item.id));

    for (const item of backupItems) {
      await this.libraryRepository.upsert(item);
    }

    for (const current of currentItems) {
      if (!backupIds.has(current.id)) {
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
