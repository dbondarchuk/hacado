import { getLoggerFactory } from "@hacado/logger";
import { ShortLinksService } from "@hacado/services/short-links";
import { SHORT_CODE_ALPHABET } from "@hacado/utils";
import dotenv from "dotenv";
import http from "http";
import { URL } from "url";

dotenv.config();

const logger = getLoggerFactory("LinkShortener")("main");
const shortLinksService = new ShortLinksService();
const SHORT_CODE_PATTERN = new RegExp(`^[${SHORT_CODE_ALPHABET}]{8,16}$`);

async function startServer(): Promise<void> {
  logger.info("Starting Link Shortener Server");

  const requiredEnvVars = ["MONGODB_URI", "MONGODB_DB"];
  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar],
  );

  if (missingEnvVars.length > 0) {
    logger.error({ missingEnvVars }, "Missing required environment variables");
    process.exit(1);
  }

  const port = process.env.PORT || 5557;
  const marketingUrl =
    process.env.MARKETING_URL?.trim() || "https://hacado.com";
  const server = http.createServer(async (req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    try {
      const parsedUrl = new URL(req.url || "", `http://${req.headers.host}`);
      const pathname = parsedUrl.pathname.replace(/\/+$/, "") || "/";
      logger.debug({ pathname }, "Incoming request");

      if (pathname === "/") {
        res.writeHead(302, { Location: marketingUrl });
        res.end();
        logger.info({ marketingUrl }, "Redirected root to marketing site");
        return;
      }

      const code = pathname.slice(1);
      if (code.includes("/") || !SHORT_CODE_PATTERN.test(code)) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Not found" }));
        return;
      }

      const shortLink = await shortLinksService.getShortLinkByCode(code);
      if (!shortLink) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Not found" }));
        return;
      }

      res.writeHead(302, { Location: shortLink.url });
      res.end();
      logger.info({ code }, "Redirected short link");
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
    logger.info({ port }, "Link Shortener Server listening");
  });

  const gracefulShutdown = async (signal: string) => {
    logger.info({ signal }, "Received shutdown signal, closing server");
    server.close(() => {
      logger.info("Server closed");
      process.exit(0);
    });
  };

  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

  process.on("unhandledRejection", (reason, promise) => {
    logger.error({ reason, promise }, "Unhandled promise rejection");
    process.exit(1);
  });

  process.on("uncaughtException", (error) => {
    logger.error({ error }, "Uncaught exception");
    process.exit(1);
  });
}

startServer().catch((error) => {
  logger.error({ error }, "Failed to start server");
  process.exit(1);
});
