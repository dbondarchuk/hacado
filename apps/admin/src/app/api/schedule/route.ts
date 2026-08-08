import { getServicesContainer, getUser } from "@/app/utils";
import { scheduleSearchParamsLoader } from "@hacado/api-sdk";
import { getLoggerFactory } from "@hacado/logger";
import { resolveCalendarMemberId } from "@hacado/utils";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/schedule")("GET");
  const servicesContainer = await getServicesContainer();
  const user = await getUser();
  logger.debug(
    {
      url: request.url,
      method: request.method,
      searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
    },
    "Processing schedule API request",
  );

  const searchParams = scheduleSearchParamsLoader(request.nextUrl.searchParams);
  const { start, end, member } = searchParams;

  const memberId = resolveCalendarMemberId(user, member);

  if (!start || !end) {
    logger.warn({ start, end }, "Missing required date range parameters");
    return NextResponse.json(
      { error: "Start and end dates are required" },
      { status: 400 },
    );
  }

  const response = await servicesContainer.scheduleService.getSchedule(
    start,
    end,
    memberId ?? user.memberId,
  );

  logger.debug(
    {
      start,
      end,
      memberId: memberId ?? user.memberId,
    },
    "Successfully retrieved schedule",
  );

  return NextResponse.json(response);
}
