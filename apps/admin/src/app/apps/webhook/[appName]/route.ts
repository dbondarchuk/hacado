import { getLoggerFactory } from "@hacado/logger";
import { ServicesContainer } from "@hacado/services";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const processWebhook = async (
  request: NextRequest,
  { params }: RouteContext<"/apps/webhook/[appName]">,
) => {
  const logger = getLoggerFactory("API/apps/webhook/[appName]")(
    "processWebhook",
  );
  const { appName } = await params;

  logger.debug(
    {
      url: request.url,
      method: request.method,
      appName,
    },
    "Processing static app webhook request",
  );

  if (!appName) {
    logger.warn("Missing required appName parameter");
    return NextResponse.json({ error: "AppName is required" }, { status: 400 });
  }

  const service = ServicesContainer("").connectedAppsService;
  try {
    const result = await service.processStaticWebhook(appName, request);

    if (result) {
      logger.debug(
        {
          appName,
          status: result.status,
        },
        "Successfully processed static app webhook",
      );
    } else {
      logger.warn({ appName }, "No static app webhook handler found");
    }

    return (
      result ?? NextResponse.json({ error: "unknown_handler" }, { status: 404 })
    );
  } catch (error: any) {
    logger.error(
      {
        appName,
        error: error?.message || error?.toString(),
      },
      "Error processing static app webhook",
    );
    throw error;
  }
};

export const GET = processWebhook;
export const POST = processWebhook;
export const PUT = processWebhook;
export const DELETE = processWebhook;
