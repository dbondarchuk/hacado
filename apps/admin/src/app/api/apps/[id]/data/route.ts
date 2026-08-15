import { getServicesContainer } from "@/app/utils";
import { assertCanAccessConnectedApp } from "@/lib/auth/app-access";
import { getLoggerFactory } from "@hacado/logger";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/apps/[id]/data">,
) {
  const logger = getLoggerFactory("AdminAPI/apps/[id]/data")("GET");
  const servicesContainer = await getServicesContainer();
  const { id } = await params;

  logger.debug(
    {
      appId: id,
    },
    "Getting app data",
  );

  try {
    await assertCanAccessConnectedApp(id);
    const appService =
      await servicesContainer.connectedAppsService.getAppService(id);

    let appData = appService.app.data;
    if (appService.service.processAppData && appData) {
      logger.debug(
        {
          appId: id,
          appName: appData.name,
        },
        "Processing app data by service",
      );

      appData = await appService.service.processAppData(appData);
    }

    logger.debug(
      {
        appId: id,
        hasData: !!appData,
      },
      "App data retrieved",
    );

    return NextResponse.json(appData ?? null);
  } catch (error: any) {
    logger.error(
      {
        appId: id,
        error: error?.message || error?.toString(),
      },
      "Failed to get app data",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to get app data",
        code: "get_app_data_failed",
      },
      { status: 500 },
    );
  }
}
