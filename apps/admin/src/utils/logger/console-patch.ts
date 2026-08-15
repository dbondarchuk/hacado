import { getLoggerFactory } from "@hacado/logger";

const getLogMethod = (consoleMethod: string) => {
  return function () {
    const logger = getLoggerFactory("NextJs")();
    switch (consoleMethod) {
      case "error":
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
