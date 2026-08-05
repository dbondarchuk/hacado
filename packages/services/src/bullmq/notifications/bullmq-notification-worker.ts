import { getLoggerFactory } from "@hacado/logger";
import {
  Email,
  EmailNotificationRequest,
  IServicesContainer,
  TextMessageNotificationRequest,
} from "@hacado/types";
import { Job } from "bullmq";
import { SmtpService } from "../../email";
import { getSmtpConfiguration } from "../../email/smtp/utils";
import {
  NotificationService,
  SystemNotificationService,
} from "../../notifications.service";
import { getTextBeltConfiguration } from "../../text-message";
import { TextBeltService } from "../../text-message/textbelt/service";
import { BaseBullMQClient } from "../base-bullmq-client";
import { NotificationJobData } from "./bullmq-notification-service";
import { BullMQNotificationConfig } from "./types";

export class BullMQNotificationWorker extends BaseBullMQClient {
  protected readonly config: BullMQNotificationConfig;

  constructor(
    config: BullMQNotificationConfig,
    protected readonly getServices: (
      organizationId: string,
    ) => IServicesContainer,
  ) {
    super(config, getLoggerFactory("BullMQNotificationWorker"));
    this.config = config;
    this.initializeWorkers();
  }

  private initializeWorkers(): void {
    const logger = this.loggerFactory("initializeWorkers");

    // Create email worker
    const emailWorker = this.createWorker(
      this.config.queues.email.name,
      this.processEmailJobs.bind(this),
      {
        concurrency: this.config.queues.email.concurrency,
      },
    );
    this.setupWorkerEventListeners(emailWorker, this.config.queues.email.name);

    // Create text message worker
    const textMessageWorker = this.createWorker(
      this.config.queues.textMessage.name,
      this.processTextMessageJob.bind(this),
      {
        concurrency: this.config.queues.textMessage.concurrency,
      },
    );
    this.setupWorkerEventListeners(
      textMessageWorker,
      this.config.queues.textMessage.name,
    );

    logger.info("BullMQ notification workers initialized");
  }

  private async processEmailJobs(job: Job<NotificationJobData>): Promise<void> {
    const jobData = job.data;

    switch (jobData.type) {
      case "email":
        await this.processEmailJob(job);
        break;
      case "system-email":
        await this.processSystemEmailJob(job);
        break;
      default:
        throw new Error("Invalid job type for notification processor");
    }
  }

  private async processEmailJob(job: Job<NotificationJobData>): Promise<void> {
    const logger = this.loggerFactory("processEmailJob");
    const jobData = job.data;

    if (jobData.type !== "email") {
      throw new Error("Invalid job type for email processor");
    }

    const emailData = jobData.data as EmailNotificationRequest;
    const organizationId = jobData.organizationId;
    if (!organizationId) {
      throw new Error("organizationId is required in job data");
    }

    const notificationService = this.getNotificationService(organizationId);

    try {
      logger.info(
        {
          jobId: job.id,
          attempt: job.attemptsMade + 1,
          maxAttempts: job.opts.attempts,
          emailTo: Array.isArray(emailData.email.to)
            ? emailData.email.to.join(", ")
            : emailData.email.to,
          subject: emailData.email.subject,
          appointmentId: emailData.appointmentId,
          customerId: emailData.customerId,
          organizationId,
        },
        "Processing email notification job",
      );

      await notificationService.sendEmail(emailData);

      logger.info(
        { jobId: job.id },
        "Email notification job completed successfully",
      );
    } catch (error) {
      logger.error(
        {
          error,
          jobId: job.id,
          attempt: job.attemptsMade + 1,
          maxAttempts: job.opts.attempts,
        },
        "Email notification job failed",
      );
      throw error; // Re-throw to trigger retry mechanism
    }
  }

  private async processSystemEmailJob(
    job: Job<NotificationJobData>,
  ): Promise<void> {
    const logger = this.loggerFactory("processSystemEmailJob");
    const jobData = job.data;

    if (jobData.type !== "system-email") {
      throw new Error("Invalid job type for system email processor");
    }

    const email = jobData.data as Email;
    const notificationService = new SystemNotificationService(
      new SmtpService(
        getSmtpConfiguration(),
        this.getServices("").assetsStorage,
      ),
    );

    try {
      logger.info(
        {
          jobId: job.id,
          attempt: job.attemptsMade + 1,
          maxAttempts: job.opts.attempts,
          emailTo: Array.isArray(email.to) ? email.to.join(", ") : email.to,
          subject: email.subject,
        },
        "Processing system email notification job",
      );

      await notificationService.sendSystemEmail(email);

      logger.info(
        { jobId: job.id },
        "System email notification job completed successfully",
      );
    } catch (error) {
      logger.error(
        {
          error,
          jobId: job.id,
          attempt: job.attemptsMade + 1,
          maxAttempts: job.opts.attempts,
        },
        "System email notification job failed",
      );

      throw error; // Re-throw to trigger retry mechanism
    }
  }

  private async processTextMessageJob(
    job: Job<NotificationJobData>,
  ): Promise<void> {
    const logger = this.loggerFactory("processTextMessageJob");
    const jobData = job.data;

    if (jobData.type !== "text-message") {
      throw new Error("Invalid job type for text message processor");
    }

    const textData = jobData.data as TextMessageNotificationRequest;
    const organizationId = jobData.organizationId;
    if (!organizationId) {
      throw new Error("organizationId is required in job data");
    }
    const notificationService = this.getNotificationService(organizationId);

    try {
      logger.info(
        {
          jobId: job.id,
          attempt: job.attemptsMade + 1,
          maxAttempts: job.opts.attempts,
          phone: textData.phone,
          sender: textData.sender,
          appointmentId: textData.appointmentId,
          customerId: textData.customerId,
          organizationId,
        },
        "Processing text message notification job",
      );

      await notificationService.sendTextMessage(textData);

      logger.info(
        { jobId: job.id },
        "Text message notification job completed successfully",
      );
    } catch (error) {
      logger.error(
        {
          error,
          jobId: job.id,
          attempt: job.attemptsMade + 1,
          maxAttempts: job.opts.attempts,
        },
        "Text message notification job failed",
      );
      throw error; // Re-throw to trigger retry mechanism
    }
  }

  public async getWorkerStats(): Promise<{
    email: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
    };
    textMessage: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
    };
  }> {
    const [emailStats, textMessageStats] = await Promise.all([
      this.getQueueStats(this.config.queues.email.name),
      this.getQueueStats(this.config.queues.textMessage.name),
    ]);

    return {
      email: emailStats,
      textMessage: textMessageStats,
    };
  }

  public async start(): Promise<void> {
    const logger = this.loggerFactory("start");
    logger.info("Starting BullMQ notification worker");

    try {
      // Call parent start method to handle Redis connection
      await super.start();

      // Start all workers
      for (const [name, worker] of this.workers) {
        await worker.waitUntilReady();
        logger.info({ worker: name }, "Worker started");
      }

      logger.info("BullMQ notification worker started successfully");
    } catch (error) {
      logger.error({ error }, "Failed to start BullMQ notification worker");
      throw error;
    }
  }

  public async stop(): Promise<void> {
    const logger = this.loggerFactory("stop");
    logger.info("Stopping BullMQ notification worker");

    try {
      // Call parent stop method to handle cleanup
      await super.stop();
      logger.info("BullMQ notification worker stopped successfully");
    } catch (error) {
      logger.error({ error }, "Error stopping BullMQ notification worker");
    }
  }
  /**
   * Start the worker and keep it running until it crashes or is stopped
   * This method will block until the worker encounters a fatal error
   */
  public async run(): Promise<void> {
    const logger = this.loggerFactory("runUntilCrash");

    try {
      await this.start();
      logger.info("BullMQ notification worker started successfully");

      // Set up graceful shutdown handlers
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
  ): Promise<void> {
    const logger = this.loggerFactory("runWithRestart");
    let restartCount = 0;

    while (restartCount < maxRestarts) {
      try {
        logger.info({ restartCount, maxRestarts }, "Starting worker");
        await this.run();
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

  private getNotificationService(organizationId: string): NotificationService {
    const services = this.getServices(organizationId);
    const defaultEmailService = new SmtpService(
      getSmtpConfiguration(),
      services.assetsStorage,
    );
    const defaultTextMessageSender = new TextBeltService(
      getTextBeltConfiguration(),
    );

    return new NotificationService(
      organizationId,
      services.configurationService,
      services.connectedAppsService,
      services.communicationLogsService,
      defaultEmailService,
      defaultTextMessageSender,
      services.billingService,
      services.eventService,
      services.organizationService,
    );
  }
}
