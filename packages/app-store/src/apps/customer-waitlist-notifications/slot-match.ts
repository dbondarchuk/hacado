import { DateTime } from "luxon";
import type {
  WaitlistEntryEntity,
  WaitlistTime,
} from "../waitlist/models/waitlist";

const AFTERNOON_START_HOUR = 12;
const EVENING_START_HOUR = 16;

export function hourBandForHour(hour: number): WaitlistTime {
  if (hour < AFTERNOON_START_HOUR) {
    return "morning";
  }
  if (hour < EVENING_START_HOUR) {
    return "afternoon";
  }
  return "evening";
}

export function getSlotTimeOfDayArgs(
  slotStart: Date,
  timeZone: string,
  labels: Record<WaitlistTime, string>,
) {
  const local = DateTime.fromJSDate(slotStart, { zone: "utc" }).setZone(
    timeZone,
  );
  const band = hourBandForHour(local.hour);
  return {
    slotTimeOfDay: labels[band],
    isMorning: band === "morning",
    isAfternoon: band === "afternoon",
    isEvening: band === "evening",
  };
}

export function appointmentOptionDurationMinutes(option: {
  durationType: "fixed" | "flexible";
  duration?: number;
  durationMin?: number;
}): number | undefined {
  return option.durationType === "fixed" ? option.duration : option.durationMin;
}

export function waitlistDurationMinutes(
  entry: Pick<WaitlistEntryEntity, "duration">,
  optionDuration?: number,
): number | undefined {
  return entry.duration ?? optionDuration;
}

export function windowFitsDuration(
  windowStart: Date,
  windowEnd: Date,
  durationMinutes: number,
): boolean {
  const windowMinutes = (windowEnd.getTime() - windowStart.getTime()) / 60_000;
  return durationMinutes > 0 && durationMinutes <= windowMinutes + 1e-6;
}

/** Padded local-day range for loading schedule / calendar sources around a hole. */
export function availabilityFetchRange(
  windowStart: Date,
  windowEnd: Date,
  timeZone: string,
): { from: Date; to: Date } {
  const from = DateTime.fromJSDate(windowStart, { zone: "utc" })
    .setZone(timeZone)
    .startOf("day")
    .minus({ days: 1 })
    .toUTC()
    .toJSDate();
  const to = DateTime.fromJSDate(windowEnd, { zone: "utc" })
    .setZone(timeZone)
    .endOf("day")
    .plus({ days: 1 })
    .toUTC()
    .toJSDate();
  return { from, to };
}

export function startsInsideFreedWindow(
  starts: Date[],
  windowStart: Date,
  windowEnd: Date,
  durationMinutes: number,
): Date[] {
  const durationMs = durationMinutes * 60_000;
  const windowStartMs = windowStart.getTime();
  const windowEndMs = windowEnd.getTime();
  return starts
    .filter((start) => {
      const t = start.getTime();
      return t >= windowStartMs && t + durationMs <= windowEndMs + 1e-6;
    })
    .sort((a, b) => a.getTime() - b.getTime());
}

export function matchingStartsInFreedWindow(
  starts: Date[],
  windowStart: Date,
  windowEnd: Date,
  durationMinutes: number,
  entry: Pick<WaitlistEntryEntity, "asSoonAsPossible" | "dates">,
  timeZone: string,
): Date[] {
  return startsInsideFreedWindow(
    starts,
    windowStart,
    windowEnd,
    durationMinutes,
  ).filter((start) => waitlistEntryMatchesSlot(entry, start, timeZone));
}

export function includesSlotStart(
  starts: Date[] | undefined,
  slot: Date,
): boolean {
  const t = slot.getTime();
  return (starts ?? []).some((start) => new Date(start).getTime() === t);
}

/** Whether a freed slot matches waitlist date / ASAP / morning-afternoon-evening prefs. */
export function waitlistEntryMatchesSlot(
  entry: Pick<WaitlistEntryEntity, "asSoonAsPossible" | "dates">,
  slotStart: Date,
  timeZone: string,
): boolean {
  if (entry.asSoonAsPossible) {
    return true;
  }

  if (!entry.dates?.length) {
    return false;
  }

  const local = DateTime.fromJSDate(slotStart, { zone: "utc" }).setZone(
    timeZone,
  );

  const dateKey = local.toISODate();
  if (!dateKey) {
    return false;
  }

  const band = hourBandForHour(local.hour);
  const datePref = entry.dates.find((d) => d.date === dateKey);
  if (!datePref) {
    return false;
  }

  return datePref.time.includes(band);
}

export function matchesSmsRemoveKeyword(
  body: string,
  keyword: string,
): boolean {
  return body.trim().toLowerCase() === keyword.trim().toLowerCase();
}
