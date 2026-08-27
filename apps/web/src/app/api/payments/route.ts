import { isSubscriptionPastDue } from "@/utils/subscription-access";
import { getLoggerFactory } from "@hacado/logger";
import { NextRequest } from "next/server";
import { createOrUpdateIntent } from "../../../utils/payments/create-intent";

export async function POST(request: NextRequest) {
  const logger = getLoggerFactory("API/payments")("PUT");

  logger.debug(
    {
      url: request.url,
      method: request.method,
    },
    "Processing payments API request",
  );

  const subscriptionStatus = request.headers.get("x-subscription-status");
  if (isSubscriptionPastDue(subscriptionStatus)) {
    return Response.json(
      {
        success: false,
        code: "subscription_past_due",
        message: "Something went wrong, please contact us.",
      },
      { status: 402 },
    );
  }

  try {
    const result = await createOrUpdateIntent(request);

    if (!result || result.status >= 400) {
      logger.error(
        {
          status: result.status,
        },
        "Getting if payment is required has failed",
      );
    } else {
      logger.debug(
        {
          success: true,
        },
        "Successfully processed payment intent",
      );
    }

    return result;
  } catch (error: any) {
    logger.error(
      {
        error: error?.message || error?.toString(),
      },
      "Error processing payment intent",
    );
    throw error;
  }
}
