import { getServicesContainer, getSession } from "@/app/utils";
import { getLoggerFactory } from "@timelish/logger";
import { okStatus } from "@timelish/types";
import { NextResponse } from "next/server";

export async function POST() {
  const logger = getLoggerFactory("AdminAPI/activities/read")("POST");
  const session = await getSession();
  const servicesContainer = await getServicesContainer();
  await servicesContainer.activityService.markActivityFeedRead(
    session.user.memberId,
  );
  logger.debug("Activity feed marked read");
  return NextResponse.json(okStatus, { status: 200 });
}
