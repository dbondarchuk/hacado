import { getActor, getServicesContainer } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { requireSubscriptionFeature } from "@/lib/billing/subscription-feature-guard";
import { setGiftCardStatusSchema } from "@hacado/api-sdk";
import { getLoggerFactory } from "@hacado/logger";
import { okStatus } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: RouteContext<"/api/gift-cards/[id]/status">,
) {
  const logger = getLoggerFactory("AdminAPI/gift-cards/[id]/status")("PUT");
  const featureAccess = await requireSubscriptionFeature("giftCards", logger);
  if (!featureAccess.ok) return featureAccess.response;

  const auth = await requirePermission("giftCard", "update", logger);
  if (!auth.ok) return auth.response;

  const servicesContainer = await getServicesContainer();
  const { id } = await params;

  logger.debug(
    {
      url: request.url,
      method: request.method,
      giftCardId: id,
    },
    "Processing set gift card status API request",
  );

  const body = await request.json();
  const actor = await getActor();
  const { data, success, error } = setGiftCardStatusSchema.safeParse(body);

  if (!success) {
    logger.warn({ error }, "Invalid set gift card status request format");
    return NextResponse.json(
      {
        success: false,
        error: "Invalid request format",
        code: "invalid_request_format",
      },
      { status: 400 },
    );
  }

  const result = await servicesContainer.giftCardsService.setGiftCardStatus(
    id,
    data.status,
    actor,
  );

  if (!result) {
    logger.warn({ giftCardId: id }, "Gift card not found");
    return NextResponse.json(
      {
        success: false,
        error: "Gift card not found",
        code: "gift_card_not_found",
      },
      { status: 404 },
    );
  }

  logger.debug(
    { giftCardId: id, status: data.status },
    "Gift card status updated successfully",
  );

  return NextResponse.json(okStatus, { status: 200 });
}
