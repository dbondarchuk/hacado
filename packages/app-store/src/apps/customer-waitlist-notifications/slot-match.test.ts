import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  appointmentOptionDurationMinutes,
  availabilityFetchRange,
  getSlotTimeOfDayArgs,
  hourBandForHour,
  includesSlotStart,
  matchesSmsRemoveKeyword,
  matchingStartsInFreedWindow,
  startsInsideFreedWindow,
  waitlistEntryMatchesSlot,
  windowFitsDuration,
} from "./slot-match";

describe("slot-match", () => {
  it("maps hour bands", () => {
    assert.equal(hourBandForHour(9), "morning");
    assert.equal(hourBandForHour(12), "afternoon");
    assert.equal(hourBandForHour(15), "afternoon");
    assert.equal(hourBandForHour(16), "evening");
  });

  it("matches ASAP any slot", () => {
    assert.equal(
      waitlistEntryMatchesSlot(
        { asSoonAsPossible: true },
        new Date("2026-08-27T14:00:00.000Z"),
        "UTC",
      ),
      true,
    );
  });

  it("matches dated evening slot in org timezone", () => {
    assert.equal(
      waitlistEntryMatchesSlot(
        {
          asSoonAsPossible: false,
          dates: [{ date: "2026-08-27", time: ["evening"] }],
        },
        new Date("2026-08-27T16:30:00.000Z"),
        "UTC",
      ),
      true,
    );
  });

  it("rejects a morning slot when only evening was requested", () => {
    assert.equal(
      waitlistEntryMatchesSlot(
        {
          asSoonAsPossible: false,
          dates: [{ date: "2026-08-27", time: ["evening"] }],
        },
        new Date("2026-08-27T09:00:00.000Z"),
        "UTC",
      ),
      false,
    );
  });

  it("checks duration fits the freed window", () => {
    const start = new Date("2026-08-27T10:00:00.000Z");
    const end = new Date("2026-08-27T11:00:00.000Z");
    assert.equal(windowFitsDuration(start, end, 60), true);
    assert.equal(windowFitsDuration(start, end, 90), false);
  });

  it("uses fixed duration or flexible minimum from the catalog option", () => {
    assert.equal(
      appointmentOptionDurationMinutes({
        durationType: "fixed",
        duration: 45,
      }),
      45,
    );
    assert.equal(
      appointmentOptionDurationMinutes({
        durationType: "flexible",
        durationMin: 30,
      }),
      30,
    );
  });

  it("matches SMS keyword case-insensitively", () => {
    assert.equal(matchesSmsRemoveKeyword("  remove ", "REMOVE"), true);
    assert.equal(matchesSmsRemoveKeyword("STOP", "REMOVE"), false);
  });
});

describe("slot time of day args", () => {
  const labels = {
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
  };

  it("labels a morning slot", () => {
    assert.deepEqual(
      getSlotTimeOfDayArgs(new Date("2026-08-27T09:00:00.000Z"), "UTC", labels),
      {
        slotTimeOfDay: "morning",
        isMorning: true,
        isAfternoon: false,
        isEvening: false,
      },
    );
  });

  it("labels an afternoon slot in the organization timezone", () => {
    assert.deepEqual(
      getSlotTimeOfDayArgs(new Date("2026-08-27T14:00:00.000Z"), "UTC", labels),
      {
        slotTimeOfDay: "afternoon",
        isMorning: false,
        isAfternoon: true,
        isEvening: false,
      },
    );
  });
});

describe("freed window starts", () => {
  const windowStart = new Date("2026-08-27T10:00:00.000Z");
  const windowEnd = new Date("2026-08-27T13:00:00.000Z");
  const starts = [
    new Date("2026-08-27T09:30:00.000Z"),
    new Date("2026-08-27T10:00:00.000Z"),
    new Date("2026-08-27T10:30:00.000Z"),
    new Date("2026-08-27T12:00:00.000Z"),
    new Date("2026-08-27T12:45:00.000Z"),
  ];

  it("keeps 30-minute starts that fit inside a 3-hour hole", () => {
    assert.deepEqual(
      startsInsideFreedWindow(starts, windowStart, windowEnd, 30).map((d) =>
        d.toISOString(),
      ),
      [
        "2026-08-27T10:00:00.000Z",
        "2026-08-27T10:30:00.000Z",
        "2026-08-27T12:00:00.000Z",
      ],
    );
  });

  it("matches afternoon prefs to a later start in a morning-started hole", () => {
    const matching = matchingStartsInFreedWindow(
      starts,
      windowStart,
      windowEnd,
      30,
      {
        asSoonAsPossible: false,
        dates: [{ date: "2026-08-27", time: ["afternoon"] }],
      },
      "UTC",
    );
    assert.deepEqual(
      matching.map((d) => d.toISOString()),
      ["2026-08-27T12:00:00.000Z"],
    );
  });

  it("treats more than one matching start as other times available", () => {
    const matching = matchingStartsInFreedWindow(
      starts,
      windowStart,
      windowEnd,
      30,
      { asSoonAsPossible: true },
      "UTC",
    );
    assert.equal(matching.length > 1, true);
  });

  it("pads availability fetch to neighboring local days", () => {
    const { from, to } = availabilityFetchRange(windowStart, windowEnd, "UTC");
    assert.equal(from.toISOString(), "2026-08-26T00:00:00.000Z");
    assert.equal(to.toISOString(), "2026-08-28T23:59:59.999Z");
  });

  it("detects an already notified start", () => {
    const slot = new Date("2026-08-27T10:00:00.000Z");
    assert.equal(
      includesSlotStart([slot], new Date("2026-08-27T10:00:00.000Z")),
      true,
    );
    assert.equal(
      includesSlotStart([slot], new Date("2026-08-27T10:30:00.000Z")),
      false,
    );
  });
});
