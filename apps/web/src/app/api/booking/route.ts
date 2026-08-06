import { getAppointmentEventAndIsPaymentRequired } from "@/utils/appointments/get-payment-required";
import { trackBookingStepWithCustomer } from "@/utils/booking-tracking";
import { isSubscriptionPastDue } from "@/utils/subscription-access";
import { getServicesContainer } from "@/utils/utils";
import { getLoggerFactory } from "@hacado/logger";
import {
  AppointmentLimitReachedError,
  appointmentRequestSchema,
  AppointmentTimeNotAvaialbleError,
} from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const logger = getLoggerFactory("API/booking")("POST");
  const servicesContainer = await getServicesContainer();
  logger.debug(
    {
      url: request.url,
      method: request.method,
    },
    "Processing event API request",
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

  const formData = await request.formData();

  const json = formData.get("json") as string;
  if (!json) {
    logger.warn("Missing JSON data in form");
    return NextResponse.json(
      {
        success: false,
        error: "json_missing",
        message: "JSON with event data is missing",
      },
      { status: 400 },
    );
  }

  const appointmentRequestParsed = JSON.parse(json);
  const {
    data: appointmentRequest,
    success: parseSuccess,
    error: parseError,
  } = appointmentRequestSchema.safeParse(appointmentRequestParsed);

  if (!parseSuccess) {
    logger.warn({ parseError }, "Invalid appointment request format");
    return NextResponse.json(parseError, { status: 400 });
  }

  logger.debug(
    {
      customerEmail: appointmentRequest.fields.email,
      customerName: appointmentRequest.fields.name,
      dateTime: appointmentRequest.dateTime,
      hasPaymentIntent: !!appointmentRequest.paymentIntentId,
    },
    "Processing appointment request",
  );

  let files: Record<string, File> | undefined = undefined;
  const fileFields = formData.getAll("fileField") as string[];
  if (!!fileFields) {
    try {
      files = fileFields.reduce(
        (map, fileField) => {
          const file = formData.get(`file_${fileField}`) as File;
          if (!file) {
            throw new Error("File field is not present");
          }

          return {
            ...map,
            [fileField]: file,
          };
        },
        {} as Record<string, File>,
      );
    } catch (e: any) {
      logger.warn({ error: e?.message }, "File upload error");
      return NextResponse.json(
        { success: false, error: "file_not_uploaded", message: e?.message },
        { status: 400 },
      );
    }
  }

  logger.debug(
    {
      fileCount: files ? Object.keys(files).length : 0,
    },
    "Processing files",
  );

  const eventOrError = await getAppointmentEventAndIsPaymentRequired(
    appointmentRequest,
    false,
    files,
  );

  if ("error" in eventOrError) {
    logger.warn(
      {
        error: eventOrError.error.code,
        message: eventOrError.error.message,
        status: eventOrError.error.status,
      },
      "Appointment event creation failed",
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

  let paymentIntentId = appointmentRequest.paymentIntentId;
  if (eventOrError.isPaymentRequired) {
    if (!paymentIntentId) {
      logger.warn("Payment required but no payment intent provided");
      return NextResponse.json(
        { success: false, error: "payment_required" },
        { status: 402 },
      ); // Payment required
    }

    const paymentIntent =
      await servicesContainer.paymentsService.getIntent(paymentIntentId);
    if (!paymentIntent) {
      logger.warn({ paymentIntentId }, "Payment intent not found");
      return NextResponse.json(
        { success: false, error: "payment_intent_not_found" },
        { status: 402 },
      ); // Payment required
    }

    if (paymentIntent.status !== "paid") {
      logger.warn(
        { paymentIntentId, status: paymentIntent.status },
        "Payment not paid",
      );
      return NextResponse.json(
        { success: false, error: "payment_not_paid" },
        { status: 402 },
      ); // Payment required
    }

    if (paymentIntent.amount !== eventOrError.amount) {
      logger.warn(
        {
          paymentIntentId,
          paymentAmount: paymentIntent.amount,
          requiredAmount: eventOrError.amount,
        },
        "Payment amount mismatch",
      );
      return NextResponse.json(
        { success: false, error: "payment_amount_dont_match" },
        { status: 402 },
      ); // Payment required
    }
  } else if (paymentIntentId) {
    logger.warn("Payment not required but payment intent provided");

    const paymentIntent =
      await servicesContainer.paymentsService.getIntent(paymentIntentId);

    if (!paymentIntent) {
      logger.warn({ paymentIntentId }, "Payment intent not found");
    } else if (paymentIntent.status !== "paid") {
      logger.warn(
        { paymentIntentId },
        "Payment intent is not paid. Removing it",
      );
      paymentIntentId = undefined;
    }
  }

  // Get session ID for tracking
  const sessionId = request.headers.get("x-session-id");

  // Track form submission attempt
  await trackBookingStepWithCustomer(
    request,
    "FORM_SUBMITTED",
    appointmentRequest,
    {
      isPaymentRequired: eventOrError.isPaymentRequired,
      paymentAmount: eventOrError.isPaymentRequired
        ? eventOrError.amount
        : undefined,
    },
  );

  try {
    // Store sessionId in event data for later tracking
    const eventWithSessionId = {
      ...eventOrError.event,
      data: {
        ...eventOrError.event.data,
        sessionId, // Store for onAppointmentCreated hook
      },
    };

    const result = await servicesContainer.bookingService.createAppointment({
      event: eventWithSessionId,
      paymentIntentId,
      files,
      eventSource: { actor: "customer" },
      giftCards: eventOrError.giftCards,
      memberId: appointmentRequest.memberId,
    });

    await trackBookingStepWithCustomer(
      request,
      "BOOKING_CONVERTED",
      appointmentRequest,
      {
        convertedTo: "appointment",
        convertedId: result._id,
        appointmentId: result._id,
        optionId: eventOrError.event.option._id,
        duration: eventOrError.event.totalDuration,
        customerId: appointmentRequest.fields.email,
        customerEmail: appointmentRequest.fields.email,
        customerName: appointmentRequest.fields.name,
        isPaymentRequired: eventOrError.isPaymentRequired,
        paymentAmount: eventOrError.isPaymentRequired
          ? eventOrError.amount
          : undefined,
      },
    );

    logger.debug(
      {
        eventId: result._id,
        customerEmail: appointmentRequest.fields.email,
        customerName: appointmentRequest.fields.name,
        isPaymentRequired: eventOrError.isPaymentRequired,
      },
      "Successfully created appointment event",
    );

    return NextResponse.json(
      { success: true, id: result._id },
      { status: 201 },
    );
  } catch (e: any) {
    // Track failure
    await trackBookingStepWithCustomer(
      request,
      "FORM_SUBMITTED",
      appointmentRequest,
      {
        error:
          e instanceof AppointmentTimeNotAvaialbleError
            ? "time_not_available"
            : "unknown_error",
        isPaymentRequired: eventOrError.isPaymentRequired,
        paymentAmount: eventOrError.isPaymentRequired
          ? eventOrError.amount
          : undefined,
      },
    );

    if (e instanceof AppointmentTimeNotAvaialbleError) {
      logger.warn({ error: e?.message }, "Appointment time not available");
      return NextResponse.json(
        { success: false, error: "time_not_available", message: e?.message },
        { status: 400 },
      );
    }

    if (e instanceof AppointmentLimitReachedError) {
      return NextResponse.json(
        {
          success: false,
          code: e.code,
          message: e.message,
          limit: e.limit,
        },
        { status: 402 },
      );
    }

    logger.error(
      { error: e?.message || e?.toString() },
      "Error creating appointment event",
    );
    throw e;
  }
}
