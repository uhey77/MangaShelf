import { AppSettings } from '@domain/entities/AppSettings';
import { AppSettingsRepository } from '@domain/repositories/AppSettingsRepository';

export interface SaveAppSettingsCommand {
  settings: AppSettings;
}

export class SaveAppSettings {
  constructor(private repository: AppSettingsRepository) {}

  handle(command: SaveAppSettingsCommand): Promise<void> {
    return this.repository.save(command.settings);
  }
}
