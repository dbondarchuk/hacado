import { getServicesContainer, getSession } from "@/app/utils";
import { getLoggerFactory } from "@hacado/logger";
import type {
  StockMediaProviderName,
  StockMediaType,
} from "@hacado/types/stock-media";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function parseProvider(raw: string | null): StockMediaProviderName {
  return raw === "pexels" ? "pexels" : "unsplash";
}

function parseMediaType(raw: string | null): StockMediaType {
  return raw === "video" ? "video" : "photo";
}

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/stock-media/search")("GET");
  const session = await getSession();
  if (!session) {
    logger.warn("Unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const provider = parseProvider(searchParams.get("provider"));
  const mediaType = parseMediaType(searchParams.get("type"));
  const query = searchParams.get("query") ?? undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(
    80,
    Math.max(1, parseInt(searchParams.get("limit") || "24", 10) || 24),
  );

  const servicesContainer = await getServicesContainer();
  const stock = servicesContainer.stockMediaProvider;

  if (!stock.supportsMediaType(provider, mediaType)) {
    logger.warn({ provider, mediaType }, "Media type not supported");
    return NextResponse.json(
      {
        error: `${provider} does not support media type ${mediaType}`,
      },
      { status: 405 },
    );
  }

  if (!stock.isConfigured(provider)) {
    logger.warn({ provider }, "Stock media provider is not configured");
    return NextResponse.json(
      { error: `${provider} is not configured` },
      { status: 503 },
    );
  }

  logger.debug(
    { provider, mediaType, query, page, limit },
    "Searching stock media",
  );

  try {
    const result = await stock.search({
      provider,
      mediaType,
      query,
      page,
      perPage: limit,
    });

    logger.debug(
      {
        provider,
        mediaType,
        total: result.total,
        count: result.items.length,
        page: result.page,
      },
      "Stock media search succeeded",
    );

    return NextResponse.json(result);
  } catch (error) {
    logger.error({ error, provider, mediaType }, "Stock media search failed");
    return NextResponse.json(
      { error: "Failed to search stock media" },
      { status: 502 },
    );
  }
}
