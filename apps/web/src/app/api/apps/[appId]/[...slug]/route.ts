import { getServicesContainer } from "@/utils/utils";
import { getLoggerFactory } from "@hacado/logger";
import { NextRequest, NextResponse } from "next/server";

const processAppCall = async (
  request: NextRequest,
  { params }: RouteContext<"/api/apps/[appId]/[...slug]">,
) => {
  const logger = getLoggerFactory("API/apps-call")("processAppCall");
  const { appId, slug } = await params;
  const servicesContainer = await getServicesContainer();

  logger.debug(
    {
      url: request.url,
      method: request.method,
      appId,
      slug: slug?.join("/"),
    },
    "Processing app call request",
  );

  if (!appId) {
    logger.warn("Missing required appId parameter");
    return NextResponse.json({ error: "AppId is required" }, { status: 400 });
  }

  try {
    const result = await servicesContainer.connectedAppsService.processAppCall(
      appId,
      slug,
      request,
    );

    if (result) {
      logger.debug(
        {
          appId,
          slug: slug.join("/"),
          status: result.status,
        },
        "Successfully processed app call",
      );
    } else {
      logger.warn({ appId, slug: slug.join("/") }, "No app call handler found");
    }

    return (
      result ?? NextResponse.json({ error: "unknown_handler" }, { status: 404 })
    );
  } catch (error: any) {
    logger.error(
      {
        appId,
        slug: slug.join("/"),
        error: error?.message || error?.toString(),
      },
      "Error processing app call",
    );
    throw error;
  }
};

export const GET = processAppCall;
export const POST = processAppCall;
export const PUT = processAppCall;
export const DELETE = processAppCall;
export const OPTIONS = processAppCall;
export const PATCH = processAppCall;
