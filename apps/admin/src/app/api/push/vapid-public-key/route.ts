import { getLoggerFactory } from "@hacado/logger";
import { getVapidPublicKey } from "@hacado/services/push-notifications";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const logger = getLoggerFactory("AdminAPI/push/vapid-public-key")("GET");
  logger.debug("Fetching VAPID public key");

  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    logger.warn("VAPID public key is not configured");
    return NextResponse.json(
      { error: "Push notifications are not configured" },
      { status: 503 },
    );
  }

  logger.debug("Returning VAPID public key");
  return NextResponse.json({ publicKey });
}
