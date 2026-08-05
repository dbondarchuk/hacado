import { type Instrumentation } from "next";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("pino");
    await import("./utils/logger/next-patch");
    await import("./utils/logger/console-patch");
  }
}

export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context,
) => {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("pino");
    const { getLoggerFactory } = await import("@hacado/logger");
    const logger = getLoggerFactory("Instrumentation")("onRequestError");

    logger.error(
      {
        message: (err as any)?.message,
        request,
        context,
      },
      "Request error",
    );
  }
};
