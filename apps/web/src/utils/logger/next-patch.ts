import { getLoggerFactory } from "@hacado/logger";

// Need to use require to make it work with production build
const nextLogger = require("next/dist/build/output/log");

const getLogMethod = (nextMethod: string) => {
  return function () {
    const logger = getLoggerFactory("NextJs")();
    switch (nextMethod) {
      case "error":
        // @ts-expect-error
        return logger.error.apply(logger, arguments);
      case "warn":
        // @ts-expect-error
        return logger.warn.apply(logger, arguments);
      case "trace":
        if ("trace" in logger) {
          // @ts-expect-error
          return logger.trace.apply(logger)(arguments);
        }
      // To support Winston which doesn't have logger.trace()
      //   return childLogger.debug.bind(childLogger);
      default:
        // @ts-expect-error
        return logger.info.apply(logger, arguments);
    }
  };
};

const cachePath = require.resolve("next/dist/build/output/log");
const cacheObject = require.cache[cachePath]!;

// This is required to forcibly redefine all properties on the logger.
// From Next 13 and onwards they're defined as non-configurable, preventing them from being patched.
cacheObject.exports = { ...cacheObject.exports };

Object.keys(nextLogger.prefixes).forEach((method) => {
  Object.defineProperty(cacheObject.exports, method, {
    value: getLogMethod(method),
  });
});
