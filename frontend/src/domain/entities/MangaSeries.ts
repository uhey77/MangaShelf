export interface MangaSeries {
  id: string;
  title: string;
  author: string;
  publisher?: string | null;
  publishedDate?: string | null;
  latestVolume: number;
  ownedVolumes: number[];
  nextReleaseDate?: string | null;
  isFavorite: boolean;
  notes: string;
  coverUrl: string;
  genre: string[];
  isbn?: string | null;
  source?: string | null;
  sourceUrl?: string | null;
}
