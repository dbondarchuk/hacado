import { getLoggerFactory } from "@hacado/logger";
import type { EventEnvelope, IServicesContainer } from "@hacado/types";
import { Job } from "bullmq";
import { BaseBullMQClient } from "../bullmq/base-bullmq-client";
import { reviveJobData } from "../bullmq/jobs/utils";
import { getDbConnection } from "../database/index";
import type { BullMQEventConfig } from "./bullmq-event-types";
import { eventHandlers } from "./handlers";

export class BullMQEventWorker extends BaseBullMQClient {
  protected readonly config: BullMQEventConfig;

  constructor(
    config: BullMQEventConfig,
    protected readonly getServices: (
      organizationId: string,
    ) => IServicesContainer,
  ) {
    super(config, getLoggerFactory("BullMQEventWorker"));
    this.config = config;
    this.initializeWorkers();
  }

  private initializeWorkers(): void {
    const worker = this.createWorker(
      this.config.queues.events.name,
      this.processEvent.bind(this),
      { concurrency: this.config.queues.events.concurrency },
    );
    this.setupWorkerEventListeners(worker, this.config.queues.events.name);
  }

  private async processEvent(job: Job): Promise<void> {
    const logger = this.loggerFactory("processEvent");

    try {
      const envelope = reviveJobData(job.data) as EventEnvelope;

      if (!envelope.source) {
        envelope.source = { actor: "system" };
      }

      if (!envelope?.organizationId || !envelope?.id) {
        throw new Error("Invalid event job payload");
      }

      const services = this.getServices(envelope.organizationId);

      await Promise.all(
        eventHandlers.map((handler) =>
          handler.run({
            envelope,
            services,
            redis: services.redisClient,
            getDbConnection: getDbConnection,
          }),
        ),
      );

      logger.info(
        { eventId: envelope.id, type: envelope.type },
        "Event processed",
      );
    } catch (error) {
      logger.error({ error }, "Error processing event");
    }
  }

  public async getWorkerStats(): Promise<{
    events: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
    };
  }> {
    const eventsStats = await this.getQueueStats(
      this.config.queues.events.name,
    );
    return { events: eventsStats };
  }

  public async start(): Promise<void> {
    const logger = this.loggerFactory("start");
    logger.info("Starting BullMQ event worker");
    try {
      await super.start();
      for (const [name, worker] of this.workers) {
        await worker.waitUntilReady();
        logger.info({ worker: name }, "Worker started");
      }
      logger.info("BullMQ event worker started successfully");
    } catch (error) {
      logger.error({ error }, "Failed to start BullMQ event worker");
      throw error;
    }
  }

  public async stop(): Promise<void> {
    const logger = this.loggerFactory("stop");
    logger.info("Stopping BullMQ event worker");
    try {
      await super.stop();
      logger.info("BullMQ event worker stopped successfully");
    } catch (error) {
      logger.error({ error }, "Error stopping BullMQ event worker");
    }
  }

  public async run(options?: { registerSignals?: boolean }): Promise<void> {
    const logger = this.loggerFactory("runUntilCrash");
    const registerSignals = options?.registerSignals !== false;
    try {
      await this.start();
      logger.info("BullMQ event worker running");

      if (registerSignals) {
        const gracefulShutdown = async (signal: string) => {
          logger.info({ signal }, "Shutdown signal, stopping event worker");
          await this.stop();
          process.exit(0);
        };

        process.on("SIGINT", () => gracefulShutdown("SIGINT"));
        process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
      }

      await new Promise<void>((resolve, reject) => {
        for (const [workerName, worker] of this.workers) {
          worker.on("error", (error: Error) => {
            logger.error({ error, worker: workerName }, "Worker error");
            reject(error);
          });
        }

        this.redis.on("error", (error: Error) => {
          logger.error({ error }, "Redis connection error");
          reject(error);
        });

        this.redis.on("close", () => {
          logger.warn("Redis connection closed");
          reject(new Error("Redis connection closed"));
        });

        const keepAlive = () => {
          setTimeout(keepAlive, 1000);
        };
        keepAlive();
      });
    } catch (error) {
      logger.error({ error }, "Event worker crashed");
      await this.stop();
      throw error;
    }
  }

  public async runWithRestart(
    maxRestarts: number = 10,
    restartDelay: number = 5000,
    options?: { registerSignals?: boolean },
  ): Promise<void> {
    const logger = this.loggerFactory("runWithRestart");
    let restartCount = 0;

    while (restartCount < maxRestarts) {
      try {
        logger.info({ restartCount, maxRestarts }, "Starting event worker");
        await this.run(options);
      } catch (error) {
        restartCount++;
        logger.error(
          { error, restartCount, maxRestarts },
          "Event worker crashed, restarting",
        );

        if (restartCount >= maxRestarts) {
          throw new Error(`Event worker crashed ${maxRestarts} times`);
        }

        const delay = restartDelay * Math.pow(2, restartCount - 1);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
}
