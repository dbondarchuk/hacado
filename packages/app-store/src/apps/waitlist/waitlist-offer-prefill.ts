import type { DateTime, HourNumbers, MinuteNumbers } from "@hacado/types";
import { DateTime as LuxonDateTime } from "luxon";

/** Client `fetchWithJson` revives ISO strings to `Date`; the offer API may return either. */
export function waitlistOfferSlotToDateTime(
  slot: string | Date,
  timeZone: string,
): DateTime {
  const utc = offerSlotToUtc(slot);
  const dt = utc.setZone(timeZone);
  return {
    date: new Date(dt.year, dt.month - 1, dt.day),
    time: {
      hour: dt.hour as HourNumbers,
      minute: dt.minute as MinuteNumbers,
    },
    timeZone,
  };
}

function offerSlotToUtc(slot: string | Date): LuxonDateTime {
  return slot instanceof Date
    ? LuxonDateTime.fromJSDate(slot, { zone: "utc" })
    : LuxonDateTime.fromISO(slot, { zone: "utc" });
}

/** True when `availability` still contains the offered start (unix-second match). */
export function isWaitlistOfferSlotAvailable(
  availability: Date[],
  slot: string | Date,
): boolean {
  const slotSec = Math.floor(offerSlotToUtc(slot).toMillis() / 1000);
  return availability.some(
    (start) => Math.floor(start.getTime() / 1000) === slotSec,
  );
}
