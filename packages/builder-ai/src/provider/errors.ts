import type { NormalizedAIError, NormalizedAIErrorCode } from "../types";

export class BuilderAIError extends Error {
  readonly code: NormalizedAIErrorCode;
  readonly retryable: boolean;
  readonly provider?: string;
  readonly cause?: unknown;

  constructor(error: NormalizedAIError) {
    super(error.message);
    this.name = "BuilderAIError";
    this.code = error.code;
    this.retryable = error.retryable;
    this.provider = error.provider;
    this.cause = error.cause;
  }

  toJSON(): NormalizedAIError {
    return {
      code: this.code,
      message: this.message,
      retryable: this.retryable,
      provider: this.provider,
    };
  }
}

export function normalizeProviderError(
  error: unknown,
  provider?: string,
): NormalizedAIError {
  if (error instanceof BuilderAIError) {
    return error.toJSON();
  }

  const message =
    error instanceof Error ? error.message : "Unknown provider error";
  const lower = message.toLowerCase();

  if (
    lower.includes("unauthorized") ||
    lower.includes("authentication") ||
    lower.includes("api key")
  ) {
    return {
      code: "authentication",
      message,
      retryable: false,
      provider,
      cause: error,
    };
  }

  if (lower.includes("rate limit") || lower.includes("429")) {
    return {
      code: "rate_limit",
      message,
      retryable: true,
      provider,
      cause: error,
    };
  }

  if (lower.includes("timeout") || lower.includes("timed out")) {
    return {
      code: "timeout",
      message,
      retryable: true,
      provider,
      cause: error,
    };
  }

  if (
    lower.includes("model") &&
    (lower.includes("not found") || lower.includes("unavailable"))
  ) {
    return {
      code: "model_unavailable",
      message,
      retryable: true,
      provider,
      cause: error,
    };
  }

  if (
    lower.includes("invalid") ||
    lower.includes("bad request") ||
    lower.includes("400")
  ) {
    return {
      code: "invalid_request",
      message,
      retryable: false,
      provider,
      cause: error,
    };
  }

  return {
    code: "provider_error",
    message,
    retryable: true,
    provider,
    cause: error,
  };
}
