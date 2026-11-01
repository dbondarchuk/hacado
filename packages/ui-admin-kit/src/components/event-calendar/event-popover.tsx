import { useI18n, useLocale } from "@hacado/i18n/client";
import { MemberName } from "@hacado/ui-admin/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@hacado/ui/avatar";
import { cn } from "@hacado/ui/cn";
import { useTimeZone } from "@hacado/ui/context";
import { Link } from "@hacado/ui/link";
import { Popover, PopoverContent, PopoverTrigger } from "@hacado/ui/popover";
import { durationToTime } from "@hacado/utils/time";
import { CalendarClock, Clock, Timer, Video } from "lucide-react";
import { DateTime } from "luxon";
import React from "react";
import { getEventAppearance } from "./styles";
import { EventCalendarEvent } from "./types";

export type EventPopoverProps = {
  event: EventCalendarEvent;
  children: React.ReactNode;
};

function customerInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0]?.toUpperCase())
    .filter(Boolean)
    .slice(0, 2)
    .join("");
}

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
          {event.customer?.name ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <Avatar className="size-7">
                <AvatarImage
                  src={event.customer.image ?? undefined}
                  alt={event.customer.name}
                />
                <AvatarFallback className="text-xs">
                  {customerInitials(event.customer.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex flex-col">
                <span className="truncate font-medium">
                  {event.customer.name}
                </span>
              </div>
            </div>
          ) : null}
          {event.member ? <MemberName member={event.member} /> : null}

          <div className="flex gap-2 items-center text-base text-muted-foreground">
            <Clock className="size-7 shrink-0" />
            <span>
              {eventDate.toLocaleString(DateTime.DATETIME_FULL, { locale })}
            </span>
          </div>
          {duration.hours < 23 && (
            <div className="flex gap-2 items-center text-base text-muted-foreground">
              <Timer className="size-7 shrink-0" />
              <span>
                {duration.hours} {t("calendar.hour")} {duration.minutes}{" "}
                {t("calendar.minute")}
              </span>
            </div>
          )}
          <div className="flex gap-2 items-center text-base text-muted-foreground">
            <CalendarClock className="size-7 shrink-0" />
            <span>
              {endDate.toLocaleString(DateTime.DATETIME_FULL, { locale })}
            </span>
          </div>

          {event.video?.link && (
            <div className="flex items-center gap-2 text-base text-muted-foreground">
              <Video className="size-7 shrink-0" />
              <div className="flex flex-col gap-1 overflow-hidden">
                <Link
                  variant="underline"
                  href={event.video.link}
                  target="_blank"
                  className="truncate"
                >
                  {event.video.link}
                </Link>
                {/* <div className="flex items-center gap-1 flex-col text-xs text-muted-foreground">
                  {event.video.password && (
                    <span>
                      {t(
                        "appointments.view.meetingInformation.meetingPassword",
                      )}
                      : {event.video.password}
                    </span>
                  )}
                  {event.video.meetingId && (
                    <span>
                      {t("appointments.view.meetingInformation.meetingId")}:{" "}
                      {event.video.meetingId}
                    </span>
                  )}
                </div> */}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
