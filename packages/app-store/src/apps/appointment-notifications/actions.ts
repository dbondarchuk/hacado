import { adminApi } from "@hacado/api-sdk";
import { WithTotal } from "@hacado/types";
import {
  AppointmentNotification,
  AppointmentNotificationsAppData,
  AppointmentNotificationUpdateModel,
  GetAppointmentNotificationsAction,
  RequestAction,
} from "./models";

const logger = (action: string) => ({
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

export const deleteAppointmentNotification = async (
  appId: string,
  appointmentNotificationId: string,
) => {
  const actionLogger = logger("deleteAppointmentNotification");
  actionLogger.debug(
    { appId, appointmentNotificationId },
    "Deleting appointment notification",
  );
  try {
    const result = await adminApi.apps.processRequest(appId, {
      type: "delete-appointment-notifications",
      ids: [appointmentNotificationId],
    } as RequestAction);
    actionLogger.debug(
      { appId, appointmentNotificationId },
      "Appointment notification deleted",
    );
    return result;
  } catch (error) {
    actionLogger.error(
      {
        appId,
        appointmentNotificationId,
        error: error instanceof Error ? error.message : String(error),
      },
      "Failed to delete appointment notification",
    );
    throw error;
  }
};

export const deleteSelectedAppointmentNotifications = async (
  appId: string,
  ids: string[],
) => {
  const actionLogger = logger("deleteSelectedAppointmentNotifications");
  actionLogger.debug(
    { appId, ids, count: ids.length },
    "Deleting selected appointment notifications",
  );
  try {
    const result = await adminApi.apps.processRequest(appId, {
      type: "delete-appointment-notifications",
      ids: ids,
    } as RequestAction);
    actionLogger.debug(
      { appId, ids, count: ids.length },
      "Selected appointment notifications deleted",
    );
    return result;
  } catch (error) {
    actionLogger.error(
      {
        appId,
        ids,
        count: ids.length,
        error: error instanceof Error ? error.message : String(error),
      },
      "Failed to delete selected appointment notifications",
    );
    throw error;
  }
};

export const getAppointmentNotifications = async (
  appId: string,
  query: GetAppointmentNotificationsAction["query"],
) => {
  const actionLogger = logger("getAppointmentNotifications");
  actionLogger.debug(
    { appId, hasQuery: !!query },
    "Getting appointment notifications",
  );
  try {
    const result = (await adminApi.apps.processRequest(appId, {
      type: "get-appointment-notifications",
      query,
    } as RequestAction)) as WithTotal<AppointmentNotification>;
    actionLogger.debug(
      { appId, hasQuery: !!query, total: result.total },
      "Appointment notifications retrieved",
    );
    return result;
  } catch (error) {
    actionLogger.error(
      {
        appId,
        hasQuery: !!query,
        error: error instanceof Error ? error.message : String(error),
      },
      "Failed to get appointment notifications",
    );
    throw error;
  }
};

export const getAppointmentNotification = async (appId: string, id: string) => {
  const actionLogger = logger("getAppointmentNotification");
  actionLogger.debug({ appId, id }, "Getting appointment notification");
  try {
    const result = (await adminApi.apps.processRequest(appId, {
      type: "get-appointment-notification",
      id,
    } as RequestAction)) as AppointmentNotification;
    actionLogger.debug(
      { appId, id, hasResult: !!result },
      "Appointment notification retrieved",
    );
    return result;
  } catch (error) {
    actionLogger.error(
      {
        appId,
        id,
        error: error instanceof Error ? error.message : String(error),
      },
      "Failed to get appointment notification",
    );
    throw error;
  }
};

export const getAppointmentNotificationsAppData = async (appId: string) => {
  const actionLogger = logger("getAppointmentNotificationsAppData");
  actionLogger.debug({ appId }, "Getting app data");
  try {
    const result = (await adminApi.apps.processRequest(appId, {
      type: "get-app-data",
    } as RequestAction)) as AppointmentNotificationsAppData;
    actionLogger.debug({ appId, hasData: !!result }, "App data retrieved");
    return result;
  } catch (error) {
    actionLogger.error(
      { appId, error: error instanceof Error ? error.message : String(error) },
      "Failed to get appointment notifications app data",
    );
    throw error;
  }
};

export const setAppointmentNotificationsAppData = async (
  appId: string,
  data: AppointmentNotificationsAppData,
) => {
  const actionLogger = logger("setAppointmentNotificationsAppData");
  actionLogger.debug(
    { appId, hasData: !!data },
    "Setting appointment notifications app data",
  );
  try {
    const result = await adminApi.apps.processRequest(appId, {
      type: "set-app-data",
      data,
    } as RequestAction);
    actionLogger.debug({ appId, hasData: !!data }, "App data set");
    return result;
  } catch (error) {
    actionLogger.error(
      {
        appId,
        hasData: !!data,
        error: error instanceof Error ? error.message : String(error),
      },
      "Failed to set app data",
    );
    throw error;
  }
};

export const checkUniqueName = async (
  appId: string,
  name: string,
  id?: string,
) => {
  const actionLogger = logger("checkUniqueName");
  actionLogger.debug({ appId, name, id }, "Checking unique name");
  try {
    const result = (await adminApi.apps.processRequest(appId, {
      type: "check-unique-name",
      name,
      id,
    } as RequestAction)) as boolean;
    actionLogger.debug(
      { appId, name, id, isUnique: result },
      "Unique name check completed",
    );
    return result;
  } catch (error) {
    actionLogger.error(
      {
        appId,
        name,
        id,
        error: error instanceof Error ? error.message : String(error),
      },
      "Failed to check unique name",
    );
    throw error;
  }
};

export const create = async (
  appId: string,
  appointmentNotification: AppointmentNotificationUpdateModel,
) => {
  const actionLogger = logger("create");
  actionLogger.debug(
    { appId, hasAppointmentNotification: !!appointmentNotification },
    "Creating appointment notification",
  );
  try {
    const result = await adminApi.apps.processRequest(appId, {
      type: "create-appointment-notification",
      appointmentNotification,
    } as RequestAction);
    actionLogger.debug(
      { appId, hasAppointmentNotification: !!appointmentNotification },
      "Appointment notification created",
    );
    return result;
  } catch (error) {
    actionLogger.error(
      {
        appId,
        hasAppointmentNotification: !!appointmentNotification,
        error: error instanceof Error ? error.message : String(error),
      },
      "Failed to create appointment notification",
    );
    throw error;
  }
};

export const update = async (
  appId: string,
  id: string,
  update: AppointmentNotificationUpdateModel,
) => {
  const actionLogger = logger("update");
  actionLogger.debug(
    { appId, id, hasUpdate: !!update },
    "Updating appointment notification",
  );
  try {
    const result = await adminApi.apps.processRequest(appId, {
      type: "update-appointment-notification",
      update,
      id,
    } as RequestAction);
    actionLogger.debug(
      { appId, id, hasUpdate: !!update },
      "Appointment notification updated",
    );
    return result;
  } catch (error) {
    actionLogger.error(
      {
        appId,
        id,
        hasUpdate: !!update,
        error: error instanceof Error ? error.message : String(error),
      },
      "Failed to update appointment notification",
    );
    throw error;
  }
};
