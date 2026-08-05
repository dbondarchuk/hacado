import { getLoggerFactory } from "@hacado/logger";
import {
  BOOKING_TRACKING_STEP_EVENT_TYPE,
  BookingStep,
  BookingTrackingEventData,
  BookingTrackingMetadata,
} from "@hacado/types";
import { NextRequest } from "next/server";
import { getServicesContainer } from "./utils";

/**
 * Tracks a booking step and emits `booking.tracking.step` for subscribers (e.g. built-in tracking).
 */
export async function trackBookingStep(
  request: NextRequest,
  step: BookingStep,
  metadata?: BookingTrackingMetadata,
): Promise<void> {
  const logger = getLoggerFactory("BookingTracking")("trackBookingStep");

  try {
    const sessionId = request.headers.get("x-session-id");
    if (!sessionId) {
      logger.debug("No session ID found, skipping tracking");
      return;
    }

    const servicesContainer = await getServicesContainer();
    const eventData: BookingTrackingEventData = {
      sessionId,
      step,
      metadata,
    };

    await servicesContainer.eventService.emit(
      BOOKING_TRACKING_STEP_EVENT_TYPE,
      eventData,
      { actor: "customer", actorId: metadata?.customerId },
    );

    logger.debug(
      { sessionId, step, metadata },
      "Booking step tracked and event emitted",
    );
  } catch (error) {
    logger.error({ error, step }, "Failed to track booking step");
  }
}

/**
 * Tracks a booking step with customer info extracted from appointment request
 */
export async function trackBookingStepWithCustomer(
  request: NextRequest,
  step: BookingStep,
  appointmentRequest?: {
    fields?: {
      email: string;
      name: string;
      phone: string;
    };
    optionId?: string;
    dateTime?: Date;
    addonsIds?: string[];
  },
  metadata?: BookingTrackingMetadata,
): Promise<void> {
  let customerId: string | undefined;
  if (appointmentRequest?.fields?.email && appointmentRequest?.fields?.phone) {
    try {
      const servicesContainer = await getServicesContainer();
      const customer = await servicesContainer.customersService.findCustomer(
        appointmentRequest.fields.email,
        appointmentRequest.fields.phone,
      );
      customerId = customer?._id;
    } catch {
      // Ignore errors - customer might not exist yet
    }
  }

  const enhancedMetadata: BookingTrackingMetadata = {
    ...metadata,
    optionId: appointmentRequest?.optionId || metadata?.optionId,
    customerEmail: appointmentRequest?.fields?.email,
    customerName: appointmentRequest?.fields?.name,
    customerId,
  };

  return trackBookingStep(request, step, enhancedMetadata);
}
