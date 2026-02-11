import { MangaSeries } from '@domain/entities/MangaSeries';

export interface GoogleDriveSyncResult {
  fileId: string;
  syncedAt: string;
}

export interface GoogleDriveLibraryBackup {
  fileId: string;
  fileName: string;
  syncedAt: string;
  items: MangaSeries[];
}

export interface GoogleDriveBackupRepository {
  syncLibrary(items: MangaSeries[]): Promise<GoogleDriveSyncResult>;
  getLatestLibraryBackup(): Promise<GoogleDriveLibraryBackup | null>;
}
