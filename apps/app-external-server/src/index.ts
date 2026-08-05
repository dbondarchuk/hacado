import { getLoggerFactory } from "@hacado/logger";
import { ServicesContainer } from "@hacado/services";
import dotenv from "dotenv";
import http from "http";
import { URL } from "url";

// Load environment variables
dotenv.config();

const logger = getLoggerFactory("AppExternalServer")("main");

async function startServer(): Promise<void> {
  logger.info("Starting App External Server");

  // Validate required environment variables
  const requiredEnvVars = ["MONGODB_URI"];
  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar],
  );

  if (missingEnvVars.length > 0) {
    logger.error({ missingEnvVars }, "Missing required environment variables");
    process.exit(1);
  }

  const port = process.env.APP_EXTERNAL_SERVER_PORT || 5556;

  const server = http.createServer(async (req, res) => {
    // Enable CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "OPTIONS, GET, POST, PUT, DELETE, PATCH, PROPFIND, REPORT, PROPPATCH, MKCOL, MOVE, COPY, LOCK, UNLOCK",
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Authorization, Content-Type, Depth, Prefer, If-Match, If-None-Match",
    );

    // // Handle preflight requests
    // if (req.method === "OPTIONS") {
    //   res.writeHead(200);
    //   res.end();
    //   return;
    // }

    try {
      const parsedUrl = new URL(req.url || "", `http://${req.headers.host}`);
      const pathname = parsedUrl.pathname;

      logger.debug(
        {
          method: req.method,
          pathname,
          url: req.url,
        },
        "Incoming request",
      );

      // Match pattern: /api/apps/[organizationId]/[appId]/[...slug]
      const match = pathname.match(
        /^\/api\/apps\/([^/]+)\/([^/]+)(?:\/(.*))?$/,
      );
      if (!match) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Not found",
            message:
              "Expected path format: /api/apps/{organizationId}/{appId}/[...slug]",
          }),
        );
        return;
      }

      const organizationId = match[1];
      const appId = match[2];
      const slugPath = match[3] || "";
      const slug = slugPath ? slugPath.split("/").filter(Boolean) : [];

      // Get services container
      const servicesContainer = ServicesContainer(organizationId);

      // Convert Node.js request to Web API Request
      const body = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", () => resolve(Buffer.concat(chunks)));
        req.on("error", reject);
      });

      const requestUrl = `http://${req.headers.host}${req.url}`;
      const request = new Request(requestUrl, {
        method: req.method || "GET",
        headers: new Headers(
          Object.entries(req.headers).reduce(
            (acc, [key, value]) => {
              if (value) {
                acc[key] = Array.isArray(value) ? value.join(", ") : value;
              }
              return acc;
            },
            {} as Record<string, string>,
          ),
        ),
        body: body.length > 0 ? new Uint8Array(body) : undefined,
      });

      // Process the external app call
      const result =
        await servicesContainer.connectedAppsService.processAppExternalCall(
          appId,
          slug,
          request,
        );

      if (!result) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Handler not found" }));
        return;
      }

      // Convert Web API Response to Node.js response
      const status = result.status;
      const headers: Record<string, string> = {};
      result.headers.forEach((value, key) => {
        headers[key] = value;
      });

      res.writeHead(status, headers);

      const responseBody = await result.text();
      res.end(responseBody);

      logger.debug(
        {
          appId,
          slug: slug.join("/"),
          method: req.method,
          status,
        },
        "Successfully processed external app call",
      );
    } catch (error: any) {
      logger.error(
        {
          error: error?.message || error?.toString(),
          url: req.url,
          method: req.method,
        },
        "Error processing request",
      );

      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "Internal server error",
          message: error?.message || "Unknown error",
        }),
      );
    }
  });

  server.listen(port, () => {
    logger.info({ port }, "App External Server listening");
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

  // Handle uncaught errors
  process.on("uncaughtException", (error) => {
    logger.error({ error }, "Uncaught exception");
    gracefulShutdown("uncaughtException");
  });

  process.on("unhandledRejection", (reason) => {
    logger.error({ reason }, "Unhandled rejection");
    gracefulShutdown("unhandledRejection");
  });
}

// Start the server
startServer().catch((error) => {
  logger.error({ error }, "Failed to start server");
  process.exit(1);
});
