import { DateTime } from "luxon";

export const DEFAULT_ANALYTICS_TIME_ZONE = "UTC";

/**
 * Analytics day for a session: start of the organization-local calendar day
 * of `startedAt`, as a JS Date (instant of that local midnight).
 *
 * All counters for a session (started, entered, completed, stoppedAt) use
 * this date so one session is never split across two business days.
 */
export function toAnalyticsDate(
  startedAt: Date | string,
  timeZone: string = DEFAULT_ANALYTICS_TIME_ZONE,
): Date {
  const dt =
    typeof startedAt === "string"
      ? DateTime.fromISO(startedAt, { setZone: true })
      : DateTime.fromJSDate(startedAt, { zone: "utc" });

  const zone = timeZone || DEFAULT_ANALYTICS_TIME_ZONE;
  const zoned = dt.isValid ? dt.setZone(zone) : DateTime.utc();
  const use = zoned.isValid ? zoned : DateTime.utc();
  return use.startOf("day").toJSDate();
}

export function isSessionStale(
  lastActivityAt: Date | string,
  abandonAfterSeconds: number,
  now: Date,
): boolean {
  const last =
    typeof lastActivityAt === "string"
      ? DateTime.fromISO(lastActivityAt)
      : DateTime.fromJSDate(lastActivityAt);
  if (!last.isValid) return true;
  const ageSeconds = DateTime.fromJSDate(now).diff(last, "seconds").seconds;
  return ageSeconds >= abandonAfterSeconds;
}
