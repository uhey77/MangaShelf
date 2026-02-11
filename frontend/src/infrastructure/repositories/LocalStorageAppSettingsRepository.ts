import {
  AppSettings,
  DEFAULT_APP_SETTINGS,
  ShelfGridColumns,
  ShelfSort,
  ThemeMode
} from '@domain/entities/AppSettings';
import { AppSettingsRepository } from '@domain/repositories/AppSettingsRepository';

const STORAGE_KEY = 'manga_shelf.app_settings.v1';

type StoredSettings = Partial<Record<keyof AppSettings, unknown>>;

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark';
}

function isShelfSort(value: unknown): value is ShelfSort {
  return value === 'title' || value === 'latestVolumeDesc';
}

function isShelfGridColumns(value: unknown): value is ShelfGridColumns {
  return value === 1 || value === 2;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function toAppSettings(value: unknown): AppSettings {
  if (!value || typeof value !== 'object') {
    return { ...DEFAULT_APP_SETTINGS };
  }

  const stored = value as StoredSettings;
  return {
    themeMode: isThemeMode(stored.themeMode) ? stored.themeMode : DEFAULT_APP_SETTINGS.themeMode,
    notificationsEnabled:
      typeof stored.notificationsEnabled === 'boolean'
        ? stored.notificationsEnabled
        : DEFAULT_APP_SETTINGS.notificationsEnabled,
    shelfSort: isShelfSort(stored.shelfSort) ? stored.shelfSort : DEFAULT_APP_SETTINGS.shelfSort,
    shelfGridColumns: isShelfGridColumns(stored.shelfGridColumns)
      ? stored.shelfGridColumns
      : DEFAULT_APP_SETTINGS.shelfGridColumns,
    googleDriveLinked:
      typeof stored.googleDriveLinked === 'boolean'
        ? stored.googleDriveLinked
        : DEFAULT_APP_SETTINGS.googleDriveLinked,
    googleDriveLastSyncedAt: isNullableString(stored.googleDriveLastSyncedAt)
      ? stored.googleDriveLastSyncedAt
      : DEFAULT_APP_SETTINGS.googleDriveLastSyncedAt
  };
}

export class LocalStorageAppSettingsRepository implements AppSettingsRepository {
  async load(): Promise<AppSettings> {
    if (typeof window === 'undefined') {
      return { ...DEFAULT_APP_SETTINGS };
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_APP_SETTINGS };
    }

    try {
      const parsed = JSON.parse(raw);
      return toAppSettings(parsed);
    } catch {
      return { ...DEFAULT_APP_SETTINGS };
    }
  }

  async save(settings: AppSettings): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }
}
