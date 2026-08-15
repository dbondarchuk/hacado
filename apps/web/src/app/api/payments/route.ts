import { trackBookingStepWithCustomer } from "@/utils/booking-tracking";
import { isSubscriptionPastDue } from "@/utils/subscription-access";
import { sessionCanUseFeature } from "@/utils/utils";
import { getLoggerFactory } from "@hacado/logger";
import {
  CollectPayment,
  CreateOrUpdatePaymentIntentRequest,
} from "@hacado/types";
import { NextRequest } from "next/server";
import { createOrUpdateIntent } from "../../../utils/payments/createIntent";

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

  if (!(await sessionCanUseFeature("payments"))) {
    return Response.json(
      {
        success: false,
        code: "subscription_upgrade_required",
        message: "Online payments are not available on this plan.",
      },
      { status: 402 },
    );
  }

  try {
    const body = (await request
      .clone()
      .json()) as CreateOrUpdatePaymentIntentRequest;

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

      // Track payment check if payment intent was created/returned
      // Only track for appointment booking (not reschedule/cancellation fees)
      try {
        if (body?.type === "deposit" || body?.type === "payment") {
          const appointmentRequest = body?.request;
          if (appointmentRequest) {
            const resultData = (await result.clone().json()) as CollectPayment;
            await trackBookingStepWithCustomer(
              request,
              "PAYMENT_CHECKED",
              appointmentRequest,
              {
                isPaymentRequired: !!resultData.intent,
                paymentAmount: resultData.intent?.amount,
              },
            );
          }
        }
      } catch (trackingError) {
        // Don't fail the request if tracking fails
        logger.debug({ trackingError }, "Failed to track payment check");
      }
      ``;
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
