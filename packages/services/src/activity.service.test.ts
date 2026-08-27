import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { ActivityRecord } from "@hacado/types";
import { systemEventSource } from "@hacado/types";

import { ActivityService } from "./activity.service";

const source = systemEventSource;

function activity(
  eventType: string,
  options?: { noExpiry?: true },
): ActivityRecord {
  return {
    eventId: "evt-1",
    eventType,
    title: "Test",
    source,
    ...options,
  };
}

describe("ActivityService organizationRetentionDays", () => {
  it("returns Polar-cached days from the organization", () => {
    assert.equal(
      ActivityService.organizationRetentionDays({ activityRetentionDays: 90 }),
      90,
    );
    assert.equal(
      ActivityService.organizationRetentionDays({ activityRetentionDays: 365 }),
      365,
    );
  });

  it("returns null for fees-exempt, unlimited, or missing retention", () => {
    assert.equal(
      ActivityService.organizationRetentionDays({
        feesExempt: true,
        activityRetentionDays: 365,
      }),
      null,
    );
    assert.equal(
      ActivityService.organizationRetentionDays({
        activityRetentionDays: null,
      }),
      null,
    );
    assert.equal(ActivityService.organizationRetentionDays({}), null);
    assert.equal(ActivityService.organizationRetentionDays(null), null);
  });
});

describe("ActivityService calculateExpiresAt / buildPersistedEntry", () => {
  it("sets expiresAt from organization retention by default", () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    assert.equal(
      ActivityService.calculateExpiresAt(createdAt, 90)?.toISOString(),
      "2026-04-01T00:00:00.000Z",
    );

    const entry = ActivityService.buildPersistedEntry({
      organizationId: "org-1",
      activity: activity("page.updated"),
      organizationRetentionDays: 90,
      createdAt,
      id: "act-1",
    });
    assert.equal(entry.expiresAt?.toISOString(), "2026-04-01T00:00:00.000Z");
    assert.equal("noExpiry" in entry, false);
  });

  it("produces different expiration dates for different organization retention", () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    const ninety = ActivityService.buildPersistedEntry({
      organizationId: "org-1",
      activity: activity("page.updated"),
      organizationRetentionDays: 90,
      createdAt,
      id: "a",
    });
    const year = ActivityService.buildPersistedEntry({
      organizationId: "org-1",
      activity: activity("page.updated"),
      organizationRetentionDays: 365,
      createdAt,
      id: "b",
    });
    assert.equal(ninety.expiresAt?.toISOString(), "2026-04-01T00:00:00.000Z");
    assert.equal(year.expiresAt?.toISOString(), "2027-01-01T00:00:00.000Z");
  });

  it("omits expiresAt when noExpiry is set even if the org has a retention period", () => {
    const entry = ActivityService.buildPersistedEntry({
      organizationId: "org-1",
      activity: activity("payment.created", { noExpiry: true }),
      organizationRetentionDays: 90,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      id: "act-1",
    });
    assert.equal(entry.expiresAt, undefined);
  });

  it("snapshots expiresAt at insert; a later org retention change does not rewrite it", () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    const first = ActivityService.buildPersistedEntry({
      organizationId: "org-1",
      activity: activity("page.updated"),
      organizationRetentionDays: 365,
      createdAt,
      id: "act-1",
    });
    const afterChange = ActivityService.buildPersistedEntry({
      organizationId: "org-1",
      activity: activity("page.updated"),
      organizationRetentionDays: 90,
      createdAt,
      id: "act-2",
    });
    assert.equal(first.expiresAt?.toISOString(), "2027-01-01T00:00:00.000Z");
    assert.equal(
      afterChange.expiresAt?.toISOString(),
      "2026-04-01T00:00:00.000Z",
    );
  });

  it("omits expiresAt when the organization has unlimited retention", () => {
    const entry = ActivityService.buildPersistedEntry({
      organizationId: "org-1",
      activity: activity("page.updated"),
      organizationRetentionDays: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      id: "act-1",
    });
    assert.equal(entry.expiresAt, undefined);
  });
});
