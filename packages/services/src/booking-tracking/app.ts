import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import {
  BOOKING_TRACKING_STEP_EVENT_TYPE,
  BookingTrackingEventData,
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
import { BookingProgressAnalyticsRepository } from "./analytics-repository";
import {
  ABANDONED_BOOKINGS_JOB_SCHEDULE_INTERVAL_SECONDS,
  ABANDONED_BOOKINGS_JOB_TYPE,
  BOOKING_TRACKING_APP_ID,
  getAbandonedBookingsJobId,
  isSessionJsonKey,
  REDIS_KEY_PREFIX,
} from "./const";
import { DEFAULT_ANALYTICS_TIME_ZONE } from "./date";
import { BookingProgressRedis, BookingProgressTracker } from "./tracker";

export class BuiltInBookingTrackingApp implements IEventSubscriber, IScheduled {
  private jobScheduled = false;
  private timeZone: string | undefined;

  protected readonly loggerFactory: LoggerFactory;
  protected readonly analytics: BookingProgressAnalyticsRepository;
  protected readonly redis: Redis;
  protected readonly tracker: BookingProgressTracker;

  public constructor(
    protected readonly organizationId: string,
    protected readonly services: IServicesContainer,
  ) {
    this.loggerFactory = getLoggerFactory("BookingTrackingApp", organizationId);
    this.analytics = new BookingProgressAnalyticsRepository(organizationId);
    this.redis = getRedisClient();
    this.tracker = new BookingProgressTracker({
      organizationId,
      redis: this.redis as unknown as BookingProgressRedis,
      increment: (date, delta) => this.analytics.incrementMetrics(date, delta),
      getTimeZone: () => this.getTimeZone(),
    });
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
      const { sessionId, step, metadata, createIfMissing } = data;
      await this.tracker.trackStep(sessionId, step, metadata, createIfMissing);

      await this.scheduleAbandonedBookingsJobIfNeeded();

      logger.debug({ sessionId, step, metadata }, "Booking step tracked");
    } catch (error) {
      logger.error({ error, envelope }, "Failed to track booking step");
      throw error;
    }
  }

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
      const sessionIds = await this.scanSessionIds();
      logger.debug({ count: sessionIds.length }, "Found booking session keys");

      let claimed = 0;
      let skippedOptionsOnly = 0;

      for (const sessionId of sessionIds) {
        try {
          const result = await this.tracker.claimAbandoned(sessionId);
          if (result.skippedOptionsOnly) {
            skippedOptionsOnly += 1;
            continue;
          }
          if (result.claimed) {
            claimed += 1;
            logger.debug(
              { sessionId, currentStep: result.currentStep },
              "Recorded abandoned booking at current step",
            );
          }
        } catch (error) {
          logger.error(
            { error, sessionId },
            "Failed to process abandoned booking session",
          );
        }
      }

      logger.info(
        { claimed, skippedOptionsOnly, scanned: sessionIds.length },
        "Successfully processed abandoned bookings",
      );

      this.jobScheduled = false;
      await this.scheduleAbandonedBookingsJobIfNeeded();
    } catch (error) {
      logger.error({ error }, "Failed to process abandoned bookings");
      throw error;
    }
  }

  private async scanSessionIds(): Promise<string[]> {
    const pattern = `${REDIS_KEY_PREFIX}:${this.organizationId}:*`;
    const sessionIds: string[] = [];
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
      for (const key of result[1]) {
        if (!isSessionJsonKey(key)) continue;
        const parts = key.split(":");
        const sessionId = parts[3];
        if (sessionId) sessionIds.push(sessionId);
      }
    } while (cursor !== "0");

    return sessionIds;
  }

  private async getTimeZone(): Promise<string> {
    if (this.timeZone) return this.timeZone;
    try {
      const general =
        await this.services.configurationService.getConfiguration("general");
      this.timeZone = general?.timeZone || DEFAULT_ANALYTICS_TIME_ZONE;
    } catch {
      this.timeZone = DEFAULT_ANALYTICS_TIME_ZONE;
    }
    return this.timeZone;
  }
}
