import { useI18n, useLocale } from "@hacado/i18n/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  cn,
  useTimeZone,
} from "@hacado/ui";
import { MemberName } from "@hacado/ui-admin";
import { durationToTime } from "@hacado/utils";
import { CalendarClock, Clock, Timer, User } from "lucide-react";
import { DateTime } from "luxon";
import React from "react";
import { getEventAppearance } from "./styles";
import { EventCalendarEvent } from "./types";

export type EventPopoverProps = {
  event: EventCalendarEvent;
  children: React.ReactNode;
};

export const EventPopover: React.FC<EventPopoverProps> = ({
  event,
  children,
}) => {
  const t = useI18n("admin");
  const locale = useLocale();
  const timeZone = useTimeZone();

  const eventDate = DateTime.fromJSDate(event.start).setZone(timeZone);
  const endDate = DateTime.fromJSDate(event.end).setZone(timeZone);
  const duration = durationToTime(
    endDate.diff(eventDate, "minutes").toObject().minutes ?? 0,
  );
  const appearance = getEventAppearance(event);
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <div
            className={cn("h-1.5 rounded-full", appearance.className)}
            style={appearance.style}
          />
          <div className="font-semibold text-xl">{event.title}</div>
          {event.customerName ? (
            <div className="flex items-center gap-2 text-base text-muted-foreground">
              <User className="size-4 shrink-0" />
              <span className="truncate">{event.customerName}</span>
            </div>
          ) : null}
          {event.member ? <MemberName member={event.member} /> : null}

          <div className="flex items-center text-base text-muted-foreground">
            <Clock />
            <span>
              {eventDate.toLocaleString(DateTime.DATETIME_FULL, { locale })}
            </span>
          </div>
          {duration.hours < 23 && (
            <div className="flex items-center text-base text-muted-foreground">
              <Timer />
              <span>
                {duration.hours} {t("calendar.hour")} {duration.minutes}{" "}
                {t("calendar.minute")}
              </span>
            </div>
          )}
          <div className="flex items-center text-base text-muted-foreground">
            <CalendarClock />
            <span>
              {endDate.toLocaleString(DateTime.DATETIME_FULL, { locale })}
            </span>
          </div>

          {/* {event.location && (
            <div className="flex items-center text-base text-muted-foreground">
              <MapPin />
              <span>{event.location}</span>
            </div>
          )}

          {event.description && (
            <div className="pt-2 border-t text-base">{event.description}</div>
          )} */}
        </div>
      </PopoverContent>
    </Popover>
  );
};
