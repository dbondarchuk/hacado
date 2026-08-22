import { getActor, getServicesContainer } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { requireSubscriptionFeature } from "@/lib/billing/subscription-feature-guard";
import { setGiftCardsStatusSchema } from "@hacado/api-sdk";
import { getLoggerFactory } from "@hacado/logger";
import { okStatus } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/gift-cards/set-status")("POST");
  const featureAccess = await requireSubscriptionFeature("giftCards", logger);
  if (!featureAccess.ok) return featureAccess.response;

  const auth = await requirePermission("giftCard", "update", logger);
  if (!auth.ok) return auth.response;

  const servicesContainer = await getServicesContainer();
  const actor = await getActor();
  logger.debug(
    {
      url: request.url,
      method: request.method,
    },
    "Processing set gift cards status API request",
  );

  const body = await request.json();
  const { data, success, error } = setGiftCardsStatusSchema.safeParse(body);

  if (!success) {
    logger.warn({ error }, "Invalid set gift cards status request format");
    return NextResponse.json(
      {
        success: false,
        error: "Invalid request format",
        code: "invalid_request_format",
      },
      { status: 400 },
    );
  }

  await servicesContainer.giftCardsService.setGiftCardsStatus(
    data.ids,
    data.status,
    actor,
  );

  logger.debug(
    { ids: data.ids, status: data.status },
    "Gift cards status updated successfully",
  );

  return NextResponse.json(okStatus, { status: 200 });
}
