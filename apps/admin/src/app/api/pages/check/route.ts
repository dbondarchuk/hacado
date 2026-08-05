import { getServicesContainer } from "@/app/utils";
import { getLoggerFactory } from "@hacado/logger";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/pages/check")("GET");
  const servicesContainer = await getServicesContainer();
  logger.debug(
    {
      url: request.url,
      method: request.method,
      searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
    },
    "Processing page slug check request",
  );

  const searchParams = request.nextUrl.searchParams;
  const slug = searchParams.get("slug");
  const id = searchParams.get("id");

  if (!slug) {
    logger.warn({ slug }, "Missing required slug parameter");
    return NextResponse.json(
      {
        success: false,
        error: "Slug is required",
        code: "missing_slug_parameter",
      },
      { status: 400 },
    );
  }

  logger.debug(
    {
      slug,
      id,
    },
    "Checking page slug uniqueness",
  );

  try {
    const isUnique = await servicesContainer.pagesService.checkUniqueSlug(
      slug,
      id || undefined,
    );

    logger.debug(
      {
        slug,
        id,
        isUnique,
      },
      "Page slug uniqueness check completed",
    );

    return NextResponse.json({ isUnique });
  } catch (error: any) {
    logger.error(
      {
        slug,
        id,
        error: error?.message || error?.toString(),
      },
      "Failed to check page slug uniqueness",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to check slug uniqueness",
        code: "check_slug_failed",
      },
      { status: 500 },
    );
  }
}
