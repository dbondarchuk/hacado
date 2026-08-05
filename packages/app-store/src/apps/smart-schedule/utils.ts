import {
  TimeSlot as BaseTimeSlot,
  DaySchedule,
  TimeSlotsFinderConfiguration,
} from "@hacado/types";
import { DateTime } from "luxon";

type TimeSlotsWithPriorityFinderConfiguration = {
  allowSkipBreak?: boolean;
  breakDuration?: number;
  filterLowPrioritySlots?: boolean;
  lowerPriorityIfNoFollowingBooking?: boolean;
  discourageLargeGaps?: boolean;
  preferBackToBack?: boolean;
  allowSmartSlotStarts?: boolean;
  preferLaterStarts?: boolean;
  preferEarlierEnds?: boolean;
} & Pick<
  TimeSlotsFinderConfiguration,
  "timeZone" | "slotStart" | "customSlots"
>;

type Period = {
  startAt: DateTime;
  endAt: DateTime;
};

export type TimeSlot = BaseTimeSlot & {
  priority: number;
};

type Props = {
  start: DateTime;
  end: DateTime;
  duration: number;
  events: Period[];
  configuration: TimeSlotsWithPriorityFinderConfiguration;
  schedule: Record<string, DaySchedule>;
  allServiceDurations?: number[];
};

function parseTimeToDateTime(
  date: DateTime,
  time: string,
  zone: string,
): DateTime {
  const [hour, minute] = time.split(":").map(Number);
  return date.setZone(zone).set({ hour, minute, second: 0, millisecond: 0 });
}

function mergeOverlappingPeriods(periods: Period[]): Period[] {
  if (periods.length === 0) return [];

  // Sort periods by start time
  const sorted = [...periods].sort(
    (a, b) => a.startAt.toMillis() - b.startAt.toMillis(),
  );
  const merged: Period[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const lastMerged = merged[merged.length - 1];

    // If current period overlaps with or is adjacent to the last merged period
    if (current.startAt <= lastMerged.endAt) {
      // Merge by extending the end time if current ends later
      if (current.endAt > lastMerged.endAt) {
        lastMerged.endAt = current.endAt;
      }
    } else {
      // No overlap, add as new period
      merged.push(current);
    }
  }

  return merged;
}

function getSlotStartTimes(
  start: DateTime,
  end: DateTime,
  config: TimeSlotsWithPriorityFinderConfiguration,
): DateTime[] {
  const {
    slotStart = 5,
    customSlots = [],
    timeZone,
    allowSmartSlotStarts,
  } = config;

  const result: DateTime[] = [];
  const seen = new Set<number>();

  if (slotStart === "custom") {
    // Include exact matches first
    for (const { hour, minute } of customSlots) {
      const dt = start
        .setZone(timeZone)
        .set({ hour, minute, second: 0, millisecond: 0 });
      if (dt >= start && dt < end) {
        result.push(dt);
        seen.add(dt.toMillis());
      }
    }

    if (allowSmartSlotStarts) {
      // Generate all 5-min slots and include those not already included
      let cursor = start.startOf("minute");
      while (cursor < end) {
        if (cursor.minute % 5 === 0 && !seen.has(cursor.toMillis())) {
          result.push(cursor);
        }
        cursor = cursor.plus({ minutes: 1 });
      }
    }

    return result.sort((a, b) => a.toMillis() - b.toMillis());
  }

  // Non-custom mode (numeric or "every-hour")
  const primaryStep = slotStart === "every-hour" ? 60 : slotStart;
  const additionalSteps = allowSmartSlotStarts
    ? [5, 10, 15, 20, 30].filter(
        (s) => s !== primaryStep && primaryStep % s === 0,
      )
    : [];

  let cursor = start.startOf("minute");
  while (cursor < end) {
    const minutes = cursor.minute;
    if (
      minutes % primaryStep === 0 ||
      (allowSmartSlotStarts && additionalSteps.some((s) => minutes % s === 0))
    ) {
      result.push(cursor);
    }
    cursor = cursor.plus({ minutes: 1 });
  }

  return result.sort((a, b) => a.toMillis() - b.toMillis());
}

export function getAvailableTimeSlotsWithPriority({
  start,
  end,
  duration,
  events,
  configuration,
  schedule,
  allServiceDurations,
}: Props): TimeSlot[] {
  const {
    breakDuration = 0,
    allowSkipBreak = false,
    timeZone,
    filterLowPrioritySlots = false,
    lowerPriorityIfNoFollowingBooking = false,
    discourageLargeGaps = false,
    preferBackToBack = false,
    preferLaterStarts = false,
    preferEarlierEnds = false,
    customSlots,
    slotStart: slotStartAt = 5,
  } = configuration;

  const days: TimeSlot[] = [];

  const sortedDurations = [...(allServiceDurations || [])].sort(
    (a, b) => b - a,
  );

  const durationWeights = new Map<number, number>();
  sortedDurations.forEach((d, i) => durationWeights.set(d, i + 1)); // weight 1 = highest priority

  function calculateFittingAppointments(availableTime: number): {
    count: number;
    totalWeight: number;
  } {
    let count = 0;
    let weightSum = 0;
    let remaining = availableTime;

    while (true) {
      const next = sortedDurations.find((d) =>
        allowSkipBreak ? d <= remaining : d + breakDuration <= remaining,
      );

      if (!next) break;

      count++;
      remaining -= allowSkipBreak ? next : next + breakDuration;
      weightSum += durationWeights.get(next)!;
    }

    return { count, totalWeight: weightSum };
  }

  for (
    let day = start.startOf("day");
    day <= end.startOf("day");
    day = day.plus({ days: 1 })
  ) {
    const dateKey = day.toISODate()!;
    const shifts = schedule[dateKey];
    if (!shifts) continue;

    for (const shift of shifts) {
      const workStart = parseTimeToDateTime(day, shift.start, timeZone);
      const workEnd = parseTimeToDateTime(day, shift.end, timeZone);
      // Filter events that overlap with the shift and clip them to shift boundaries
      const shiftEvents = events
        .filter((e) => e.startAt < workEnd && e.endAt > workStart)
        .map((e) => ({
          startAt: DateTime.max(e.startAt, workStart),
          endAt: DateTime.min(e.endAt, workEnd),
        }));

      // Create timeline with work boundaries and events, then merge overlapping periods
      const timeline: Period[] = mergeOverlappingPeriods([
        { startAt: workStart, endAt: workStart },
        ...shiftEvents,
        { startAt: workEnd, endAt: workEnd },
      ]);

      const allSlotStarts = getSlotStartTimes(workStart, workEnd, {
        ...configuration,
        allowSmartSlotStarts: false,
      })
        .filter((s) => s.plus({ minutes: duration }) <= workEnd)
        .sort((a, b) => a.toMillis() - b.toMillis());

      const firstValidSlotStart = allSlotStarts[0];
      const lastValidSlotStart = allSlotStarts[allSlotStarts.length - 1];

      for (let i = 0; i < timeline.length - 1; i++) {
        const gapStart = timeline[i].endAt;
        const gapEnd = timeline[i + 1].startAt;
        const possibleStarts = getSlotStartTimes(
          gapStart,
          gapEnd,
          configuration,
        );

        const gapSlots: (TimeSlot & {
          possibleAppointments: number;
          possibleAppointmentsWeight: number;
        })[] = [];

        for (const slotStart of possibleStarts) {
          const slotEnd = slotStart.plus({ minutes: duration });
          if (slotEnd > gapEnd || slotEnd > end || slotStart < start) continue;

          const isFirstGap = timeline[i].endAt.equals(workStart);
          const isLastGap = timeline[i + 1].startAt.equals(workEnd);

          const gapBeforeSlot = slotStart.diff(gapStart, "minutes").minutes;
          const gapAfterSlot = gapEnd.diff(slotEnd, "minutes").minutes;

          const isToShiftStart =
            slotStart.diff(firstValidSlotStart, "minutes").minutes <= 5;

          const isToShiftEnd =
            Math.abs(
              slotStart
                .plus({ minutes: duration })
                .diff(lastValidSlotStart.plus({ minutes: duration }), "minutes")
                .minutes,
            ) <= 5;

          const anyOtherServiceCanFitBefore =
            allServiceDurations &&
            allServiceDurations.some((s) => s <= gapBeforeSlot);
          const anyOtherServiceCanFitAfter =
            allServiceDurations &&
            allServiceDurations.some((s) => s <= gapAfterSlot);

          const anyOtherServiceCanFit =
            anyOtherServiceCanFitBefore || anyOtherServiceCanFitAfter;

          const hasBreakBefore =
            isToShiftStart || gapBeforeSlot >= breakDuration;
          // || allowSkipBreak;

          const hasBreakAfter =
            isToShiftEnd ||
            gapAfterSlot >= breakDuration ||
            // allowSkipBreak ||
            !anyOtherServiceCanFit;

          if ((!hasBreakAfter || !hasBreakBefore) && !allowSkipBreak) continue;

          const before = calculateFittingAppointments(gapBeforeSlot);

          const after = calculateFittingAppointments(gapAfterSlot);

          const possibleAppointments = before.count + after.count;
          const possibleAppointmentsWeight =
            before.totalWeight + after.totalWeight;

          const adjacentToEvent =
            Math.abs(slotStart.diff(timeline[i].endAt, "minutes").minutes) <=
              breakDuration ||
            Math.abs(
              slotEnd.diff(timeline[i + 1].startAt, "minutes").minutes,
            ) <= breakDuration;

          const slotMatchesCustom = (() => {
            if (slotStartAt === "custom") {
              return customSlots?.some(
                (t) =>
                  t.hour === slotStart.hour && t.minute === slotStart.minute,
              );
            }
            const step = slotStartAt === "every-hour" ? 60 : slotStartAt;
            return slotStart.minute % step === 0;
          })();

          let priority = 0;

          if (slotMatchesCustom) priority += 3;
          if (hasBreakBefore && !isToShiftStart && !anyOtherServiceCanFitBefore)
            priority += 1;
          if (hasBreakAfter && !isToShiftEnd && !anyOtherServiceCanFitAfter)
            priority += 1;

          if (
            preferBackToBack &&
            adjacentToEvent &&
            !isToShiftStart &&
            !isToShiftEnd
          )
            priority += 1;
          if (lowerPriorityIfNoFollowingBooking && !anyOtherServiceCanFit)
            priority -= 1;

          // if (allowSkipBreak && (!hasBreakBefore || !hasBreakAfter)) {
          //   priority -= 1;
          // }

          if (!anyOtherServiceCanFit) {
            const isBackToBack = adjacentToEvent && preferBackToBack;

            const penalizeGap = (
              gapMinutes: number,
              isAtShiftEdge: boolean,
              isBackToBack: boolean,
            ): number => {
              if (isBackToBack) {
                if (gapMinutes > 120) return isAtShiftEdge ? 1 : 2;
                if (gapMinutes > 60) return 1;
                if (gapMinutes > 30) return 0;
              } else {
                if (gapMinutes > 120) return isAtShiftEdge ? 1 : 3;
                if (gapMinutes > 60) return isAtShiftEdge ? 1 : 2;
                if (gapMinutes > 30) return isAtShiftEdge ? 0 : 1;
              }
              return 0;
            };
            // Prefer later starts: if no other service fits, prefer slot with lesser gap after
            if (preferLaterStarts && isFirstGap) {
              // Add priority bonus inversely proportional to gap after (smaller gap = higher bonus)
              // Formula: bonus = 2 / (1 + gapMinutes / 10)
              // This gives: gap=0 -> bonus=2.0, gap=10 -> bonus=1, gap=30 -> bonus=0.5
              const gapAfterBonus = 2 / (1 + gapAfterSlot / 10);
              priority += gapAfterBonus;
            } else if (discourageLargeGaps) {
              priority -= penalizeGap(
                gapBeforeSlot,
                isToShiftStart,
                isBackToBack,
              );
            }

            // Prefer earlier ends: if no other service fits, prefer slot with lesser gap before
            if (preferEarlierEnds && isLastGap) {
              // Add priority bonus inversely proportional to gap before (smaller gap = higher bonus)
              const gapBeforeBonus = 2 / (1 + gapBeforeSlot / 10);
              priority += gapBeforeBonus;
            } else if (discourageLargeGaps) {
              priority -= penalizeGap(gapAfterSlot, isToShiftEnd, isBackToBack);
            }
          }

          gapSlots.push({
            startAt: slotStart.toJSDate(),
            endAt: slotEnd.toJSDate(),
            duration,
            priority,
            possibleAppointments,
            possibleAppointmentsWeight,
          });
        }

        // 🔍 Filter per-gap low priority slots
        if (filterLowPrioritySlots && gapSlots.length > 0) {
          const maxAppointments = Math.max(
            ...gapSlots.map((s) => s.possibleAppointments),
          );

          if (maxAppointments > 0) {
            // Update priority for gapSlots
            for (const slot of gapSlots) {
              if (slot.possibleAppointments === maxAppointments) {
                slot.priority += 3; // primary score for being optimal in this gap
                slot.priority += 1 / slot.possibleAppointmentsWeight; // make a slightly better score for appointments with lesser weight
              }
            }
          }

          const maxPriority = Math.max(...gapSlots.map((s) => s.priority));

          // Select slots that are at least 80% of the max priority
          // This ensures we select "near top" priorities
          days.push(...gapSlots.filter((s) => s.priority >= maxPriority * 0.8));
        } else {
          days.push(...gapSlots);
        }
      }
    }
  }

  return days;
}
