import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  AppSettings,
  DEFAULT_APP_SETTINGS,
  ShelfGridColumns,
  ShelfSort,
  ThemeMode
} from '@domain/entities/AppSettings';
import { MangaSeries } from '@domain/entities/MangaSeries';
import { useAppContainer } from '@presentation/providers/AppProvider';

const LOAD_ERROR_MESSAGE = '設定の読み込みに失敗しました';
const SAVE_ERROR_MESSAGE = '設定の保存に失敗しました';
const GOOGLE_DRIVE_SYNC_ERROR_MESSAGE = 'Google Driveとの同期に失敗しました';
const GOOGLE_DRIVE_RESTORE_ERROR_MESSAGE = 'Google Driveからの復元に失敗しました';
const GOOGLE_DRIVE_BIDIRECTIONAL_SYNC_ERROR_MESSAGE = 'Google Driveとの双方向同期に失敗しました';
const APP_NOTIFICATION_KEY = 'manga_shelf.release_notifications.v1';
const NOTIFICATION_WINDOW_DAYS = 7;

type NotificationPermissionState = NotificationPermission | 'unsupported';

function getNotificationPermissionState(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

function parseLocalDate(raw: string): Date | null {
  const [yearRaw, monthRaw, dayRaw] = raw.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  return new Date(year, month - 1, day);
}

function normalizeDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isReleaseWithinDays(value: string, days: number): boolean {
  const releaseDate = parseLocalDate(value);
  if (!releaseDate) return false;
  const today = normalizeDay(new Date());
  const releaseDay = normalizeDay(releaseDate);
  const diffMs = releaseDay.getTime() - today.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  return diffDays >= 0 && diffDays <= days;
}

function loadNotifiedReleaseKeys(): Set<string> {
  if (typeof window === 'undefined') {
    return new Set();
  }

  const raw = window.localStorage.getItem(APP_NOTIFICATION_KEY);
  if (!raw) {
    return new Set();
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return new Set();
    }
    return new Set(parsed.filter((value): value is string => typeof value === 'string'));
  } catch {
    return new Set();
  }
}

function saveNotifiedReleaseKeys(keys: Set<string>): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(APP_NOTIFICATION_KEY, JSON.stringify(Array.from(keys)));
}

function toReleaseKey(series: MangaSeries): string | null {
  if (!series.nextReleaseDate) {
    return null;
  }
  return `${series.id}:${series.nextReleaseDate}`;
}

export interface UseAppSettingsParams {
  library: MangaSeries[];
  onLibraryReplace: (items: MangaSeries[]) => void;
}

export function useAppSettings({ library, onLibraryReplace }: UseAppSettingsParams) {
  const {
    getAppSettings,
    saveAppSettings,
    syncLibraryToGoogleDrive,
    restoreLibraryFromGoogleDrive,
    syncLibraryBidirectionallyWithGoogleDrive
  } = useAppContainer();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [settingsReady, setSettingsReady] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [googleDriveSyncing, setGoogleDriveSyncing] = useState(false);
  const [googleDriveSyncError, setGoogleDriveSyncError] = useState<string | null>(null);
  const [googleDriveRestoring, setGoogleDriveRestoring] = useState(false);
  const [googleDriveRestoreError, setGoogleDriveRestoreError] = useState<string | null>(null);
  const [googleDriveBidirectionalSyncing, setGoogleDriveBidirectionalSyncing] = useState(false);
  const [googleDriveBidirectionalSyncError, setGoogleDriveBidirectionalSyncError] = useState<
    string | null
  >(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermissionState>(
    () => getNotificationPermissionState()
  );

  useEffect(() => {
    let active = true;

    const loadSettings = async () => {
      try {
        const stored = await getAppSettings.handle();
        if (!active) return;
        setSettings(stored);
        setSettingsError(null);
      } catch {
        if (!active) return;
        setSettingsError(LOAD_ERROR_MESSAGE);
      } finally {
        if (active) {
          setSettingsReady(true);
        }
      }
    };

    loadSettings();
    return () => {
      active = false;
    };
  }, [getAppSettings]);

  useEffect(() => {
    if (!settingsReady) return;
    let active = true;

    const persistSettings = async () => {
      try {
        await saveAppSettings.handle({ settings });
        if (!active) return;
        setSettingsError(null);
      } catch {
        if (!active) return;
        setSettingsError(SAVE_ERROR_MESSAGE);
      }
    };

    void persistSettings();

    return () => {
      active = false;
    };
  }, [saveAppSettings, settings, settingsReady]);

  useEffect(() => {
    setNotificationPermission(getNotificationPermissionState());
  }, []);

  useEffect(() => {
    if (!settings.notificationsEnabled) return;
    if (notificationPermission === 'granted') return;
    setSettings((prev) => ({ ...prev, notificationsEnabled: false }));
  }, [notificationPermission, settings.notificationsEnabled]);

  useEffect(() => {
    if (notificationPermission !== 'granted') return;
    if (!settings.notificationsEnabled) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    const notifiedKeys = loadNotifiedReleaseKeys();
    let hasChanges = false;

    for (const series of library) {
      const key = toReleaseKey(series);
      if (!key || notifiedKeys.has(key)) {
        continue;
      }
      if (!series.nextReleaseDate) {
        continue;
      }
      if (!isReleaseWithinDays(series.nextReleaseDate, NOTIFICATION_WINDOW_DAYS)) {
        continue;
      }

      try {
        new Notification('Manga Shelf 新刊通知', {
          body: `${series.title} の次巻発売日が近づいています（${series.nextReleaseDate.replace(/-/g, '/')}）`
        });
        notifiedKeys.add(key);
        hasChanges = true;
      } catch {
        // 通知表示失敗時は保存だけ行わない
      }
    }

    if (hasChanges) {
      saveNotifiedReleaseKeys(notifiedKeys);
    }
  }, [library, notificationPermission, settings.notificationsEnabled]);

  const setThemeMode = useCallback((themeMode: ThemeMode) => {
    setSettings((prev) => ({ ...prev, themeMode }));
  }, []);

  const toggleThemeMode = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      themeMode: prev.themeMode === 'dark' ? 'light' : 'dark'
    }));
  }, []);

  const setShelfSort = useCallback((shelfSort: ShelfSort) => {
    setSettings((prev) => ({ ...prev, shelfSort }));
  }, []);

  const setShelfGridColumns = useCallback((shelfGridColumns: ShelfGridColumns) => {
    setSettings((prev) => ({ ...prev, shelfGridColumns }));
  }, []);

  const setNotificationsEnabled = useCallback(async (enabled: boolean) => {
    if (!enabled) {
      setSettings((prev) => ({ ...prev, notificationsEnabled: false }));
      return;
    }

    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationPermission('unsupported');
      setSettings((prev) => ({ ...prev, notificationsEnabled: false }));
      return;
    }

    const currentPermission = Notification.permission;
    setNotificationPermission(currentPermission);

    if (currentPermission === 'granted') {
      setSettings((prev) => ({ ...prev, notificationsEnabled: true }));
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        setSettings((prev) => ({ ...prev, notificationsEnabled: true }));
        return;
      }
    } catch {
      // requestPermission が例外を返す環境向けのフォールバック
    }

    setSettings((prev) => ({ ...prev, notificationsEnabled: false }));
  }, []);

  const syncGoogleDriveBackup = useCallback(async () => {
    setGoogleDriveSyncing(true);
    setGoogleDriveSyncError(null);

    try {
      const result = await syncLibraryToGoogleDrive.handle({ items: library });
      setSettings((prev) => ({
        ...prev,
        googleDriveLinked: true,
        googleDriveLastSyncedAt: result.syncedAt
      }));
    } catch (error) {
      if (error instanceof Error && error.message) {
        setGoogleDriveSyncError(error.message);
      } else {
        setGoogleDriveSyncError(GOOGLE_DRIVE_SYNC_ERROR_MESSAGE);
      }
    } finally {
      setGoogleDriveSyncing(false);
    }
  }, [library, syncLibraryToGoogleDrive]);

  const restoreGoogleDriveBackup = useCallback(async () => {
    if (
      typeof window !== 'undefined' &&
      !window.confirm('現在の本棚データを最新バックアップで置き換えます。よろしいですか？')
    ) {
      return;
    }

    setGoogleDriveRestoring(true);
    setGoogleDriveRestoreError(null);

    try {
      const result = await restoreLibraryFromGoogleDrive.handle();
      onLibraryReplace(result.restoredItems);
      setSettings((prev) => ({
        ...prev,
        googleDriveLinked: true,
        googleDriveLastSyncedAt: result.restoredFrom
      }));
    } catch (error) {
      if (error instanceof Error && error.message) {
        setGoogleDriveRestoreError(error.message);
      } else {
        setGoogleDriveRestoreError(GOOGLE_DRIVE_RESTORE_ERROR_MESSAGE);
      }
    } finally {
      setGoogleDriveRestoring(false);
    }
  }, [onLibraryReplace, restoreLibraryFromGoogleDrive]);

  const syncGoogleDriveBidirectionally = useCallback(async () => {
    setGoogleDriveBidirectionalSyncing(true);
    setGoogleDriveBidirectionalSyncError(null);

    try {
      const result = await syncLibraryBidirectionallyWithGoogleDrive.handle();
      onLibraryReplace(result.mergedItems);
      setSettings((prev) => ({
        ...prev,
        googleDriveLinked: true,
        googleDriveLastSyncedAt: result.syncedAt
      }));
    } catch (error) {
      if (error instanceof Error && error.message) {
        setGoogleDriveBidirectionalSyncError(error.message);
      } else {
        setGoogleDriveBidirectionalSyncError(GOOGLE_DRIVE_BIDIRECTIONAL_SYNC_ERROR_MESSAGE);
      }
    } finally {
      setGoogleDriveBidirectionalSyncing(false);
    }
  }, [onLibraryReplace, syncLibraryBidirectionallyWithGoogleDrive]);

  const notificationSupported = notificationPermission !== 'unsupported';

  const notificationStatusMessage = useMemo(() => {
    if (notificationPermission === 'unsupported') {
      return 'このブラウザは通知に対応していません。';
    }
    if (notificationPermission === 'denied') {
      return '通知が拒否されています。ブラウザ設定から通知を許可してください。';
    }
    if (!settings.notificationsEnabled) {
      return '通知はオフです。ON にすると権限確認が表示されます。';
    }
    return '新刊通知は有効です。';
  }, [notificationPermission, settings.notificationsEnabled]);

  return {
    settings,
    settingsError,
    googleDriveSyncing,
    googleDriveSyncError,
    googleDriveRestoring,
    googleDriveRestoreError,
    googleDriveBidirectionalSyncing,
    googleDriveBidirectionalSyncError,
    notificationPermission,
    notificationSupported,
    notificationStatusMessage,
    setThemeMode,
    toggleThemeMode,
    setShelfSort,
    setShelfGridColumns,
    setNotificationsEnabled,
    syncGoogleDriveBackup,
    restoreGoogleDriveBackup,
    syncGoogleDriveBidirectionally
  };
}
