import { MangaSeries } from '@domain/entities/MangaSeries';
import { LibraryRepository } from '@domain/repositories/LibraryRepository';

export interface UpsertLibraryItemCommand {
  item: MangaSeries;
}

export class UpsertLibraryItem {
  constructor(private repository: LibraryRepository) {}

  handle(command: UpsertLibraryItemCommand): Promise<MangaSeries> {
    return this.repository.upsert(command.item);
  }
}
