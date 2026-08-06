import { getBaseLoggerFactory } from "@hacado/logger";
import { NextFetchEvent, NextRequest } from "next/server";
import { MiddlewareProxy } from "./types";

export const withLogger: MiddlewareProxy = (next) => {
  return async (request: NextRequest, event: NextFetchEvent) => {
    if (request.nextUrl.pathname.startsWith("/_next"))
      return next(request, event);

    const correlationId = crypto.randomUUID();
    console.log("correlationId", correlationId);

    let originalSessionId = request.cookies.get("x-session-id");
    const sessionId = originalSessionId?.value || crypto.randomUUID();
    request.headers.append("x-correlation-id", correlationId);
    request.headers.append("x-session-id", sessionId);
    request.headers.append("x-request-url", request.url);
    request.headers.append("x-request-method", request.method);

    const logger = getBaseLoggerFactory({ correlationId });
    logger.debug(
      { requestUrl: request.url, requestMethod: request.method, correlationId },
      `Incoming request`,
    );

    // const start = performance.now();
    // const response = next(request, event);

    // after(() => {
    //   const end = performance.now();
    //   const diff = end - start;

    //   logger.info(
    //     {
    //       url: request.url,
    //       method: request.method,
    //       //   status: response.status,
    //       correlationId,
    //       time: `${diff.toFixed(4)}µs`,
    //     },
    //     "Response"
    //   );
    // });

    const result = await next(request, event);
    if (!originalSessionId) {
      result.cookies.set("x-session-id", sessionId);
    }

    return result;
  };
};
