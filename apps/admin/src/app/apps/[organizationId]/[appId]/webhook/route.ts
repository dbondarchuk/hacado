import { getLoggerFactory } from "@hacado/logger";
import { ServicesContainer } from "@hacado/services";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const processWebhook = async (
  request: NextRequest,
  { params }: RouteContext<"/apps/[organizationId]/[appId]/webhook">,
) => {
  const logger = getLoggerFactory("API/apps-webhook")("processWebhook");
  const { appId, organizationId } = await params;

  logger.debug(
    {
      url: request.url,
      method: request.method,
      appId,
    },
    "Processing webhook request",
  );

  if (!appId) {
    logger.warn("Missing required appId parameter");
    return NextResponse.json({ error: "AppId is required" }, { status: 400 });
  }

  const service = ServicesContainer(organizationId).connectedAppsService;

  try {
    const result = await service.processWebhook(appId, request);

    if (result) {
      logger.debug(
        {
          appId,
          status: result.status,
        },
        "Successfully processed webhook",
      );
    } else {
      logger.warn({ appId }, "No webhook handler found");
    }

    return (
      result ?? NextResponse.json({ error: "unknown_handler" }, { status: 404 })
    );
  } catch (error: any) {
    logger.error(
      {
        appId,
        error: error?.message || error?.toString(),
      },
      "Error processing webhook",
    );
    throw error;
  }
};

export const GET = processWebhook;
export const POST = processWebhook;
export const PUT = processWebhook;
export const DELETE = processWebhook;
