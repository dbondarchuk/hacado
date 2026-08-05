import { trackBookingStep } from "@/utils/booking-tracking";
import { isSubscriptionPastDue } from "@/utils/subscription-access";
import { getServicesContainer } from "@/utils/utils";
import { availabilitySearchParamsLoader } from "@hacado/api-sdk";
import { getLoggerFactory } from "@hacado/logger";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("API/availability")("GET");
  const servicesContainer = await getServicesContainer();
  logger.debug(
    {
      url: request.url,
      method: request.method,
      searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
    },
    "Processing availability API request",
  );

  const subscriptionStatus = request.headers.get("x-subscription-status");
  if (isSubscriptionPastDue(subscriptionStatus)) {
    return NextResponse.json(
      {
        success: false,
        code: "subscription_past_due",
        message: "Something went wrong, please contact us.",
      },
      { status: 402 },
    );
  }

  const params = availabilitySearchParamsLoader(request.nextUrl.searchParams);
  const duration = params.duration;
  let memberId = params.memberId;

  if (!duration || duration <= 0) {
    logger.warn({ duration }, "Invalid duration parameter");
    return NextResponse.json(
      {
        error: "Duration should be positive number",
        code: "invalid_duration",
        success: false,
      },
      { status: 400 },
    );
  }

  if (!memberId) {
    const members = await servicesContainer.teamService.getActiveMembers();
    if (members.length === 1) {
      memberId = members[0]._id;
    } else {
      logger.warn(
        { members },
        "Multiple members found, but no memberId provided",
      );
      return NextResponse.json(
        {
          error: "Multiple members found, but no memberId provided",
          code: "missing_member",
          success: false,
        },
        { status: 400 },
      );
    }
  }

  if (!memberId) {
    logger.warn({ memberId }, "Missing memberId parameter");
    return NextResponse.json(
      {
        error: "Member is required",
        code: "missing_member",
        success: false,
      },
      { status: 400 },
    );
  }

  // Track availability check
  await trackBookingStep(request, "AVAILABILITY_CHECKED", {
    duration,
  });

  logger.debug({ duration, memberId }, "Fetching availability");

  const availability = await servicesContainer.bookingService.getAvailability(
    duration,
    memberId,
  );

  logger.debug(
    {
      duration,
      memberId,
      availableSlots: availability.length,
    },
    "Successfully retrieved availability",
  );

  return NextResponse.json(availability);
}
