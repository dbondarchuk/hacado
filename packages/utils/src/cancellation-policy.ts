import {
  AppointmentRescheduleConfiguration,
  AppointmentWithDepositCancellationConfiguration,
  AppointmentWithoutDepositCancellationConfiguration,
} from "@hacado/types";
import { DateTime } from "luxon";

/**
 * Determine which policy row applies for a given time to appointment.
 *
 * @param policies - validated PolicyList (sorted ascending by timeBeforeAppointmentMinutes)
 * @param timeBeforeAppointmentMinutes - difference in minutes (appointment - now)
 * @param defaultPolicy - optional fallback policy if time is larger than the last threshold
 */
export function findApplicablePolicy<
  T extends
    | Exclude<
        AppointmentWithDepositCancellationConfiguration,
        { enabled?: false | undefined }
      >
    | Exclude<
        AppointmentWithoutDepositCancellationConfiguration,
        { enabled?: false | undefined }
      >
    | Exclude<
        AppointmentRescheduleConfiguration,
        { enabled?: false | undefined }
      >,
>(
  policies: NonNullable<T["policies"]>,
  timeBeforeAppointmentMinutes: number,
  defaultPolicy: T["defaultPolicy"],
): NonNullable<T["policies"]>[number] | T["defaultPolicy"] | undefined {
  if (!policies || policies.length === 0) return defaultPolicy;

  // iterate from smallest threshold to largest
  for (let i = policies.length - 1; i >= 0; i--) {
    const p = policies[i];
    if (timeBeforeAppointmentMinutes >= p.minutesToAppointment) {
      return p;
    }
  }

  // If we got here, timeBeforeAppointmentMinutes > last policy's threshold
  // Decide what to do:
  return defaultPolicy;
}

/**
 * High-level convenience: given a feature config (cancellations or reschedules),
 * an appointment DateTime and a request DateTime, return the applicable policy or undefined.
 */
export function getPolicyForRequest<
  T extends
    | AppointmentWithDepositCancellationConfiguration
    | AppointmentWithoutDepositCancellationConfiguration
    | AppointmentRescheduleConfiguration,
>(
  featureConfig: T,
  appointmentTime: Date | DateTime,
  requestTime: Date | DateTime,
):
  | NonNullable<Exclude<T, { enabled?: false | undefined }>["policies"]>[number]
  | Exclude<T, { enabled?: false | undefined }>["defaultPolicy"]
  | undefined {
  if (!featureConfig?.enabled) return undefined;

  const appointmentDateTime =
    appointmentTime instanceof DateTime
      ? appointmentTime
      : DateTime.fromJSDate(appointmentTime);
  const requestDateTime =
    requestTime instanceof DateTime
      ? requestTime
      : DateTime.fromJSDate(requestTime);

  const diffMinutes = appointmentDateTime
    .diff(requestDateTime, "minutes")
    .as("minutes");

  if (diffMinutes <= 0) {
    return {
      minutesToAppointment: 0,
      action: "notAllowed",
    } as NonNullable<
      Exclude<T, { enabled?: false | undefined }>["policies"]
    >[number];
  }

  return findApplicablePolicy(
    featureConfig.policies ?? [],
    diffMinutes,
    featureConfig.defaultPolicy,
  );
}
