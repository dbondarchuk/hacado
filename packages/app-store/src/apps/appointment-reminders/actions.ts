import { appsApi } from "@hacado/api-sdk/admin/apps";
import { WithTotal } from "@hacado/types/database";
import {
  AppointmentReminder,
  AppointmentRemindersAppData,
  AppointmentReminderUpdateModel,
  GetAppointmentRemindersAction,
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

export const deleteAppointmentReminder = async (
  appId: string,
  appointmentReminderId: string,
) => {
  const actionLogger = logger("deleteAppointmentReminder");
  actionLogger.debug(
    { appId, appointmentReminderId },
    "Deleting appointment reminder",
  );

  try {
    const result = await appsApi.processRequest(appId, {
      type: "delete-appointment-reminders",
      ids: [appointmentReminderId],
    } as RequestAction);

    actionLogger.debug(
      { appId, appointmentReminderId },
      "Appointment reminder deleted",
    );

    return result;
  } catch (error) {
    actionLogger.error(
      {
        appId,
        appointmentReminderId,
        error: error instanceof Error ? error.message : String(error),
      },
      "Failed to delete appointment reminder",
    );

    throw error;
  }
};

export const deleteSelectedAppointmentReminders = async (
  appId: string,
  ids: string[],
) => {
  const actionLogger = logger("deleteSelectedAppointmentReminders");
  actionLogger.debug(
    { appId, ids, count: ids.length },
    "Deleting selected appointment reminders",
  );

  try {
    const result = await appsApi.processRequest(appId, {
      type: "delete-appointment-reminders",
      ids: ids,
    } as RequestAction);

    actionLogger.debug(
      { appId, ids, count: ids.length },
      "Selected appointment reminders deleted",
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
      "Failed to delete selected appointment reminders",
    );

    throw error;
  }
};

export const getAppointmentReminders = async (
  appId: string,
  query: GetAppointmentRemindersAction["query"],
) => {
  const actionLogger = logger("getAppointmentReminders");
  actionLogger.debug(
    { appId, hasQuery: !!query },
    "Getting appointment reminders",
  );

  try {
    const result = (await appsApi.processRequest(appId, {
      type: "get-appointment-reminders",
      query,
    } as RequestAction)) as WithTotal<AppointmentReminder>;

    actionLogger.debug(
      { appId, hasQuery: !!query, total: result.total },
      "Appointment reminders retrieved",
    );

    return result;
  } catch (error) {
    actionLogger.error(
      {
        appId,
        hasQuery: !!query,
        error: error instanceof Error ? error.message : String(error),
      },
      "Failed to get appointment reminders",
    );

    throw error;
  }
};

export const getAppointmentReminder = async (appId: string, id: string) => {
  const actionLogger = logger("getAppointmentReminder");
  actionLogger.debug({ appId, id }, "Getting appointment reminder");
  try {
    const result = (await appsApi.processRequest(appId, {
      type: "get-appointment-reminder",
      id,
    } as RequestAction)) as AppointmentReminder;

    actionLogger.debug(
      { appId, id, hasResult: !!result },
      "Appointment reminder retrieved",
    );

    return result;
  } catch (error) {
    actionLogger.error(
      {
        appId,
        id,
        error: error instanceof Error ? error.message : String(error),
      },
      "Failed to get appointment reminder",
    );

    throw error;
  }
};

export const getAppointmentRemindersAppData = async (appId: string) => {
  const actionLogger = logger("getAppointmentRemindersAppData");
  actionLogger.debug({ appId }, "Getting app data");
  try {
    const result = (await appsApi.processRequest(appId, {
      type: "get-app-data",
    } as RequestAction)) as AppointmentRemindersAppData;

    actionLogger.debug({ appId, hasData: !!result }, "App data retrieved");
    return result;
  } catch (error) {
    actionLogger.error(
      { appId, error: error instanceof Error ? error.message : String(error) },
      "Failed to get appointment reminders app data",
    );

    throw error;
  }
};

export const setAppointmentRemindersAppData = async (
  appId: string,
  data: AppointmentRemindersAppData,
) => {
  const actionLogger = logger("setAppointmentRemindersAppData");
  actionLogger.debug(
    { appId, hasData: !!data },
    "Setting appointment reminders app data",
  );

  try {
    const result = await appsApi.processRequest(appId, {
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
    const result = (await appsApi.processRequest(appId, {
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
  appointmentReminder: AppointmentReminderUpdateModel,
) => {
  const actionLogger = logger("create");
  actionLogger.debug(
    { appId, hasAppointmentReminder: !!appointmentReminder },
    "Creating appointment reminder",
  );

  try {
    const result = await appsApi.processRequest(appId, {
      type: "create-appointment-reminder",
      appointmentReminder,
    } as RequestAction);

    actionLogger.debug(
      { appId, hasAppointmentReminder: !!appointmentReminder },
      "Appointment reminder created",
    );

    return result;
  } catch (error) {
    actionLogger.error(
      {
        appId,
        hasAppointmentReminder: !!appointmentReminder,
        error: error instanceof Error ? error.message : String(error),
      },
      "Failed to create appointment reminder",
    );

    throw error;
  }
};

export const update = async (
  appId: string,
  id: string,
  update: AppointmentReminderUpdateModel,
) => {
  const actionLogger = logger("update");
  actionLogger.debug(
    { appId, id, hasUpdate: !!update },
    "Updating appointment reminder",
  );

  try {
    const result = await appsApi.processRequest(appId, {
      type: "update-appointment-reminder",
      update,
      id,
    } as RequestAction);

    actionLogger.debug(
      { appId, id, hasUpdate: !!update },
      "Appointment reminder updated",
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
      "Failed to update appointment reminder",
    );

    throw error;
  }
};
