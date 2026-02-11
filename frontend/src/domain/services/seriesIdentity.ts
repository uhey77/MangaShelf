const KANJI_DIGITS: Record<string, number> = {
  〇: 0,
  零: 0,
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9
};

const KANJI_UNITS: Record<string, number> = {
  十: 10,
  百: 100,
  千: 1000
};

const UPPER_LOWER_MAP: Record<string, number> = {
  上: 1,
  中: 2,
  下: 3
};

const ARABIC_VOLUME_PATTERN_SOURCE = '(?:第\\s*(\\d+)\\s*巻|(\\d+)\\s*巻|vol\\.?\\s*(\\d+))';
const PAREN_ARABIC_PATTERN_SOURCE = '[（(「『【\\[]\\s*(\\d{1,4})\\s*[）)」』】\\]]';
const KANJI_VOLUME_PATTERN_SOURCE =
  '(?:第\\s*([〇零一二三四五六七八九十百千]+)\\s*巻|([〇零一二三四五六七八九十百千]+)\\s*巻)';
const PAREN_UPPER_LOWER_PATTERN_SOURCE = '[（(「『【\\[]\\s*([上中下])(?:巻)?\\s*[）)」』】\\]]';
const STANDALONE_UPPER_LOWER_PATTERN_SOURCE = '(?:^|[\\s\\-_/])([上中下])(?:巻)?(?=$|[\\s\\-_/])';
const TRAILING_ARABIC_PATTERN_SOURCE = '(?:^|[\\s\\-_/#])(\\d{1,4})$';

export function normalizeText(value: string): string {
  return value.normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();
}

export function extractVolumeNumber(title: string): number | null {
  if (!title) {
    return null;
  }

  const normalizedTitle = title.normalize('NFKC');
  const candidates: number[] = [];

  for (const match of normalizedTitle.matchAll(new RegExp(ARABIC_VOLUME_PATTERN_SOURCE, 'gi'))) {
    for (const groupIndex of [1, 2, 3]) {
      const raw = match[groupIndex];
      if (!raw) {
        continue;
      }
      const value = Number.parseInt(raw, 10);
      if (isPlausibleVolume(value)) {
        candidates.push(value);
      }
    }
  }

  for (const match of normalizedTitle.matchAll(new RegExp(PAREN_ARABIC_PATTERN_SOURCE, 'g'))) {
    const raw = match[1];
    if (!raw) {
      continue;
    }
    const value = Number.parseInt(raw, 10);
    if (isPlausibleVolume(value)) {
      candidates.push(value);
    }
  }

  for (const match of normalizedTitle.matchAll(new RegExp(TRAILING_ARABIC_PATTERN_SOURCE, 'g'))) {
    const raw = match[1];
    if (!raw) {
      continue;
    }
    const value = Number.parseInt(raw, 10);
    if (isPlausibleVolume(value)) {
      candidates.push(value);
    }
  }

  for (const match of normalizedTitle.matchAll(new RegExp(KANJI_VOLUME_PATTERN_SOURCE, 'g'))) {
    const raw = match[1] ?? match[2];
    if (!raw) {
      continue;
    }
    const value = parseKanjiNumber(raw);
    if (value !== null && value > 0) {
      candidates.push(value);
    }
  }

  for (const match of normalizedTitle.matchAll(new RegExp(PAREN_UPPER_LOWER_PATTERN_SOURCE, 'g'))) {
    const mapped = UPPER_LOWER_MAP[match[1] ?? ''];
    if (mapped) {
      candidates.push(mapped);
    }
  }

  for (const match of normalizedTitle.matchAll(
    new RegExp(STANDALONE_UPPER_LOWER_PATTERN_SOURCE, 'g')
  )) {
    const mapped = UPPER_LOWER_MAP[match[1] ?? ''];
    if (mapped) {
      candidates.push(mapped);
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  return Math.max(...candidates);
}

export function buildSeriesKey(title: string, author: string): string {
  const strippedTitle = normalizeText(stripVolumeExpression(title));
  const normalizedTitle = strippedTitle.length > 0 ? strippedTitle : normalizeText(title);
  const normalizedAuthor = normalizeAuthorKey(author);
  return `title:${normalizedTitle}|author:${normalizedAuthor}`;
}

export function toSeriesDisplayTitle(title: string): string {
  const strippedTitle = stripVolumeExpression(title);
  if (strippedTitle.length > 0) {
    return strippedTitle;
  }
  const normalizedTitle = title.normalize('NFKC').trim();
  if (normalizedTitle.length > 0) {
    return normalizedTitle;
  }
  return title;
}

function normalizeAuthorKey(author: string): string {
  return normalizeText(author).replace(/\s+/g, '');
}

function stripVolumeExpression(title: string): string {
  const normalizedTitle = title.normalize('NFKC');
  const removedArabic = normalizedTitle.replace(
    new RegExp('(?:第\\s*\\d+\\s*巻|\\d+\\s*巻|vol\\.?\\s*\\d+)', 'gi'),
    ' '
  );
  const removedParenArabic = removedArabic.replace(
    new RegExp('[（(「『【\\[]\\s*\\d{1,4}\\s*[）)」』】\\]]', 'g'),
    ' '
  );
  const removedKanji = removedParenArabic.replace(
    new RegExp(
      '(?:第\\s*[〇零一二三四五六七八九十百千]+\\s*巻|[〇零一二三四五六七八九十百千]+\\s*巻)',
      'g'
    ),
    ' '
  );
  const removedParenUpperLower = removedKanji.replace(
    new RegExp('[（(「『【\\[]\\s*[上中下](?:巻)?\\s*[）)」』】\\]]', 'g'),
    ' '
  );
  const removedStandaloneUpperLower = removedParenUpperLower.replace(
    new RegExp('(^|[\\s\\-_/])[上中下](?:巻)?(?=$|[\\s\\-_/])', 'g'),
    '$1'
  );
  const removedTrailingArabic = removedStandaloneUpperLower.replace(
    new RegExp('(?:\\s+|[-_/#])\\d{1,4}$', 'g'),
    ''
  );
  return removedTrailingArabic.replace(/\s+/g, ' ').trim();
}

function parseKanjiNumber(value: string): number | null {
  if (!value) {
    return null;
  }

  const normalized = value.normalize('NFKC');
  let total = 0;
  let current = 0;

  for (const char of normalized) {
    if (char in KANJI_DIGITS) {
      current = KANJI_DIGITS[char];
      continue;
    }

    const unit = KANJI_UNITS[char];
    if (unit === undefined) {
      return null;
    }

    if (current === 0) {
      current = 1;
    }

    total += current * unit;
    current = 0;
  }

  total += current;
  if (!isPlausibleVolume(total)) {
    return null;
  }

  return total;
}

function isPlausibleVolume(value: number): boolean {
  return Number.isInteger(value) && value > 0 && value <= 500;
}
