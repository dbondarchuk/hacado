import { getServicesContainer, getUser } from "@/app/utils";
import { calendarSearchParamsLoader } from "@timelish/api-sdk";
import { getLoggerFactory } from "@timelish/logger";
import { AppointmentStatus, appointmentStatuses } from "@timelish/types";
import { resolveCalendarMemberId } from "@timelish/utils";
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
  const { start, end, includeDeclined, member } = searchParams;
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
      includeDeclined,
      memberId,
    },
    "Fetching calendar data",
  );

  const statuses: AppointmentStatus[] = appointmentStatuses.filter(
    (s) => includeDeclined || s !== "declined",
  );

  const [events, schedule] = await Promise.all([
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

  logger.debug(
    {
      start,
      end,
      includeDeclined,
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
