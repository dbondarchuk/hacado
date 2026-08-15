import { getLoggerFactory } from "@hacado/logger";
import {
  BullMQEventConfig,
  BullMQEventWorker,
  BullMQJobConfig,
  BullMQJobWorker,
  getBullMQEventConfig,
  getBullMQJobConfig,
  ServicesContainer,
} from "@hacado/services";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export async function startBullMQJobProcessorApp(): Promise<void> {
  const logger = getLoggerFactory("BullMQJobProcessorApp")("main");

  logger.info("Initializing BullMQ Job Processor App");

  // Validate required environment variables
  const requiredEnvVars = ["MONGODB_URI", "REDIS_HOST"];

  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar],
  );

  if (missingEnvVars.length > 0) {
    logger.error({ missingEnvVars }, "Missing required environment variables");
    process.exit(1);
  }

  try {
    // Get BullMQ configuration from environment variables
    const config: BullMQJobConfig = getBullMQJobConfig();
    const eventConfig: BullMQEventConfig = getBullMQEventConfig();

    logger.info({ config, eventConfig }, "BullMQ configuration loaded");

    const jobWorker = new BullMQJobWorker(config, (organizationId) =>
      ServicesContainer(organizationId),
    );
    const eventWorker = new BullMQEventWorker(eventConfig, (organizationId) =>
      ServicesContainer(organizationId),
    );

    const gracefulShutdown = async (signal: string) => {
      logger.info(
        { signal },
        "Received shutdown signal, stopping workers gracefully",
      );
      await Promise.all([jobWorker.stop(), eventWorker.stop()]);
      process.exit(0);
    };

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      logger.error({ reason, promise }, "Unhandled promise rejection");
      process.exit(1);
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      logger.error({ error }, "Uncaught exception");
      process.exit(1);
    });

    // Choose the run mode based on environment
    const runMode = process.env.BULLMQ_RUN_MODE || "crash";

    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

    const signalOpts = { registerSignals: false as const };

    if (runMode === "restart") {
      const maxRestarts = parseInt(process.env.BULLMQ_MAX_RESTARTS || "10");
      const restartDelay = parseInt(process.env.BULLMQ_RESTART_DELAY || "5000");

      logger.info(
        { maxRestarts, restartDelay },
        "Starting workers with automatic restart",
      );
      await Promise.all([
        jobWorker.runWithRestart(maxRestarts, restartDelay, signalOpts),
        eventWorker.runWithRestart(maxRestarts, restartDelay, signalOpts),
      ]);
    } else {
      logger.info("Starting workers (will crash on fatal error)");
      await Promise.all([
        jobWorker.run(signalOpts),
        eventWorker.run(signalOpts),
      ]);
    }
  } catch (error) {
    logger.error({ error }, "Fatal error in BullMQ Job Processor App");
    process.exit(1);
  }
}
