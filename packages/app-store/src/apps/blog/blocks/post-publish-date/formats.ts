import { DateTime, DateTimeFormatOptions } from "luxon";
import { BlogAdminKeys } from "../../translations/types";

export type DateFormatOption = {
  value: string;
  i18nKey: BlogAdminKeys;
  preset?: DateTimeFormatOptions;
};

// Static date for preview (same for all labels)
const PREVIEW_DATE = DateTime.fromISO("2024-12-25T10:30:00");

// Map of format values to Luxon presets
export const formatPresetMap: Record<string, DateTimeFormatOptions> = {
  DATE_FULL: DateTime.DATE_FULL,
  DATE_HUGE: DateTime.DATE_HUGE,
  DATE_MED: DateTime.DATE_MED,
  DATE_MED_WITH_WEEKDAY: DateTime.DATE_MED_WITH_WEEKDAY,
  DATE_SHORT: DateTime.DATE_SHORT,
  DATETIME_FULL: DateTime.DATETIME_FULL,
  DATETIME_HUGE: DateTime.DATETIME_HUGE,
  DATETIME_MED: DateTime.DATETIME_MED,
  DATETIME_MED_WITH_WEEKDAY: DateTime.DATETIME_MED_WITH_WEEKDAY,
  DATETIME_SHORT: DateTime.DATETIME_SHORT,
};

// Format a date using the format string or preset
export const formatDate = (date: DateTime, format: string): string => {
  if (format in formatPresetMap) {
    return date.toLocaleString(formatPresetMap[format]);
  }

  return date.toFormat(format);
};

// Get preview text for a format
export const getFormatPreview = (format: string): string => {
  return formatDate(PREVIEW_DATE, format);
};

// Date format options
export const dateFormatOptions: DateFormatOption[] = [
  {
    value: "DATE_FULL",
    i18nKey:
      "block.postPublishDate.dateFormats.dateFull" satisfies BlogAdminKeys,
    preset: DateTime.DATE_FULL,
  },
  {
    value: "DATE_HUGE",
    i18nKey:
      "block.postPublishDate.dateFormats.dateHuge" satisfies BlogAdminKeys,
    preset: DateTime.DATE_HUGE,
  },
  {
    value: "DATE_MED",
    i18nKey:
      "block.postPublishDate.dateFormats.dateMed" satisfies BlogAdminKeys,
    preset: DateTime.DATE_MED,
  },
  {
    value: "DATE_MED_WITH_WEEKDAY",
    i18nKey:
      "block.postPublishDate.dateFormats.dateMedWithWeekday" satisfies BlogAdminKeys,
    preset: DateTime.DATE_MED_WITH_WEEKDAY,
  },
  {
    value: "DATE_SHORT",
    i18nKey:
      "block.postPublishDate.dateFormats.dateShort" satisfies BlogAdminKeys,
    preset: DateTime.DATE_SHORT,
  },
  {
    value: "DATETIME_FULL",
    i18nKey:
      "block.postPublishDate.dateFormats.datetimeFull" satisfies BlogAdminKeys,
    preset: DateTime.DATETIME_FULL,
  },
  {
    value: "DATETIME_HUGE",
    i18nKey:
      "block.postPublishDate.dateFormats.datetimeHuge" satisfies BlogAdminKeys,
    preset: DateTime.DATETIME_HUGE,
  },
  {
    value: "DATETIME_MED",
    i18nKey:
      "block.postPublishDate.dateFormats.datetimeMed" satisfies BlogAdminKeys,
    preset: DateTime.DATETIME_MED,
  },
  {
    value: "DATETIME_MED_WITH_WEEKDAY",
    i18nKey:
      "block.postPublishDate.dateFormats.datetimeMedWithWeekday" satisfies BlogAdminKeys,
    preset: DateTime.DATETIME_MED_WITH_WEEKDAY,
  },
  {
    value: "DATETIME_SHORT",
    i18nKey:
      "block.postPublishDate.dateFormats.datetimeShort" satisfies BlogAdminKeys,
    preset: DateTime.DATETIME_SHORT,
  },
  {
    value: "MMMM d, yyyy",
    i18nKey:
      "block.postPublishDate.dateFormats.customMmmmdYyyy" satisfies BlogAdminKeys,
  },
  {
    value: "MMM d, yyyy",
    i18nKey:
      "block.postPublishDate.dateFormats.customMmmdYyyy" satisfies BlogAdminKeys,
  },
  {
    value: "dd/MM/yyyy",
    i18nKey:
      "block.postPublishDate.dateFormats.customDdMmYyyy" satisfies BlogAdminKeys,
  },
  {
    value: "MM/dd/yyyy",
    i18nKey:
      "block.postPublishDate.dateFormats.customMmDdYyyy" satisfies BlogAdminKeys,
  },
  {
    value: "yyyy-MM-dd",
    i18nKey:
      "block.postPublishDate.dateFormats.customYyyyMmDd" satisfies BlogAdminKeys,
  },
];
