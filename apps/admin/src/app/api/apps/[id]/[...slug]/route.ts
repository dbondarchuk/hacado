import { getServicesContainer } from "@/app/utils";
import { getLoggerFactory } from "@hacado/logger";
import { NextRequest, NextResponse } from "next/server";

const processAppCall = async (
  request: NextRequest,
  { params }: RouteContext<"/api/apps/[id]/[...slug]">,
) => {
  const logger = getLoggerFactory("API/apps-call")("processAppCall");
  const { id, slug } = await params;
  const servicesContainer = await getServicesContainer();

  logger.debug(
    {
      url: request.url,
      method: request.method,
      appId: id,
      slug: slug?.join("/"),
    },
    "Processing app call request",
  );

  if (!id) {
    logger.warn("Missing required appId parameter");
    return NextResponse.json({ error: "AppId is required" }, { status: 400 });
  }

  try {
    const result = await servicesContainer.connectedAppsService.processAppCall(
      id,
      slug,
      request,
    );

    if (result) {
      logger.debug(
        {
          appId: id,
          slug: slug.join("/"),
          status: result.status,
        },
        "Successfully processed app call",
      );
    } else {
      logger.warn(
        { appId: id, slug: slug.join("/") },
        "No app call handler found",
      );
    }

    return (
      result ?? NextResponse.json({ error: "unknown_handler" }, { status: 404 })
    );
  } catch (error: any) {
    logger.error(
      {
        appId: id,
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
