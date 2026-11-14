"use client";

import { useLocale } from "@hacado/i18n/client";
import { useTimeZone } from "@hacado/ui/context";
import { DateTime } from "luxon";
import React from "react";

export const TableDateTime: React.FC<{
  value: Date | string | null | undefined;
  format?: Intl.DateTimeFormatOptions;
  empty?: React.ReactNode;
  /** When false, skip organization timezone conversion. Default true. */
  useOrgTimeZone?: boolean;
}> = ({
  value,
  format = DateTime.DATETIME_MED,
  empty = "-",
  useOrgTimeZone = true,
}) => {
  const locale = useLocale();
  const timeZone = useTimeZone();

  if (value == null || value === "") return <>{empty}</>;

  let dateTime =
    typeof value === "string"
      ? DateTime.fromISO(value)
      : DateTime.fromJSDate(value);

  if (!dateTime.isValid) return <>{empty}</>;

  if (useOrgTimeZone) {
    dateTime = dateTime.setZone(timeZone);
  }

  return (
    <span className="whitespace-nowrap">
      {dateTime.toLocaleString(format, { locale })}
    </span>
  );
};
