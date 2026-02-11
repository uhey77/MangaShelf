import { MangaSeries } from '@domain/entities/MangaSeries';
import {
  GoogleDriveBackupRepository,
  GoogleDriveSyncResult
} from '@domain/repositories/GoogleDriveBackupRepository';

export interface SyncLibraryToGoogleDriveCommand {
  items: MangaSeries[];
}

export class SyncLibraryToGoogleDrive {
  constructor(private repository: GoogleDriveBackupRepository) {}

  handle(command: SyncLibraryToGoogleDriveCommand): Promise<GoogleDriveSyncResult> {
    return this.repository.syncLibrary(command.items);
  }
}
