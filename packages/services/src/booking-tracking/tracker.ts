import {
  BookingProgressMetricsDelta,
  BookingProgressSession,
  BookingStep,
  BookingTrackingMetadata,
} from "@hacado/types";
import {
  ABANDON_AFTER_SECONDS,
  getCountedEnteredKey,
  getCountedStartedKey,
  getRedisKey,
  getSessionTrackingKeys,
  getTerminalKey,
  REDIS_TTL_SECONDS,
  STEPS_EXCLUDED_FROM_ENTERED,
} from "./const";
import { isSessionStale, toAnalyticsDate } from "./date";
import { isEmptyDelta } from "./metrics-delta";

export type BookingProgressRedis = {
  get(key: string): Promise<string | null>;
  set(
    key: string,
    value: string,
    secondsToken: "EX",
    seconds: number,
    nx?: "NX",
  ): Promise<string | null>;
  del(...keys: string[]): Promise<number>;
};

export type BookingProgressTrackerDeps = {
  organizationId: string;
  redis: BookingProgressRedis;
  increment: (date: Date, delta: BookingProgressMetricsDelta) => Promise<void>;
  getTimeZone: () => Promise<string>;
  now?: () => Date;
  abandonAfterSeconds?: number;
  ttlSeconds?: number;
};

const TERMINAL_COMPLETED = "completed";
const TERMINAL_ABANDONED = "abandoned";

export class BookingProgressTracker {
  private readonly organizationId: string;
  private readonly redis: BookingProgressRedis;
  private readonly increment: BookingProgressTrackerDeps["increment"];
  private readonly getTimeZone: () => Promise<string>;
  private readonly now: () => Date;
  private readonly abandonAfterSeconds: number;
  private readonly ttlSeconds: number;

  public constructor(deps: BookingProgressTrackerDeps) {
    this.organizationId = deps.organizationId;
    this.redis = deps.redis;
    this.increment = deps.increment;
    this.getTimeZone = deps.getTimeZone;
    this.now = deps.now ?? (() => new Date());
    this.abandonAfterSeconds =
      deps.abandonAfterSeconds ?? ABANDON_AFTER_SECONDS;
    this.ttlSeconds = deps.ttlSeconds ?? REDIS_TTL_SECONDS;
  }

  public async trackStep(
    sessionId: string,
    step: BookingStep,
    metadata?: BookingTrackingMetadata,
    createIfMissing: boolean = true,
  ): Promise<void> {
    const terminalKey = getTerminalKey(this.organizationId, sessionId);
    const existingTerminal = await this.redis.get(terminalKey);
    if (existingTerminal) {
      // Duplicate conversion (or conversion that lost the abandon race).
      if (step === "BOOKING_CONVERTED") {
        return;
      }

      // Same browser session starting another booking after the previous
      // one finished. Drop old flags so started/entered can count again.
      await this.resetFinishedSession(sessionId);
    }

    const sessionKey = getRedisKey(this.organizationId, sessionId);
    const existingRaw = await this.redis.get(sessionKey);
    const existing = existingRaw
      ? (JSON.parse(existingRaw) as BookingProgressSession)
      : null;

    if (!existing && createIfMissing === false) {
      return;
    }

    const now = this.now();
    const nowIso = now.toISOString();

    const session: BookingProgressSession = existing
      ? { ...existing, sessionId, organizationId: this.organizationId }
      : {
          sessionId,
          organizationId: this.organizationId,
          startedAt: nowIso,
          lastActivityAt: nowIso,
          currentStep: step,
          enteredSteps: [],
          status: "active",
        };

    session.lastActivityAt = nowIso;

    const shouldUpdateCurrentStep =
      step !== "OPTIONS_REQUESTED" ||
      !existing ||
      existing.currentStep === "OPTIONS_REQUESTED";
    if (shouldUpdateCurrentStep && step !== "BOOKING_CONVERTED") {
      session.currentStep = step;
    }

    this.applyMetadata(session, metadata);

    const delta: BookingProgressMetricsDelta = {};
    const isCountableStarted = step !== "OPTIONS_REQUESTED";
    const isCountableEntered = !STEPS_EXCLUDED_FROM_ENTERED.has(step);

    if (isCountableStarted) {
      const startedClaimed = await this.claimFlag(
        getCountedStartedKey(this.organizationId, sessionId),
      );
      if (startedClaimed) {
        delta.started = 1;
      }
    }

    if (isCountableEntered && !session.enteredSteps.includes(step)) {
      session.enteredSteps = [...session.enteredSteps, step];
    }

    if (isCountableEntered) {
      const enteredClaimed = await this.claimFlag(
        getCountedEnteredKey(this.organizationId, sessionId, step),
      );
      if (enteredClaimed) {
        delta.entered = { [step]: 1 };
      }
    }

    if (step === "BOOKING_CONVERTED") {
      session.status = "completed";
      if (metadata?.convertedTo) session.convertedTo = metadata.convertedTo;

      const claimed = await this.claimTerminal(sessionId, TERMINAL_COMPLETED);
      if (claimed) {
        delta.completed = 1;
        if (session.convertedTo) {
          delta.convertedTo = { [session.convertedTo]: 1 };
        }
        await this.persistSession(sessionKey, session);
        await this.flushDelta(session.startedAt, delta);
        await this.deleteSessionJson(sessionKey);
        return;
      }

      return;
    }

    await this.persistSession(sessionKey, session);
    await this.flushDelta(session.startedAt, delta);
  }

  /**
   * Atomically claim an inactive session as abandoned.
   * Returns whether stoppedAt was incremented.
   */
  public async claimAbandoned(sessionId: string): Promise<{
    claimed: boolean;
    skippedOptionsOnly: boolean;
    currentStep?: BookingStep;
  }> {
    const sessionKey = getRedisKey(this.organizationId, sessionId);
    const existingRaw = await this.redis.get(sessionKey);
    if (!existingRaw) {
      return { claimed: false, skippedOptionsOnly: false };
    }

    const session = JSON.parse(existingRaw) as BookingProgressSession;
    const now = this.now();
    if (
      session.status !== "active" ||
      !isSessionStale(session.lastActivityAt, this.abandonAfterSeconds, now)
    ) {
      return { claimed: false, skippedOptionsOnly: false };
    }

    const claimed = await this.claimTerminal(sessionId, TERMINAL_ABANDONED);
    if (!claimed) {
      return { claimed: false, skippedOptionsOnly: false };
    }

    const latestRaw = await this.redis.get(sessionKey);
    if (!latestRaw) {
      return { claimed: false, skippedOptionsOnly: false };
    }
    const latest = JSON.parse(latestRaw) as BookingProgressSession;
    if (!isSessionStale(latest.lastActivityAt, this.abandonAfterSeconds, now)) {
      await this.redis.del(getTerminalKey(this.organizationId, sessionId));
      return { claimed: false, skippedOptionsOnly: false };
    }

    const currentStep = latest.currentStep;
    if (currentStep === "OPTIONS_REQUESTED") {
      await this.deleteSessionJson(sessionKey);
      await this.redis.del(getTerminalKey(this.organizationId, sessionId));
      return {
        claimed: false,
        skippedOptionsOnly: true,
        currentStep,
      };
    }

    await this.flushDelta(latest.startedAt, {
      stoppedAt: { [currentStep]: 1 },
    });
    await this.deleteSessionJson(sessionKey);
    return { claimed: true, skippedOptionsOnly: false, currentStep };
  }

  private applyMetadata(
    session: BookingProgressSession,
    metadata?: BookingTrackingMetadata,
  ): void {
    if (!metadata) return;
    if (metadata.optionId) session.optionId = metadata.optionId;
    if (metadata.duration !== undefined) session.duration = metadata.duration;
    if (metadata.isPaymentRequired !== undefined) {
      session.isPaymentRequired = metadata.isPaymentRequired;
    }
    if (metadata.paymentAmount !== undefined) {
      session.paymentAmount = metadata.paymentAmount;
    }
    if (metadata.customerId) session.customerId = metadata.customerId;
    if (metadata.customerEmail) session.customerEmail = metadata.customerEmail;
    if (metadata.customerName) session.customerName = metadata.customerName;
    if (metadata.appointmentId) session.appointmentId = metadata.appointmentId;
    if (metadata.convertedTo) session.convertedTo = metadata.convertedTo;
  }

  private async claimFlag(key: string): Promise<boolean> {
    const ok = await this.redis.set(key, "1", "EX", this.ttlSeconds, "NX");
    return ok === "OK";
  }

  private async claimTerminal(
    sessionId: string,
    value: typeof TERMINAL_COMPLETED | typeof TERMINAL_ABANDONED,
  ): Promise<boolean> {
    const ok = await this.redis.set(
      getTerminalKey(this.organizationId, sessionId),
      value,
      "EX",
      this.ttlSeconds,
      "NX",
    );
    return ok === "OK";
  }

  private async persistSession(
    sessionKey: string,
    session: BookingProgressSession,
  ): Promise<void> {
    await this.redis.set(
      sessionKey,
      JSON.stringify(session),
      "EX",
      this.ttlSeconds,
    );
  }

  private async deleteSessionJson(sessionKey: string): Promise<void> {
    await this.redis.del(sessionKey);
  }

  private async resetFinishedSession(sessionId: string): Promise<void> {
    const keys = getSessionTrackingKeys(this.organizationId, sessionId);
    await this.redis.del(...keys);
  }

  private async flushDelta(
    startedAt: string,
    delta: BookingProgressMetricsDelta,
  ): Promise<void> {
    if (isEmptyDelta(delta)) return;
    const timeZone = await this.getTimeZone();
    const date = toAnalyticsDate(startedAt, timeZone);
    await this.increment(date, delta);
  }
}
