import { getServicesContainer } from "@/app/utils";
import { activitiesSearchParamsLoader } from "@hacado/api-sdk";
import { getLoggerFactory } from "@hacado/logger";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/activities")("GET");
  const servicesContainer = await getServicesContainer();

  const params = activitiesSearchParamsLoader(request.nextUrl.searchParams);
  const page = params.page;
  const limit = params.limit;
  const offset = (page - 1) * limit;

  const res = await servicesContainer.activityService.getActivities({
    offset,
    limit,
    search: params.search ?? undefined,
    sort: params.sort,
    range:
      params.start || params.end
        ? { start: params.start ?? undefined, end: params.end ?? undefined }
        : undefined,
    eventType: params.eventType?.length ? params.eventType : undefined,
    severity: params.severity?.length ? params.severity : undefined,
    actor: params.actor?.length ? params.actor : undefined,
  });

  logger.debug(
    { total: res.total, count: res.items.length },
    "Listed activities",
  );

  return NextResponse.json(res);
}
