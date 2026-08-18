import { getServicesContainer, getUser } from "@/app/utils";
import { getLoggerFactory } from "@hacado/logger";
import {
  AppointmentStatus,
  appointmentStatuses,
  isClosedAppointmentStatus,
} from "@hacado/types";
import { resolveCalendarMemberId } from "@hacado/utils";
import { DateTime } from "luxon";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/calendar/events")("GET");
  const servicesContainer = await getServicesContainer();
  const user = await getUser();
  logger.debug(
    {
      url: request.url,
      method: request.method,
      searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
    },
    "Processing events API request",
  );

  const searchParams = request.nextUrl.searchParams;
  const startStr = searchParams.get("start");
  const endStr = searchParams.get("end");
  const includeClosed =
    searchParams.get("includeClosed")?.toLowerCase() === "true";
  const memberId = resolveCalendarMemberId(user, searchParams.get("member"));

  if (!startStr || !endStr) {
    logger.warn({ startStr, endStr }, "Missing required date range parameters");
    return NextResponse.json({ error: "Range is required" }, { status: 400 });
  }

  const start = DateTime.fromISO(startStr);
  const end = DateTime.fromISO(endStr);
  if (!start.isValid || !end.isValid) {
    logger.warn(
      { startStr, endStr, startValid: start.isValid, endValid: end.isValid },
      "Invalid date format provided",
    );
    return NextResponse.json(
      { error: "Start and End must be dates in ISO format" },
      { status: 400 },
    );
  }

  const statuses: AppointmentStatus[] = appointmentStatuses.filter(
    (s) => includeClosed || !isClosedAppointmentStatus(s),
  );

  logger.debug(
    {
      start: start.toISO(),
      end: end.toISO(),
      includeClosed,
      statuses,
      memberId,
    },
    "Fetching events with parameters",
  );

  const events = await servicesContainer.bookingService.getCalendarEvents(
    start.toJSDate(),
    end.toJSDate(),
    statuses,
    memberId,
  );

  logger.debug(
    {
      start: start.toISO(),
      end: end.toISO(),
      memberId,
      eventCount: events.length,
    },
    "Successfully retrieved events",
  );

  return NextResponse.json(events);
}
