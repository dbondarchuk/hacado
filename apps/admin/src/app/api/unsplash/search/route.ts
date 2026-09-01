import { getServicesContainer, getSession } from "@/app/utils";
import { UnsplashService } from "@/utils/media-sources/unsplash.service";
import { getLoggerFactory } from "@hacado/logger";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/unsplash/search")("GET");
  const session = await getSession();
  if (!session) {
    logger.warn("Unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const servicesContainer = await getServicesContainer();
  const service = new UnsplashService(servicesContainer.redisClient);
  if (!service.isConfigured()) {
    logger.warn("Unsplash is not configured");
    return NextResponse.json(
      { error: "Unsplash is not configured" },
      { status: 503 },
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query") ?? undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(
    30,
    Math.max(1, parseInt(searchParams.get("limit") || "24", 10) || 24),
  );

  logger.debug({ query, page, limit }, "Searching Unsplash photos");

  try {
    const result = await service.searchPhotos({
      query,
      page,
      perPage: limit,
    });

    logger.debug(
      { total: result.total, count: result.items.length, page: result.page },
      "Unsplash search succeeded",
    );

    return NextResponse.json(result);
  } catch (error) {
    logger.error({ error }, "Unsplash search failed");
    return NextResponse.json(
      { error: "Failed to search Unsplash" },
      { status: 502 },
    );
  }
}
