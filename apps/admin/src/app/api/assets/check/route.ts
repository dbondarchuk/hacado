import { getServicesContainer } from "@/app/utils";
import { getLoggerFactory } from "@hacado/logger";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/assets/check")("GET");
  const servicesContainer = await getServicesContainer();
  logger.debug(
    {
      url: request.url,
      method: request.method,
      searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
    },
    "Processing asset filename check request",
  );

  const searchParams = request.nextUrl.searchParams;
  const filename = searchParams.get("filename");
  const id = searchParams.get("id");

  if (!filename) {
    logger.warn({ filename }, "Missing required filename parameter");
    return NextResponse.json(
      {
        success: false,
        error: "Filename is required",
        code: "missing_filename_parameter",
      },
      { status: 400 },
    );
  }

  logger.debug(
    {
      filename,
      id,
    },
    "Checking asset filename uniqueness",
  );

  try {
    const isUnique = await servicesContainer.assetsService.checkUniqueFileName(
      filename,
      id || undefined,
    );

    logger.debug(
      {
        filename,
        id,
        isUnique,
      },
      "Asset filename uniqueness check completed",
    );

    return NextResponse.json({ isUnique });
  } catch (error: any) {
    logger.error(
      {
        filename,
        id,
        error: error?.message || error?.toString(),
      },
      "Failed to check asset filename uniqueness",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to check filename uniqueness",
        code: "check_filename_failed",
      },
      { status: 500 },
    );
  }
}
