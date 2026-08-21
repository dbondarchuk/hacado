import { getServicesContainer } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { requireSubscriptionFeature } from "@/lib/billing/subscription-feature-guard";
import { soldPackagesSearchParamsLoader } from "@hacado/api-sdk";
import { getLoggerFactory } from "@hacado/logger";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/customer-packages")("GET");
  const featureAccess = await requireSubscriptionFeature("packages", logger);
  if (!featureAccess.ok) return featureAccess.response;

  const auth = await requirePermission("package", "read", logger);
  if (!auth.ok) return auth.response;

  const servicesContainer = await getServicesContainer();
  const params = soldPackagesSearchParamsLoader(request.nextUrl.searchParams);
  const offset = (params.page - 1) * params.limit;

  logger.debug("Getting customer packages", { params });

  const res = await servicesContainer.packagesService.getCustomerPackages({
    customerId: params.customerId ?? undefined,
    packageId: params.packageId ?? undefined,
    status: params.status ?? undefined,
    offset,
    limit: params.limit,
    search: params.search ?? undefined,
    sort: params.sort,
  });

  logger.debug("Successfully retrieved customer packages", {
    itemsCount: res.items.length,
  });

  return NextResponse.json(res);
}
