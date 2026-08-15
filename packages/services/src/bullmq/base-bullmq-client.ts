import { LoggerFactory } from "@hacado/logger";
import { Job, Queue, QueueEvents, Worker } from "bullmq";
import { Redis } from "ioredis";
import { BullMQConfig } from "./types";

export interface QueueJobData {
  [key: string]: any;
}

export abstract class BaseBullMQClient {
  protected readonly redis: Redis;
  protected readonly config: BullMQConfig;
  protected readonly queues: Map<string, Queue> = new Map();
  protected readonly workers: Map<string, Worker> = new Map();
  protected readonly queueEvents: Map<string, QueueEvents> = new Map();

  constructor(
    config: BullMQConfig,
    protected readonly loggerFactory: LoggerFactory,
  ) {
    this.config = config;

    // Initialize Redis connection
    this.redis =
      typeof this.config.redis === "object" && "host" in this.config.redis
        ? new Redis({
            host: this.config.redis.host,
            port: this.config.redis.port,
            password: this.config.redis.password,
            db: this.config.redis.db,
            maxRetriesPerRequest: null,
            lazyConnect: true,
          })
        : this.config.redis;
  }

  /**
   * Start the BullMQ client
   * This method can be overridden by subclasses
   */
  public async start(): Promise<void> {
    const logger = this.loggerFactory("start");
    logger.info("Starting BullMQ client");

    try {
      // Connect to Redis if not already connected
      if (this.redis.status === "ready") {
        logger.info("Redis already connected");
      } else if (this.redis.status === "connecting") {
        logger.info("Redis is connecting, waiting for connection");
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Redis connection timeout"));
          }, 10000); // 10 second timeout

          this.redis.once("ready", () => {
            clearTimeout(timeout);
            resolve();
          });

          this.redis.once("error", (error) => {
            clearTimeout(timeout);
            reject(error);
          });
        });
        logger.info("Redis connection established");
      } else {
        await this.redis.connect();
        logger.info("Connected to Redis");
      }

      logger.info("BullMQ client started successfully");
    } catch (error) {
      logger.error({ error }, "Failed to start BullMQ client");
      throw error;
    }
  }

  /**
   * Stop the BullMQ client
   * This method can be overridden by subclasses
   */
  public async stop(): Promise<void> {
    const logger = this.loggerFactory("stop");
    logger.info("Stopping BullMQ client");

    try {
      // Close all workers
      for (const [name, worker] of this.workers) {
        await worker.close();
        logger.info({ worker: name }, "Worker closed");
      }

      // Close all queues
      for (const [name, queue] of this.queues) {
        await queue.close();
        logger.info({ queue: name }, "Queue closed");
      }

      // Close all queue events
      for (const [name, queueEvents] of this.queueEvents) {
        await queueEvents.close();
        logger.info({ queueEvents: name }, "Queue events closed");
      }

      // Close Redis connection
      await this.redis.quit();
      logger.info("Redis connection closed");

      logger.info("BullMQ client stopped successfully");
    } catch (error) {
      logger.error({ error }, "Error stopping BullMQ client");
    }
  }

  protected createQueue(name: string, additionalOptions?: any): Queue {
    const logger = this.loggerFactory("createQueue");

    const queue = new Queue(name, {
      connection: this.redis,
      defaultJobOptions: {
        ...this.config.defaultJobOptions,
        ...additionalOptions,
      },
    });

    this.queues.set(name, queue);
    logger.info({ queue: name }, "Queue created");

    return queue;
  }

  protected createWorker(
    queueName: string,
    processor: (job: Job) => Promise<any>,
    options?: any,
  ): Worker {
    const logger = this.loggerFactory("createWorker");

    const worker = new Worker(queueName, processor, {
      ...this.config.defaultJobOptions,
      connection: this.redis,
      concurrency: 5,
      ...options,
    });

    this.workers.set(queueName, worker);
    logger.info({ worker: queueName }, "Worker created");

    return worker;
  }

  protected createQueueEvents(queueName: string): QueueEvents {
    const logger = this.loggerFactory("createQueueEvents");

    const queueEvents = new QueueEvents(queueName, {
      connection: this.redis,
    });

    this.queueEvents.set(queueName, queueEvents);
    logger.info({ queueEvents: queueName }, "Queue events created");

    return queueEvents;
  }

  protected setupWorkerEventListeners(worker: Worker, queueName: string): void {
    const logger = this.loggerFactory("setupWorkerEventListeners");

    worker.on("completed", (job: Job) => {
      logger.info({ jobId: job.id, queue: queueName }, "Job completed");
    });

    worker.on("failed", (job: Job | undefined, err: Error) => {
      logger.error(
        { jobId: job?.id, error: err, queue: queueName },
        "Job failed",
      );
    });

    worker.on("stalled", (jobId: string) => {
      logger.warn({ jobId, queue: queueName }, "Job stalled");
    });

    worker.on("error", (err: Error) => {
      logger.error({ error: err, worker: queueName }, "Worker error");
    });
  }

  protected setupQueueEventListeners(
    queueEvents: QueueEvents,
    queueName: string,
  ): void {
    const logger = this.loggerFactory("setupQueueEventListeners");

    queueEvents.on(
      "completed",
      (
        args: { jobId: string; returnvalue: string; prev?: string },
        id: string,
      ) => {
        logger.info(
          { jobId: args.jobId, queue: queueName },
          "Job completed via queue events",
        );
      },
    );

    queueEvents.on(
      "failed",
      (
        args: { jobId: string; failedReason: string; prev?: string },
        id: string,
      ) => {
        logger.error(
          { jobId: args.jobId, error: args.failedReason, queue: queueName },
          "Job failed via queue events",
        );
      },
    );

    queueEvents.on("stalled", (args: { jobId: string }, id: string) => {
      logger.warn(
        { jobId: args.jobId, queue: queueName },
        "Job stalled via queue events",
      );
    });
  }

  public async getQueueStats(queueName: string): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const [waiting, active, completed, failed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
    };
  }

  public async getAllQueueStats(): Promise<
    Record<
      string,
      {
        waiting: number;
        active: number;
        completed: number;
        failed: number;
      }
    >
  > {
    const stats: Record<string, any> = {};

    for (const queueName of this.queues.keys()) {
      stats[queueName] = await this.getQueueStats(queueName);
    }

    return stats;
  }

  protected getQueue(queueName: string): Queue {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }
    return queue;
  }
}
