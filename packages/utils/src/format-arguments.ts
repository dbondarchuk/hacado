import { Language } from "@hacado/i18n";
import { Currency } from "@hacado/types";
import { DateTime } from "luxon";
import { formatAmountWithCurrency } from "./currency";

// Types for the formatted date/time properties
type DateTimeFormatted = {
  full: string;
  medium: string;
  short: string;
  date: string;
  time: string;
  timeWithSeconds: string;
  relative: string;
  iso: string;
  timestamp: number;
  day: {
    number: number;
    text: string;
    short: string;
  };
  month: {
    number: number;
    name: string;
    short: string;
  };
  year: number;
  hour: number;
  minute: number;
  second: number;
};

// Type for amount/price formatted properties
type AmountFormatted = string;

// Recursive type that transforms the input object
export type FormattedArguments<T> = {
  [K in keyof T]: T[K] extends Date | DateTime
    ? { original: DateTime } & DateTimeFormatted
    : T[K] extends number
      ? T[K] &
          (Lowercase<string & K> extends
            | `${string}amount${string}`
            | `${string}price${string}`
            ? { [P in `${string & K}Formatted`]: AmountFormatted }
            : {})
      : T[K] extends (infer U)[]
        ? FormattedArguments<U>[]
        : T[K] extends object
          ? FormattedArguments<T[K]>
          : T[K];
};

export function formatArguments<T extends Record<string, any>>(
  args: T,
  locale: Language,
  currency: Currency,
  timeZone?: string,
): FormattedArguments<T> {
  return processObject(
    args,
    locale,
    currency,
    timeZone,
  ) as FormattedArguments<T>;
}

function processObject(
  obj: any,
  locale: Language,
  currency: Currency,
  timeZone?: string,
): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => processObject(item, locale, currency, timeZone));
  }

  if (typeof obj === "object" && !isDate(obj) && !isLuxonDateTime(obj)) {
    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      result[key] = processObject(value, locale, currency, timeZone);

      // If the value is a Date or Luxon DateTime, replace with formatted object
      if (isDate(value) || isLuxonDateTime(value)) {
        const dateTime = isDate(value)
          ? DateTime.fromJSDate(value).setZone(timeZone)
          : (value as DateTime).setZone(timeZone);

        // Replace the original value with formatted object containing original
        result[key] = {
          original: dateTime.toJSDate(),
          full: dateTime
            .setLocale(locale)
            .toLocaleString(DateTime.DATETIME_FULL),
          medium: dateTime
            .setLocale(locale)
            .toLocaleString(DateTime.DATETIME_MED),
          short: dateTime
            .setLocale(locale)
            .toLocaleString(DateTime.DATETIME_SHORT),
          huge: dateTime
            .setLocale(locale)
            .toLocaleString(DateTime.DATETIME_HUGE),
          date: dateTime.setLocale(locale).toLocaleString(DateTime.DATE_FULL),
          dateHuge: dateTime
            .setLocale(locale)
            .toLocaleString(DateTime.DATE_HUGE),
          time: dateTime.setLocale(locale).toLocaleString(DateTime.TIME_SIMPLE),
          timeWithSeconds: dateTime
            .setLocale(locale)
            .toLocaleString(DateTime.TIME_WITH_SECONDS),
          relative: dateTime.setLocale(locale).toRelative(),
          iso: dateTime.toISO(),
          timestamp: dateTime.toMillis(),
          day: {
            number: dateTime.day,
            text: dateTime.setLocale(locale).weekdayLong,
            short: dateTime.setLocale(locale).weekdayShort,
          },
          month: {
            number: dateTime.month,
            name: dateTime.setLocale(locale).monthLong,
            short: dateTime.setLocale(locale).monthShort,
          },
          year: dateTime.year,
          hour: dateTime.hour,
          minute: dateTime.minute,
          second: dateTime.second,
        };
      }

      // If the value is a number and the key contains 'amount', create formatted sibling
      if (
        typeof value === "number" &&
        (key.toLowerCase().includes("amount") ||
          key.toLowerCase().includes("price")) &&
        !(`${key}Formatted` in obj)
      ) {
        result[`${key}Formatted`] = formatAmountWithCurrency(
          value,
          locale,
          currency,
        );
      }
    }

    return result;
  }

  return obj;
}

function isDate(value: any): value is Date {
  return value && value instanceof Date;
}

function isLuxonDateTime(value: any): value is DateTime {
  return value && value instanceof DateTime;
}
