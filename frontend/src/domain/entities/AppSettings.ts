export type ThemeMode = 'light' | 'dark';
export type ShelfSort = 'title' | 'latestVolumeDesc';
export type ShelfGridColumns = 1 | 2;

export interface AppSettings {
  themeMode: ThemeMode;
  notificationsEnabled: boolean;
  shelfSort: ShelfSort;
  shelfGridColumns: ShelfGridColumns;
  googleDriveLinked: boolean;
  googleDriveLastSyncedAt: string | null;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  themeMode: 'light',
  notificationsEnabled: false,
  shelfSort: 'title',
  shelfGridColumns: 1,
  googleDriveLinked: false,
  googleDriveLastSyncedAt: null
};
