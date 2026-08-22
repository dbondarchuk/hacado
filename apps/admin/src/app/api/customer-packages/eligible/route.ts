import { getServicesContainer } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { requireSubscriptionFeature } from "@/lib/billing/subscription-feature-guard";
import { getLoggerFactory } from "@hacado/logger";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/customer-packages/eligible")("GET");
  const featureAccess = await requireSubscriptionFeature("packages", logger);
  if (!featureAccess.ok) return featureAccess.response;

  const { ok, response } = await requirePermission("package", "read", logger);

  if (!ok) return response;

  logger.debug("Getting eligible packages", {
    request: request.nextUrl.searchParams,
  });

  const customerId = request.nextUrl.searchParams.get("customerId") ?? "";
  const optionId = request.nextUrl.searchParams.get("optionId") ?? "";
  const memberId = request.nextUrl.searchParams.get("memberId") ?? "";
  const dateTimeRaw = request.nextUrl.searchParams.get("dateTime");
  const appointmentDate = dateTimeRaw ? new Date(dateTimeRaw) : new Date();

  if (!customerId || !optionId || !memberId) {
    logger.debug("Invalid request parameters", {
      customerId,
      optionId,
      memberId,
    });
    return NextResponse.json({ items: [] });
  }

  const servicesContainer = await getServicesContainer();
  const option = await servicesContainer.servicesService.getOption(optionId);
  const optionStaffMemberIds = (option?.staff ?? []).map((s) => s.memberId);

  const items = await servicesContainer.packagesService.findEligible({
    customerId,
    optionId,
    memberId,
    appointmentDate,
    optionStaffMemberIds,
  });

  logger.debug("Successfully retrieved eligible packages", {
    itemsCount: items.length,
  });
  return NextResponse.json({ items });
}
