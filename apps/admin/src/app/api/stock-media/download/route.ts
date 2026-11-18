import { getServicesContainer, getSession } from "@/app/utils";
import { getLoggerFactory } from "@hacado/logger";
import type { StockMediaProviderName } from "@hacado/types/stock-media";
import { NextRequest, NextResponse } from "next/server";
import * as z from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  provider: z.enum(["unsplash", "pexels"]).default("unsplash"),
  downloadLocation: z.string().url(),
});

export async function POST(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/stock-media/download")("POST");
  const session = await getSession();
  if (!session) {
    logger.warn("Unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    logger.warn({ error: parsed.error }, "Invalid download request");
    return NextResponse.json(
      { error: "Invalid request", success: false },
      { status: 400 },
    );
  }

  const { provider, downloadLocation } = parsed.data;
  const servicesContainer = await getServicesContainer();
  const stock = servicesContainer.stockMediaProvider;

  logger.debug({ provider, downloadLocation }, "Tracking stock media download");

  try {
    await stock.trackDownload({
      provider: provider as StockMediaProviderName,
      downloadLocation,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to track download";

    if (message === "Invalid download location") {
      logger.warn({ provider, downloadLocation }, "Rejected download location");
      return NextResponse.json(
        { error: "Invalid download location", success: false },
        { status: 400 },
      );
    }

    logger.error({ error, provider }, "Track download failed");
    return NextResponse.json(
      { error: "Failed to track download", success: false },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
