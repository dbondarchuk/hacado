import { getLoggerFactory } from "@hacado/logger";
import { resolveOrganizationByHostname } from "@hacado/services";
import dotenv from "dotenv";
import http from "http";
import { URL } from "url";

// Load environment variables
dotenv.config();

const logger = getLoggerFactory("DomainChecker")("main");

async function startServer(): Promise<void> {
  logger.info("Starting Domain Checker Server");

  // Validate required environment variables
  const requiredEnvVars = ["MONGODB_URI", "REDIS_HOST"];

  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar],
  );

  if (missingEnvVars.length > 0) {
    logger.error({ missingEnvVars }, "Missing required environment variables");
    process.exit(1);
  }

  const port = process.env.PORT || 5555;
  const server = http.createServer(async (req, res) => {
    // Enable CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    // Only handle GET requests
    if (req.method !== "GET") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    try {
      const parsedUrl = new URL(req.url || "", `http://${req.headers.host}`);
      const pathname = parsedUrl.pathname;
      const domain = parsedUrl.searchParams.get("domain");

      logger.debug({ pathname, domain }, "Incoming request");

      // Handle /check endpoint
      if (pathname === "/check") {
        if (!domain) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: "Missing required parameter: domain",
              example: "/check?domain=example.com",
            }),
          );
          return;
        }

        try {
          const resolution = await resolveOrganizationByHostname(domain);
          const isInUse = resolution !== null;

          if (!isInUse) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                error: "Domain is not in use",
                domain,
              }),
            );
            logger.info({ domain, inUse: false }, "Domain check completed");
            return;
          }

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              domain,
              inUse: true,
            }),
          );

          logger.info({ domain, inUse: true }, "Domain check completed");
        } catch (error) {
          logger.error({ error, domain }, "Error checking domain");
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: "Internal server error",
              message: error instanceof Error ? error.message : "Unknown error",
            }),
          );
        }
      } else {
        // Handle 404 for other paths
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Not found" }));
      }
    } catch (error) {
      logger.error({ error }, "Error processing request");
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        }),
      );
    }
  });

  server.listen(port, () => {
    logger.info({ port }, "Domain Checker Server listening");
  });

  // Set up graceful shutdown handlers
  const gracefulShutdown = async (signal: string) => {
    logger.info({ signal }, "Received shutdown signal, closing server");
    server.close(() => {
      logger.info("Server closed");
      process.exit(0);
    });
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
}

// Start the server
startServer().catch((error) => {
  logger.error({ error }, "Failed to start server");
  process.exit(1);
});
