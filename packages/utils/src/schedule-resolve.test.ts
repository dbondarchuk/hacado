import type { DaySchedule, ScheduleException } from "@hacado/types";
import { DateTime } from "luxon";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveDaySchedule } from "./schedule-resolve";
import { getWeekIdentifier } from "./time";

const morning: DaySchedule = [{ start: "09:00", end: "12:00" }];
const afternoon: DaySchedule = [{ start: "13:00", end: "17:00" }];
const closed: DaySchedule = [];
const evening: DaySchedule = [{ start: "18:00", end: "22:00" }];

const companyHoliday: ScheduleException = {
  scope: "company",
  startDate: "2024-12-24",
  endDate: "2024-12-26",
  days: {},
  holidays: [1, 2, 3, 4, 5, 6, 7],
};

const memberOpenOnHoliday: ScheduleException = {
  scope: "member",
  memberId: "member-1",
  startDate: "2024-12-25",
  endDate: "2024-12-25",
  days: {
    3: morning, // Wednesday
  },
};

const memberTuesdayOff: ScheduleException = {
  scope: "member",
  memberId: "member-1",
  startDate: "2024-06-03",
  endDate: "2024-06-09",
  days: {
    2: closed,
  },
};

const companyReducedTuesday: ScheduleException = {
  scope: "company",
  startDate: "2024-06-03",
  endDate: "2024-06-09",
  days: {
    2: afternoon,
  },
};

const memberEveningTuesday: ScheduleException = {
  scope: "member",
  memberId: "member-1",
  startDate: "2024-06-03",
  endDate: "2024-06-09",
  days: {
    2: evening,
  },
};

const companyEmptyTuesday: ScheduleException = {
  scope: "company",
  startDate: "2024-06-03",
  endDate: "2024-06-09",
  days: {
    2: closed,
  },
};

describe("resolveDaySchedule", () => {
  it("uses the org default when no exceptions apply", () => {
    const result = resolveDaySchedule({
      date: "2024-06-03",
      weekDay: 1,
      defaultShifts: morning,
      companyExceptions: [],
      memberExceptions: [],
    });
    assert.deepEqual(result.shifts, morning);
    assert.equal(result.source, "default");
  });

  it("uses member exception over default", () => {
    const result = resolveDaySchedule({
      date: "2024-06-04",
      weekDay: 2,
      defaultShifts: morning,
      companyExceptions: [],
      memberExceptions: [memberTuesdayOff],
    });
    assert.deepEqual(result.shifts, closed);
    assert.equal(result.source, "member");
  });

  it("company holiday beats member open hours", () => {
    const result = resolveDaySchedule({
      date: "2024-12-25",
      weekDay: 3,
      defaultShifts: afternoon,
      companyExceptions: [companyHoliday],
      memberExceptions: [memberOpenOnHoliday],
    });
    assert.deepEqual(result.shifts, closed);
    assert.equal(result.source, "holiday");
  });

  it("member hours beat company open hours", () => {
    const result = resolveDaySchedule({
      date: "2024-06-04",
      weekDay: 2,
      defaultShifts: morning,
      companyExceptions: [companyReducedTuesday],
      memberExceptions: [memberEveningTuesday],
    });
    assert.deepEqual(result.shifts, evening);
    assert.equal(result.source, "member");
  });

  it("empty company hours are not holidays — member may still work", () => {
    const result = resolveDaySchedule({
      date: "2024-06-04",
      weekDay: 2,
      defaultShifts: morning,
      companyExceptions: [companyEmptyTuesday],
      memberExceptions: [memberEveningTuesday],
    });
    assert.deepEqual(result.shifts, evening);
    assert.equal(result.source, "member");
  });

  it("falls through to app day when no exceptions define the weekday", () => {
    const result = resolveDaySchedule({
      date: "2024-06-05",
      weekDay: 3,
      defaultShifts: morning,
      companyExceptions: [],
      memberExceptions: [memberTuesdayOff],
      appDay: afternoon,
    });
    assert.deepEqual(result.shifts, afternoon);
    assert.equal(result.source, "app");
  });

  it("prefers a narrower overlapping exception", () => {
    const wide: ScheduleException = {
      scope: "member",
      memberId: "member-1",
      startDate: "2024-06-01",
      endDate: "2024-06-30",
      days: { 1: morning },
    };
    const narrow: ScheduleException = {
      scope: "member",
      memberId: "member-1",
      startDate: "2024-06-03",
      endDate: "2024-06-03",
      days: { 1: afternoon },
    };
    const result = resolveDaySchedule({
      date: "2024-06-03",
      weekDay: 1,
      defaultShifts: closed,
      companyExceptions: [],
      memberExceptions: [wide, narrow],
    });
    assert.deepEqual(result.shifts, afternoon);
    assert.equal(result.source, "member");
  });

  it("treats missing default as closed", () => {
    const result = resolveDaySchedule({
      date: "2024-06-08",
      weekDay: 6,
      defaultShifts: undefined,
      companyExceptions: [],
      memberExceptions: [],
    });
    assert.deepEqual(result.shifts, closed);
    assert.equal(result.source, "default");
  });

  it("expands a weekly recurrence", () => {
    const recurring: ScheduleException = {
      scope: "company",
      startDate: "2024-06-03",
      endDate: "2024-06-09",
      days: { 2: afternoon },
      repeatEveryWeeks: 1,
      repeatUntil: "2024-06-30",
      createdAt: "2024-06-01T00:00:00.000Z",
    };
    const result = resolveDaySchedule({
      date: "2024-06-18", // Tuesday, 2 weeks later
      weekDay: 2,
      defaultShifts: morning,
      companyExceptions: [recurring],
      memberExceptions: [],
    });
    assert.deepEqual(result.shifts, afternoon);
    assert.equal(result.source, "company");
  });

  it("respects every-two-weeks interval", () => {
    const recurring: ScheduleException = {
      scope: "company",
      startDate: "2024-06-03",
      endDate: "2024-06-09",
      days: { 2: afternoon },
      repeatEveryWeeks: 2,
      repeatUntil: "2024-06-30",
      createdAt: "2024-06-01T00:00:00.000Z",
    };
    const onHit = resolveDaySchedule({
      date: "2024-06-18",
      weekDay: 2,
      defaultShifts: morning,
      companyExceptions: [recurring],
      memberExceptions: [],
    });
    assert.deepEqual(onHit.shifts, afternoon);

    const offHit = resolveDaySchedule({
      date: "2024-06-11",
      weekDay: 2,
      defaultShifts: morning,
      companyExceptions: [recurring],
      memberExceptions: [],
    });
    assert.deepEqual(offHit.shifts, morning);
    assert.equal(offHit.source, "default");
  });

  it("stops after repeatUntil", () => {
    const recurring: ScheduleException = {
      scope: "company",
      startDate: "2024-06-03",
      endDate: "2024-06-09",
      days: { 2: afternoon },
      repeatEveryWeeks: 1,
      repeatUntil: "2024-06-16",
      createdAt: "2024-06-01T00:00:00.000Z",
    };
    const result = resolveDaySchedule({
      date: "2024-06-25",
      weekDay: 2,
      defaultShifts: morning,
      companyExceptions: [recurring],
      memberExceptions: [],
    });
    assert.deepEqual(result.shifts, morning);
    assert.equal(result.source, "default");
  });

  it("honors excludeWeeks on a recurrence", () => {
    const templateMonday = DateTime.fromISO("2024-06-03", { zone: "utc" });
    const excludedWeek = getWeekIdentifier(templateMonday.plus({ weeks: 1 }));
    const recurring: ScheduleException = {
      scope: "company",
      startDate: "2024-06-03",
      endDate: "2024-06-09",
      days: { 2: afternoon },
      repeatEveryWeeks: 1,
      repeatUntil: "2024-06-30",
      excludeWeeks: [excludedWeek],
      createdAt: "2024-06-01T00:00:00.000Z",
    };
    const result = resolveDaySchedule({
      date: "2024-06-11",
      weekDay: 2,
      defaultShifts: morning,
      companyExceptions: [recurring],
      memberExceptions: [],
    });
    assert.deepEqual(result.shifts, morning);
    assert.equal(result.source, "default");
  });

  it("lets a single-week override beat a recurrence", () => {
    const recurring: ScheduleException = {
      scope: "member",
      memberId: "member-1",
      startDate: "2024-06-03",
      endDate: "2024-06-09",
      days: { 2: afternoon },
      repeatEveryWeeks: 1,
      repeatUntil: "2024-06-30",
      createdAt: "2024-06-01T00:00:00.000Z",
    };
    const weekOverride: ScheduleException = {
      scope: "member",
      memberId: "member-1",
      startDate: "2024-06-17",
      endDate: "2024-06-23",
      days: { 2: evening },
    };
    const result = resolveDaySchedule({
      date: "2024-06-18",
      weekDay: 2,
      defaultShifts: morning,
      companyExceptions: [],
      memberExceptions: [recurring, weekOverride],
    });
    assert.deepEqual(result.shifts, evening);
    assert.equal(result.source, "member");
  });

  it("prefers the newer recurrence when two overlap", () => {
    const everyWeek: ScheduleException = {
      scope: "company",
      startDate: "2024-06-03",
      endDate: "2024-06-09",
      days: { 2: afternoon },
      repeatEveryWeeks: 1,
      repeatUntil: "2024-06-30",
      createdAt: "2024-06-01T00:00:00.000Z",
    };
    const everyTwo: ScheduleException = {
      scope: "company",
      startDate: "2024-06-03",
      endDate: "2024-06-09",
      days: { 2: evening },
      repeatEveryWeeks: 2,
      repeatUntil: "2024-06-30",
      createdAt: "2024-06-10T00:00:00.000Z",
    };
    const evenWeek = resolveDaySchedule({
      date: "2024-06-18",
      weekDay: 2,
      defaultShifts: morning,
      companyExceptions: [everyWeek, everyTwo],
      memberExceptions: [],
    });
    assert.deepEqual(evenWeek.shifts, evening);

    const oddWeek = resolveDaySchedule({
      date: "2024-06-11",
      weekDay: 2,
      defaultShifts: morning,
      companyExceptions: [everyWeek, everyTwo],
      memberExceptions: [],
    });
    assert.deepEqual(oddWeek.shifts, afternoon);
  });
});
