"use server";

import { getActor, getServicesContainer } from "@/app/utils";
import { getLoggerFactory } from "@hacado/logger";
import { DefaultAppsConfiguration } from "@hacado/types";

const logger = getLoggerFactory("DefaultAppsActions");

export async function updateDefaultAppsConfiguration(
  data: DefaultAppsConfiguration,
) {
  const actionLogger = logger("updateDefaultAppsConfiguration");
  const servicesContainer = await getServicesContainer();
  actionLogger.debug(
    {
      defaultAppsCount: Object.keys(data).length,
      defaultApps: Object.keys(data),
    },
    "Updating default apps configuration",
  );

  try {
    const source = await getActor();
    await servicesContainer.configurationService.setConfiguration(
      "defaultApps",
      data,
      source,
    );

    actionLogger.debug(
      {
        defaultAppsCount: Object.keys(data).length,
        defaultApps: Object.keys(data),
      },
      "Default apps configuration updated successfully",
    );
  } catch (error) {
    actionLogger.error(
      {
        defaultAppsCount: Object.keys(data).length,
        defaultApps: Object.keys(data),
        error: error instanceof Error ? error.message : String(error),
      },
      "Failed to update default apps configuration",
    );
    throw error;
  }
}
