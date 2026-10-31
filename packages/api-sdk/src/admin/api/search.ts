import type { CommandSearchGroup } from "@hacado/types/apps";
import { fetchAdminApi } from "./utils";

export const searchCommands = async (
  params: { q: string; type?: string },
  options?: Pick<RequestInit, "signal">,
) => {
  const searchParams = new URLSearchParams({ q: params.q });
  if (params.type) {
    searchParams.set("type", params.type);
  }

  const response = await fetchAdminApi(`/search?${searchParams.toString()}`, {
    method: "GET",
    cache: "no-store",
    signal: options?.signal,
  });

  return response.json<{ groups: CommandSearchGroup[] }>();
};
