import { useCallback, useEffect, useState } from 'react';

import { MangaSeries } from '@domain/entities/MangaSeries';
import { useAppContainer } from '@presentation/providers/AppProvider';

const LOAD_ERROR_MESSAGE = '本棚データの読み込みに失敗しました';
const SAVE_ERROR_MESSAGE = '本棚への保存に失敗しました';

export function useLibrary() {
  const { getLibrary, upsertLibraryItem } = useAppContainer();
  const [library, setLibrary] = useState<MangaSeries[]>([]);
  const [libraryError, setLibraryError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadLibrary = async () => {
      try {
        const items = await getLibrary.handle();
        if (!active) return;
        setLibrary(items);
        setLibraryError(null);
      } catch {
        if (!active) return;
        setLibraryError(LOAD_ERROR_MESSAGE);
      }
    };

    loadLibrary();
    return () => {
      active = false;
    };
  }, [getLibrary]);

  const updateSeries = useCallback(
    async (updated: MangaSeries) => {
      try {
        const saved = await upsertLibraryItem.handle({ item: updated });
        setLibrary((prev) => {
          const exists = prev.some((item) => item.id === saved.id);
          if (!exists) return [...prev, saved];
          return prev.map((item) => (item.id === saved.id ? saved : item));
        });
        setLibraryError(null);
        return saved;
      } catch {
        setLibraryError(SAVE_ERROR_MESSAGE);
        return null;
      }
    },
    [upsertLibraryItem]
  );

  return { library, libraryError, updateSeries };
}
