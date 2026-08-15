import {
  CommunicationLog,
  CommunicationLogContentPayload,
  okStatus,
  WithTotal,
} from "@hacado/types";
import {
  CommunicationLogsSearchParams,
  serializeCommunicationLogsSearchParams,
} from "../search-params";
import { fetchAdminApi } from "./utils";

export const getCommunicationLogs = async (
  searchParams: CommunicationLogsSearchParams,
) => {
  console.debug("Getting communication logs", {
    searchParams,
  });

  const serializedSearchParams =
    serializeCommunicationLogsSearchParams(searchParams);

  const result = await fetchAdminApi(
    `/communication-logs${serializedSearchParams}`,
  );

  const data = await result.json<WithTotal<CommunicationLog>>();

  console.debug("Communication logs retrieved successfully", {
    total: data.total,
    count: data.items.length,
  });

  return data;
};

export const getCommunicationLogContent = async (logId: string) => {
  const result = await fetchAdminApi(`/communication-logs/${logId}`);
  return result.json<CommunicationLogContentPayload>();
};

export const clearAllCommunicationLogs = async () => {
  console.debug("Clearing all communication logs");
  const result = await fetchAdminApi("/communication-logs", {
    method: "DELETE",
  });

  console.debug("All communication logs cleared successfully");
  const data = await result.json<typeof okStatus>();
  return data;
};

export const clearSelectedCommunicationLogs = async (ids: string[]) => {
  console.debug("Clearing selected communication logs", { ids });
  const result = await fetchAdminApi("/communication-logs/delete", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });

  const data = await result.json<typeof okStatus>();
  console.debug("Selected communication logs cleared successfully", { ids });
  return data;
};
