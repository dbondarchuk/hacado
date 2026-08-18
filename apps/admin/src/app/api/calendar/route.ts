import { getServicesContainer, getUser } from "@/app/utils";
import { calendarSearchParamsLoader } from "@hacado/api-sdk";
import { getLoggerFactory } from "@hacado/logger";
import {
  AppointmentStatus,
  appointmentStatuses,
  CalendarEvent,
  isClosedAppointmentStatus,
} from "@hacado/types";
import { resolveCalendarMemberId } from "@hacado/utils";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/calendar")("GET");
  const servicesContainer = await getServicesContainer();
  const user = await getUser();

  logger.debug(
    {
      url: request.url,
      method: request.method,
      searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
    },
    "Processing calendar API request",
  );

  const searchParams = calendarSearchParamsLoader(request.nextUrl.searchParams);
  const { start, end, includeClosed, member } = searchParams;
  const memberId = resolveCalendarMemberId(user, member);
  if (!start || !end) {
    logger.warn("Missing required date range parameters");
    return NextResponse.json(
      { error: "Start and end dates are required" },
      { status: 400 },
    );
  }

  logger.debug(
    {
      start,
      end,
      includeClosed,
      memberId,
    },
    "Fetching calendar data",
  );

  const statuses: AppointmentStatus[] = appointmentStatuses.filter(
    (s) => includeClosed || !isClosedAppointmentStatus(s),
  );

  const [fullEvents, schedule] = await Promise.all([
    servicesContainer.bookingService.getCalendarEvents(
      start,
      end,
      statuses,
      memberId,
    ),
    servicesContainer.scheduleService.getSchedule(
      start,
      end,
      memberId ?? user.memberId,
    ),
  ]);

  // Trim actual calendar events titles for other members
  const events: CalendarEvent[] = fullEvents.map((event) =>
    "_id" in event
      ? event
      : {
          ...event,
          title: event.memberId === user.memberId ? event.title : "Busy",
        },
  );

  logger.debug(
    {
      start,
      end,
      includeClosed,
      memberId,
      eventCount: events.length,
    },
    "Successfully retrieved calendar data",
  );

  return NextResponse.json({
    events,
    schedule,
  });
}
