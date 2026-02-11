import { MangaSeries } from '@domain/entities/MangaSeries';

export interface GoogleDriveSyncResult {
  fileId: string;
  syncedAt: string;
}

export interface GoogleDriveBackupRepository {
  syncLibrary(items: MangaSeries[]): Promise<GoogleDriveSyncResult>;
}
