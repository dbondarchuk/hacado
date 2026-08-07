import { getServicesContainer } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { activitiesSearchParamsLoader } from "@hacado/api-sdk";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(
    "activity",
    "read",
    "AdminAPI/activities",
    "GET",
  );
  if (!auth.ok) return auth.response;

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

  auth.logger.debug(
    { total: res.total, count: res.items.length },
    "Listed activities",
  );

  return NextResponse.json(res);
}
