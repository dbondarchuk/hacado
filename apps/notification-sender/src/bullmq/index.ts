import { getLoggerFactory } from "@hacado/logger";
import {
  BullMQNotificationConfig,
  BullMQNotificationWorker,
  getBullMQNotificationConfig,
  ServicesContainer,
} from "@hacado/services";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export async function startBullMQNotificationSenderApp(): Promise<void> {
  const logger = getLoggerFactory("BullMQNotificationSenderApp")("main");

  logger.info("Initializing BullMQ Notification Sender App");

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
    const config: BullMQNotificationConfig = getBullMQNotificationConfig();

    logger.info({ config }, "BullMQ configuration loaded");

    // Create and start the worker
    const worker = new BullMQNotificationWorker(config, (organizationId) =>
      ServicesContainer(organizationId),
    );

    // Set up graceful shutdown handlers
    const gracefulShutdown = async (signal: string) => {
      logger.info(
        { signal },
        "Received shutdown signal, stopping worker gracefully",
      );
      await worker.stop();
      process.exit(0);
    };

    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

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

    if (runMode === "restart") {
      const maxRestarts = parseInt(process.env.BULLMQ_MAX_RESTARTS || "10");
      const restartDelay = parseInt(process.env.BULLMQ_RESTART_DELAY || "5000");

      logger.info(
        { maxRestarts, restartDelay },
        "Starting worker with automatic restart",
      );
      await worker.runWithRestart(maxRestarts, restartDelay);
    } else {
      logger.info("Starting worker (will crash on fatal error)");
      await worker.run();
    }
  } catch (error) {
    logger.error({ error }, "Fatal error in BullMQ Notification Sender App");
    process.exit(1);
  }
}
