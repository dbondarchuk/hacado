import { getServicesContainer } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(
    "activity",
    "read",
    "AdminAPI/activities/event-types",
    "GET",
  );
  if (!auth.ok) return auth.response;

  const servicesContainer = await getServicesContainer();

  const page = Math.max(
    1,
    Number(request.nextUrl.searchParams.get("page")) || 1,
  );
  const limit = Math.min(
    50,
    Math.max(1, Number(request.nextUrl.searchParams.get("limit")) || 10),
  );
  const search = request.nextUrl.searchParams.get("search") ?? undefined;
  const offset = (page - 1) * limit;

  const { items, total } =
    await servicesContainer.activityService.getDistinctEventTypes({
      search,
      offset,
      limit,
    });

  auth.logger.debug(
    { total, count: items.length },
    "Listed distinct event types",
  );

  return NextResponse.json({ items, total });
}
