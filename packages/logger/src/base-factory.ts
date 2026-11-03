import pino from "pino";
import { format } from "util";

export const getBaseLoggerFactory = ({
  correlationId,
  sessionId,
  organizationId,
  userId,
  hostname,
  url,
  method,
}: {
  correlationId?: string | null;
  sessionId?: string | null;
  organizationId?: string | null;
  userId?: string | null;
  hostname?: string | null;
  url?: string | null;
  method?: string | null;
}) => {
  const logger = pino({
    level: process.env.LOG_LEVEL || "info",
    redact: {
      paths: [
        "email",
        "phone",
        "password",
        "secretKey",
        "clientId",
        "participant",
      ],
      censor: (str: any) =>
        (str?.toString() as string)
          .split("")
          .map((c, index) => (index % 2 == 0 ? c : "#"))
          .join(""),
    },
    formatters: {
      level: (label) => {
        return { level: label.toUpperCase() };
      },
      log: (obj) => ({
        ...obj,
        correlationId,
        sessionId,
        organizationId,
        userId,
        hostname,
        url,
        method,
      }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    hooks: {
      // https://getpino.io/#/docs/api?id=logmethod
      logMethod(args, method) {
        if (args.length < 2) {
          // If there's only 1 argument passed to the log method, use Pino's default behaviour.
          return method.apply(this, args);
        }

        if (typeof args[0] === "object" && typeof args[1] === "string") {
          // If the first argument is an object, and the second is a string, we assume that it's a merging
          // object and message, followed by interpolation values.
          // This matches Pino's logger signature, so use the default behaviour.
          return method.apply(this, args);
        }

        if (typeof args[0] === "string" && typeof args[1] === "object") {
          // If the first argument is a string, and the second is an object, swap them round to use the object
          // as a merging object for Pino.
          const arg1 = args.shift();
          const arg2 = args.shift();
          return method.apply(this, [arg2, arg1, ...args]);
        }

        if (args.every((arg) => typeof arg === "string")) {
          // If every argument is a string, we assume they should be concatenated together.
          // This is to support the existing behaviour of console, where multiple string arguments are concatenated into a single string.
          return method.apply(this, [format(...args)]);
        }

        // If the arguments can't be changed to match Pino's signature, collapse them into a single merging object.
        const messageParts: any[] = [];
        const mergingObject: any = {};

        // @ts-expect-error not never
        args.forEach((arg) => {
          if (Object.prototype.toString.call(arg) === "[object Error]") {
            // If the arg is an error, add it to the merging object in the same format Pino would.
            Object.assign(mergingObject, { err: arg, msg: arg.message });
          } else if (typeof arg === "object") {
            // If the arg is an object, assign it's properties to the merging object.
            Object.assign(mergingObject, arg);
          } else {
            // Otherwise push it's value into an array for concatenation into a string.
            messageParts.push(arg);
          }
        });

        // Concatenate non-object arguments into a single string message.
        const message =
          messageParts.length > 0 ? format(...messageParts) : undefined;

        return method.apply(this, [mergingObject, message]);
      },
    },
    // mixin: (_context, level, logger) => {
    //   return { "level-label": logger.levels.labels[level] };
    // },
  });

  return logger;
};
