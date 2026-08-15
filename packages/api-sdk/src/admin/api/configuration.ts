import { ConfigurationKey, ConfigurationOption, okStatus } from "@hacado/types";
import { fetchAdminApi } from "./utils";

export const getConfiguration = async <T extends ConfigurationKey>(
  configuration: T,
) => {
  console.debug("Getting configuration", { configuration });
  const response = await fetchAdminApi(`/configuration/${configuration}`, {
    method: "GET",
  });

  const data = await response.json<ConfigurationOption<T>["value"]>();
  console.debug("Configuration retrieved successfully", { data });
  return data;
};

export const setConfiguration = async <T extends ConfigurationKey>(
  configuration: T,
  value: ConfigurationOption<T>["value"],
) => {
  console.debug("Setting configuration", { configuration, value });
  const response = await fetchAdminApi(`/configuration/${configuration}`, {
    method: "PUT",
    body: JSON.stringify(value),
  });

  const data = await response.json<typeof okStatus>();
  console.debug("Configuration set successfully", { configuration, value });
  return data;
};
