import { trackBookingStep } from "@/utils/booking-tracking";
import { getPlanTier, getServicesContainer } from "@/utils/utils";
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

  let response = await servicesContainer.bookingService.getAppointmentOptions();

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

  logger.debug(
    {
      optionsCount: response.options.length,
      showPromoCode: response.showPromoCode,
    },
    "Successfully retrieved booking options",
  );

  return NextResponse.json(response);
}
