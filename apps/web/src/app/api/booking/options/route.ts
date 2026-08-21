import { trackBookingStep } from "@/utils/booking-tracking";
import { getCustomerSessionFromRequest } from "@/utils/customer-auth/session";
import {
  getPlanTier,
  getServicesContainer,
  sessionCanUseFeature,
} from "@/utils/utils";
import { getLoggerFactory } from "@hacado/logger";
import { BillingPlanTier, FREE_TIER_LIMITS } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("API/booking/options")("GET");
  const servicesContainer = await getServicesContainer();
  logger.debug(
    {
      url: request.url,
      method: request.method,
    },
    "Processing booking options API request",
  );

  // Track booking started
  await trackBookingStep(request, "OPTIONS_REQUESTED");

  const [session, canUsePackages] = await Promise.all([
    getCustomerSessionFromRequest(),
    sessionCanUseFeature("packages"),
  ]);
  let response = await servicesContainer.bookingService.getAppointmentOptions({
    customerId: canUsePackages ? session?.customerId : undefined,
  });

  const planTier = await getPlanTier();
  if (
    planTier === BillingPlanTier.Free &&
    response?.options &&
    response.options.length > FREE_TIER_LIMITS.services
  ) {
    logger.debug(
      {
        optionsCount: response.options.length,
        freeTierLimit: FREE_TIER_LIMITS.services,
      },
      "Free tier limit reached, slicing options",
    );

    const options = response.options.slice(0, FREE_TIER_LIMITS.services);
    response = {
      ...response,
      options,
    };
  }

  const canUseDiscounts = await sessionCanUseFeature("discounts");

  if (!canUseDiscounts || !canUsePackages) {
    const filterCatalog = (
      nodes: NonNullable<typeof response.catalog>,
    ): NonNullable<typeof response.catalog> =>
      nodes
        .map((node) => {
          if (node.type === "group") {
            const children = filterCatalog(node.children);
            return children.length ? { ...node, children } : null;
          }
          if (node.type === "package") {
            return canUsePackages ? node : null;
          }
          return node;
        })
        .filter((node): node is NonNullable<typeof node> => node !== null);

    response = {
      ...response,
      showPromoCode: canUseDiscounts ? response.showPromoCode : false,
      packages: canUsePackages ? response.packages : [],
      hasActiveCustomerPackages: canUsePackages
        ? response.hasActiveCustomerPackages
        : false,
      catalog: response.catalog
        ? filterCatalog(response.catalog)
        : response.catalog,
    };
  }

  logger.debug(
    {
      optionsCount: response.options.length,
      showPromoCode: response.showPromoCode,
    },
    "Successfully retrieved booking options",
  );

  return NextResponse.json(response);
}
