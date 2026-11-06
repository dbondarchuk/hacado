import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import { ConnectedAppError, IConnectedAppProps } from "@hacado/types/apps";
import { WithTotal } from "@hacado/types/database";
import { buildSearchQuery } from "@hacado/utils/query";
import { escapeRegex } from "@hacado/utils/string";
import { DateTime } from "luxon";
import { ObjectId, type Filter, type Sort } from "mongodb";
import {
  AppointmentReminder,
  AppointmentReminderUpdateModel,
  GetAppointmentRemindersAction,
} from "./models";
import { AppointmentRemindersAdminAllKeys } from "./translations/types";

const APPOINTMENT_REMINDERS_COLLECTION_NAME = "appointment-reminders";

export class AppointmentRemindersRepository {
  protected readonly loggerFactory: LoggerFactory;

  public constructor(protected readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "AppointmentRemindersRepository",
      props.organizationId,
    );
  }

  public async getAppointmentReminder(appId: string, id: string) {
    const logger = this.loggerFactory("getAppointmentReminder");
    logger.debug(
      {
        appId,
        organizationId: this.props.organizationId,
        appointmentReminderId: id,
      },
      "Getting appointment reminder",
    );

    try {
      const db = await this.props.getDbConnection();

      const appointmentReminder = await db
        .collection<AppointmentReminder>(APPOINTMENT_REMINDERS_COLLECTION_NAME)
        .findOne({
          appId,
          organizationId: this.props.organizationId,
          _id: id,
        });

      if (appointmentReminder) {
        logger.debug(
          {
            appId,
            appointmentReminderId: id,
            appointmentReminderName: appointmentReminder.name,
          },
          "Successfully retrieved appointment reminder",
        );
      } else {
        logger.debug(
          { appId, appointmentReminderId: id },
          "Appointment reminder not found",
        );
      }

      return appointmentReminder;
    } catch (error: any) {
      logger.error(
        {
          appId,
          appointmentReminderId: id,
          error: error?.message || error?.toString(),
        },
        "Error getting appointment reminder",
      );

      throw error;
    }
  }

  public async getAppointmentReminders(
    appId: string,
    query: GetAppointmentRemindersAction["query"],
  ): Promise<WithTotal<AppointmentReminder>> {
    const logger = this.loggerFactory("getAppointmentReminders");
    logger.debug({ appId, query }, "Getting appointment reminders");

    try {
      const db = await this.props.getDbConnection();

      const sort: Sort = query.sort?.reduce(
        (prev, curr) => ({
          ...prev,
          [curr.id]: curr.desc ? -1 : 1,
        }),
        {},
      ) || { updatedAt: -1 };

      const filter: Filter<AppointmentReminder> = {
        appId,
      };

      if (query.channel?.length) {
        const channelClauses = query.channel.map((channel) =>
          channel === "email"
            ? {
                $or: [
                  { emailEnabled: true },
                  { emailEnabled: { $exists: false }, channel: "email" },
                ],
              }
            : {
                $or: [
                  { textEnabled: true },
                  {
                    textEnabled: { $exists: false },
                    channel: "text-message",
                    enabled: true,
                  },
                ],
              },
        );

        filter.$and = [...(filter.$and ?? []), { $or: channelClauses }];
      }

      if (query.type) {
        filter.type = {
          $in: query.type,
        };
      }

      if (query.search) {
        const $regex = new RegExp(escapeRegex(query.search), "i");
        const queries = buildSearchQuery<AppointmentReminder>(
          { $regex },
          "name",
        );

        filter.$or = queries;
      }

      logger.debug(
        { appId, filter, sort, offset: query.offset, limit: query.limit },
        "Executing appointment reminders query",
      );

      const [result] = await db
        .collection<AppointmentReminder>(APPOINTMENT_REMINDERS_COLLECTION_NAME)
        .aggregate([
          {
            $sort: sort,
          },
          {
            $match: filter,
          },
          {
            $project: {
              value: false,
            },
          },
          {
            $facet: {
              paginatedResults:
                query.limit === 0
                  ? undefined
                  : [
                      ...(typeof query.offset !== "undefined"
                        ? [{ $skip: query.offset }]
                        : []),
                      ...(typeof query.limit !== "undefined"
                        ? [{ $limit: query.limit }]
                        : []),
                    ],
              totalCount: [
                {
                  $count: "count",
                },
              ],
            },
          },
        ])
        .toArray();

      const total = result.totalCount?.[0]?.count || 0;
      const items = result.paginatedResults || [];

      logger.debug(
        { appId, total, itemCount: items.length },
        "Successfully retrieved appointment reminders",
      );

      return {
        total,
        items,
      };
    } catch (error: any) {
      logger.error(
        { appId, query, error: error?.message || error?.toString() },
        "Error getting appointment reminders",
      );

      throw error;
    }
  }

  public async createAppointmentReminder(
    appId: string,
    appointmentReminder: AppointmentReminderUpdateModel,
  ): Promise<AppointmentReminder> {
    const logger = this.loggerFactory("createAppointmentReminder");
    logger.debug(
      {
        appId,
        appointmentReminderName: appointmentReminder.name,
        emailEnabled: appointmentReminder.emailEnabled,
        textEnabled: appointmentReminder.textEnabled,
        type: appointmentReminder.type,
        appointmentCount: appointmentReminder.appointmentCount,
      },
      "Creating appointment reminder",
    );

    try {
      const dbAppointmentReminder: AppointmentReminder = {
        ...appointmentReminder,
        appId,
        _id: new ObjectId().toString(),
        organizationId: this.props.organizationId,
        updatedAt: DateTime.utc().toJSDate(),
      };

      const isUnique = await this.checkUniqueName(
        appId,
        appointmentReminder.name,
      );

      if (!isUnique) {
        logger.error(
          { appId, appointmentReminderName: appointmentReminder.name },
          "Appointment reminder name already exists",
        );

        throw new ConnectedAppError(
          "app_appointment-reminders_admin.form.name.validation.unique" satisfies AppointmentRemindersAdminAllKeys,
        );
      }

      const db = await this.props.getDbConnection();
      const appointmentReminders = db.collection<AppointmentReminder>(
        APPOINTMENT_REMINDERS_COLLECTION_NAME,
      );

      await appointmentReminders.insertOne(dbAppointmentReminder);

      logger.info(
        {
          appId,
          appointmentReminderId: dbAppointmentReminder._id,
          appointmentReminderName: appointmentReminder.name,
        },
        "Successfully created appointment reminder",
      );

      return dbAppointmentReminder;
    } catch (error: any) {
      logger.error(
        {
          appId,
          appointmentReminderName: appointmentReminder.name,
          error: error?.message || error?.toString(),
        },
        "Error creating appointment reminder",
      );

      throw error;
    }
  }

  public async updateAppointmentReminder(
    appId: string,
    id: string,
    update: AppointmentReminderUpdateModel,
  ): Promise<void> {
    const logger = this.loggerFactory("updateAppointmentReminder");
    logger.debug(
      {
        appId,
        appointmentReminderId: id,
        appointmentReminderName: update.name,
      },
      "Updating appointment reminder",
    );

    try {
      const db = await this.props.getDbConnection();
      const appointmentReminders = db.collection<AppointmentReminder>(
        APPOINTMENT_REMINDERS_COLLECTION_NAME,
      );

      const { _id, ...updateObj } = update as AppointmentReminder; // Remove fields in case it slips here

      const isUnique = await this.checkUniqueName(appId, update.name, id);
      if (!isUnique) {
        logger.error(
          {
            appId,
            appointmentReminderId: id,
            appointmentReminderName: update.name,
          },
          "Appointment reminder name already exists",
        );

        throw new ConnectedAppError(
          "app_appointment-reminders_admin.form.name.validation.unique" satisfies AppointmentRemindersAdminAllKeys,
        );
      }

      updateObj.updatedAt = DateTime.utc().toJSDate();

      await appointmentReminders.updateOne(
        {
          _id: id,
        },
        {
          $set: updateObj,
          $unset: {
            channel: "",
            templateId: "",
            enabled: "",
            smsKind: "",
            followUpText: "",
          },
        },
      );

      logger.info(
        {
          appId,
          appointmentReminderId: id,
          appointmentReminderName: update.name,
        },
        "Successfully updated appointment reminder",
      );
    } catch (error: any) {
      logger.error(
        {
          appId,
          appointmentReminderId: id,
          appointmentReminderName: update.name,
          error: error?.message || error?.toString(),
        },
        "Error updating appointment reminder",
      );

      throw error;
    }
  }

  public async deleteAppointmentReminders(
    appId: string,
    ids: string[],
  ): Promise<void> {
    const logger = this.loggerFactory("deleteAppointmentReminders");
    logger.debug(
      { appId, appointmentReminderIds: ids },
      "Deleting appointment reminders",
    );

    try {
      const db = await this.props.getDbConnection();
      const appointmentReminders = db.collection<AppointmentReminder>(
        APPOINTMENT_REMINDERS_COLLECTION_NAME,
      );

      await appointmentReminders.deleteMany({
        appId,
        organizationId: this.props.organizationId,
        _id: {
          $in: ids,
        },
      });

      logger.info(
        { appId, appointmentReminderIds: ids },
        "Successfully deleted appointment reminders",
      );
    } catch (error: any) {
      logger.error(
        {
          appId,
          appointmentReminderIds: ids,
          error: error?.message || error?.toString(),
        },
        "Error deleting appointment reminders",
      );

      throw error;
    }
  }

  public async checkUniqueName(
    appId: string,
    name: string,
    id?: string,
  ): Promise<boolean> {
    const logger = this.loggerFactory("checkUniqueName");
    logger.debug(
      { appId, name, appointmentReminderId: id },
      "Checking unique name",
    );

    try {
      const db = await this.props.getDbConnection();
      const appointmentReminders = db.collection<AppointmentReminder>(
        APPOINTMENT_REMINDERS_COLLECTION_NAME,
      );

      const filter: Filter<AppointmentReminder> = {
        name,
        appId,
      };

      if (id) {
        filter._id = {
          $ne: id,
        };
      }

      const result = appointmentReminders.aggregate([
        {
          $match: filter,
        },
      ]);

      const isUnique = !(await result.hasNext());

      logger.debug(
        { appId, name, appointmentReminderId: id, isUnique },
        "Name uniqueness check completed",
      );

      return isUnique;
    } catch (error: any) {
      logger.error(
        {
          appId,
          name,
          appointmentReminderId: id,
          error: error?.message || error?.toString(),
        },
        "Error checking unique name",
      );

      throw error;
    }
  }

  public async getTextMessageOffer(appId: string): Promise<{
    reminders: boolean;
    other: boolean;
  }> {
    const logger = this.loggerFactory("getTextMessageOffer");

    try {
      const db = await this.props.getDbConnection();
      const docs = await db
        .collection<AppointmentReminder>(APPOINTMENT_REMINDERS_COLLECTION_NAME)
        .find({
          appId,
          organizationId: this.props.organizationId,
          $or: [
            { textEnabled: true },
            {
              textEnabled: { $exists: false },
              channel: "text-message",
              enabled: true,
            },
          ],
        })
        .toArray();

      let reminders = false;
      let other = false;
      for (const doc of docs) {
        if (doc.type === "timeAfter" || doc.type === "atTimeAfter") {
          other = true;
        } else {
          reminders = true;
        }
      }

      return { reminders, other };
    } catch (error: any) {
      logger.error(
        { appId, error: error?.message || error?.toString() },
        "Error reading text message offer",
      );

      return { reminders: false, other: false };
    }
  }

  public async onUninstall(appId: string): Promise<void> {
    const logger = this.loggerFactory("onUninstall");
    try {
      const db = await this.props.getDbConnection();
      const collection = db.collection<AppointmentReminder>(
        APPOINTMENT_REMINDERS_COLLECTION_NAME,
      );

      logger.debug({ appId }, "Deleting appointment reminders for app");

      await collection.deleteMany({
        appId,
      });

      // Drop only when no reminders remain for any app in this organization DB.
      const remaining = await collection.countDocuments({});

      if (remaining === 0) {
        logger.debug(
          { appId },
          "Appointment reminders collection empty, dropping collection",
        );

        await db.dropCollection(APPOINTMENT_REMINDERS_COLLECTION_NAME);
      }

      logger.info({ appId }, "Successfully cleaned up appointment reminders");
    } catch (error: any) {
      logger.error(
        { appId, error: error?.message || error?.toString() },
        "Error cleaning up appointment reminders",
      );

      throw error;
    }
  }

  public async installAppointmentRemindersApp() {
    const logger = this.loggerFactory("installAppointmentRemindersApp");
    logger.debug("Installing appointment reminders app");

    const db = await this.props.getDbConnection();
    const collection = await db.createCollection<AppointmentReminder>(
      APPOINTMENT_REMINDERS_COLLECTION_NAME,
    );

    const indexes = {
      organizationId_appId_updatedAt_1: {
        organizationId: 1,
        appId: 1,
        updatedAt: 1,
      },
      organizationId_appId_type_1: { organizationId: 1, appId: 1, type: 1 },
      organizationId_appId_channel_1: {
        organizationId: 1,
        appId: 1,
        channel: 1,
      },
      organizationId_appId_name_1: { organizationId: 1, appId: 1, name: 1 },
    };

    for (const [name, index] of Object.entries(indexes)) {
      logger.debug(`Checking if index ${name} exists`);
      if (await collection.indexExists(name)) {
        logger.debug(`Index ${name} already exists`);
        continue;
      }

      logger.debug(`Creating index ${name}`);
      await collection.createIndex(index, { name });
    }

    logger.debug("Appointment reminders app installed");
  }
}
