import { getServicesContainer, getUser } from "@/app/utils";
import { getOwnerMemberIds } from "@/lib/auth/app-access";
import { withCatalogTarget } from "@timelish/app-store/utils";
import { getLoggerFactory } from "@timelish/logger";
import { filterConnectedAppsForUser } from "@timelish/utils";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const fetchCache = "force-cache";
export const revalidate = 3;

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/apps/by/name")("GET");
  const servicesContainer = await getServicesContainer();
  logger.debug(
    {
      url: request.url,
      method: request.method,
      searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
    },
    "Processing apps by name API request",
  );

  const appName = request.nextUrl.searchParams.get("name");

  if (!appName) {
    logger.warn("Missing required name parameter");
    return NextResponse.json(
      {
        success: false,
        error: "Name is required",
        code: "missing_name_parameter",
      },
      { status: 400 },
    );
  }

  logger.debug(
    {
      appName,
    },
    "Getting apps by name",
  );

  try {
    const [user, ownerMemberIds] = await Promise.all([
      getUser(),
      getOwnerMemberIds(),
    ]);
    const installed =
      await servicesContainer.connectedAppsService.getAppsByApp(appName);
    const apps = filterConnectedAppsForUser(
      user,
      installed.map(withCatalogTarget),
      ownerMemberIds,
    );

    logger.debug(
      {
        appName,
        count: apps.length,
      },
      "Apps by name retrieved",
    );

    return NextResponse.json(apps);
  } catch (error: any) {
    logger.error(
      {
        appName,
        error: error?.message || error?.toString(),
      },
      "Failed to get apps by name",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to get apps by name",
        code: "get_apps_by_name_failed",
      },
      { status: 500 },
    );
  }
}
