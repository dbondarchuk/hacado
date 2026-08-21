import { getServicesContainer } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { requireSubscriptionFeature } from "@/lib/billing/subscription-feature-guard";
import { getLoggerFactory } from "@hacado/logger";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/gift-cards/[id]/payments">,
) {
  const logger = getLoggerFactory("AdminAPI/gift-cards/[id]/payments")("GET");
  const featureAccess = await requireSubscriptionFeature("giftCards", logger);
  if (!featureAccess.ok) return featureAccess.response;

  const auth = await requirePermission("giftCard", "read", logger);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  logger.debug(
    {
      url: request.url,
      method: request.method,
      giftCardId: id,
    },
    "Getting gift card payments",
  );

  const servicesContainer = await getServicesContainer();
  const giftCard = await servicesContainer.giftCardsService.getGiftCard(id);
  if (!giftCard) {
    logger.warn({ giftCardId: id }, "Gift card not found");
    return NextResponse.json(null, { status: 404 });
  }

  const payments =
    await servicesContainer.giftCardsService.getGiftCardPayments(id);
  logger.debug(
    { giftCardId: id, count: payments.length },
    "Gift card payments retrieved",
  );

  return NextResponse.json(payments);
}
