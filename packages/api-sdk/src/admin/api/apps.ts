import {
  AppScope,
  ConnectedApp,
  ConnectedAppData,
  ConnectedAppUninstallResult,
  ConnectedAppStatusWithText,
  okStatus,
} from "@hacado/types";
import { fetchAdminApi } from "./utils";

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
