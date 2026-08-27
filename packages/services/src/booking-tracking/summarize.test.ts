import { BookingProgressAnalyticsDaily } from "@hacado/types";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { groupingKey, summarizeBookingProgress } from "./summarize";

function daily(
  dateIso: string,
  metrics: Partial<BookingProgressAnalyticsDaily["metrics"]>,
): BookingProgressAnalyticsDaily {
  return {
    organizationId: "org_1",
    date: new Date(dateIso),
    metrics: {
      started: 0,
      completed: 0,
      entered: {},
      stoppedAt: {},
      convertedTo: {},
      ...metrics,
    },
    createdAt: new Date(dateIso),
    updatedAt: new Date(dateIso),
  };
}

describe("summarizeBookingProgress", () => {
  const docs = [
    daily("2026-08-03T00:00:00.000Z", {
      started: 10,
      completed: 2,
      entered: { SERVICE_SELECTED: 10, FORM_FILLED: 4 },
      stoppedAt: { SERVICE_SELECTED: 6, FORM_FILLED: 2 },
      convertedTo: { appointment: 2 },
    }),
    daily("2026-08-04T00:00:00.000Z", {
      started: 5,
      completed: 1,
      entered: { SERVICE_SELECTED: 5 },
      stoppedAt: { SERVICE_SELECTED: 4 },
      convertedTo: { package: 1 },
    }),
    daily("2026-08-10T00:00:00.000Z", {
      started: 3,
      completed: 3,
      entered: { SERVICE_SELECTED: 3 },
      stoppedAt: {},
      convertedTo: { appointment: 3 },
    }),
  ];

  it("sums daily documents into KPI and step breakdowns", () => {
    const summary = summarizeBookingProgress(docs, "day", "UTC");
    assert.equal(summary.stats.total, 18);
    assert.equal(summary.stats.converted, 6);
    assert.equal(summary.stats.abandoned, 12);
    assert.equal(
      summary.entered.find((i) => i.step === "SERVICE_SELECTED")?.count,
      18,
    );
    assert.equal(
      summary.stoppedAt.find((i) => i.step === "FORM_FILLED")?.count,
      2,
    );
    assert.equal(
      summary.convertedTo.find((i) => i.convertedTo === "appointment")?.count,
      5,
    );
    assert.equal(summary.overTime.length, 3);
  });

  it("groups daily documents by week", () => {
    const summary = summarizeBookingProgress(docs, "week", "UTC");
    const keys = summary.overTime.map((row) => row.date);
    assert.ok(keys.length >= 2);
    assert.ok(keys.length <= 3);
    const firstWeek = summary.overTime.find(
      (row) => row.date === groupingKey(docs[0].date, "week", "UTC"),
    );
    assert.ok(firstWeek);
    assert.equal(firstWeek.total, 15);
    assert.equal(firstWeek.converted, 3);
  });

  it("groups daily documents by month", () => {
    const summary = summarizeBookingProgress(docs, "month", "UTC");
    assert.equal(summary.overTime.length, 1);
    assert.equal(summary.overTime[0].date, "2026-08");
    assert.equal(summary.overTime[0].total, 18);
  });

  it("omits steps with zero activity", () => {
    const summary = summarizeBookingProgress(docs, "day", "UTC");
    assert.equal(
      summary.entered.some((item) => item.step === "PAYMENT_CHECKED"),
      false,
    );
  });
});
