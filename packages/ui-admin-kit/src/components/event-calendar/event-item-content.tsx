"use client";

import { useLocale } from "@hacado/i18n/client";
import { MemberName } from "@hacado/ui-admin/data-table";
import { cn } from "@hacado/ui/cn";
import { useTimeZone } from "@hacado/ui/context";
import { User } from "lucide-react";
import { DateTime } from "luxon";
import React from "react";
import type { EventCalendarEvent } from "./types";

export type EventItemContentProps = {
  event: Pick<
    EventCalendarEvent,
    "title" | "customer" | "member" | "start" | "end"
  >;
  /** `full` = week/agenda card; `compact` = month chip. */
  density?: "full" | "compact";
  className?: string;
  showTime?: boolean;
};

export const EventItemContent: React.FC<EventItemContentProps> = ({
  event,
  density = "full",
  className,
  showTime = true,
}) => {
  const locale = useLocale();
  const timeZone = useTimeZone();
  const start = DateTime.fromJSDate(event.start).setZone(timeZone);
  const end = DateTime.fromJSDate(event.end).setZone(timeZone);
  const timeLabel = `${start.toLocaleString(DateTime.TIME_SIMPLE, { locale })} – ${end.toLocaleString(DateTime.TIME_SIMPLE, { locale })}`;

  if (density === "compact") {
    return (
      <div className={cn("min-w-0", className)}>
        {showTime ? (
          <div
            className="opacity-70 text-[12px] mb-0.5 truncate"
            suppressHydrationWarning
          >
            {start.toLocaleString(DateTime.TIME_SIMPLE, { locale })}
          </div>
        ) : null}
        <div className="font-medium truncate">{event.title}</div>
        {event.member ? (
          <MemberName member={event.member} compact className="mt-0.5" />
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-h-0 min-w-0 overflow-hidden flex flex-col gap-0.5 text-left",
        className,
      )}
    >
      <div className="font-semibold text-[13px] leading-tight truncate">
        {event.title}
      </div>
      {showTime ? (
        <div
          className="text-[12px] leading-tight opacity-80 truncate"
          suppressHydrationWarning
        >
          {timeLabel}
        </div>
      ) : null}
      {event.customer?.name ? (
        <div className="flex items-center gap-1 min-w-0 text-[12px] leading-tight opacity-90">
          <User className="size-3.5 shrink-0 opacity-80" aria-hidden />
          <span className="truncate">{event.customer.name}</span>
        </div>
      ) : null}
      {event.member ? (
        <MemberName member={event.member} compact className="mt-0.5" />
      ) : null}
    </div>
  );
};
