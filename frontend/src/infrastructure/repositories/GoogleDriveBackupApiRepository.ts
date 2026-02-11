import { MangaSeries } from '@domain/entities/MangaSeries';
import {
  GoogleDriveBackupRepository,
  GoogleDriveSyncResult
} from '@domain/repositories/GoogleDriveBackupRepository';

const GSI_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const DRIVE_UPLOAD_ENDPOINT =
  'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
const DRIVE_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const DRIVE_FILE_MIME_TYPE = 'application/json';
const DRIVE_FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';
const DRIVE_FOLDER_NAME = 'MangaShelf';

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
  expires_in?: number;
};

type GoogleTokenClient = {
  requestAccessToken: (options?: { prompt?: '' | 'consent' }) => void;
};

let gsiLoadingPromise: Promise<void> | null = null;

function getGoogleClientId(): string {
  const env = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env;
  const clientId = env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error(
      'Google Drive連携には VITE_GOOGLE_CLIENT_ID の設定が必要です。frontend/.env に設定してください。'
    );
  }
  return clientId;
}

function buildBackupPayload(items: MangaSeries[], syncedAt: string): string {
  return JSON.stringify(
    {
      exportedAt: syncedAt,
      count: items.length,
      items
    },
    null,
    2
  );
}

function buildMultipartBody(
  fileName: string,
  payload: string,
  boundary: string,
  parentFolderId: string
): string {
  const metadata = {
    name: fileName,
    mimeType: DRIVE_FILE_MIME_TYPE,
    parents: [parentFolderId]
  };

  return [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    `Content-Type: ${DRIVE_FILE_MIME_TYPE}`,
    '',
    payload,
    `--${boundary}--`,
    ''
  ].join('\r\n');
}

async function extractGoogleApiErrorDetail(response: Response): Promise<string> {
  let detail = response.statusText || `HTTP ${response.status}`;
  try {
    const errorPayload = (await response.json()) as {
      error?: { message?: string };
    };
    detail = errorPayload.error?.message ?? detail;
  } catch {
    // JSON 解析不可時は statusText をそのまま利用する
  }
  return detail;
}

function getGoogleObject(): unknown {
  return (window as Window & { google?: unknown }).google;
}

function hasTokenClientFactory(googleObject: unknown): googleObject is {
  accounts: { oauth2: { initTokenClient: (config: unknown) => GoogleTokenClient } };
} {
  if (!googleObject || typeof googleObject !== 'object') {
    return false;
  }

  const candidate = googleObject as {
    accounts?: { oauth2?: { initTokenClient?: unknown } };
  };

  return typeof candidate.accounts?.oauth2?.initTokenClient === 'function';
}

async function ensureGsiClientLoaded(): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Google Drive連携はブラウザ環境でのみ利用できます。');
  }

  if (hasTokenClientFactory(getGoogleObject())) {
    return;
  }

  if (!gsiLoadingPromise) {
    gsiLoadingPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${GSI_SCRIPT_URL}"]`);
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener(
          'error',
          () => reject(new Error('Google認証スクリプトの読み込みに失敗しました。')),
          {
            once: true
          }
        );
        return;
      }

      const script = document.createElement('script');
      script.src = GSI_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Google認証スクリプトの読み込みに失敗しました。'));
      document.head.appendChild(script);
    });
  }

  await gsiLoadingPromise;

  if (!hasTokenClientFactory(getGoogleObject())) {
    throw new Error('Google認証クライアントの初期化に失敗しました。');
  }
}

export class GoogleDriveBackupApiRepository implements GoogleDriveBackupRepository {
  private accessToken: string | null = null;
  private accessTokenExpiresAt = 0;
  private backupFolderId: string | null = null;

  private async requestAccessToken(): Promise<string> {
    await ensureGsiClientLoaded();

    const googleObject = getGoogleObject();
    if (!hasTokenClientFactory(googleObject)) {
      throw new Error('Google認証クライアントを利用できませんでした。');
    }

    const prompt: '' | 'consent' = this.accessToken ? '' : 'consent';

    return new Promise<string>((resolve, reject) => {
      const tokenClient = googleObject.accounts.oauth2.initTokenClient({
        client_id: getGoogleClientId(),
        scope: DRIVE_SCOPE,
        callback: (response: GoogleTokenResponse) => {
          if (!response.access_token) {
            const detail = response.error_description ?? response.error ?? '不明なエラー';
            reject(new Error(`Google認証に失敗しました: ${detail}`));
            return;
          }

          this.accessToken = response.access_token;
          const expiresIn = typeof response.expires_in === 'number' ? response.expires_in : 0;
          this.accessTokenExpiresAt = Date.now() + Math.max(0, expiresIn - 60) * 1000;
          resolve(response.access_token);
        }
      });

      try {
        tokenClient.requestAccessToken({ prompt });
      } catch {
        reject(new Error('Google認証の開始に失敗しました。'));
      }
    });
  }

  private async getAccessToken(): Promise<string> {
    const token = this.accessToken;
    const hasValidToken = typeof token === 'string' && this.accessTokenExpiresAt > Date.now();
    if (hasValidToken) {
      return token;
    }
    return this.requestAccessToken();
  }

  private async findBackupFolderId(accessToken: string): Promise<string | null> {
    const query =
      `mimeType='${DRIVE_FOLDER_MIME_TYPE}'` +
      ` and name='${DRIVE_FOLDER_NAME}'` +
      ` and trashed=false and 'root' in parents`;
    const url =
      `${DRIVE_FILES_ENDPOINT}?` +
      `q=${encodeURIComponent(query)}` +
      '&spaces=drive&fields=files(id,name)&pageSize=1';

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const detail = await extractGoogleApiErrorDetail(response);
      throw new Error(`Google Driveフォルダ検索に失敗しました: ${detail}`);
    }

    const data = (await response.json()) as {
      files?: Array<{ id?: string }>;
    };

    const folderId = data.files?.[0]?.id;
    if (!folderId) {
      return null;
    }

    return folderId;
  }

  private async createBackupFolder(accessToken: string): Promise<string> {
    const response = await fetch(DRIVE_FILES_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: DRIVE_FOLDER_NAME,
        mimeType: DRIVE_FOLDER_MIME_TYPE,
        parents: ['root']
      })
    });

    if (!response.ok) {
      const detail = await extractGoogleApiErrorDetail(response);
      throw new Error(`Google Driveフォルダ作成に失敗しました: ${detail}`);
    }

    const data = (await response.json()) as { id?: string };
    if (!data.id) {
      throw new Error('Google Driveフォルダ作成後のID取得に失敗しました。');
    }

    return data.id;
  }

  private async getOrCreateBackupFolderId(accessToken: string): Promise<string> {
    if (this.backupFolderId) {
      return this.backupFolderId;
    }

    const existing = await this.findBackupFolderId(accessToken);
    if (existing) {
      this.backupFolderId = existing;
      return existing;
    }

    const created = await this.createBackupFolder(accessToken);
    this.backupFolderId = created;
    return created;
  }

  private async uploadBackupFile(
    accessToken: string,
    fileName: string,
    payload: string,
    parentFolderId: string
  ): Promise<Response> {
    const boundary = `mangashelf_${Math.random().toString(36).slice(2)}`;
    const body = buildMultipartBody(fileName, payload, boundary, parentFolderId);

    return fetch(DRIVE_UPLOAD_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body
    });
  }

  async syncLibrary(items: MangaSeries[]): Promise<GoogleDriveSyncResult> {
    const accessToken = await this.getAccessToken();
    let folderId = await this.getOrCreateBackupFolderId(accessToken);
    const syncedAt = new Date().toISOString();
    const timestamp = syncedAt.replace(/[:.]/g, '-');
    const fileName = `mangashelf-backup-${timestamp}.json`;
    const payload = buildBackupPayload(items, syncedAt);
    let response = await this.uploadBackupFile(accessToken, fileName, payload, folderId);

    // フォルダが外部で削除されていた場合に備えて1回だけ再作成して再試行
    if (response.status === 404 && this.backupFolderId) {
      this.backupFolderId = null;
      folderId = await this.getOrCreateBackupFolderId(accessToken);
      response = await this.uploadBackupFile(accessToken, fileName, payload, folderId);
    }

    if (!response.ok) {
      const detail = await extractGoogleApiErrorDetail(response);
      throw new Error(`Google Driveへの同期に失敗しました: ${detail}`);
    }

    const data = (await response.json()) as { id?: string };
    if (!data.id) {
      throw new Error('Google Drive同期後のファイルID取得に失敗しました。');
    }

    return {
      fileId: data.id,
      syncedAt
    };
  }
}
