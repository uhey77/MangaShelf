import { useCallback, useEffect, useState } from 'react';

import { MangaSeries } from '@domain/entities/MangaSeries';
import { deduplicateSeriesByKey } from '@domain/services/seriesMerge';
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
        setLibrary(deduplicateSeriesByKey(items));
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
          const remaining = prev.filter((item) => item.id !== saved.id);
          return deduplicateSeriesByKey([saved, ...remaining]);
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

  const replaceLibrary = useCallback((items: MangaSeries[]) => {
    setLibrary(deduplicateSeriesByKey(items));
    setLibraryError(null);
  }, []);

  return { library, libraryError, updateSeries, replaceLibrary };
}
