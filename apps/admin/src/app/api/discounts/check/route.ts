import { getServicesContainer } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { requireSubscriptionFeature } from "@/lib/billing/subscription-feature-guard";
import { checkDiscountNameAndCodeParamsLoader } from "@hacado/api-sdk";
import { getLoggerFactory } from "@hacado/logger";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/discounts/check")("GET");
  const featureAccess = await requireSubscriptionFeature("discounts", logger);
  if (!featureAccess.ok) return featureAccess.response;

  const auth = await requirePermission("discount", "read", logger);
  if (!auth.ok) return auth.response;

  const servicesContainer = await getServicesContainer();
  logger.debug(
    {
      url: request.url,
      method: request.method,
    },
    "Processing check discount name and code uniqueness API request",
  );

  const params = checkDiscountNameAndCodeParamsLoader(
    request.nextUrl.searchParams,
  );

  // if (!params.name && !params.codes?.length) {
  //   logger.warn(
  //     { params },
  //     "Invalid check discount name and code uniqueness request format",
  //   );
  //   return NextResponse.json(
  //     {
  //       error: "Missing required parameters",
  //       success: false,
  //       code: "invalid_request_format",
  //     },
  //     { status: 400 },
  //   );
  // }

  const result =
    await servicesContainer.servicesService.checkDiscountUniqueNameAndCode(
      params.name ?? undefined,
      params.codes ?? undefined,
      params.id ?? undefined,
    );

  logger.debug(
    { params, result },
    "Discount name and code uniqueness check result",
  );
  return NextResponse.json(result, { status: 200 });
}
