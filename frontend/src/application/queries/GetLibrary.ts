import { MangaSeries } from '@domain/entities/MangaSeries';
import { LibraryRepository } from '@domain/repositories/LibraryRepository';

export class GetLibrary {
  constructor(private repository: LibraryRepository) {}

  handle(): Promise<MangaSeries[]> {
    return this.repository.list();
  }
}
