import { BookingProgressMetricsDelta, BookingStep } from "@hacado/types";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emptyMetrics } from "./metrics-delta";
import { BookingProgressRedis, BookingProgressTracker } from "./tracker";

class MemoryRedis implements BookingProgressRedis {
  public readonly store = new Map<string, string>();

  public async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  public async set(
    key: string,
    value: string,
    _secondsToken: "EX",
    _seconds: number,
    nx?: "NX",
  ): Promise<string | null> {
    if (nx === "NX" && this.store.has(key)) {
      return null;
    }
    this.store.set(key, value);
    return "OK";
  }

  public async del(...keys: string[]): Promise<number> {
    let removed = 0;
    for (const key of keys) {
      if (this.store.delete(key)) removed += 1;
    }
    return removed;
  }
}

class IncrementStore {
  public readonly byDate = new Map<string, ReturnType<typeof emptyMetrics>>();

  public async increment(
    date: Date,
    delta: BookingProgressMetricsDelta,
  ): Promise<void> {
    const key = date.toISOString();
    const current = this.byDate.get(key) ?? emptyMetrics();
    current.started += delta.started ?? 0;
    current.completed += delta.completed ?? 0;
    for (const [step, count] of Object.entries(delta.entered ?? {})) {
      current.entered[step] = (current.entered[step] ?? 0) + count;
    }
    for (const [step, count] of Object.entries(delta.stoppedAt ?? {})) {
      current.stoppedAt[step] = (current.stoppedAt[step] ?? 0) + count;
    }
    for (const [type, count] of Object.entries(delta.convertedTo ?? {})) {
      current.convertedTo[type] = (current.convertedTo[type] ?? 0) + count;
    }
    this.byDate.set(key, current);
  }

  public totals() {
    const totals = emptyMetrics();
    for (const metrics of this.byDate.values()) {
      totals.started += metrics.started;
      totals.completed += metrics.completed;
      for (const [step, count] of Object.entries(metrics.entered)) {
        totals.entered[step] = (totals.entered[step] ?? 0) + count;
      }
      for (const [step, count] of Object.entries(metrics.stoppedAt)) {
        totals.stoppedAt[step] = (totals.stoppedAt[step] ?? 0) + count;
      }
      for (const [type, count] of Object.entries(metrics.convertedTo)) {
        totals.convertedTo[type] = (totals.convertedTo[type] ?? 0) + count;
      }
    }
    return totals;
  }
}

function createHarness(options?: {
  timeZone?: string;
  now?: { current: Date };
}) {
  const redis = new MemoryRedis();
  const increments = new IncrementStore();
  const clock = options?.now ?? {
    current: new Date("2026-08-26T15:00:00.000Z"),
  };
  const tracker = new BookingProgressTracker({
    organizationId: "org_1",
    redis,
    increment: (date, delta) => increments.increment(date, delta),
    getTimeZone: async () => options?.timeZone ?? "UTC",
    now: () => clock.current,
  });
  return { redis, increments, tracker, clock };
}

async function track(
  tracker: BookingProgressTracker,
  sessionId: string,
  steps: BookingStep[],
) {
  for (const step of steps) {
    await tracker.trackStep(sessionId, step);
  }
}

describe("BookingProgressTracker", () => {
  it("counts a simple flow without optional steps", async () => {
    const { tracker, increments } = createHarness();
    await track(tracker, "s1", [
      "SERVICE_SELECTED",
      "AVAILABILITY_SELECTED",
      "FORM_FILLED",
    ]);
    await tracker.trackStep("s1", "BOOKING_CONVERTED", {
      convertedTo: "appointment",
    });

    const totals = increments.totals();
    assert.equal(totals.started, 1);
    assert.equal(totals.completed, 1);
    assert.deepEqual(totals.entered, {
      SERVICE_SELECTED: 1,
      AVAILABILITY_SELECTED: 1,
      FORM_FILLED: 1,
    });
    assert.deepEqual(totals.stoppedAt, {});
    assert.deepEqual(totals.convertedTo, { appointment: 1 });
  });

  it("counts specialist, otp, and payment when those steps fire", async () => {
    const { tracker, increments } = createHarness();
    await track(tracker, "s1", [
      "SERVICE_SELECTED",
      "SPECIALIST_SELECTED",
      "AVAILABILITY_SELECTED",
      "FORM_FILLED",
      "OTP_REQUESTED",
      "OTP_VERIFIED",
      "PAYMENT_CHECKED",
    ]);
    await tracker.trackStep("s1", "BOOKING_CONVERTED", {
      convertedTo: "appointment",
    });

    const totals = increments.totals();
    assert.equal(totals.entered.SPECIALIST_SELECTED, 1);
    assert.equal(totals.entered.OTP_REQUESTED, 1);
    assert.equal(totals.entered.OTP_VERIFIED, 1);
    assert.equal(totals.entered.PAYMENT_CHECKED, 1);
    assert.equal(totals.completed, 1);
  });

  it("does not invent skipped optional steps", async () => {
    const { tracker, increments } = createHarness();
    await track(tracker, "s1", [
      "SERVICE_SELECTED",
      "AVAILABILITY_SELECTED",
      "FORM_FILLED",
    ]);
    await tracker.trackStep("s1", "BOOKING_CONVERTED", {
      convertedTo: "appointment",
    });

    const totals = increments.totals();
    assert.equal(totals.entered.SPECIALIST_SELECTED, undefined);
    assert.equal(totals.entered.OTP_VERIFIED, undefined);
    assert.equal(totals.entered.PAYMENT_CHECKED, undefined);
  });

  it("counts each entered step only once when revisited", async () => {
    const { tracker, increments } = createHarness();
    await tracker.trackStep("s1", "SERVICE_SELECTED");
    await tracker.trackStep("s1", "SERVICE_SELECTED");
    await tracker.trackStep("s1", "SERVICE_SELECTED");

    const totals = increments.totals();
    assert.equal(totals.started, 1);
    assert.equal(totals.entered.SERVICE_SELECTED, 1);
  });

  it("does not count OPTIONS_REQUESTED as started or entered", async () => {
    const { tracker, increments } = createHarness();
    await tracker.trackStep("s1", "OPTIONS_REQUESTED");

    const totals = increments.totals();
    assert.equal(totals.started, 0);
    assert.deepEqual(totals.entered, {});
  });

  it("increments started on the first real step after OPTIONS_REQUESTED", async () => {
    const { tracker, increments } = createHarness();
    await tracker.trackStep("s1", "OPTIONS_REQUESTED");
    await tracker.trackStep("s1", "SERVICE_SELECTED");

    const totals = increments.totals();
    assert.equal(totals.started, 1);
    assert.equal(totals.entered.SERVICE_SELECTED, 1);
    assert.equal(totals.entered.OPTIONS_REQUESTED, undefined);
  });

  it("ignores duplicate completion requests", async () => {
    const { tracker, increments } = createHarness();
    await tracker.trackStep("s1", "SERVICE_SELECTED");
    await tracker.trackStep("s1", "BOOKING_CONVERTED", {
      convertedTo: "appointment",
    });
    await tracker.trackStep("s1", "BOOKING_CONVERTED", {
      convertedTo: "appointment",
    });

    const totals = increments.totals();
    assert.equal(totals.completed, 1);
  });

  it("starts a new funnel when the customer books again after converting", async () => {
    const { tracker, increments } = createHarness();
    await tracker.trackStep("s1", "SERVICE_SELECTED");
    await tracker.trackStep("s1", "BOOKING_CONVERTED", {
      convertedTo: "appointment",
    });
    await tracker.trackStep("s1", "SERVICE_SELECTED");
    await tracker.trackStep("s1", "FORM_FILLED");
    await tracker.trackStep("s1", "BOOKING_CONVERTED", {
      convertedTo: "appointment",
    });

    const totals = increments.totals();
    assert.equal(totals.started, 2);
    assert.equal(totals.completed, 2);
    assert.equal(totals.entered.SERVICE_SELECTED, 2);
    assert.equal(totals.entered.FORM_FILLED, 1);
    assert.deepEqual(totals.convertedTo, { appointment: 2 });
  });

  it("starts a new funnel when the customer returns after abandoning", async () => {
    const { tracker, increments, clock } = createHarness();
    await tracker.trackStep("s1", "SERVICE_SELECTED");
    clock.current = new Date(clock.current.getTime() + 31 * 60 * 1000);
    await tracker.claimAbandoned("s1");
    await tracker.trackStep("s1", "SERVICE_SELECTED");

    const totals = increments.totals();
    assert.equal(totals.started, 2);
    assert.equal(totals.entered.SERVICE_SELECTED, 2);
    assert.equal(totals.stoppedAt.SERVICE_SELECTED, 1);
    assert.equal(totals.completed, 0);
  });

  it("records stoppedAt at every supported step", async () => {
    const steps: BookingStep[] = [
      "SERVICE_SELECTED",
      "SPECIALIST_SELECTED",
      "ADDON_SELECTED",
      "AVAILABILITY_CHECKED",
      "AVAILABILITY_SELECTED",
      "DUPLICATE_CHECKED",
      "OTP_REQUESTED",
      "OTP_VERIFIED",
      "PAYMENT_CHECKED",
      "FORM_FILLED",
    ];

    for (const step of steps) {
      const { tracker, increments, clock } = createHarness();
      await tracker.trackStep(`s-${step}`, step);
      clock.current = new Date(clock.current.getTime() + 31 * 60 * 1000);
      const result = await tracker.claimAbandoned(`s-${step}`);
      assert.equal(result.claimed, true);
      assert.equal(result.currentStep, step);
      assert.equal(increments.totals().stoppedAt[step], 1);
      assert.equal(increments.totals().completed, 0);
    }
  });

  it("skips OPTIONS_REQUESTED-only sessions on abandon", async () => {
    const { tracker, increments, clock } = createHarness();
    await tracker.trackStep("s1", "OPTIONS_REQUESTED");
    clock.current = new Date(clock.current.getTime() + 31 * 60 * 1000);
    const result = await tracker.claimAbandoned("s1");
    assert.equal(result.skippedOptionsOnly, true);
    assert.equal(result.claimed, false);
    assert.deepEqual(increments.totals(), emptyMetrics());
  });

  it("lets a second worker skip a session already claimed as abandoned", async () => {
    const redis = new MemoryRedis();
    const increments = new IncrementStore();
    const clock = { current: new Date("2026-08-26T15:00:00.000Z") };
    const deps = {
      organizationId: "org_1",
      redis,
      increment: (date: Date, delta: BookingProgressMetricsDelta) =>
        increments.increment(date, delta),
      getTimeZone: async () => "UTC",
      now: () => clock.current,
    };
    const workerA = new BookingProgressTracker(deps);
    const workerB = new BookingProgressTracker(deps);

    await workerA.trackStep("s1", "FORM_FILLED");
    clock.current = new Date(clock.current.getTime() + 31 * 60 * 1000);

    const [first, second] = await Promise.all([
      workerA.claimAbandoned("s1"),
      workerB.claimAbandoned("s1"),
    ]);

    const claimedCount = [first, second].filter((r) => r.claimed).length;
    assert.equal(claimedCount, 1);
    assert.equal(increments.totals().stoppedAt.FORM_FILLED, 1);
  });

  it("does not increment stoppedAt again on scheduler retry", async () => {
    const { tracker, increments, clock } = createHarness();
    await tracker.trackStep("s1", "PAYMENT_CHECKED");
    clock.current = new Date(clock.current.getTime() + 31 * 60 * 1000);
    await tracker.claimAbandoned("s1");
    await tracker.claimAbandoned("s1");
    assert.equal(increments.totals().stoppedAt.PAYMENT_CHECKED, 1);
  });

  it("counts a session as either completed or abandoned, never both", async () => {
    const redis = new MemoryRedis();
    const increments = new IncrementStore();
    const clock = { current: new Date("2026-08-26T15:00:00.000Z") };
    const deps = {
      organizationId: "org_1",
      redis,
      increment: (date: Date, delta: BookingProgressMetricsDelta) =>
        increments.increment(date, delta),
      getTimeZone: async () => "UTC",
      now: () => clock.current,
    };
    const tracker = new BookingProgressTracker(deps);
    await tracker.trackStep("s1", "PAYMENT_CHECKED");
    clock.current = new Date(clock.current.getTime() + 31 * 60 * 1000);

    await Promise.all([
      tracker.trackStep("s1", "BOOKING_CONVERTED", {
        convertedTo: "appointment",
      }),
      tracker.claimAbandoned("s1"),
    ]);

    const totals = increments.totals();
    const terminalCount =
      totals.completed + (totals.stoppedAt.PAYMENT_CHECKED ?? 0);
    assert.equal(terminalCount, 1);
    assert.equal(
      totals.completed === 1 || totals.stoppedAt.PAYMENT_CHECKED === 1,
      true,
    );
  });

  it("buckets all session counters on startedAt in the organization timezone", async () => {
    const clock = { current: new Date("2026-08-26T03:00:00.000Z") };
    const { tracker, increments } = createHarness({
      timeZone: "America/New_York",
      now: clock,
    });
    await tracker.trackStep("s1", "SERVICE_SELECTED");
    await tracker.trackStep("s1", "BOOKING_CONVERTED", {
      convertedTo: "appointment",
    });

    assert.equal(increments.byDate.size, 1);
    const dateKey = [...increments.byDate.keys()][0];
    // 2026-08-26 03:00 UTC is 2026-08-25 23:00 in America/New_York (EDT).
    assert.equal(dateKey, "2026-08-25T04:00:00.000Z");
    const metrics = increments.byDate.get(dateKey)!;
    assert.equal(metrics.started, 1);
    assert.equal(metrics.completed, 1);
  });

  it("skips tracking when createIfMissing is false and no session exists", async () => {
    const { tracker, increments } = createHarness();
    await tracker.trackStep("s1", "PAYMENT_SUCCESS", undefined, false);
    assert.deepEqual(increments.totals(), emptyMetrics());
  });
});
