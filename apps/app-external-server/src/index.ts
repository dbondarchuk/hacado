import { getLoggerFactory } from "@hacado/logger";
import {
  getTextBeltConfiguration,
  ServicesContainer,
  TextBeltWebhookService,
} from "@hacado/services";
import dotenv from "dotenv";
import http, { IncomingMessage, ServerResponse } from "http";
import { URL } from "url";

// Load environment variables
dotenv.config();

const logger = getLoggerFactory("AppExternalServer")("main");

type RouteHandler = (
  match: RegExpMatchArray,
  request: Request,
) => Promise<Response | undefined>;

type Route = {
  pattern: RegExp;
  process: RouteHandler;
};

async function readRequestBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function toWebRequest(req: IncomingMessage, body: Buffer): Request {
  const requestUrl = `http://${req.headers.host}${req.url}`;
  return new Request(requestUrl, {
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
}

async function writeWebResponse(
  res: ServerResponse,
  result: Response,
): Promise<void> {
  const headers: Record<string, string> = {};
  result.headers.forEach((value, key) => {
    headers[key] = value;
  });

  res.writeHead(result.status, headers);
  res.end(await result.text());
}

function setCorsHeaders(res: ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, DELETE, PATCH, PROPFIND, REPORT, PROPPATCH, MKCOL, MOVE, COPY, LOCK, UNLOCK",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type, Depth, Prefer, If-Match, If-None-Match",
  );
}

async function handlePlatformTextbeltWebhook(
  organizationId: string,
  request: Request,
): Promise<Response> {
  const services = ServicesContainer(organizationId);
  const webhookService = new TextBeltWebhookService(
    organizationId,
    getTextBeltConfiguration(),
    services.configurationService,
    services.connectedAppsService,
    services.bookingService,
    services.customersService,
    services.communicationLogsService,
    services.notificationService,
    services.organizationService,
    services.billingService,
    services.eventService,
    services.teamService,
  );

  return webhookService.processWebhook(request);
}

const routes: Route[] = [
  {
    // /api/webhooks/platform/textbelt/:organizationId
    pattern: /^\/api\/webhooks\/platform\/textbelt\/([^/]+)\/?$/,
    process: async (match, request) =>
      handlePlatformTextbeltWebhook(match[1], request),
  },
  {
    // /api/webhooks/apps/name/:appName
    pattern: /^\/api\/webhooks\/apps\/name\/([^/]+)\/?$/,
    process: async (match, request) =>
      ServicesContainer("").connectedAppsService.processStaticWebhook(
        match[1],
        request,
      ),
  },
  {
    // /api/webhooks/apps/id/:organizationId/:appId
    pattern: /^\/api\/webhooks\/apps\/id\/([^/]+)\/([^/]+)\/?$/,
    process: async (match, request) =>
      ServicesContainer(match[1]).connectedAppsService.processWebhook(
        match[2],
        request,
      ),
  },
  {
    // /api/apps/:organizationId/:appId(/...)
    pattern: /^\/api\/apps\/([^/]+)\/([^/]+)(?:\/(.*))?$/,
    process: async (match, request) => {
      const slugPath = match[3] || "";
      const slug = slugPath ? slugPath.split("/").filter(Boolean) : [];
      return ServicesContainer(
        match[1],
      ).connectedAppsService.processAppExternalCall(match[2], slug, request);
    },
  },
];

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
    setCorsHeaders(res);

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

      const body = await readRequestBody(req);
      const request = toWebRequest(req, body);

      for (const route of routes) {
        const match = pathname.match(route.pattern);
        if (!match) {
          continue;
        }

        const result = await route.process(match, request);
        if (!result) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Handler not found" }));
          return;
        }

        await writeWebResponse(res, result);
        logger.debug(
          {
            pathname,
            method: req.method,
            status: result.status,
          },
          "Successfully processed request",
        );
        return;
      }

      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "Not found",
          message:
            "Expected path format: /api/webhooks/platform/textbelt/{organizationId}, /api/webhooks/apps/name/{appName}, /api/webhooks/apps/id/{organizationId}/{appId}, or /api/apps/{organizationId}/{appId}/[...slug]",
        }),
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
