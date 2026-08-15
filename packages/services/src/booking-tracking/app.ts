import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import {
  BOOKING_TRACKING_STEP_EVENT_TYPE,
  BookingStep,
  BookingTrackingEvent,
  BookingTrackingEventData,
  BookingTrackingMetadata,
  ConnectedAppData,
  EventEnvelope,
  IEventSubscriber,
  IScheduled,
  IServicesContainer,
  JobRequest,
} from "@hacado/types";
import { Redis } from "ioredis";
import { DateTime } from "luxon";
import { getRedisClient } from "../bullmq";
import {
  ABANDON_AFTER_SECONDS,
  ABANDONED_BOOKINGS_JOB_SCHEDULE_INTERVAL_SECONDS,
  ABANDONED_BOOKINGS_JOB_TYPE,
  BOOKING_TRACKING_APP_ID,
  getAbandonedBookingsJobId,
  getRedisKey,
  REDIS_KEY_PREFIX,
  REDIS_TTL_SECONDS,
} from "./const";
import { BookingTrackingRepository } from "./repository";

type BookingSession = {
  startedAt: string;
  lastSeenAt: string;
  lastStep: BookingStep;
  steps: Record<BookingStep, string>;
  optionId?: string;
  duration?: number;
  isPaymentRequired?: boolean;
  paymentAmount?: number;
  customerId?: string;
  customerEmail?: string;
  customerName?: string;
  status: "active" | "abandoned" | "processed" | "converted";
  appointmentId?: string;
  convertedTo?: string;
  convertedId?: string;
  convertedAppName?: string;
};

export class BuiltInBookingTrackingApp implements IEventSubscriber, IScheduled {
  private jobScheduled = false;

  protected readonly loggerFactory: LoggerFactory;
  protected readonly repository: BookingTrackingRepository;
  protected readonly redis: Redis;

  public constructor(
    protected readonly organizationId: string,
    protected readonly services: IServicesContainer,
  ) {
    this.loggerFactory = getLoggerFactory("BookingTrackingApp", organizationId);
    this.repository = new BookingTrackingRepository(organizationId);
    this.redis = getRedisClient();
  }

  public async onEvent(
    _: ConnectedAppData,
    envelope: EventEnvelope,
  ): Promise<void> {
    const logger = this.loggerFactory("onEvent");
    logger.debug({ envelope }, "Tracking booking step");
    if (envelope.type !== BOOKING_TRACKING_STEP_EVENT_TYPE) {
      logger.debug(
        { type: envelope.type },
        "Skipping event, unknown event type",
      );
      return;
    }

    const data = envelope.payload as BookingTrackingEventData;

    try {
      const { sessionId, step, metadata } = data;
      await this.trackBookingStep(sessionId, step, metadata);

      await this.scheduleAbandonedBookingsJobIfNeeded();

      // If booking was converted, save to MongoDB immediately
      if (step === "BOOKING_CONVERTED" && metadata) {
        const session = await this.getActiveSession(sessionId);
        if (session) {
          await this.saveBookingResult(sessionId, {
            startedAt: session.startedAt,
            lastSeenAt: session.lastSeenAt,
            lastStep: "BOOKING_CONVERTED",
            steps: session.steps,
            optionId: session.optionId,
            duration: session.duration,
            isPaymentRequired: session.isPaymentRequired,
            paymentAmount: session.paymentAmount,
            customerId: metadata?.customerId || session.customerId,
            customerEmail: metadata?.customerEmail || session.customerEmail,
            customerName: metadata?.customerName || session.customerName,
            status: "converted",
            convertedTo: metadata?.convertedTo,
            convertedId: metadata?.convertedId,
            convertedAppName: metadata?.convertedAppName,
            convertedAt: new Date(),
          });

          // Mark as processed in Redis
          await this.markSessionAsProcessed(sessionId);

          logger.debug(
            { sessionId, convertedTo: metadata?.convertedTo },
            "Successfully saved converted booking to DB",
          );
        }
      }

      logger.debug({ sessionId, step, metadata }, "Booking step tracked");
    } catch (error) {
      logger.error({ error, envelope }, "Failed to track booking step");
      throw error;
    }
  }

  /**
   * Schedule abandoned bookings job if not already scheduled
   */
  private async scheduleAbandonedBookingsJobIfNeeded(): Promise<void> {
    if (this.jobScheduled) {
      return;
    }

    const logger = this.loggerFactory("scheduleAbandonedBookingsJobIfNeeded");
    try {
      const jobId = getAbandonedBookingsJobId(this.organizationId);
      const job = await this.services.jobService.getDeduplicatedJob(jobId);

      if (job) {
        logger.debug("Abandoned bookings job already scheduled");
        return;
      }

      // Schedule as an app job that calls this built-in app's method
      const nextTime = DateTime.now().plus({
        seconds: ABANDONED_BOOKINGS_JOB_SCHEDULE_INTERVAL_SECONDS,
      });

      await this.services.jobService.scheduleJob({
        type: "app",
        executeAt: nextTime.toJSDate(),
        appId: BOOKING_TRACKING_APP_ID,
        payload: {
          type: ABANDONED_BOOKINGS_JOB_TYPE,
        },
        deduplication: {
          id: jobId,
          ttl: ABANDONED_BOOKINGS_JOB_SCHEDULE_INTERVAL_SECONDS * 1000,
        },
      });

      this.jobScheduled = true;
      logger.debug("Scheduled abandoned bookings job");
    } catch (error) {
      logger.error({ error }, "Failed to schedule abandoned bookings job");
    }
  }

  /**
   * Process abandoned bookings - called by scheduled job
   */
  public async processJob(
    _appData: ConnectedAppData,
    jobData: JobRequest,
  ): Promise<void> {
    const logger = this.loggerFactory("processJob");
    logger.debug({ jobData }, "Processing abandoned bookings");

    if (jobData.type !== "app") {
      logger.debug({ jobData }, "Skipping job, not an app job");
      return;
    }

    if (jobData.payload.type !== ABANDONED_BOOKINGS_JOB_TYPE) {
      logger.debug({ jobData }, "Skipping job, unknown job type");
      return;
    }

    try {
      const abandonedSessions = await this.getAbandonedSessions(
        ABANDON_AFTER_SECONDS,
      );

      logger.debug(
        { count: abandonedSessions.length },
        "Found abandoned sessions",
      );

      for (const session of abandonedSessions) {
        try {
          // Skip sessions that only requested options (users who just opened the page)
          if (session.lastStep === "OPTIONS_REQUESTED") {
            logger.debug(
              { sessionId: session.sessionId },
              "Skipping session that only requested options",
            );

            // Still mark as processed in Redis to avoid reprocessing
            await this.markSessionAsProcessed(session.sessionId);
            continue;
          }

          // Save to MongoDB using core service
          await this.saveBookingResult(session.sessionId, {
            startedAt: session.startedAt,
            lastSeenAt: session.lastSeenAt,
            lastStep: session.lastStep,
            steps: session.steps,
            optionId: session.optionId,
            duration: session.duration,
            isPaymentRequired: session.isPaymentRequired,
            paymentAmount: session.paymentAmount,
            customerId: session.customerId,
            customerEmail: session.customerEmail,
            customerName: session.customerName,
            status: "abandoned",
            appointmentId: session.appointmentId,
            abandonedAt: new Date(),
          });

          // Mark as processed in Redis
          await this.markSessionAsProcessed(session.sessionId);

          logger.debug(
            { sessionId: session.sessionId, lastStep: session.lastStep },
            "Saved abandoned booking to MongoDB",
          );
        } catch (error) {
          logger.error(
            { error, sessionId: session.sessionId },
            "Failed to save abandoned booking",
          );
        }
      }

      logger.info(
        { count: abandonedSessions.length },
        "Successfully processed abandoned bookings",
      );

      // Schedule next hourly job
      this.jobScheduled = false;
      await this.scheduleAbandonedBookingsJobIfNeeded();
    } catch (error) {
      logger.error({ error }, "Failed to process abandoned bookings");
      throw error;
    }
  }

  private async getActiveSession(sessionId: string): Promise<{
    sessionId: string;
    startedAt: string;
    lastSeenAt: string;
    lastStep: BookingStep;
    steps: Record<BookingStep, string>;
    optionId?: string;
    duration?: number;
    isPaymentRequired?: boolean;
    paymentAmount?: number;
    customerId?: string;
    customerEmail?: string;
    customerName?: string;
    status: "active" | "abandoned" | "processed" | "converted";
    appointmentId?: string;
    convertedTo?: string;
    convertedId?: string;
    convertedAppName?: string;
  } | null> {
    const logger = this.loggerFactory("getActiveSession");
    const redisKey = getRedisKey(this.organizationId, sessionId);

    try {
      const existing = await this.redis.get(redisKey);
      if (!existing) {
        return null;
      }

      const session: BookingSession = JSON.parse(existing);
      return { ...session, sessionId };
    } catch (error) {
      logger.error({ error, sessionId }, "Failed to get active session");
      return null;
    }
  }

  /**
   * Save booking result to MongoDB
   * Internal method used by job processor
   */
  private async saveBookingResult(
    sessionId: string,
    data: {
      startedAt: Date | string;
      lastSeenAt: Date | string;
      lastStep: BookingStep;
      steps: Record<BookingStep, string>;
      optionId?: string;
      duration?: number;
      isPaymentRequired?: boolean;
      paymentAmount?: number;
      customerId?: string;
      customerEmail?: string;
      customerName?: string;
      status: "abandoned" | "converted";
      appointmentId?: string;
      abandonedAt?: Date;
      convertedAt?: Date;
      convertedTo?: string;
      convertedId?: string;
      convertedAppName?: string;
    },
  ): Promise<BookingTrackingEvent> {
    return this.repository.saveBookingResult(sessionId, {
      ...data,
      startedAt:
        typeof data.startedAt === "string"
          ? new Date(data.startedAt)
          : data.startedAt,
      lastSeenAt:
        typeof data.lastSeenAt === "string"
          ? new Date(data.lastSeenAt)
          : data.lastSeenAt,
    });
  }

  /**
   * Mark session as processed (after moving to MongoDB)
   * Internal method used by job processor
   */
  private async markSessionAsProcessed(sessionId: string): Promise<void> {
    const logger = this.loggerFactory("markSessionAsProcessed");
    const redisKey = getRedisKey(this.organizationId, sessionId);

    try {
      const existing = await this.redis.get(redisKey);
      if (!existing) {
        logger.warn({ sessionId }, "Session not found for processing");
        return;
      }

      //   const session: BookingSession = JSON.parse(existing);
      //   session.status = "processed";

      //   await this.redis.setex(
      //     redisKey,
      //     REDIS_TTL_SECONDS,
      //     JSON.stringify(session),
      //   );

      //   logger.debug({ sessionId }, "Session marked as processed");
      await this.redis.del(redisKey);
      logger.debug({ sessionId }, "Session marked as processed");
    } catch (error) {
      logger.error({ error, sessionId }, "Failed to mark session as processed");
      throw error;
    }
  }

  private async trackBookingStep(
    sessionId: string,
    step: BookingStep,
    metadata?: BookingTrackingMetadata,
  ): Promise<void> {
    const logger = this.loggerFactory("trackBookingStep");
    const redisKey = getRedisKey(this.organizationId, sessionId);
    const now = new Date().toISOString();

    try {
      // Get existing session
      const existing = await this.redis.get(redisKey);
      const existingSession = existing
        ? (JSON.parse(existing) as BookingSession)
        : null;

      const isExistingSessionActive =
        existingSession?.status === "active" &&
        DateTime.fromISO(existingSession.lastSeenAt).diffNow("seconds")
          .seconds < ABANDON_AFTER_SECONDS;

      const session: BookingSession = isExistingSessionActive
        ? existingSession
        : {
            startedAt: now,
            lastSeenAt: now,
            lastStep: step,
            steps: {} as Record<BookingStep, string>,
            status: "active",
          };

      // Update lastSeenAt always
      session.lastSeenAt = now;
      session.lastStep = step;

      // Only add step to steps object if it's new (handles back-and-forth navigation)
      if (!session.steps[step]) {
        session.steps[step] = now;
        logger.debug(
          { sessionId, step, isNewStep: true },
          "New booking step tracked",
        );
      } else {
        logger.debug(
          { sessionId, step, isNewStep: false },
          "Booking step revisited, updating lastSeenAt only",
        );
      }

      // Handle conversion step
      if (step === "BOOKING_CONVERTED") {
        session.status = "converted";
        if (metadata?.convertedTo) session.convertedTo = metadata.convertedTo;
        if (metadata?.convertedId) session.convertedId = metadata.convertedId;
        if (metadata?.convertedAppName)
          session.convertedAppName = metadata.convertedAppName;
      }

      // Update metadata
      if (metadata) {
        if (metadata.optionId) session.optionId = metadata.optionId;
        if (metadata.duration !== undefined)
          session.duration = metadata.duration;
        if (metadata.isPaymentRequired !== undefined) {
          session.isPaymentRequired = metadata.isPaymentRequired;
        }
        if (metadata.paymentAmount !== undefined) {
          session.paymentAmount = metadata.paymentAmount;
        }
        if (metadata.customerId) session.customerId = metadata.customerId;
        if (metadata.customerEmail)
          session.customerEmail = metadata.customerEmail;
        if (metadata.customerName) session.customerName = metadata.customerName;
        if (metadata.appointmentId)
          session.appointmentId = metadata.appointmentId;
      }

      // Set with 48 hour TTL
      await this.redis.setex(
        redisKey,
        REDIS_TTL_SECONDS,
        JSON.stringify(session),
      );

      logger.debug({ sessionId, step }, "Booking step tracked successfully");
    } catch (error) {
      logger.error({ error, sessionId, step }, "Failed to track booking step");
      throw error;
    }
  }

  private async getAbandonedSessions(
    abandonAfterSeconds: number = ABANDON_AFTER_SECONDS,
  ): Promise<Array<BookingSession & { sessionId: string }>> {
    const logger = this.loggerFactory("getAbandonedSessions");
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - abandonAfterSeconds * 1000);

    try {
      // Scan for all booking sessions for this organization
      const pattern = `${REDIS_KEY_PREFIX}:${this.organizationId}:*`;
      const keys: string[] = [];
      let cursor = "0";

      do {
        const result = await this.redis.scan(
          cursor,
          "MATCH",
          pattern,
          "COUNT",
          100,
        );
        cursor = result[0];
        keys.push(...result[1]);
      } while (cursor !== "0");

      const abandonedSessions: Array<BookingSession & { sessionId: string }> =
        [];

      for (const key of keys) {
        // Extract sessionId from key: booking:session:{organizationId}:{sessionId}
        const keyParts = key.split(":");
        if (keyParts.length < 4) continue;
        const sessionId = keyParts[3];

        const data = await this.redis.get(key);
        if (!data) continue;

        const session: BookingSession = JSON.parse(data);

        // Check if session should be considered abandoned
        // Skip if already converted
        if (
          session.status === "active" &&
          new Date(session.lastSeenAt) < cutoffTime &&
          session.lastStep !== "BOOKING_CONVERTED"
        ) {
          session.status = "abandoned";
          abandonedSessions.push({ ...session, sessionId });
        }
      }

      logger.debug(
        {
          count: abandonedSessions.length,
          abandonAfterSeconds,
        },
        "Retrieved abandoned sessions",
      );

      return abandonedSessions;
    } catch (error) {
      logger.error({ error }, "Failed to get abandoned sessions");
      throw error;
    }
  }
}
