import { getServicesContainer } from "@/app/utils";
import { assertCanAccessConnectedApp } from "@/lib/auth/app-access";
import { getLoggerFactory } from "@timelish/logger";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/apps/[id]/login-url">,
) {
  const logger = getLoggerFactory("AdminAPI/apps/[id]/login-url")("GET");
  const servicesContainer = await getServicesContainer();
  const { id } = await params;

  logger.debug(
    {
      appId: id,
    },
    "Requesting app login URL",
  );

  try {
    await assertCanAccessConnectedApp(id);
    const loginUrl =
      await servicesContainer.connectedAppsService.requestLoginUrl(id);

    logger.debug(
      {
        appId: id,
        hasUrl: !!loginUrl,
      },
      "App login URL retrieved",
    );

    return NextResponse.json(loginUrl);
  } catch (error: any) {
    logger.error(
      {
        appId: id,
        error: error?.message || error?.toString(),
      },
      "Failed to get app login URL",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to get app login URL",
        code: "get_app_login_url_failed",
      },
      { status: 500 },
    );
  }
}
