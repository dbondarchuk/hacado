import { getLoggerFactory } from "@timelish/logger";
import {
  AppJobRequest,
  EventDeliveryJobRequest,
  EventEnvelope,
  IEventSubscriber,
  IScheduled,
  IServicesContainer,
  OrganizationJobRequest,
  WithOrganizationId,
} from "@timelish/types";
import { Job } from "bullmq";
import { BuiltInApps } from "../../built-in/apps";
import { getBuiltInAppData } from "../../built-in/utils";
import { canProcessApp } from "@timelish/app-store";
import { resolvePlanTierFromOrganization } from "../../billing/subscription-entitlements";
import { BaseBullMQClient } from "../base-bullmq-client";
import { BullMQJobConfig } from "./types";
import { reviveJobData } from "./utils";

export class BullMQJobWorker extends BaseBullMQClient {
  protected readonly config: BullMQJobConfig;

  constructor(
    config: BullMQJobConfig,
    protected readonly getServices: (
      organizationId: string,
    ) => IServicesContainer,
  ) {
    super(config, getLoggerFactory("BullMQJobWorker"));
    this.config = config;
    this.initializeWorkers();
  }

  private initializeWorkers(): void {
    const logger = this.loggerFactory("initializeWorkers");

    // Create email worker
    const jobWorker = this.createWorker(
      this.config.queues.job.name,
      this.processJob.bind(this),
      {
        concurrency: this.config.queues.job.concurrency,
      },
    );
    this.setupWorkerEventListeners(jobWorker, this.config.queues.job.name);

    logger.info("BullMQ job workers initialized");
  }

  private async processJob(job: Job<OrganizationJobRequest>): Promise<void> {
    const logger = this.loggerFactory("processJob");
    const jobData = reviveJobData(job.data);

    try {
      logger.info(
        {
          jobId: job.id,
          attempt: job.attemptsMade + 1,
          maxAttempts: job.opts.attempts,
          jobData,
        },
        "Processing job",
      );

      switch (jobData.type) {
        case "app":
          await this.processAppJob(job.id!, jobData);
          break;
        case "event":
          await this.processEventDeliveryJob(job.id!, jobData);
          break;
        default:
          throw new Error(`Invalid job type: ${(jobData as any).type}`);
      }

      logger.info({ jobId: job.id }, "Job completed successfully");
    } catch (error) {
      logger.error(
        {
          error,
          jobId: job.id,
          attempt: job.attemptsMade + 1,
          maxAttempts: job.opts.attempts,
        },
        "Job failed",
      );

      throw error; // Re-throw to trigger retry mechanism
    }
  }

  public async getWorkerStats(): Promise<{
    job: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
    };
  }> {
    const jobStats = await this.getQueueStats(this.config.queues.job.name);

    return {
      job: jobStats,
    };
  }

  public async start(): Promise<void> {
    const logger = this.loggerFactory("start");
    logger.info("Starting BullMQ job worker");

    try {
      // Call parent start method to handle Redis connection
      await super.start();

      // Start all workers
      for (const [name, worker] of this.workers) {
        await worker.waitUntilReady();
        logger.info({ worker: name }, "Worker started");
      }

      logger.info("BullMQ job worker started successfully");
    } catch (error) {
      logger.error({ error }, "Failed to start BullMQ job worker");
      throw error;
    }
  }

  public async stop(): Promise<void> {
    const logger = this.loggerFactory("stop");
    logger.info("Stopping BullMQ job worker");

    try {
      // Call parent stop method to handle cleanup
      await super.stop();
      logger.info("BullMQ job worker stopped successfully");
    } catch (error) {
      logger.error({ error }, "Error stopping BullMQ job worker");
    }
  }
  /**
   * Start the worker and keep it running until it crashes or is stopped
   * This method will block until the worker encounters a fatal error
   */
  public async run(options?: { registerSignals?: boolean }): Promise<void> {
    const logger = this.loggerFactory("runUntilCrash");
    const registerSignals = options?.registerSignals !== false;

    try {
      await this.start();
      logger.info("BullMQ job worker started successfully");

      if (registerSignals) {
        const gracefulShutdown = async (signal: string) => {
          logger.info(
            { signal },
            "Received shutdown signal, stopping worker gracefully",
          );
          await this.stop();
          process.exit(0);
        };

        process.on("SIGINT", () => gracefulShutdown("SIGINT"));
        process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
      }

      // Keep the process alive and wait for worker errors
      await new Promise<void>((resolve, reject) => {
        // Listen for worker errors
        for (const [workerName, worker] of this.workers) {
          worker.on("error", (error: Error) => {
            logger.error(
              { error, worker: workerName },
              "Worker encountered fatal error",
            );
            reject(error);
          });
        }

        // Listen for Redis connection errors
        this.redis.on("error", (error: Error) => {
          logger.error({ error }, "Redis connection error");
          reject(error);
        });

        // Listen for Redis connection close
        this.redis.on("close", () => {
          logger.warn("Redis connection closed");
          reject(new Error("Redis connection closed"));
        });

        // Keep the process alive
        const keepAlive = () => {
          setTimeout(keepAlive, 1000);
        };
        keepAlive();
      });
    } catch (error) {
      logger.error({ error }, "Worker crashed with error");
      await this.stop();
      throw error;
    }
  }

  /**
   * Start the worker and run it indefinitely with automatic restart on crashes
   * This method will restart the worker if it crashes, with exponential backoff
   */
  public async runWithRestart(
    maxRestarts: number = 10,
    restartDelay: number = 5000,
    options?: { registerSignals?: boolean },
  ): Promise<void> {
    const logger = this.loggerFactory("runWithRestart");
    let restartCount = 0;

    while (restartCount < maxRestarts) {
      try {
        logger.info({ restartCount, maxRestarts }, "Starting worker");
        await this.run(options);
      } catch (error) {
        restartCount++;
        logger.error(
          { error, restartCount, maxRestarts },
          "Worker crashed, attempting restart",
        );

        if (restartCount >= maxRestarts) {
          logger.error({ maxRestarts }, "Max restarts reached, giving up");
          throw new Error(`Worker crashed ${maxRestarts} times, giving up`);
        }

        // Exponential backoff delay
        const delay = restartDelay * Math.pow(2, restartCount - 1);
        logger.info({ delay }, "Waiting before restart");
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  private async canProcessAppForJob(
    organizationId: string,
    appId: string,
  ): Promise<boolean> {
    const services = this.getServices(organizationId);
    const organization = await services.organizationService.getOrganization();
    const planTier = resolvePlanTierFromOrganization(organization);

    if (BuiltInApps[appId as keyof typeof BuiltInApps]) {
      return canProcessApp(planTier, appId);
    }

    try {
      const { app } = await services.connectedAppsService.getAppService(appId);
      return canProcessApp(planTier, app.name);
    } catch {
      return true;
    }
  }

  private async processAppJob(
    jobId: string,
    jobData: WithOrganizationId<AppJobRequest>,
  ): Promise<void> {
    const logger = this.loggerFactory("processAppJob");

    try {
      logger.info({ jobId, jobData }, "Processing app job");
      const organizationId = jobData.organizationId;
      if (!organizationId) {
        throw new Error("organizationId is required in job data");
      }

      const services = this.getServices(organizationId);
      const allowed = await this.canProcessAppForJob(
        organizationId,
        jobData.appId,
      );
      if (!allowed) {
        logger.info(
          { jobId, appId: jobData.appId },
          "Skipping app job for subscription plan tier",
        );
        return;
      }

      const builtIn = BuiltInApps[jobData.appId as keyof typeof BuiltInApps];
      if (builtIn?.scheduled) {
        const contacts =
          await services.teamService.getOrganizationAdminContacts();
        const contact = contacts[0];
        if (!contact) {
          throw new Error("Organization admin member not found");
        }
        const appData = getBuiltInAppData(
          organizationId,
          contact.memberId,
          jobData.appId as keyof typeof BuiltInApps,
        );
        const service = new builtIn.getService(organizationId, services);
        if (typeof service.processJob === "function") {
          await service.processJob(appData, jobData);
          logger.info({ jobId }, "Job completed successfully");
        } else {
          logger.error(
            { jobId },
            "Built-in service does not implement processJob",
          );
        }
        return;
      }

      const { app, service } =
        await services.connectedAppsService.getAppService<IScheduled>(
          jobData.appId,
        );

      if (service.processJob) {
        await service.processJob(app, jobData);
        logger.info({ jobId }, "Job completed successfully");
      } else {
        logger.error({ jobId }, "Service does not implement processJob");
      }
    } catch (error) {
      logger.error({ error, jobId, jobData }, "Failed to process app job");
      throw error;
    }
  }

  private async processEventDeliveryJob(
    jobId: string,
    jobData: WithOrganizationId<EventDeliveryJobRequest>,
  ): Promise<void> {
    const logger = this.loggerFactory("processEventDeliveryJob");

    try {
      logger.info({ jobId, jobData }, "Processing event delivery job");
      const organizationId = jobData.organizationId;
      if (!organizationId) {
        throw new Error("organizationId is required in job data");
      }

      const envelope = reviveJobData(jobData.envelope) as EventEnvelope;
      const services = this.getServices(organizationId);

      const allowed = await this.canProcessAppForJob(
        organizationId,
        jobData.appId,
      );
      if (!allowed) {
        logger.info(
          { jobId, appId: jobData.appId },
          "Skipping event delivery for subscription plan tier",
        );
        return;
      }

      const builtIn = BuiltInApps[jobData.appId];
      if (builtIn) {
        const contacts =
          await services.teamService.getOrganizationAdminContacts();
        const contact = contacts[0];
        if (!contact) {
          throw new Error("Organization admin member not found");
        }
        const appData = getBuiltInAppData(
          organizationId,
          contact.memberId,
          jobData.appId as keyof typeof BuiltInApps,
        );
        const service = new builtIn.getService(organizationId, services);
        const subscriber = service as IEventSubscriber;
        if (typeof subscriber.onEvent === "function") {
          await subscriber.onEvent(appData, envelope);
        }
      } else {
        const { service, app } =
          await services.connectedAppsService.getAppService(jobData.appId);

        const subscriber = service as IEventSubscriber;
        if (typeof subscriber.onEvent === "function") {
          await subscriber.onEvent(app, envelope);
        }
      }

      logger.info({ jobId }, "Event delivery job completed successfully");
    } catch (error) {
      logger.error(
        { error, jobId, jobData },
        "Failed to process event delivery job",
      );
      throw error;
    }
  }
}
