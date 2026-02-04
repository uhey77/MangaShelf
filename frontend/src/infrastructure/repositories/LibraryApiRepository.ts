import { MangaSeries } from '@domain/entities/MangaSeries';
import { LibraryRepository } from '@domain/repositories/LibraryRepository';
import { fetchJson } from '@infrastructure/http/fetchJson';
import { fromDomain, LibraryItemDto, toDomain } from '@infrastructure/mappers/libraryMapper';

export class LibraryApiRepository implements LibraryRepository {
  async list(): Promise<MangaSeries[]> {
    const data = await fetchJson<LibraryItemDto[]>('/api/library');
    return data.map((item) => toDomain(item));
  }

  async upsert(item: MangaSeries): Promise<MangaSeries> {
    const payload = fromDomain(item);
    const saved = await fetchJson<LibraryItemDto>('/api/library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return toDomain(saved);
  }

  async delete(itemId: string): Promise<void> {
    await fetchJson<void>(`/api/library/${itemId}`, { method: 'DELETE' });
  }
}
