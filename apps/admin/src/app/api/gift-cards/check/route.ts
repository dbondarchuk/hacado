import { getServicesContainer } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { requireSubscriptionFeature } from "@/lib/billing/subscription-feature-guard";
import { checkGiftCardCodeUniqueParamsLoader } from "@hacado/api-sdk";
import { getLoggerFactory } from "@hacado/logger";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/gift-cards/check")("GET");
  const featureAccess = await requireSubscriptionFeature("giftCards", logger);
  if (!featureAccess.ok) return featureAccess.response;

  const auth = await requirePermission("giftCard", "read", logger);
  if (!auth.ok) return auth.response;

  const servicesContainer = await getServicesContainer();
  logger.debug(
    {
      url: request.url,
      method: request.method,
    },
    "Processing check gift card code uniqueness API request",
  );

  const params = checkGiftCardCodeUniqueParamsLoader(
    request.nextUrl.searchParams,
  );

  if (!params.code) {
    logger.warn({ params }, "Missing required code parameter");
    return NextResponse.json(
      {
        error: "Code is required",
        success: false,
        code: "missing_code_parameter",
      },
      { status: 400 },
    );
  }

  const result =
    await servicesContainer.giftCardsService.checkGiftCardCodeUnique(
      params.code,
      params.id ?? undefined,
    );

  logger.debug({ params, result }, "Gift card code uniqueness check result");
  return NextResponse.json(result, { status: 200 });
}
