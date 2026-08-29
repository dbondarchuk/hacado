import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isWaitlistOfferSlotAvailable,
  waitlistOfferSlotToDateTime,
} from "./waitlist-offer-prefill";

describe("waitlistOfferSlotToDateTime", () => {
  const iso = "2026-08-27T15:30:00.000Z";
  const timeZone = "Europe/Kyiv";

  it("parses an ISO string into org-zone wall time", () => {
    const result = waitlistOfferSlotToDateTime(iso, timeZone);
    assert.equal(result.timeZone, timeZone);
    assert.equal(result.time.hour, 18);
    assert.equal(result.time.minute, 30);
    assert.equal(result.date.getFullYear(), 2026);
    assert.equal(result.date.getMonth(), 7);
    assert.equal(result.date.getDate(), 27);
  });

  it("parses a revived Date the same as the ISO string", () => {
    const fromDate = waitlistOfferSlotToDateTime(new Date(iso), timeZone);
    const fromIso = waitlistOfferSlotToDateTime(iso, timeZone);
    assert.deepEqual(fromDate.time, fromIso.time);
    assert.equal(fromDate.date.getTime(), fromIso.date.getTime());
  });
});

describe("isWaitlistOfferSlotAvailable", () => {
  const iso = "2026-08-27T15:30:00.000Z";

  it("is true when the offered start is in availability", () => {
    assert.equal(
      isWaitlistOfferSlotAvailable(
        [new Date("2026-08-27T12:00:00.000Z"), new Date(iso)],
        iso,
      ),
      true,
    );
  });

  it("is false when the offered start is gone", () => {
    assert.equal(
      isWaitlistOfferSlotAvailable([new Date("2026-08-27T12:00:00.000Z")], iso),
      false,
    );
  });
});
