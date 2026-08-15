import { getServicesContainer } from "@/app/utils";
import { getLoggerFactory } from "@hacado/logger";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/services/options/check")("GET");
  const servicesContainer = await getServicesContainer();
  logger.debug(
    {
      url: request.url,
      method: request.method,
      searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
    },
    "Processing service option name check request",
  );

  const searchParams = request.nextUrl.searchParams;
  const name = searchParams.get("name");
  const id = searchParams.get("id");

  if (!name) {
    logger.warn({ name }, "Missing required name parameter");
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
      name,
      id,
    },
    "Checking service option name uniqueness",
  );

  try {
    const isUnique =
      await servicesContainer.servicesService.checkOptionUniqueName(
        name,
        id || undefined,
      );

    logger.debug(
      {
        name,
        id,
        isUnique,
      },
      "Service option name uniqueness check completed",
    );

    return NextResponse.json({ isUnique });
  } catch (error: any) {
    logger.error(
      {
        name,
        id,
        error: error?.message || error?.toString(),
      },
      "Failed to check service option name uniqueness",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to check name uniqueness",
        code: "check_name_failed",
      },
      { status: 500 },
    );
  }
}
