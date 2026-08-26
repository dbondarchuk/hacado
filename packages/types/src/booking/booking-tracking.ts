/**
 * Core booking tracking types
 * These types are used for tracking booking flow events
 */

export type BookingStep =
  | "OPTIONS_REQUESTED" // API: booking page-load, starts the session
  | "SERVICE_SELECTED"
  | "SPECIALIST_SELECTED"
  | "ADDON_SELECTED"
  | "AVAILABILITY_CHECKED" // API: availability fetch
  | "AVAILABILITY_SELECTED"
  | "DUPLICATE_CHECKED" // API: duplicate-appointment check
  | "OTP_REQUESTED" // API: OTP send
  | "OTP_VERIFIED"
  | "PAYMENT_CHECKED"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "FORM_FILLED"
  | "BOOKING_CONVERTED";

/**
 * Progress steps the booking UI reports when the customer moves forward.
 * Conversion (`BOOKING_CONVERTED`) is recorded only on the server.
 */
export const CLIENT_TRACKABLE_BOOKING_STEPS = [
  "SERVICE_SELECTED",
  "SPECIALIST_SELECTED",
  "ADDON_SELECTED",
  "AVAILABILITY_SELECTED",
  "FORM_FILLED",
  "OTP_VERIFIED",
  "PAYMENT_CHECKED",
  "PAYMENT_SUCCESS",
  "PAYMENT_FAILED",
] as const satisfies readonly BookingStep[];

export type ClientTrackableBookingStep =
  (typeof CLIENT_TRACKABLE_BOOKING_STEPS)[number];

export const isClientTrackableBookingStep = (
  step: string,
): step is ClientTrackableBookingStep =>
  (CLIENT_TRACKABLE_BOOKING_STEPS as readonly string[]).includes(step);

/**
 * Maps a booking wizard screen to the funnel step fired when the customer
 * clicks Next on that screen.
 */
export const BOOKING_UI_STEP_TRACKING: Record<
  string,
  ClientTrackableBookingStep
> = {
  option: "SERVICE_SELECTED",
  specialist: "SPECIALIST_SELECTED",
  addons: "ADDON_SELECTED",
  calendar: "AVAILABILITY_SELECTED",
  form: "FORM_FILLED",
};

export type BookingTrackingMetadata = {
  optionId?: string;
  duration?: number;
  isPaymentRequired?: boolean;
  paymentAmount?: number;
  appointmentId?: string;
  memberId?: string;
  error?: string;
  customerId?: string;
  customerEmail?: string;
  customerName?: string;
  convertedTo?: string; // e.g. "appointment", "package", or an app conversion type
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
  /** When false, skip if no active booking session exists. Defaults to true. */
  createIfMissing?: boolean;
};

/**
 * Active booking progress session stored in Redis.
 * `currentStep` is the last tracked BookingStep (not a separate wizard id).
 */
export type BookingProgressSession = {
  sessionId: string;
  organizationId: string;
  startedAt: string;
  lastActivityAt: string;
  currentStep: BookingStep;
  enteredSteps: BookingStep[];
  status: "active" | "completed" | "abandoned";
  convertedTo?: string;
  optionId?: string;
  duration?: number;
  isPaymentRequired?: boolean;
  paymentAmount?: number;
  customerId?: string;
  customerEmail?: string;
  customerName?: string;
  appointmentId?: string;
};

export type BookingProgressAnalyticsMetrics = {
  started: number;
  completed: number;
  /** Unique sessions that entered/reached each step. */
  entered: Record<string, number>;
  /** Sessions that became inactive while currentStep was this step. */
  stoppedAt: Record<string, number>;
  /** Completed sessions grouped by convertedTo (appointment, package, …). */
  convertedTo: Record<string, number>;
};

/**
 * One MongoDB document per organization + analytics day.
 * All counters for a session land on the day of that session's startedAt
 * in the organization's business timezone.
 */
export type BookingProgressAnalyticsDaily = {
  _id?: string;
  organizationId: string;
  date: Date;
  metrics: BookingProgressAnalyticsMetrics;
  createdAt: Date;
  updatedAt: Date;
};

export type BookingProgressMetricsDelta = {
  started?: number;
  completed?: number;
  entered?: Record<string, number>;
  stoppedAt?: Record<string, number>;
  convertedTo?: Record<string, number>;
};
