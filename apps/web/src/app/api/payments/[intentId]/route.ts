import { isSubscriptionPastDue } from "@/utils/subscription-access";
import { getLoggerFactory } from "@hacado/logger";
import { NextRequest } from "next/server";
import { createOrUpdateIntent } from "../../../../utils/payments/createIntent";

export async function PUT(
  request: NextRequest,
  { params }: RouteContext<"/api/payments/[intentId]">,
) {
  const logger = getLoggerFactory("API/payments-intent")("POST");
  const { intentId } = await params;

  logger.debug(
    {
      url: request.url,
      method: request.method,
      intentId,
    },
    "Processing payment intent API request",
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
    const result = await createOrUpdateIntent(request, intentId);

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
          intentId,
          success: true,
        },
        "Successfully processed payment intent",
      );
    }

    return result;
  } catch (error: any) {
    logger.error(
      {
        intentId,
        error: error?.message || error?.toString(),
      },
      "Error processing payment intent",
    );
    throw error;
  }
}
