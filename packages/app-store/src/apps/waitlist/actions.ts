import { adminApi } from "@hacado/api-sdk";
import { WithTotal } from "@hacado/types";
import {
  CreateWaitlistEntryActionType,
  CreateWaitlistEntryRequest,
  DismissWaitlistEntriesActionType,
  GetWaitlistEntriesAction,
  GetWaitlistEntriesActionType,
  GetWaitlistEntryActionType,
  WaitlistEntry,
} from "./models";

const loggerFactory = (action: string) => ({
  debug: (data: any, message: string) => {
    console.debug(`[${action}] DEBUG:`, message, data);
  },
  info: (data: any, message: string) => {
    console.log(`[${action}] INFO:`, message, data);
  },
  error: (data: any, message: string) => {
    console.error(`[${action}] ERROR:`, message, data);
  },
});

export async function getWaitlistEntries(
  appId: string,
  query: GetWaitlistEntriesAction["query"],
) {
  const logger = loggerFactory("getWaitlistEntries");
  logger.debug({ appId, query }, "Getting waitlist entries");

  try {
    const result = (await adminApi.apps.processRequest(appId, {
      type: GetWaitlistEntriesActionType,
      query,
    })) as WithTotal<WaitlistEntry>;

    logger.info(
      { appId, resultCount: result?.items?.length || 0 },
      "Successfully retrieved waitlist entries",
    );
    return result;
  } catch (error: any) {
    logger.error(
      { appId, error: error?.message || error?.toString() },
      "Error getting waitlist entries",
    );
    throw error;
  }
}

export async function getWaitlistEntry(appId: string, id: string) {
  const logger = loggerFactory("getWaitlistEntry");
  logger.debug({ appId, id }, "Getting waitlist entry");

  try {
    const result = (await adminApi.apps.processRequest(appId, {
      type: GetWaitlistEntryActionType,
      id,
    })) as WaitlistEntry;

    logger.info({ appId, id }, "Successfully retrieved waitlist entry");
    return result;
  } catch (error: any) {
    logger.error(
      { appId, error: error?.message || error?.toString() },
      "Error getting waitlist entry",
    );
    throw error;
  }
}

export async function dismissWaitlistEntries(appId: string, ids: string[]) {
  const logger = loggerFactory("dismissWaitlistEntries");
  logger.debug({ appId, waitlistEntryIds: ids }, "Dismissing waitlist entries");

  try {
    const result = await adminApi.apps.processRequest(appId, {
      type: DismissWaitlistEntriesActionType,
      ids,
    });

    logger.info(
      { appId, waitlistEntryIds: ids },
      "Successfully dismissed waitlist entries",
    );
    return result;
  } catch (error: any) {
    logger.error(
      {
        appId,
        waitlistEntryIds: ids,
        error: error?.message || error?.toString(),
      },
      "Error dismissing waitlist entries",
    );
    throw error;
  }
}

export async function createWaitlistEntry(
  appId: string,
  entry: CreateWaitlistEntryRequest,
) {
  const logger = loggerFactory("createWaitlistEntry");
  logger.debug({ appId, entry }, "Creating waitlist entry");

  try {
    const result = await adminApi.apps.processRequest(appId, {
      type: CreateWaitlistEntryActionType,
      entry,
    });
    logger.info({ appId, entry }, "Successfully created waitlist entry");
    return result;
  } catch (error: any) {
    logger.error(
      { appId, entry, error: error?.message || error?.toString() },
      "Error creating waitlist entry",
    );
    throw error;
  }
}
