import { BlogPublicKeys } from "../../translations/types";
import { calculateReadingTimeMinutes } from "./utils";

export const READ_TIME_FORMAT_KEYS = ["minRead", "min", "minutesRead"] as const;

export type ReadTimeFormatKey = (typeof READ_TIME_FORMAT_KEYS)[number];

export type ReadTimeFormatOption = {
  value: ReadTimeFormatKey;
  i18nKey: BlogPublicKeys;
};

const PREVIEW_MINUTES = 10;
const DEFAULT_FORMAT_KEY: ReadTimeFormatKey = "minRead";

export const resolveFormatKey = (format: string): ReadTimeFormatKey => {
  if (READ_TIME_FORMAT_KEYS.includes(format as ReadTimeFormatKey)) {
    return format as ReadTimeFormatKey;
  }

  return DEFAULT_FORMAT_KEY;
};

export const getFormatI18nKey = (
  formatKey: ReadTimeFormatKey,
): BlogPublicKeys => {
  return `block.postReadTime.formats.${formatKey}` satisfies BlogPublicKeys;
};

export type ReadTimeTranslateFn = (
  key: BlogPublicKeys,
  values?: { minutes: string },
) => string;

export const getReadingTimeLabel = (
  content: unknown,
  format: string,
  wordsPerMinute: number,
  t: ReadTimeTranslateFn,
): string => {
  const formatKey = resolveFormatKey(format);
  const minutes = calculateReadingTimeMinutes(content, wordsPerMinute);
  return t(getFormatI18nKey(formatKey), { minutes: String(minutes) });
};

export const getFormatPreview = (
  format: string,
  t: ReadTimeTranslateFn,
): string => {
  const formatKey = resolveFormatKey(format);
  return t(getFormatI18nKey(formatKey), { minutes: String(PREVIEW_MINUTES) });
};
