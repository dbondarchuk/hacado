"use client";

import { I18nFn, useI18n, useLocale } from "@hacado/i18n/client";
import { DATE_TIME_FORMATS, DateTimeFormat } from "@hacado/types";
import { useTimeZone } from "@hacado/ui";
import { DateTime } from "luxon";

const T_PREFIX = "t_";
const DT_PREFIX = "dt_";

function resolveArgs<T extends any>(
  t: I18nFn<undefined, undefined>,
  timeZone: string,
  locale: string,
  args?: T,
): T {
  if (!args) return args as T;
  if (typeof args === "object") {
    if (Array.isArray(args)) {
      return args.map((arg) => resolveArgs(t, timeZone, locale, arg)) as T;
    }

    return Object.fromEntries(
      Object.entries(args).map(([key, value]) => {
        if (typeof value === "string" && key.startsWith(T_PREFIX)) {
          return [
            key.substring(T_PREFIX.length),
            t.has(value as any) ? t(value as any) : value,
          ];
        }

        if (
          typeof value === "object" &&
          value &&
          "value" in value &&
          key.startsWith(DT_PREFIX)
        ) {
          return [
            key.substring(DT_PREFIX.length),
            DateTime.fromISO(value.value as any)
              .setZone(value.timeZone ?? timeZone)
              .toLocaleString(
                value.format
                  ? (DATE_TIME_FORMATS[value.format as DateTimeFormat] ??
                      DateTime.DATETIME_FULL)
                  : DateTime.DATETIME_FULL,
              ),
          ];
        }

        return [key, resolveArgs(t, timeZone, locale, value)];
      }),
    ) as T;
  }

  return args;
}

type Field =
  | { key: string; args?: Record<string, unknown> }
  | string
  | undefined
  | null;

/**
 * Resolves message text: plain strings may be i18n keys (use `t.has`);
 * objects are translated only when they have a `key` property.
 */
export function resolvedI18nText(
  field: Field,
  t: I18nFn<undefined, undefined>,
  timeZone: string,
  locale: string,
): string {
  if (field === undefined || field === null) {
    return "";
  }
  if (typeof field === "string") {
    return t.has(field as any) ? t(field as any) : field;
  }
  if (
    typeof field === "object" &&
    !!field &&
    "key" in field &&
    typeof (field as { key: unknown }).key === "string"
  ) {
    const { key, args } = field as {
      key: string;
      args?: Record<string, unknown>;
    };
    return t.has(key as any)
      ? t(key as any, resolveArgs(t, timeZone, locale, args))
      : key;
  }
  return "";
}

export function useResolvedI18nText(field: Field): string {
  const t = useI18n();
  const timeZone = useTimeZone();
  const locale = useLocale();
  return resolvedI18nText(field, t, timeZone, locale);
}

export const ResolvedI18nText = ({ text }: { text: Field }) => {
  return useResolvedI18nText(text);
};
