/**
 * Core booking tracking types
 * These types are used for tracking booking flow events
 */

export type BookingStep =
  | "OPTIONS_REQUESTED"
  | "AVAILABILITY_CHECKED"
  | "DUPLICATE_CHECKED"
  | "PAYMENT_CHECKED"
  | "FORM_SUBMITTED"
  | "BOOKING_CONVERTED";

export type BookingTrackingMetadata = {
  optionId?: string;
  duration?: number;
  isPaymentRequired?: boolean;
  paymentAmount?: number;
  appointmentId?: string;
  error?: string;
  customerId?: string;
  customerEmail?: string;
  customerName?: string;
  convertedTo?: string; // e.g., "appointment", "waitlist", "quote", "inquiry"
  convertedId?: string; // ID of the converted entity
  convertedAppName?: string; // Name of the app that did the conversion
};

/** Dot-scoped event name (e.g. `booking.tracking.*` patterns). */
export const BOOKING_TRACKING_STEP_EVENT_TYPE =
  "booking.tracking.step" as const;

export type BookingTrackingEventData = {
  sessionId: string;
  step: BookingStep;
  metadata?: BookingTrackingMetadata;
};

/**
 * Booking tracking event stored in MongoDB
 */
export type BookingTrackingEvent = {
  _id: string;
  sessionId: string;
  organizationId: string;
  startedAt: Date;
  lastSeenAt: Date;
  abandonedAt?: Date | null;
  convertedAt?: Date | null;
  lastStep: BookingStep;
  steps: Record<BookingStep, Date>;
  optionId?: string | null;
  duration?: number | null;
  isPaymentRequired?: boolean;
  paymentAmount?: number | null;
  customerId?: string | null;
  customerEmail?: string | null;
  customerName?: string | null;
  status: "abandoned" | "converted";
  appointmentId?: string | null;
  convertedTo?: string | null;
  convertedId?: string | null;
  convertedAppName?: string | null;
  createdAt: Date;
  updatedAt: Date;
};
