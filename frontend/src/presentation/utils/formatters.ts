export const formatDate = (value?: string | null): string => {
  if (!value) return '';
  return value.replace(/-/g, '/');
};

export const buildMetaLine = (
  publisher?: string | null,
  publishedDate?: string | null
): string => {
  const parts = [publisher, formatDate(publishedDate)].filter(Boolean);
  return parts.join(' / ');
};
