import { MangaSeries } from '@domain/entities/MangaSeries';
import { GoogleDriveBackupRepository } from '@domain/repositories/GoogleDriveBackupRepository';
import { LibraryRepository } from '@domain/repositories/LibraryRepository';

export interface SyncLibraryBidirectionallyWithGoogleDriveResult {
  mergedItems: MangaSeries[];
  fileId: string;
  syncedAt: string;
  usedRemoteBackup: boolean;
  remoteBackupSyncedAt: string | null;
}

function isNonEmptyString(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function pickRequiredString(
  primary: string | null | undefined,
  fallback: string | null | undefined
): string {
  if (isNonEmptyString(primary)) return primary;
  if (isNonEmptyString(fallback)) return fallback;
  return '';
}

function pickNullableString(
  primary: string | null | undefined,
  fallback: string | null | undefined
): string | null {
  if (isNonEmptyString(primary)) return primary;
  if (isNonEmptyString(fallback)) return fallback;
  return null;
}

function normalizeLatestVolume(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function normalizeOwnedVolumes(volumes: number[], latestVolume: number): number[] {
  const normalized = volumes
    .map((value) => Math.floor(value))
    .filter((value) => Number.isFinite(value) && value > 0 && value <= latestVolume);
  return Array.from(new Set(normalized)).sort((a, b) => a - b);
}

function mergeGenre(local: string[], remote: string[]): string[] {
  const merged = [...local];
  for (const genre of remote) {
    if (!merged.includes(genre)) {
      merged.push(genre);
    }
  }
  return merged;
}

function mergeSeries(local: MangaSeries, remote: MangaSeries): MangaSeries {
  const latestVolume = Math.max(
    normalizeLatestVolume(local.latestVolume),
    normalizeLatestVolume(remote.latestVolume)
  );

  return {
    id: local.id,
    title: pickRequiredString(local.title, remote.title),
    author: pickRequiredString(local.author, remote.author),
    publisher: pickNullableString(local.publisher, remote.publisher),
    publishedDate: pickNullableString(local.publishedDate, remote.publishedDate),
    latestVolume,
    ownedVolumes: normalizeOwnedVolumes(
      [...local.ownedVolumes, ...remote.ownedVolumes],
      latestVolume
    ),
    nextReleaseDate: pickNullableString(local.nextReleaseDate, remote.nextReleaseDate),
    isFavorite: local.isFavorite || remote.isFavorite,
    notes: pickRequiredString(local.notes, remote.notes),
    coverUrl: pickRequiredString(local.coverUrl, remote.coverUrl),
    genre: mergeGenre(local.genre, remote.genre),
    isbn: pickNullableString(local.isbn, remote.isbn),
    source: pickNullableString(local.source, remote.source),
    sourceUrl: pickNullableString(local.sourceUrl, remote.sourceUrl)
  };
}

function mergeLibraryItems(localItems: MangaSeries[], remoteItems: MangaSeries[]): MangaSeries[] {
  const remoteMap = new Map(remoteItems.map((item) => [item.id, item]));
  const mergedItems: MangaSeries[] = [];
  const mergedIds = new Set<string>();

  for (const localItem of localItems) {
    const remoteItem = remoteMap.get(localItem.id);
    mergedItems.push(remoteItem ? mergeSeries(localItem, remoteItem) : localItem);
    mergedIds.add(localItem.id);
  }

  for (const remoteItem of remoteItems) {
    if (!mergedIds.has(remoteItem.id)) {
      mergedItems.push(remoteItem);
    }
  }

  return mergedItems;
}

export class SyncLibraryBidirectionallyWithGoogleDrive {
  constructor(
    private googleDriveBackupRepository: GoogleDriveBackupRepository,
    private libraryRepository: LibraryRepository
  ) {}

  async handle(): Promise<SyncLibraryBidirectionallyWithGoogleDriveResult> {
    const localItems = await this.libraryRepository.list();
    const remoteBackup = await this.googleDriveBackupRepository.getLatestLibraryBackup();
    const mergedItems = remoteBackup
      ? mergeLibraryItems(localItems, remoteBackup.items)
      : localItems;

    const mergedIds = new Set(mergedItems.map((item) => item.id));
    for (const item of mergedItems) {
      await this.libraryRepository.upsert(item);
    }

    for (const item of localItems) {
      if (!mergedIds.has(item.id)) {
        await this.libraryRepository.delete(item.id);
      }
    }

    const syncResult = await this.googleDriveBackupRepository.syncLibrary(mergedItems);
    const persistedItems = await this.libraryRepository.list();

    return {
      mergedItems: persistedItems,
      fileId: syncResult.fileId,
      syncedAt: syncResult.syncedAt,
      usedRemoteBackup: remoteBackup !== null,
      remoteBackupSyncedAt: remoteBackup?.syncedAt ?? null
    };
  }
}
