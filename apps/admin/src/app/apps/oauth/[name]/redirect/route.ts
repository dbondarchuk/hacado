import { getLoggerFactory } from "@hacado/logger";
import { ServicesContainer } from "@hacado/services";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/apps/oauth/[name]/redirect">,
) {
  const logger = getLoggerFactory("API/apps-oauth-redirect")("GET");
  const { name } = await params;

  logger.debug(
    {
      url: request.url,
      method: request.method,
      appName: name,
    },
    "Processing OAuth redirect request",
  );

  const service = ServicesContainer("").connectedAppsService;
  try {
    await service.processRedirect(name, request);

    logger.debug(
      {
        appName: name,
      },
      "Successfully processed OAuth redirect",
    );

    return new NextResponse(`<html><script>window.close()</script></html>`, {
      status: 201,
      headers: { "content-type": "text/html" },
    });
  } catch (error: any) {
    logger.error(
      {
        appName: name,
        error: error?.message || error?.toString(),
      },
      "Error processing OAuth redirect",
    );
    throw error;
  }
}
