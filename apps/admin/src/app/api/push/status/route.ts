import { getServicesContainer, getSession } from "@/app/utils";
import { getLoggerFactory } from "@hacado/logger";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/push/status")("GET");
  logger.debug("Checking push subscription status");

  const session = await getSession();
  if (!session) {
    logger.debug("Unauthorized push status request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const endpoint = request.nextUrl.searchParams.get("endpoint");
  if (!endpoint) {
    logger.debug("Push status missing endpoint");
    return NextResponse.json({ error: "endpoint required" }, { status: 400 });
  }

  const services = await getServicesContainer();
  const subscription =
    await services.pushNotificationsService.getSubscriptionByEndpoint(endpoint);

  const enabled =
    !!subscription && subscription.memberId === session.user.memberId;

  logger.debug(
    {
      endpoint,
      found: Boolean(subscription),
      memberId: session.user.memberId,
      enabled,
    },
    "Push subscription status result",
  );

  return NextResponse.json({ enabled });
}
