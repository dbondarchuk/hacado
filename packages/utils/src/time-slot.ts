import { DateTime as Luxon } from "luxon";

import {
  PeriodMoment,
  Shift,
  TimeSlot,
  TimeSlotPeriod,
  TimeSlotsFinderConfiguration,
  TimeSlotsFinderError,
} from "@hacado/types";

export type DateTimePeriod = {
  startAt: Luxon;
  endAt: Luxon;
};

export interface TimeSlotsFinderParameters {
  /** The calendar data. */
  calendarEvents: { startAt: Luxon; endAt: Luxon }[];
  /** The configuration specifying the rules used to find availabilities. */
  configuration: TimeSlotsFinderConfiguration;
  /** The date from which searching time slots. */
  from: Date;
  /** The date to which searching time slots. */
  to: Date;
}

/**
 * Extract available time slots from a calendar. Take a configuration to precise rules used to
 * search availabilities. If the configuration provided is invalid, an error will be thrown.
 * @throws TimeSlotsFinderError
 * @param {TimeSlotsFinderParameters} params
 * @return {TimeSlot[]}
 */
export function getAvailableTimeSlotsInCalendar(
  params: TimeSlotsFinderParameters,
): TimeSlot[] {
  const { calendarEvents, configuration, from, to } = params;

  const usedConfig = _checkSearchParameters(configuration, from, to);
  const { unavailablePeriods, timeZone } = usedConfig;

  const eventList = [
    ..._getUnavailablePeriodAsEvents(unavailablePeriods ?? [], timeZone),
  ];
  if (calendarEvents) {
    eventList.push(...calendarEvents);
  }
  const { firstFromMoment, lastToMoment } = _computeBoundaries(
    from,
    to,
    usedConfig,
  );

  const timeSlots: TimeSlot[] = [];

  let fromMoment = firstFromMoment;
  while (fromMoment < lastToMoment) {
    // Retrieve availablePeriods shifs for the given weekday
    const shifts = _getWeekDayConfigForMoment(usedConfig, fromMoment);
    if (shifts) {
      /* Go through each shift of the week day */
      shifts.forEach((shift: Shift) => {
        const { startAt, endAt } = _getMomentsFromShift(fromMoment, shift);
        /* Ensure that shift boundaries don't exceed global boundaries */
        const partialFrom = Luxon.max(firstFromMoment, startAt);
        const partialTo = Luxon.min(lastToMoment, endAt);
        if (partialFrom > partialTo) {
          /* That may happen when shift boundaries exceed global ones */
          return;
        }
        timeSlots.push(
          ..._getAvailableTimeSlotsForShift(
            usedConfig,
            eventList,
            partialFrom,
            partialTo,
          ),
        );
      });
    }
    /* Go one day forward: all shifts for this day has been processed (if any) */
    fromMoment = fromMoment.plus({ days: 1 }).startOf("day");
  }

  return timeSlots;
}

function _checkSearchParameters(
  configuration: TimeSlotsFinderConfiguration,
  from: Date,
  to: Date,
): TimeSlotsFinderConfiguration {
  if (!from || !to || from.getTime() > to.getTime()) {
    throw new TimeSlotsFinderError("Invalid boundaries for the search");
  }

  let usedConfig = configuration;
  try {
    const formattedPeriods = _mergeOverlappingShiftsInAvailablePeriods(
      configuration.schedule,
    );
    usedConfig = { ...configuration, schedule: formattedPeriods };
  } catch (_) {
    /* If workedPeriods aren't formatted well and provoke an error, the validation will fail */
  }
  /* Don't go further if configuration is invalid */
  isConfigurationValid(usedConfig);
  return usedConfig;
}

function _computeBoundaries(
  from: Date,
  to: Date,
  configuration: TimeSlotsFinderConfiguration,
) {
  const searchLimitMoment = configuration.maxDaysBeforeLastSlot
    ? Luxon.now()
        .setZone(configuration.timeZone)
        .plus({ days: configuration.maxDaysBeforeLastSlot })
        .endOf("day")
    : null;

  const firstFromMoment = Luxon.max(
    Luxon.fromJSDate(from).setZone(configuration.timeZone),
    Luxon.now()
      .setZone(configuration.timeZone)
      /* `minAvailableTimeBeforeSlot` will be subtract later and it cannot start before now */
      .plus({ minutes: configuration.minAvailableTimeBeforeSlot ?? 0 })
      .plus({ minutes: configuration.minTimeBeforeFirstSlot ?? 0 }),
  );
  const lastToMoment = searchLimitMoment
    ? Luxon.min(
        Luxon.fromJSDate(to).setZone(configuration.timeZone),
        searchLimitMoment,
      )
    : Luxon.fromJSDate(to).setZone(configuration.timeZone);

  return { firstFromMoment, lastToMoment };
}

function _getWeekDayConfigForMoment(
  configuration: TimeSlotsFinderConfiguration,
  searchMoment: Luxon,
) {
  return configuration.schedule[searchMoment.toISODate() ?? ""] ?? [];
}

function _getMomentsFromShift(fromMoment: Luxon, shift: Shift) {
  let startAt = fromMoment.set({
    hour: parseInt(shift.start.slice(0, 2), 10),
    minute: parseInt(shift.start.slice(3), 10),
  });

  let endAt = fromMoment.set({
    hour: parseInt(shift.end.slice(0, 2), 10),
    minute: parseInt(shift.end.slice(3), 10),
  });

  return { startAt, endAt };
}

function _getAvailableTimeSlotsForShift(
  configuration: TimeSlotsFinderConfiguration,
  eventList: DateTimePeriod[],
  from: Luxon,
  to: Luxon,
) {
  const timeSlots: TimeSlot[] = [];
  const minTimeWindowNeeded = _getMinTimeWindowNeeded(configuration);

  const minAvailableTimeBeforeSlot =
    configuration.minAvailableTimeBeforeSlot ?? 0;
  const minAvailableTimeAfterSlot =
    configuration.timeSlotDuration +
    (configuration.minAvailableTimeBeforeSlot ?? 0);

  // Ensures we preserve minAvailableTimeBeforeSlot before the first slot
  let searchMoment = from.minus({ minute: minAvailableTimeBeforeSlot });
  /*
   *  Ensures we don't create an event that would finish after "to" boundary
   *  or break minAvailableTimeBeforeSlot
   */
  const searchEndMoment = to
    .minus({ minute: minAvailableTimeAfterSlot })
    .set({ second: 59 });

  /*
   *  We can safely ignore calendar events outside from/to boundaries
   *  We extend this boundaries to take in account minAvailableTimeBeforeSlot
   */
  const filteringMin = from.minus({ minute: minAvailableTimeBeforeSlot });
  const filteringMax = to.plus({ minute: minAvailableTimeAfterSlot });
  const cleanedList: DateTimePeriod[] = _prepareEvents(
    eventList,
    filteringMin,
    filteringMax,
  );

  /* Find index of the first event that is not yet ended at searchMoment */
  let eventIndex = cleanedList.findIndex((event) => event.endAt > searchMoment);
  while (true) {
    const focusedEvent: DateTimePeriod | null =
      (eventIndex >= 0 && cleanedList[eventIndex]) || null;

    /* Adjust searchMoment according to the slotStartMinuteMultiple param */
    searchMoment = _nextSearchMoment(searchMoment, configuration);

    /* We reached the end of the day */
    if (searchMoment > searchEndMoment) {
      break;
    }

    const freeTimeLimitMoment = searchMoment.plus({
      minute: minTimeWindowNeeded,
    });

    if (focusedEvent && focusedEvent.startAt < freeTimeLimitMoment) {
      /**
       * If first event that is not yet ended start to soon to get a slot at this time,
       * go directly to the end of the event for next search.
       */
      searchMoment = focusedEvent.endAt.setZone(configuration.timeZone);

      if (focusedEvent) {
        eventIndex += 1;
      }
    } else {
      const { newSearchMoment, timeSlot } = _pushNewSlot(
        searchMoment,
        configuration,
      );
      timeSlots.push(timeSlot);
      searchMoment = newSearchMoment;
    }
  }
  return timeSlots;
}

/*
 * Filter events time boundaries (to enhance performance)
 * then sort by startDate (to make binary sort possible)
 * then filter encompassed events (using binary search)
 */
function _prepareEvents(periods: DateTimePeriod[], from: Luxon, to: Luxon) {
  const filteredPeriods = _filterPeriods(periods, from, to);
  const sortedPeriods = _sortPeriods(filteredPeriods);
  return sortedPeriods.filter(
    (event) => !_findEmcompassingEvent(sortedPeriods, event),
  );
}

/* Comparison function to sort DayjsPeriod on start date */
function _sortPeriods(periods: DateTimePeriod[]) {
  return periods.sort((a, b) => (a.startAt > b.startAt ? 1 : -1));
}

/* Filter DayjsPeriod which are strictly outside the provided boundaries */
function _filterPeriods(periods: DateTimePeriod[], from: Luxon, to: Luxon) {
  return periods.filter((period) => period.startAt < to && period.endAt > from);
}

/* Uses a sorted search technique. Event list must be sorted on event.startAt */
function _findEmcompassingEvent(
  eventList: DateTimePeriod[],
  event: DateTimePeriod,
): boolean {
  for (const currentEvent of eventList) {
    // Found condition
    if (
      currentEvent.startAt <= event.startAt &&
      currentEvent.endAt > event.endAt
    ) {
      return true;
      // Stop if outside boundaries
    } else if (currentEvent.startAt > event.startAt) {
      return false;
    }
  }
  return false;
}

function _getMinTimeWindowNeeded(configuration: TimeSlotsFinderConfiguration) {
  return (
    (configuration.minAvailableTimeBeforeSlot ?? 0) +
    configuration.timeSlotDuration +
    (configuration.minAvailableTimeAfterSlot ?? 0)
  );
}

function _pushNewSlot(
  searchMoment: Luxon,
  configuration: TimeSlotsFinderConfiguration,
): { newSearchMoment: Luxon; timeSlot: TimeSlot } {
  const minAvailableTimeBeforeSlot =
    configuration.minAvailableTimeBeforeSlot ?? 0;

  const startAt = searchMoment.plus({
    minute: minAvailableTimeBeforeSlot,
  });

  const endAt = startAt.plus({ minute: configuration.timeSlotDuration });
  const timeSlot = {
    startAt: startAt.toUTC().toJSDate(),
    endAt: endAt.toUTC().toJSDate(),
    duration: endAt.diff(startAt, "minute").minutes,
  };
  /**
   * We should start searching after just created slot (including free time after it) but before
   * next one free time before it (since the search algorithm take it in account).
   */
  const minutesBeforeNextSearch = Math.max(
    (configuration.minAvailableTimeAfterSlot ?? 0) -
      (configuration.minAvailableTimeBeforeSlot ?? 0),
    0,
  );

  const slotStartMinuteStep = configuration.slotStart ?? 5;

  let newSearchMoment: Luxon;
  if (slotStartMinuteStep === "every-hour") {
    newSearchMoment = startAt
      .plus({ hours: 1 })
      .set({ minute: 0, second: 0, millisecond: 0 })
      .minus({ minutes: minAvailableTimeBeforeSlot });
  } else if (slotStartMinuteStep === "custom") {
    const nextTime = (configuration.customSlots || [])
      .map((slot) => searchMoment.set(slot))
      .sort((a, b) => a.toMillis() - b.toMillis())
      .find((next) => next > startAt);

    newSearchMoment =
      nextTime?.minus({ minutes: minAvailableTimeBeforeSlot }) ||
      searchMoment.plus({ day: 1 });
  } else {
    const next = searchMoment.plus({ minutes: 1 });
    const minuteToAdd =
      (slotStartMinuteStep - (next.minute % slotStartMinuteStep)) %
      slotStartMinuteStep;

    newSearchMoment = next
      .plus({ minutes: minuteToAdd })
      .set({ millisecond: 0, second: 0 });
  }

  return {
    // newSearchMoment: endAt.plus({ minute: minutesBeforeNextSearch }),
    newSearchMoment,
    timeSlot,
  };
}

function _getUnavailablePeriodAsEvents(
  unavailablePeriods: TimeSlotPeriod[],
  timeZone: string,
) {
  const format = "YYYY-MM-DD HH:mm";
  return unavailablePeriods.map((unavailablePeriod) => {
    /* Transit through string since dayjs.tz with object parsing is bugged */
    const startAtString = Luxon.fromObject(unavailablePeriod.startAt).toFormat(
      format,
    );
    let startAt = Luxon.fromFormat(startAtString, format).setZone(timeZone);
    const endAtString = Luxon.fromObject(unavailablePeriod.endAt).toFormat(
      "YYYY-MM-DD HH:mm",
    );
    let endAt = Luxon.fromFormat(endAtString, format).setZone(timeZone);

    /* If no hours defined, use full days */
    if (unavailablePeriod.startAt.hour == null) {
      startAt = startAt.startOf("day");
    }
    if (unavailablePeriod.endAt.hour == null) {
      endAt = endAt.endOf("day");
    }

    /* Can only happen if no years were defined: push endAt to next year */
    if (endAt < startAt) {
      endAt = endAt.plus({ years: 1 });
    }
    return { startAt, endAt };
  });
}

function _nextSearchMoment(
  moment: Luxon,
  configuration: TimeSlotsFinderConfiguration,
): Luxon {
  const minAvailableTimeBeforeSlot =
    configuration.minAvailableTimeBeforeSlot ?? 0;

  /* Round up to the next minute if second value is not 0 */
  const nextMoment =
    moment.second !== 0
      ? moment.startOf("minute").plus({ minutes: 1 })
      : moment;
  const slotStartAt = nextMoment.plus({
    minutes: minAvailableTimeBeforeSlot,
  });
  const slotStartMinuteStep = configuration.slotStart ?? 5;

  if (slotStartMinuteStep === "every-hour") {
    return slotStartAt
      .plus({ hours: 1, minutes: -1 })
      .set({ minute: 0, second: 0, millisecond: 0 })
      .minus({ minutes: minAvailableTimeBeforeSlot });
  } else if (slotStartMinuteStep === "custom") {
    const nextTime = (configuration.customSlots || [])
      .map((slot) => nextMoment.set(slot))
      .sort((a, b) => a.toMillis() - b.toMillis())
      .find((next) => next >= slotStartAt);

    return (
      nextTime?.minus({ minutes: minAvailableTimeBeforeSlot }) ||
      nextMoment.plus({ years: 10 })
    );
  }

  const minuteToAdd =
    (slotStartMinuteStep - (slotStartAt.minute % slotStartMinuteStep)) %
    slotStartMinuteStep;

  return nextMoment.plus({ minutes: minuteToAdd }).set({ millisecond: 0 });
}

/**
 * Return a reformatted schedulewithout overlapping shifts. Not mutating the
 * originals data.
 * @param {Record<string, Shift[]>} schedule The map of day formated to ISO and shifts
 * @return {Record<string, Shift[]>}
 */
export function _mergeOverlappingShiftsInAvailablePeriods(
  schedule: Record<string, Shift[]>,
): Record<string, Shift[]> {
  return Object.entries(schedule).reduce(
    (map, [day, shifts]) => ({
      ...map,
      [day]: _mergeOverlappingShifts(shifts ?? []),
    }),
    {} as Record<string, Shift[]>,
  );
}

/**
 * Check the validity of a configuration for the time-slots service.
 * @param {Shift[]} shifts The shifts to refactor into non-overlapping shifts.
 * @returns {Shift[]}
 */
export function _mergeOverlappingShifts(shifts: Shift[]): Shift[] {
  if (shifts.length < 2) {
    return [...shifts];
  }

  const sortedShifts = [...shifts].sort((a, b) =>
    a.start.localeCompare(b.start),
  );

  for (let i = 0; i < sortedShifts.length - 1; i += 1) {
    if (sortedShifts[i].end.localeCompare(sortedShifts[i + 1].start) >= 0) {
      if (sortedShifts[i].end.localeCompare(sortedShifts[i + 1].end) < 0) {
        sortedShifts[i] = {
          start: sortedShifts[i].start,
          end: sortedShifts[i + 1].end,
        };
      }
      sortedShifts.splice(i + 1, 1);
      /* Come back 1 element to recheck the same shift against the new next one */
      i -= 1;
    }
  }

  return sortedShifts;
}

/**
 * Check the validity of a configuration for the time-slots service.
 * @param {TimeSlotPeriod} period The shifts to refactor into non-overlapping shifts.
 * @returns {boolean}
 */
export function _isUnavailablePeriodValid(period: TimeSlotPeriod): boolean {
  return Boolean(
    period &&
      period.startAt &&
      period.endAt &&
      /* Both have year, or both have not */
      (period.startAt.year == null) === (period.endAt.year == null) &&
      _isPeriodMomentValid(period.startAt) &&
      _isPeriodMomentValid(period.endAt) &&
      /**
       * If the year value isn't specified, endAt can precede startAt, and
       * doing so will set the endAt year value to the following year if needed.
       */
      (period.startAt.year == null ||
        /* Using the objectSupport DayJS plugin, types are not up to date */
        Luxon.fromObject(period.startAt) < Luxon.fromObject(period.endAt)),
  );
}

/**
 * Indicate if a worked period is valid or not. Throws if not valid.
 * @param {Record<string, Shift[]>} schedule The schedule to check.
 * @returns {boolean}
 */
function _isScheduleValid(schedule: Record<string, Shift[]>) {
  for (const [day, shifts] of Object.entries(schedule)) {
    for (const shift of shifts) {
      if (!_isShiftValid(shift)) {
        throw new TimeSlotsFinderError(
          `Daily shift ${shift.start} - ${shift.end} for ${day} is invalid`,
        );
      }
    }
    if (_mergeOverlappingShifts(shifts).length !== shifts.length) {
      throw new TimeSlotsFinderError(`Some shifts are overlapping for ${day}`);
    }
  }

  return true;
}

/**
 * Indicate either if the provided date string is valid or not.
 * @param {PeriodMoment} periodMoment The date object to check.
 * @returns {boolean}
 */
function _isPeriodMomentValid(periodMoment: PeriodMoment) {
  if (periodMoment.hour == null && periodMoment.minute != null) {
    return false;
  }

  const isYearAndMonthValid =
    (periodMoment.year == null || periodMoment.year > 0) &&
    periodMoment.month >= 0 &&
    periodMoment.month <= 11;

  if (!isYearAndMonthValid) {
    return false;
  }

  /* The day check depends on month and year */
  let day = Luxon.now().set({ month: periodMoment.month });
  if (periodMoment.year) {
    day = day.set({ year: periodMoment.year });
  }

  return (
    periodMoment.day >= 1 &&
    periodMoment.day <= day.daysInMonth! &&
    (periodMoment.hour == null ||
      (periodMoment.hour >= 0 && periodMoment.hour <= 23)) &&
    (periodMoment.minute == null ||
      (periodMoment.minute >= 0 && periodMoment.minute <= 59))
  );
}

/**
 * Indicate either if the provided date string is valid or not.
 * @param {Shift} shift The date string to check.
 * @returns {boolean}
 */
function _isShiftValid(shift: Shift) {
  const [startHour, startMinute] = shift.start.split(":").map(Number);
  const [endHour, endMinute] = shift.end.split(":").map(Number);
  return (
    shift &&
    shift.start.match(/^\d{2}:\d{2}$/) &&
    shift.end.match(/^\d{2}:\d{2}$/) &&
    startHour >= 0 &&
    startHour <= 23 &&
    startMinute >= 0 &&
    startMinute <= 59 &&
    endHour >= 0 &&
    endHour <= 23 &&
    endMinute >= 0 &&
    endMinute <= 59 &&
    shift.end.localeCompare(shift.start) > 0
  );
}

export function isConfigurationValid(
  configuration: TimeSlotsFinderConfiguration,
): boolean {
  if (!configuration) {
    throw new TimeSlotsFinderError("No configuration defined");
  }

  /* Primitive values */
  _checkPrimitiveValue(configuration);

  /* Worked periods */
  if (!configuration.schedule) {
    throw new TimeSlotsFinderError("Schedule is expected");
  }

  _isScheduleValid(configuration.schedule);

  /* Unworked periods */
  if (
    configuration.unavailablePeriods != null &&
    !Array.isArray(configuration.unavailablePeriods)
  ) {
    throw new TimeSlotsFinderError("A list of unavailable periods is expected");
  }
  if (configuration.unavailablePeriods) {
    for (let i = 0; i < configuration.unavailablePeriods.length; i += 1) {
      if (!_isUnavailablePeriodValid(configuration.unavailablePeriods[i])) {
        throw new TimeSlotsFinderError(
          `Unavailable period nº${i + 1} is invalid`,
        );
      }
    }
  }
  return true;
}

function _checkPrimitiveValue(
  configuration: TimeSlotsFinderConfiguration,
): boolean {
  if (
    configuration.timeSlotDuration == null ||
    configuration.timeSlotDuration < 1
  ) {
    throw new TimeSlotsFinderError(`Slot duration must be at least 1 minute`);
  }
  if (
    configuration.slotStart === "custom" &&
    !configuration.customSlots?.length
  ) {
    throw new TimeSlotsFinderError(
      `Custom slots are required when type is custom`,
    );
  }
  if (
    configuration.slotStart !== "every-hour" &&
    configuration.slotStart !== "custom" &&
    !_nullOrBetween(1, 30, configuration.slotStart)
  ) {
    throw new TimeSlotsFinderError(
      `Slot start minute step must be contained between 1 and 30`,
    );
  }
  if (
    !_nullOrGreaterThanOrEqualTo(0, configuration.minAvailableTimeBeforeSlot)
  ) {
    throw new TimeSlotsFinderError(
      `Time before a slot must be at least 0 minutes`,
    );
  }
  if (
    !_nullOrGreaterThanOrEqualTo(0, configuration.minAvailableTimeAfterSlot)
  ) {
    throw new TimeSlotsFinderError(
      `Time after a slot must be at least 0 minutes`,
    );
  }
  if (!_nullOrGreaterThanOrEqualTo(0, configuration.minTimeBeforeFirstSlot)) {
    throw new TimeSlotsFinderError(
      `The number of minutes before first slot must be 0 or more`,
    );
  }
  if (!_nullOrGreaterThanOrEqualTo(1, configuration.maxDaysBeforeLastSlot)) {
    throw new TimeSlotsFinderError(
      `The number of days before latest slot must be at least 1`,
    );
  }
  _checkTimeZone(configuration.timeZone);

  const minBeforeFirst = configuration.minTimeBeforeFirstSlot;
  const maxBeforeLast = configuration.maxDaysBeforeLastSlot;
  if (
    minBeforeFirst &&
    maxBeforeLast &&
    minBeforeFirst / (24 * 60) > maxBeforeLast
  ) {
    throw new TimeSlotsFinderError(
      `The first possible slot will always be after last one possible (see minTimeBeforeFirstSlot and maxDaysBeforeLastSlot)`,
    );
  }
  return true;
}

function _checkTimeZone(timeZone: string) {
  if (!timeZone) {
    throw new TimeSlotsFinderError(`Missing time zone`);
  }
  try {
    const result = Luxon.now().setZone(timeZone);
    if (!result.zone.isValid) throw new Error();
  } catch (_) {
    throw new TimeSlotsFinderError(`Invalid time zone: ${timeZone}`);
  }
}

function _nullOrGreaterThanOrEqualTo(limit: number, value?: number): boolean {
  return value == null || value >= limit;
}
function _nullOrBetween(min: number, max: number, value?: number): boolean {
  return value == null || (value >= min && value <= max);
}
