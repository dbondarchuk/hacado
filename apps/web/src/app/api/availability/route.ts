import { trackBookingStep } from "@/utils/booking-tracking";
import { isSubscriptionPastDue } from "@/utils/subscription-access";
import { getServicesContainer } from "@/utils/utils";
import { availabilitySearchParamsLoader } from "@hacado/api-sdk";
import { getLoggerFactory } from "@hacado/logger";
import { AvailabilityByMember } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";
import pLimit from "p-limit";

const AVAILABILITY_CONCURRENCY = 5;

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
  const memberIds = params.memberIds ?? [];
  const durations = params.durations ?? [];

  if (!memberIds.length) {
    logger.warn({ memberIds }, "Missing memberIds parameter");
    return NextResponse.json(
      {
        error: "At least one memberId is required",
        code: "missing_member",
        success: false,
      },
      { status: 400 },
    );
  }

  if (durations.length !== memberIds.length) {
    logger.warn(
      { memberIds, durations },
      "memberIds and durations length mismatch",
    );

    return NextResponse.json(
      {
        error: "durations must have the same length as memberIds",
        code: "invalid_durations",
        success: false,
      },
      { status: 400 },
    );
  }

  // AvailabilityByMember is keyed by memberId; duplicates would collapse in
  // Object.fromEntries and silently drop all but the last result per id.
  if (new Set(memberIds).size !== memberIds.length) {
    logger.warn({ memberIds }, "Duplicate memberIds in availability request");
    return NextResponse.json(
      {
        error: "memberIds must be unique",
        code: "duplicate_member",
        success: false,
      },
      { status: 400 },
    );
  }

  if (durations.some((d) => !d || d <= 0)) {
    logger.warn({ durations }, "Invalid duration parameter");
    return NextResponse.json(
      {
        error: "Duration should be positive number",
        code: "invalid_duration",
        success: false,
      },
      { status: 400 },
    );
  }

  logger.debug({ memberIds, durations }, "Fetching availability");

  await trackBookingStep(request, "AVAILABILITY_CHECKED", {
    duration: durations[0],
    memberId: memberIds[0],
  });

  const limit = pLimit(AVAILABILITY_CONCURRENCY);
  const entries = await Promise.all(
    memberIds.map((memberId, index) =>
      limit(async () => {
        const availability =
          await servicesContainer.bookingService.getAvailability(
            durations[index],
            memberId,
          );

        return [memberId, availability] as const;
      }),
    ),
  );

  const availabilityByMember: AvailabilityByMember =
    Object.fromEntries(entries);

  logger.debug(
    {
      memberIds,
      slotCounts: Object.fromEntries(
        Object.entries(availabilityByMember).map(([id, slots]) => [
          id,
          slots.length,
        ]),
      ),
    },
    "Successfully retrieved availability",
  );

  return NextResponse.json(availabilityByMember);
}
