import { DateTime } from "luxon";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatSmsDate } from "./sms-date";

describe("formatSmsDate", () => {
  const zone = "America/New_York";
  const now = DateTime.fromObject(
    { year: 2026, month: 10, day: 20, hour: 15 },
    { zone },
  );

  it("uses the weekday medium format without the year", () => {
    const formatted = formatSmsDate(
      DateTime.fromObject(
        { year: 2026, month: 10, day: 26, hour: 14 },
        { zone },
      ),
      "en",
      now,
    );

    assert.equal(formatted.sms, "Mon, Oct 26, 2:00 PM");
    assert.equal(formatted.sms.includes("2026"), false);
    assert.equal(formatted.isTomorrow, false);
  });

  it("marks the next calendar day as tomorrow", () => {
    const formatted = formatSmsDate(
      DateTime.fromObject(
        { year: 2026, month: 10, day: 21, hour: 14 },
        { zone },
      ),
      "en",
      now,
    );

    assert.equal(formatted.sms, "Wed, Oct 21, 2:00 PM");
    assert.equal(formatted.isTomorrow, true);
  });
});
