import { getLoggerFactory } from "@hacado/logger";
import {
  IJobService,
  Job,
  JobRequest,
  OrganizationJobRequest,
  RepeatableJobOptions,
  ScheduleRepeatableJobRequest,
} from "@hacado/types";
import { BaseBullMQClient } from "../base-bullmq-client";
import { BullMQJobConfig } from "./types";
import { serializeJobData } from "./utils";

export class BullMQJobService extends BaseBullMQClient implements IJobService {
  protected readonly config: BullMQJobConfig;

  constructor(
    protected readonly organizationId: string,
    config: BullMQJobConfig,
  ) {
    super(config, getLoggerFactory("BullMQJobService", organizationId));
    this.config = config;
    this.initializeQueues();
  }

  private initializeQueues(): void {
    const logger = this.loggerFactory("initializeQueues");

    // Create job queue
    const jobQueue = this.createQueue(this.config.queues.job.name);
    // this.createQueueEvents(this.config.queues.job.name);

    // Create job queue
    logger.info("BullMQ job queues initialized");
  }

  public async scheduleJob(jobRequest: JobRequest): Promise<Job> {
    const logger = this.loggerFactory("scheduleJob");

    try {
      logger.info({ jobRequest }, "Scheduling job");

      const queue = this.getQueue(this.config.queues.job.name);
      const job = await queue.add(
        "job",
        serializeJobData({
          ...jobRequest,
          organizationId: this.organizationId,
        } satisfies OrganizationJobRequest),
        {
          jobId: jobRequest.id,
          priority: 0,
          delay:
            jobRequest.executeAt === "now"
              ? 0
              : jobRequest.executeAt.getTime() - new Date().getTime(),
          deduplication: jobRequest.deduplication,
        },
      );

      logger.info(
        {
          jobId: job.id,
          jobRequest,
        },
        "Job scheduled",
      );

      return {
        ...jobRequest,
        id: job.id!,
        createdAt: new Date(),
      };
    } catch (error) {
      logger.error({ error, jobRequest }, "Failed to schedule job");
      throw error;
    }
  }

  public async scheduleRepeatableJob(
    jobRequest: ScheduleRepeatableJobRequest,
    repeat: RepeatableJobOptions,
  ): Promise<void> {
    const logger = this.loggerFactory("scheduleRepeatableJob");

    try {
      const queue = this.getQueue(this.config.queues.job.name);

      logger.info({ jobRequest, repeat }, "Upserting job scheduler");

      await queue.upsertJobScheduler(
        repeat.id,
        { every: repeat.every },
        {
          name: "job",
          data: serializeJobData({
            ...jobRequest,
            executeAt: "now",
            organizationId: this.organizationId,
          } satisfies OrganizationJobRequest),
        },
      );

      logger.info(
        { schedulerId: repeat.id, every: repeat.every },
        "Job scheduler upserted",
      );
    } catch (error) {
      logger.error(
        { error, jobRequest, repeat },
        "Failed to upsert job scheduler",
      );
      throw error;
    }
  }

  public async removeRepeatableJob(id: string): Promise<void> {
    const logger = this.loggerFactory("removeRepeatableJob");

    try {
      const queue = this.getQueue(this.config.queues.job.name);
      const removed = await queue.removeJobScheduler(id);

      if (removed) {
        logger.info({ schedulerId: id }, "Job scheduler removed");
      } else {
        logger.debug({ schedulerId: id }, "Job scheduler not found");
      }
    } catch (error) {
      logger.error(
        { error, schedulerId: id },
        "Failed to remove job scheduler",
      );
      throw error;
    }
  }

  public async getJob(id: string): Promise<Job | null> {
    const logger = this.loggerFactory("getJob");
    try {
      logger.info({ jobId: id }, "Getting job");
      const queue = this.getQueue(this.config.queues.job.name);
      const job = await queue.getJob(id);
      if (!job) {
        logger.warn({ jobId: id }, "Job not found");
        return null;
      }

      logger.info({ jobId: id }, "Job found");
      return {
        ...job.data,
        id: job.id!,
        createdAt: new Date(),
      };
    } catch (error) {
      logger.error({ error, jobId: id }, "Failed to get job");
      throw error;
    }
  }

  public async getDeduplicatedJob(
    deduplicationId: string,
  ): Promise<Job | null> {
    const logger = this.loggerFactory("getDeduplicatedJob");
    try {
      logger.info({ deduplicationId }, "Getting deduplicated job");
      const queue = this.getQueue(this.config.queues.job.name);
      const jobId = await queue.getDeduplicationJobId(deduplicationId);
      if (!jobId) {
        logger.debug({ deduplicationId }, "Deduplicated job not found");
        return null;
      }

      return this.getJob(jobId);
    } catch (error) {
      logger.error(
        { error, deduplicationId },
        "Failed to get deduplicated job",
      );
      throw error;
    }
  }

  public async getJobs(): Promise<Job[]> {
    const logger = this.loggerFactory("getJobs");
    try {
      logger.info("Getting jobs");
      const queue = this.getQueue(this.config.queues.job.name);
      const jobs = await queue.getJobs();
      return jobs
        .map((job) => ({
          ...job.data,
          id: job.id!,
          createdAt: new Date(),
        }))
        .filter((job) => job.organizationId === this.organizationId);
    } catch (error) {
      logger.error({ error }, "Failed to get jobs");
      throw error;
    }
  }

  public async cancelJob(id: string): Promise<void> {
    const logger = this.loggerFactory("cancelJob");
    try {
      logger.info({ jobId: id }, "Canceling job");
      const queue = this.getQueue(this.config.queues.job.name);
      await queue.remove(id);
      logger.info({ jobId: id }, "Job canceled");
    } catch (error) {
      logger.error({ error, jobId: id }, "Failed to cancel job");
      throw error;
    }
  }

  public async getJobQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    return this.getQueueStats(this.config.queues.job.name);
  }
}
