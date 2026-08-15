import { getAppointmentEventFromRequest } from "@/utils/appointments/get-event";
import { trackBookingStepWithCustomer } from "@/utils/booking-tracking";
import { getServicesContainer } from "@/utils/utils";
import { getLoggerFactory } from "@hacado/logger";
import {
  appointmentRequestSchema,
  CheckDuplicateAppointmentsResponse,
} from "@hacado/types";
import { DateTime } from "luxon";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const logger = getLoggerFactory("API/booking/duplicate")("POST");
  const servicesContainer = await getServicesContainer();
  logger.debug(
    {
      url: request.url,
      method: request.method,
    },
    "Processing event duplicate API request",
  );

  const body = await request.json();

  const {
    data: appointmentRequest,
    error,
    success,
  } = appointmentRequestSchema.safeParse(body);
  if (!success) {
    logger.error(
      {
        error,
        success,
        body,
      },
      "Failed to parse request",
    );

    return NextResponse.json(error, { status: 400 });
  }

  // Track duplicate check
  await trackBookingStepWithCustomer(
    request,
    "DUPLICATE_CHECKED",
    appointmentRequest,
  );

  const eventOrError = await getAppointmentEventFromRequest(
    appointmentRequest,
    true,
  );

  if ("error" in eventOrError) {
    logger.error(
      {
        optionId: appointmentRequest.optionId,
        error: eventOrError.error,
      },
      "Failed to get event",
    );

    return NextResponse.json(
      {
        success: false,
        error: eventOrError.error.code,
        message: eventOrError.error.message,
      },
      { status: 400 },
    );
  }

  if (!eventOrError.option.duplicateAppointmentCheck?.enabled) {
    logger.debug(
      {
        optionId: appointmentRequest.optionId,
      },
      "Option does not need duplicate appointments confirmation",
    );

    return NextResponse.json({
      hasDuplicateAppointments: false,
    });
  }

  if (!eventOrError.customer) {
    logger.error(
      {
        optionId: appointmentRequest.optionId,
      },
      "Customer not found",
    );

    return NextResponse.json({
      hasDuplicateAppointments: false,
    });
  }

  const eventDateTime = DateTime.fromJSDate(eventOrError.event.dateTime);
  const range = {
    start: DateTime.max(
      DateTime.now(),
      eventDateTime.startOf("day").minus({
        days: eventOrError.option.duplicateAppointmentCheck.days,
      }),
    ).toJSDate(),
    end: eventDateTime
      .endOf("day")
      .plus({
        days: eventOrError.option.duplicateAppointmentCheck.days,
      })
      .toJSDate(),
  };

  try {
    const closestAppointments =
      await servicesContainer.bookingService.getAppointments({
        optionId: appointmentRequest.optionId,
        customerId: eventOrError.customer._id,
        range,
        status: ["pending", "confirmed"],
      });

    const allAppointmentsDates = closestAppointments.items.map((appointment) =>
      DateTime.fromJSDate(appointment.dateTime),
    );

    const closestAppointment = allAppointmentsDates.sort(
      (a, b) =>
        eventDateTime.diff(a).toMillis() - eventDateTime.diff(b).toMillis(),
    )[0];

    const response: CheckDuplicateAppointmentsResponse = {
      hasDuplicateAppointments: closestAppointments.total > 0,
      closestAppointment: closestAppointment?.toJSDate(),
      doNotAllowScheduling:
        eventOrError.option.duplicateAppointmentCheck.doNotAllowScheduling ??
        false,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    logger.error(
      {
        optionId: appointmentRequest.optionId,
        customerId: eventOrError.customer._id,
        range,
        status: ["pending", "confirmed"],
        error: error?.message || error?.toString(),
      },
      "Error getting duplicate appointment",
    );
    throw error;
  }
}
