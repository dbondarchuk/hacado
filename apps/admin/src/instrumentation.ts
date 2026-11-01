import { type Instrumentation } from "next";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("pino");
    await import("./utils/logger/next-patch");
    await import("./utils/logger/console-patch");
  }
}

function isNextControlFlowError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";

  const digest =
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string"
      ? (error as { digest: string }).digest
      : "";

  return (
    message.startsWith("NEXT_REDIRECT") ||
    message.startsWith("NEXT_HTTP_ERROR_FALLBACK") ||
    digest.startsWith("NEXT_REDIRECT") ||
    digest.startsWith("NEXT_HTTP_ERROR_FALLBACK")
  );
}

export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context,
) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }
  // Expected navigation / 404 control flow — not actionable app failures.
  if (isNextControlFlowError(err)) {
    return;
  }

  await import("pino");
  const { getLoggerFactory } = await import("@hacado/logger");
  const logger = getLoggerFactory("Instrumentation")("onRequestError");

  logger.error(
    {
      message: (err as any)?.message,
      digest: (err as any)?.digest,
      request,
      context,
    },
    "Request error",
  );
};
