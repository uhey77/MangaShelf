import { MangaSeries } from '@domain/entities/MangaSeries';
import { buildSeriesKey, extractVolumeNumber } from '@domain/services/seriesIdentity';

function isNonEmptyString(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function pickRequiredString(
  primary: string | null | undefined,
  fallback: string | null | undefined
): string {
  if (isNonEmptyString(primary)) {
    return primary;
  }
  if (isNonEmptyString(fallback)) {
    return fallback;
  }
  return '';
}

function pickNullableString(
  primary: string | null | undefined,
  fallback: string | null | undefined
): string | null {
  if (isNonEmptyString(primary)) {
    return primary;
  }
  if (isNonEmptyString(fallback)) {
    return fallback;
  }
  return null;
}

function normalizeLatestVolume(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.floor(value));
}

function normalizeOwnedVolumes(volumes: number[], latestVolume: number): number[] {
  const normalized = volumes
    .map((value) => Math.floor(value))
    .filter(
      (value) =>
        Number.isFinite(value) && value > 0 && (latestVolume === 0 || value <= latestVolume)
    );
  return Array.from(new Set(normalized)).sort((a, b) => a - b);
}

function mergeGenre(primary: string[], secondary: string[]): string[] {
  const merged = [...primary];
  for (const genre of secondary) {
    if (!merged.includes(genre)) {
      merged.push(genre);
    }
  }
  return merged;
}

export function mergeSeriesWithPrimary(primary: MangaSeries, secondary: MangaSeries): MangaSeries {
  const primaryVolume = extractVolumeNumber(primary.title) ?? 0;
  const secondaryVolume = extractVolumeNumber(secondary.title) ?? 0;
  const latestVolume = Math.max(
    normalizeLatestVolume(primary.latestVolume),
    normalizeLatestVolume(secondary.latestVolume),
    primaryVolume,
    secondaryVolume
  );

  const mergedOwnedVolumes = [...primary.ownedVolumes, ...secondary.ownedVolumes];
  if (primaryVolume > 0) {
    mergedOwnedVolumes.push(primaryVolume);
  }
  if (secondaryVolume > 0) {
    mergedOwnedVolumes.push(secondaryVolume);
  }

  return {
    id: primary.id,
    title: pickRequiredString(primary.title, secondary.title),
    author: pickRequiredString(primary.author, secondary.author),
    publisher: pickNullableString(primary.publisher, secondary.publisher),
    publishedDate: pickNullableString(primary.publishedDate, secondary.publishedDate),
    latestVolume,
    ownedVolumes: normalizeOwnedVolumes(mergedOwnedVolumes, latestVolume),
    nextReleaseDate: pickNullableString(primary.nextReleaseDate, secondary.nextReleaseDate),
    isFavorite: primary.isFavorite || secondary.isFavorite,
    notes: pickRequiredString(primary.notes, secondary.notes),
    coverUrl: pickRequiredString(primary.coverUrl, secondary.coverUrl),
    genre: mergeGenre(primary.genre, secondary.genre),
    isbn: pickNullableString(primary.isbn, secondary.isbn),
    source: pickNullableString(primary.source, secondary.source),
    sourceUrl: pickNullableString(primary.sourceUrl, secondary.sourceUrl)
  };
}

export function deduplicateSeriesByKey(items: MangaSeries[]): MangaSeries[] {
  const deduped: MangaSeries[] = [];
  const indexBySeriesKey = new Map<string, number>();

  for (const item of items) {
    const key = buildSeriesKey(item.title, item.author);
    const existingIndex = indexBySeriesKey.get(key);

    if (existingIndex === undefined) {
      deduped.push(item);
      indexBySeriesKey.set(key, deduped.length - 1);
      continue;
    }

    const merged = mergeSeriesWithPrimary(deduped[existingIndex], item);
    deduped[existingIndex] = merged;

    const mergedKey = buildSeriesKey(merged.title, merged.author);
    indexBySeriesKey.set(key, existingIndex);
    indexBySeriesKey.set(mergedKey, existingIndex);
  }

  return deduped;
}

export function mergeSeriesCollections(
  primaryItems: MangaSeries[],
  secondaryItems: MangaSeries[]
): MangaSeries[] {
  const mergedItems = deduplicateSeriesByKey(primaryItems);
  const indexBySeriesKey = new Map<string, number>();

  mergedItems.forEach((item, index) => {
    indexBySeriesKey.set(buildSeriesKey(item.title, item.author), index);
  });

  for (const secondaryItem of secondaryItems) {
    const key = buildSeriesKey(secondaryItem.title, secondaryItem.author);
    const existingIndex = indexBySeriesKey.get(key);

    if (existingIndex === undefined) {
      mergedItems.push(secondaryItem);
      indexBySeriesKey.set(key, mergedItems.length - 1);
      continue;
    }

    const merged = mergeSeriesWithPrimary(mergedItems[existingIndex], secondaryItem);
    mergedItems[existingIndex] = merged;

    const mergedKey = buildSeriesKey(merged.title, merged.author);
    indexBySeriesKey.set(key, existingIndex);
    indexBySeriesKey.set(mergedKey, existingIndex);
  }

  return mergedItems;
}
