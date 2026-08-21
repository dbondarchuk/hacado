import { getActor, getServicesContainer } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { requireSubscriptionFeature } from "@/lib/billing/subscription-feature-guard";
import { bulkDeleteSchema } from "@hacado/api-sdk";
import { getLoggerFactory } from "@hacado/logger";
import { okStatus } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/gift-cards/delete")("POST");
  const featureAccess = await requireSubscriptionFeature("giftCards", logger);
  if (!featureAccess.ok) return featureAccess.response;

  const auth = await requirePermission("giftCard", "delete", logger);
  if (!auth.ok) return auth.response;

  const actor = await getActor();
  const servicesContainer = await getServicesContainer();
  logger.debug(
    {
      url: request.url,
      method: request.method,
    },
    "Processing delete gift cards API request",
  );

  const body = await request.json();
  const { data, success, error } = bulkDeleteSchema.safeParse(body);

  if (!success) {
    logger.warn({ error }, "Invalid delete gift cards request format");
    return NextResponse.json(
      { error, success: false, code: "invalid_request_format" },
      { status: 400 },
    );
  }

  await servicesContainer.giftCardsService.deleteGiftCards(data.ids, actor);

  logger.debug({ ids: data.ids }, "Gift cards deleted successfully");
  return NextResponse.json(okStatus, { status: 200 });
}
