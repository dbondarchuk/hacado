import { getLoggerFactory } from "@hacado/logger";

// Need to use require to make it work with production build
const nextLogger = require("next/dist/build/output/log");

const NOISY_ERROR_PATTERNS = [
  // Bots and stale references hit `/_next/image?url=/assets/...` for missing
  // or non-inline assets; Next logs these as errors and they page alerts.
  /isn't a valid image/i,
  /The requested resource isn't a valid image/i,
];

function isNoisyNextError(args: IArguments): boolean {
  return Array.from(args).some((arg) => {
    if (typeof arg === "string") {
      return NOISY_ERROR_PATTERNS.some((pattern) => pattern.test(arg));
    }
    if (arg instanceof Error) {
      return NOISY_ERROR_PATTERNS.some((pattern) => pattern.test(arg.message));
    }
    return false;
  });
}

const getLogMethod = (nextMethod: string) => {
  return function () {
    const logger = getLoggerFactory("NextJs")();
    switch (nextMethod) {
      case "error":
        if (isNoisyNextError(arguments)) {
          // @ts-expect-error
          return logger.debug.apply(logger, arguments);
        }
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
