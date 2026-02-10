import { AppSettings } from '@domain/entities/AppSettings';
import { AppSettingsRepository } from '@domain/repositories/AppSettingsRepository';

export class GetAppSettings {
  constructor(private repository: AppSettingsRepository) {}

  handle(): Promise<AppSettings> {
    return this.repository.load();
  }
}
