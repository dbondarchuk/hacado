/**
 * Generic streaming result for connected-app `processRequest`.
 * The platform transports opaque named events; apps own event names/payloads.
 */

export const APP_PROCESS_STREAM_BRAND = Symbol.for("hacado.appProcessStream");

/** Platform-reserved terminal SSE event names (transport only). */
export const APP_PROCESS_SSE_DONE = "done" as const;
export const APP_PROCESS_SSE_ERROR = "error" as const;

export type AppProcessEmit = (event: string, data?: unknown) => void;

export type AppProcessStreamContext = {
  emit: AppProcessEmit;
  signal: AbortSignal;
};

export type AppProcessStream<T = unknown> = {
  readonly [APP_PROCESS_STREAM_BRAND]: true;
  run: (ctx: AppProcessStreamContext) => Promise<T>;
};

export type AppProcessSseDonePayload<T = unknown> = {
  data: T;
};

export type AppProcessSseErrorPayload = {
  message: string;
  code?: string;
  data?: unknown;
};

export function createAppProcessStream<T>(
  run: (ctx: AppProcessStreamContext) => Promise<T>,
): AppProcessStream<T> {
  return {
    [APP_PROCESS_STREAM_BRAND]: true,
    run,
  };
}

export function isAppProcessStream(value: unknown): value is AppProcessStream {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as AppProcessStream)[APP_PROCESS_STREAM_BRAND] === true &&
    typeof (value as AppProcessStream).run === "function"
  );
}
