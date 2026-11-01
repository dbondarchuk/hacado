import { BlogPublicKeys } from "../../translations/types";

export const AUTHOR_FORMAT_KEYS = [
  "name",
  "publishedBy",
  "by",
  "author",
] as const;

export type AuthorFormatKey = (typeof AUTHOR_FORMAT_KEYS)[number];

export type AuthorFormatOption = {
  value: AuthorFormatKey;
  i18nKey: BlogPublicKeys;
};

const PREVIEW_NAME = "Jane Doe";
const DEFAULT_FORMAT_KEY: AuthorFormatKey = "name";

export const resolveFormatKey = (format: string): AuthorFormatKey => {
  if (AUTHOR_FORMAT_KEYS.includes(format as AuthorFormatKey)) {
    return format as AuthorFormatKey;
  }

  return DEFAULT_FORMAT_KEY;
};

export const getFormatI18nKey = (
  formatKey: AuthorFormatKey,
): BlogPublicKeys => {
  return `block.postAuthor.formats.${formatKey}` satisfies BlogPublicKeys;
};

export type AuthorTranslateFn = (
  key: BlogPublicKeys,
  values?: { name: string },
) => string;

export const getAuthorLabel = (
  authorName: string,
  format: string,
  t: AuthorTranslateFn,
): string => {
  const formatKey = resolveFormatKey(format);
  return t(getFormatI18nKey(formatKey), { name: authorName });
};

export const getFormatPreview = (
  format: string,
  t: AuthorTranslateFn,
): string => {
  return getAuthorLabel(PREVIEW_NAME, format, t);
};
