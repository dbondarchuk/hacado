import { getServicesContainer, getSession } from "@/app/utils";
import { UnsplashService } from "@/utils/media-sources/unsplash.service";
import { getLoggerFactory } from "@hacado/logger";
import { NextRequest, NextResponse } from "next/server";
import * as z from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  downloadLocation: z.string().url(),
});

export async function POST(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/unsplash/download")("POST");
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

  const { downloadLocation } = parsed.data;
  const servicesContainer = await getServicesContainer();
  const service = new UnsplashService(servicesContainer.redisClient);

  if (!service.isValidDownloadLocation(downloadLocation)) {
    logger.warn({ downloadLocation }, "Rejected download location");
    return NextResponse.json(
      { error: "Invalid download location", success: false },
      { status: 400 },
    );
  }

  logger.debug({ downloadLocation }, "Tracking Unsplash download");
  await service.trackDownload(downloadLocation);

  return NextResponse.json({ ok: true });
}
