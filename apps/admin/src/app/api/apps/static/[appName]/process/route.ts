import { getServicesContainer, getSession } from "@/app/utils";
import { getLoggerFactory } from "@timelish/logger";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: RouteContext<"/api/apps/static/[appName]/process">,
) {
  const logger = getLoggerFactory("AdminAPI/apps/static/[appName]/process")(
    "POST",
  );
  const servicesContainer = await getServicesContainer();
  const { appName } = await params;
  const body = await request.json();

  logger.debug(
    {
      appName,
      hasData: !!body,
    },
    "Processing static app request",
  );

  try {
    const session = await getSession();
    const result =
      await servicesContainer.connectedAppsService.processStaticRequest(
        appName,
        body,
        request,
        session.user,
      );

    logger.debug(
      {
        appName,
        hasData: !!body,
      },
      "Static app request processed",
    );

    return NextResponse.json(result);
  } catch (error: any) {
    logger.error(
      {
        appName,
        hasData: !!body,
        error: error?.message || error?.toString(),
      },
      "Failed to process static app request",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to process static app request",
        code: "process_static_app_request_failed",
      },
      { status: 500 },
    );
  }
}
