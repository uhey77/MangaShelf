import { LibraryRepository } from '@domain/repositories/LibraryRepository';

export interface DeleteLibraryItemCommand {
  itemId: string;
}

export class DeleteLibraryItem {
  constructor(private repository: LibraryRepository) {}

  handle(command: DeleteLibraryItemCommand): Promise<void> {
    return this.repository.delete(command.itemId);
  }
}
