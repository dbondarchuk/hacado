import { getModifyAppointmentInformationRequestResult } from "@/utils/appointments/get-modify-appointment-request";
import {
  CustomerSessionRequiredError,
  requireCustomerSession,
} from "@/utils/customer-auth/session";
import { isSubscriptionPastDue } from "@/utils/subscription-access";
import { getLoggerFactory } from "@hacado/logger";
import { modifyAppointmentInformationRequestSchema } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const logger = getLoggerFactory("API/booking/modify")("POST");

  logger.debug(
    {
      url: request.url,
      method: request.method,
    },
    "Processing fetching appointment information for modify appointment API request",
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

  const json = await request.json();

  const {
    data: modifyAppointmentInformationRequest,
    success: parseSuccess,
    error: parseError,
  } = modifyAppointmentInformationRequestSchema.safeParse(json);

  if (!parseSuccess) {
    logger.warn({ parseError }, "Invalid request format");
    return NextResponse.json(parseError, { status: 400 });
  }

  logger.debug(
    {
      type: modifyAppointmentInformationRequest.type,
      lookup: modifyAppointmentInformationRequest.lookup,
    },
    "Processing appointment cancel or reschedule information request",
  );

  let session;
  try {
    session = await requireCustomerSession();
  } catch (error) {
    if (error instanceof CustomerSessionRequiredError) {
      return NextResponse.json(
        { success: false, error: "unauthorized" },
        { status: 401 },
      );
    }
    throw error;
  }

  const eventOrError = await getModifyAppointmentInformationRequestResult(
    modifyAppointmentInformationRequest,
    session,
  );

  if ("error" in eventOrError) {
    logger.warn(
      {
        error: eventOrError.error.code,
        message: eventOrError.error.message,
        status: eventOrError.error.status,
      },
      "Appointment cancel or reschedule information request failed",
    );
    return NextResponse.json(
      {
        success: false,
        error: eventOrError.error.code,
        message: eventOrError.error.message,
      },
      { status: eventOrError.error.status },
    );
  }

  const { information } = eventOrError;

  logger.debug(
    {
      allowed: information.allowed,
      reason: !information.allowed ? information.reason : undefined,
      appointmentId: information.allowed ? information.id : undefined,
    },
    "Appointment cancel or reschedule information request successful",
  );

  return NextResponse.json(information);
}
