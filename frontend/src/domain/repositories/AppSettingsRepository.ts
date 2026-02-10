import { AppSettings } from '@domain/entities/AppSettings';

export interface AppSettingsRepository {
  load(): Promise<AppSettings>;
  save(settings: AppSettings): Promise<void>;
}
