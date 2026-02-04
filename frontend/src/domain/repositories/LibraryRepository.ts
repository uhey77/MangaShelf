import { MangaSeries } from '@domain/entities/MangaSeries';

export interface LibraryRepository {
  list(): Promise<MangaSeries[]>;
  upsert(item: MangaSeries): Promise<MangaSeries>;
  delete(itemId: string): Promise<void>;
}
