import { getLoggerFactory } from "@hacado/logger";

const NOISY_ERROR_PATTERNS = [
  /isn't a valid image/i,
  /The requested resource isn't a valid image/i,
  /^NEXT_HTTP_ERROR_FALLBACK/,
  /^NEXT_REDIRECT/,
];

function isNoisyConsoleError(args: IArguments): boolean {
  return Array.from(args).some((arg) => {
    if (typeof arg === "string") {
      return NOISY_ERROR_PATTERNS.some((pattern) => pattern.test(arg));
    }
    if (arg instanceof Error) {
      const digest = (arg as unknown as { digest?: unknown }).digest;
      return (
        NOISY_ERROR_PATTERNS.some((pattern) => pattern.test(arg.message)) ||
        (typeof digest === "string" &&
          NOISY_ERROR_PATTERNS.some((pattern) => pattern.test(digest)))
      );
    }
    return false;
  });
}

const getLogMethod = (consoleMethod: string) => {
  return function () {
    const logger = getLoggerFactory("NextJs")();
    switch (consoleMethod) {
      case "error":
        if (isNoisyConsoleError(arguments)) {
          // @ts-expect-error
          return logger.debug.apply(logger, arguments);
        }
        // @ts-expect-error
        return logger.error.apply(logger, arguments);
      case "warn":
        // @ts-expect-error
        return logger.warn.apply(logger, arguments);
      case "debug":
        // @ts-expect-error
        return logger.debug.apply(logger)(arguments);
      // To support Winston which doesn't have logger.trace()
      //   return childLogger.debug.bind(childLogger);
      case "log":
      case "info":
      default:
        // @ts-expect-error
        return logger.info.apply(logger, arguments);
    }
  };
};

const consoleMethods = ["log", "debug", "info", "warn", "error"];
consoleMethods.forEach((method) => {
  // @ts-ignore
  console[method] = getLogMethod(method);
});
