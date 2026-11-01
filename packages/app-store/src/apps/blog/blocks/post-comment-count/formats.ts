import { BlogPublicKeys } from "../../translations/types";

export const COMMENT_COUNT_FORMAT_KEYS = ["count", "commentsCount"] as const;

export type CommentCountFormatKey = (typeof COMMENT_COUNT_FORMAT_KEYS)[number];

const PREVIEW_COUNT = 3;
const DEFAULT_FORMAT_KEY: CommentCountFormatKey = "count";

export const resolveCommentCountFormatKey = (
  format: string,
): CommentCountFormatKey => {
  if (COMMENT_COUNT_FORMAT_KEYS.includes(format as CommentCountFormatKey)) {
    return format as CommentCountFormatKey;
  }

  return DEFAULT_FORMAT_KEY;
};

export const getCommentCountFormatI18nKey = (
  formatKey: CommentCountFormatKey,
): BlogPublicKeys => {
  return `block.postCommentCount.formats.${formatKey}` satisfies BlogPublicKeys;
};

export type CommentCountTranslateFn = (
  key: BlogPublicKeys,
  values?: { count: number },
) => string;

export const getCommentCountLabel = (
  count: number,
  format: string,
  t: CommentCountTranslateFn,
): string => {
  const formatKey = resolveCommentCountFormatKey(format);
  return t(getCommentCountFormatI18nKey(formatKey), { count });
};

export const getCommentCountFormatPreview = (
  format: string,
  t: CommentCountTranslateFn,
): string => {
  return getCommentCountLabel(PREVIEW_COUNT, format, t);
};
