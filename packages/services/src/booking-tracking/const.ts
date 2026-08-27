import { BookingStep } from "@hacado/types";

// Constants
export const BOOKING_TRACKING_APP_ID = "booking-tracking";

export const ABANDON_AFTER_SECONDS = 30 * 60; // 30 minutes
export const ABANDONED_BOOKINGS_JOB_SCHEDULE_INTERVAL_SECONDS = 15 * 60; // 15 minutes
export const ABANDONED_BOOKINGS_JOB_ID = "booking-tracking-process-abandoned";
export const ABANDONED_BOOKINGS_JOB_TYPE = "processAbandonedBookings";

export const REDIS_TTL_SECONDS = 60 * 60 * 24 * 2; // 2 days
export const REDIS_KEY_PREFIX = "booking:session";

export const ALL_BOOKING_STEPS: readonly BookingStep[] = [
  "OPTIONS_REQUESTED",
  "SERVICE_SELECTED",
  "SPECIALIST_SELECTED",
  "ADDON_SELECTED",
  "AVAILABILITY_CHECKED",
  "AVAILABILITY_SELECTED",
  "DUPLICATE_CHECKED",
  "OTP_REQUESTED",
  "OTP_VERIFIED",
  "PAYMENT_CHECKED",
  "PAYMENT_SUCCESS",
  "PAYMENT_FAILED",
  "FORM_FILLED",
  "BOOKING_CONVERTED",
];

/** Steps that never increment metrics.entered (page-load / conversion). */
export const STEPS_EXCLUDED_FROM_ENTERED: ReadonlySet<string> = new Set([
  "OPTIONS_REQUESTED",
  "BOOKING_CONVERTED",
]);

export const getRedisKey = (
  organizationId: string,
  sessionId: string,
): string => {
  return `${REDIS_KEY_PREFIX}:${organizationId}:${sessionId}`;
};

export const getCountedStartedKey = (
  organizationId: string,
  sessionId: string,
): string => {
  return `${getRedisKey(organizationId, sessionId)}:counted:started`;
};

export const getCountedEnteredKey = (
  organizationId: string,
  sessionId: string,
  step: string,
): string => {
  return `${getRedisKey(organizationId, sessionId)}:counted:entered:${step}`;
};

export const getTerminalKey = (
  organizationId: string,
  sessionId: string,
): string => {
  return `${getRedisKey(organizationId, sessionId)}:terminal`;
};

/** Session JSON keys are `booking:session:{orgId}:{sessionId}` (4 segments). */
export const isSessionJsonKey = (key: string): boolean => {
  const parts = key.split(":");
  return parts.length === 4 && parts[0] === "booking" && parts[1] === "session";
};

export const getAbandonedBookingsJobId = (organizationId: string): string => {
  return `${ABANDONED_BOOKINGS_JOB_ID}-${organizationId}`;
};

export const getSessionTrackingKeys = (
  organizationId: string,
  sessionId: string,
): string[] => {
  return [
    getRedisKey(organizationId, sessionId),
    getCountedStartedKey(organizationId, sessionId),
    getTerminalKey(organizationId, sessionId),
    ...ALL_BOOKING_STEPS.map((step) =>
      getCountedEnteredKey(organizationId, sessionId, step),
    ),
  ];
};
