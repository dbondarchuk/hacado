import pino from "pino";
import { cache } from "react";
import { getBaseLoggerFactory } from "./base-factory";

const _getLoggerFactory = cache(async (organizationId?: string | null) => {
  try {
    // Try to import next/headers dynamically to avoid issues in client components
    const { headers } = await import("next/headers");
    const headersList = await headers();
    return getBaseLoggerFactory({
      correlationId: headersList.get("x-correlation-id"),
      sessionId: headersList.get("x-session-id"),
      organizationId: organizationId || headersList.get("x-organization-id"),
      userId: headersList.get("x-user-id"),
      hostname: headersList.get("x-forwarded-host") || headersList.get("host"),
      url: headersList.get("x-request-url"),
      method: headersList.get("x-request-method"),
    });
  } catch {
    // Fallback for client-side or when next/headers is not available
    return getBaseLoggerFactory({ organizationId });
  }
});

const promiseHandler: ProxyHandler<any> = {
  get: (target, prop) =>
    function () {
      if (target instanceof Promise) {
        let args = arguments;
        return target.then((o) => o[prop].apply(o, args));
      } else {
        let value = target[prop];
        return typeof value == "function" ? value.bind(target) : value;
      }
    },
};

export type LoggerFactory = (functionName?: string) => pino.Logger;
export type AppLogger = ReturnType<LoggerFactory>;

export const getLoggerFactory = cache(
  (moduleName: string, organizationId?: string | null): LoggerFactory => {
    return (functionName?: string) => {
      const logger: pino.Logger = new Proxy(
        _getLoggerFactory(organizationId).then((l) =>
          l.child(
            {},
            {
              msgPrefix: `[${moduleName}${functionName ? `:${functionName}` : ""}] `,
            },
          ),
        ),
        promiseHandler,
      );

      return logger;
    };
  },
);
