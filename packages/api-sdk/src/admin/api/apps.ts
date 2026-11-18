import {
  APP_PROCESS_SSE_DONE,
  APP_PROCESS_SSE_ERROR,
  AppScope,
  ConnectedApp,
  ConnectedAppData,
  ConnectedAppStatusWithText,
  ConnectedAppUninstallResult,
  type AppProcessSseDonePayload,
  type AppProcessSseErrorPayload,
} from "@hacado/types/apps";
import { okStatus } from "@hacado/types/general";
import { parseSseChunk } from "@hacado/utils/sse";
import { fetchAdminApi } from "./utils";

export class AppProcessStreamError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = "AppProcessStreamError";
  }
}

export const addNewApp = async (type: string) => {
  console.debug("Adding new app", {
    type,
  });

  const response = await fetchAdminApi("/apps", {
    method: "POST",
    body: JSON.stringify({ type }),
  });

  const data = await response.json<string>();
  console.debug("New app added successfully", {
    type,
    appId: data,
  });

  return data;
};

export const getAppStatus = async (appId: string) => {
  console.debug("Getting app status", {
    appId,
  });

  const response = await fetchAdminApi(`/apps/${appId}/status`, {
    method: "GET",
  });

  const data = await response.json<ConnectedApp>();
  console.debug("App status retrieved", {
    appId,
    status: data?.status,
  });

  return data;
};

export const setAppStatus = async (
  appId: string,
  status: ConnectedAppStatusWithText,
) => {
  console.debug("Setting app status", {
    appId,
    status: status.status,
    statusText: status.statusText,
  });

  const response = await fetchAdminApi(`/apps/${appId}/status`, {
    method: "PATCH",
    body: JSON.stringify(status),
  });

  const data = await response.json<typeof okStatus>();
  console.debug("App status updated", {
    appId,
    status: status.status,
    statusText: status.statusText,
  });

  return data;
};

export const getAppLoginUrl = async (appId: string) => {
  console.debug("Requesting app login URL", {
    appId,
  });

  const response = await fetchAdminApi(`/apps/${appId}/login-url`, {
    method: "GET",
  });

  const data = await response.json<string>();
  console.debug("App login URL retrieved", {
    appId,
    hasUrl: !!data,
  });

  return data;
};

export const processRequest = async <TResponse extends any = any>(
  appId: string,
  data: any,
) => {
  console.debug("Processing app request", {
    appId,
    hasData: !!data,
  });

  const response = await fetchAdminApi(`/apps/${appId}/process`, {
    method: "POST",
    body: JSON.stringify(data),
  });

  const result = await response.json<TResponse>();
  console.debug("App request processed", {
    appId,
    hasData: !!data,
  });

  return result;
};

export type ProcessRequestStreamOptions = {
  signal?: AbortSignal;
  /** Called for every non-terminal SSE event (opaque to the platform). */
  onEvent?: (event: string, data: unknown) => void;
};

/**
 * Opt-in SSE process: sends Accept: text/event-stream and resolves with the
 * reserved `done` payload. Mid-stream events are forwarded via `onEvent`.
 */
export const processRequestStream = async <TResponse = unknown>(
  appId: string,
  data: unknown,
  options?: ProcessRequestStreamOptions,
): Promise<TResponse> => {
  console.debug("Processing app request (SSE)", {
    appId,
    hasData: !!data,
  });

  const response = await fetchAdminApi(`/apps/${appId}/process`, {
    method: "POST",
    headers: {
      Accept: "text/event-stream",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    signal: options?.signal,
  });

  if (!response.body) {
    throw new Error("App process stream returned an empty body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let donePayload: TResponse | undefined;
  let sawDone = false;
  let streamError: AppProcessSseErrorPayload | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parsed = parseSseChunk(buffer);
    buffer = parsed.rest;

    for (const frame of parsed.events) {
      let payload: unknown = undefined;
      if (frame.data.length) {
        try {
          payload = JSON.parse(frame.data);
        } catch {
          payload = frame.data;
        }
      }

      if (frame.event === APP_PROCESS_SSE_DONE) {
        const typed = payload as AppProcessSseDonePayload<TResponse>;
        donePayload = typed?.data as TResponse;
        sawDone = true;
        continue;
      }

      if (frame.event === APP_PROCESS_SSE_ERROR) {
        streamError = (payload ?? {
          message: "App process stream failed",
        }) as AppProcessSseErrorPayload;

        continue;
      }

      options?.onEvent?.(frame.event, payload);
    }
  }

  if (streamError) {
    throw new AppProcessStreamError(
      streamError.message || "App process stream failed",
      streamError.code,
      streamError.data,
    );
  }

  if (!sawDone) {
    throw new AppProcessStreamError(
      "App process stream ended without a done event",
    );
  }

  console.debug("App request stream completed", { appId });
  return donePayload as TResponse;
};

export const processStaticRequest = async <TResponse extends any = any>(
  appName: string,
  data: any,
) => {
  console.debug("Processing static app request", {
    appName,
    hasData: !!data,
  });

  const response = await fetchAdminApi(`/apps/static/${appName}/process`, {
    method: "POST",
    body: JSON.stringify(data),
  });

  const result = await response.json<TResponse>();
  console.debug("Static app request processed", {
    appName,
    hasData: !!data,
  });

  return result;
};

export const processFormRequest = async <TResponse extends any = any>(
  appId: string,
  formData: FormData,
) => {
  console.debug("Processing form app request", {
    appId,
    hasData: !!formData,
  });

  const response = await fetchAdminApi(`/apps/${appId}/process/form`, {
    method: "POST",
    body: formData,
  });

  const result = await response.json<TResponse>();
  console.debug("Form app request processed", {
    appId,
    hasData: !!formData,
  });

  return result;
};

export const deleteApp = async (appId: string) => {
  console.debug("Deleting app", {
    appId,
  });

  const response = await fetchAdminApi(`/apps/${appId}`, {
    method: "DELETE",
  });

  const data = await response.json<ConnectedAppUninstallResult>();
  console.debug("App deleted", {
    appId,
    success: data.success,
    code: data.code,
  });

  return data;
};

export const getAppData = async (appId: string) => {
  console.debug("Getting app data", {
    appId,
  });

  const response = await fetchAdminApi(`/apps/${appId}/data`, {
    method: "GET",
  });

  const data = await response.json<any>();
  console.debug("App data retrieved", {
    appId,
    hasData: !!data,
  });

  return data;
};

export const getAppsByScope = async (...scope: AppScope[]) => {
  console.debug("Getting apps by scope", {
    scope,
  });

  const scopeParams = scope.map((s) => `scope=${s}`).join("&");
  const response = await fetchAdminApi(`/apps/by/scope?${scopeParams}`, {
    method: "GET",
  });

  const data = await response.json<ConnectedApp[]>();
  console.debug("Apps by scope retrieved", {
    scope,
    count: data.length,
  });

  return data;
};

export const getAppsByName = async (appName: string) => {
  console.debug("Getting apps by name", {
    appName,
  });

  const response = await fetchAdminApi(`/apps/by/name?name=${appName}`, {
    method: "GET",
  });

  const data = await response.json<ConnectedApp[]>();
  console.debug("Apps by name retrieved", {
    appName,
    count: data.length,
  });

  return data;
};

export const getApp = async (appId: string) => {
  console.debug("Getting app", {
    appId,
  });

  const response = await fetchAdminApi(`/apps/${appId}`, {
    method: "GET",
  });

  const data = await response.json<ConnectedAppData>();
  console.debug("App retrieved", {
    appId,
    appName: data.name,
  });

  return data;
};

export const getApps = async () => {
  console.debug("Getting all apps");

  const response = await fetchAdminApi("/apps", {
    method: "GET",
  });

  const data = await response.json<ConnectedApp[]>();
  console.debug("All apps retrieved", {
    count: data.length,
  });

  return data;
};
