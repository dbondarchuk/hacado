import { getServicesContainer, getSession } from "@/app/utils";
import { PexelsService } from "@/utils/media-sources/pexels.service";
import { getLoggerFactory } from "@hacado/logger";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/pexels/search")("GET");
  const session = await getSession();
  if (!session) {
    logger.warn("Unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const servicesContainer = await getServicesContainer();
  const service = new PexelsService(servicesContainer.redisClient);
  if (!service.isConfigured()) {
    logger.warn("Pexels is not configured");
    return NextResponse.json(
      { error: "Pexels is not configured" },
      { status: 503 },
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query") ?? undefined;
  const mediaType = searchParams.get("type") === "video" ? "video" : "photo";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(
    80,
    Math.max(1, parseInt(searchParams.get("limit") || "24", 10) || 24),
  );

  logger.debug({ query, page, limit, mediaType }, "Searching Pexels");

  try {
    const result =
      mediaType === "video"
        ? await service.searchVideos({ query, page, perPage: limit })
        : await service.searchPhotos({ query, page, perPage: limit });

    logger.debug(
      { total: result.total, count: result.items.length, page: result.page },
      "Pexels search succeeded",
    );

    return NextResponse.json(result);
  } catch (error) {
    logger.error({ error }, "Pexels search failed");
    return NextResponse.json(
      { error: "Failed to search Pexels" },
      { status: 502 },
    );
  }
}
