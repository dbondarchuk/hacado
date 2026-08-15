import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import {
  ConnectedAppError,
  IConnectedAppProps,
  WithTotal,
} from "@hacado/types";
import { buildSearchQuery, escapeRegex } from "@hacado/utils";
import { DateTime } from "luxon";
import { ObjectId, type Filter, type Sort } from "mongodb";
import {
  AppointmentNotification,
  AppointmentNotificationUpdateModel,
  GetAppointmentNotificationsAction,
} from "./models";
import { AppointmentNotificationsAdminAllKeys } from "./translations/types";

const APPOINTMENT_NOTIFICATIONS_COLLECTION_NAME = "appointment-notifications";

export class AppointmentNotificationsRepository {
  protected readonly loggerFactory: LoggerFactory;

  public constructor(protected readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "AppointmentNotificationsRepository",
      props.organizationId,
    );
  }

  public async getAppointmentNotification(appId: string, id: string) {
    const logger = this.loggerFactory("getAppointmentNotification");
    logger.debug(
      {
        appId,
        organizationId: this.props.organizationId,
        appointmentNotificationId: id,
      },
      "Getting appointment notification",
    );

    try {
      const db = await this.props.getDbConnection();

      const appointmentNotification = await db
        .collection<AppointmentNotification>(
          APPOINTMENT_NOTIFICATIONS_COLLECTION_NAME,
        )
        .findOne({
          appId,
          organizationId: this.props.organizationId,
          _id: id,
        });

      if (appointmentNotification) {
        logger.debug(
          {
            appId,
            appointmentNotificationId: id,
            appointmentNotificationName: appointmentNotification.name,
          },
          "Successfully retrieved appointment notification",
        );
      } else {
        logger.debug(
          { appId, appointmentNotificationId: id },
          "Appointment notification not found",
        );
      }

      return appointmentNotification;
    } catch (error: any) {
      logger.error(
        {
          appId,
          appointmentNotificationId: id,
          error: error?.message || error?.toString(),
        },
        "Error getting appointment notification",
      );
      throw error;
    }
  }

  public async getAppointmentNotifications(
    appId: string,
    query: GetAppointmentNotificationsAction["query"],
  ): Promise<WithTotal<AppointmentNotification>> {
    const logger = this.loggerFactory("getAppointmentNotifications");
    logger.debug({ appId, query }, "Getting appointment notifications");

    try {
      const db = await this.props.getDbConnection();

      const sort: Sort = query.sort?.reduce(
        (prev, curr) => ({
          ...prev,
          [curr.id]: curr.desc ? -1 : 1,
        }),
        {},
      ) || { updatedAt: -1 };

      const filter: Filter<AppointmentNotification> = {
        appId,
      };

      if (query.channel) {
        filter.channel = {
          $in: query.channel,
        };
      }

      if (query.type) {
        filter.type = {
          $in: query.type,
        };
      }

      if (query.search) {
        const $regex = new RegExp(escapeRegex(query.search), "i");
        const queries = buildSearchQuery<AppointmentNotification>(
          { $regex },
          "name",
        );

        filter.$or = queries;
      }

      logger.debug(
        { appId, filter, sort, offset: query.offset, limit: query.limit },
        "Executing appointment notifications query",
      );

      const [result] = await db
        .collection<AppointmentNotification>(
          APPOINTMENT_NOTIFICATIONS_COLLECTION_NAME,
        )
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
        "Successfully retrieved appointment notifications",
      );

      return {
        total,
        items,
      };
    } catch (error: any) {
      logger.error(
        { appId, query, error: error?.message || error?.toString() },
        "Error getting appointment notifications",
      );
      throw error;
    }
  }

  public async createAppointmentNotification(
    appId: string,
    appointmentNotification: AppointmentNotificationUpdateModel,
  ): Promise<AppointmentNotification> {
    const logger = this.loggerFactory("createAppointmentNotification");
    logger.debug(
      {
        appId,
        appointmentNotificationName: appointmentNotification.name,
        channel: appointmentNotification.channel,
        type: appointmentNotification.type,
        appointmentCount: appointmentNotification.appointmentCount,
      },
      "Creating appointment notification",
    );

    try {
      const dbAppointmentNotification: AppointmentNotification = {
        ...appointmentNotification,
        appId,
        _id: new ObjectId().toString(),
        organizationId: this.props.organizationId,
        updatedAt: DateTime.utc().toJSDate(),
      };

      const isUnique = await this.checkUniqueName(
        appId,
        appointmentNotification.name,
      );
      if (!isUnique) {
        logger.error(
          { appId, appointmentNotificationName: appointmentNotification.name },
          "Appointment notification name already exists",
        );
        throw new ConnectedAppError(
          "app_appointment-notifications_admin.form.name.validation.unique" satisfies AppointmentNotificationsAdminAllKeys,
        );
      }

      const db = await this.props.getDbConnection();
      const appointmentNotifications = db.collection<AppointmentNotification>(
        APPOINTMENT_NOTIFICATIONS_COLLECTION_NAME,
      );

      await appointmentNotifications.insertOne(dbAppointmentNotification);

      logger.info(
        {
          appId,
          appointmentNotificationId: dbAppointmentNotification._id,
          appointmentNotificationName: appointmentNotification.name,
        },
        "Successfully created appointment notification",
      );

      return dbAppointmentNotification;
    } catch (error: any) {
      logger.error(
        {
          appId,
          appointmentNotificationName: appointmentNotification.name,
          error: error?.message || error?.toString(),
        },
        "Error creating appointment notification",
      );
      throw error;
    }
  }

  public async updateAppointmentNotification(
    appId: string,
    id: string,
    update: AppointmentNotificationUpdateModel,
  ): Promise<void> {
    const logger = this.loggerFactory("updateAppointmentNotification");
    logger.debug(
      {
        appId,
        appointmentNotificationId: id,
        appointmentNotificationName: update.name,
      },
      "Updating appointment notification",
    );

    try {
      const db = await this.props.getDbConnection();
      const appointmentNotifications = db.collection<AppointmentNotification>(
        APPOINTMENT_NOTIFICATIONS_COLLECTION_NAME,
      );

      const { _id, ...updateObj } = update as AppointmentNotification; // Remove fields in case it slips here

      const isUnique = await this.checkUniqueName(appId, update.name, id);
      if (!isUnique) {
        logger.error(
          {
            appId,
            appointmentNotificationId: id,
            appointmentNotificationName: update.name,
          },
          "Appointment notification name already exists",
        );
        throw new ConnectedAppError(
          "app_appointment-notifications_admin.form.name.validation.unique" satisfies AppointmentNotificationsAdminAllKeys,
        );
      }

      updateObj.updatedAt = DateTime.utc().toJSDate();

      await appointmentNotifications.updateOne(
        {
          _id: id,
        },
        {
          $set: updateObj,
        },
      );

      logger.info(
        {
          appId,
          appointmentNotificationId: id,
          appointmentNotificationName: update.name,
        },
        "Successfully updated appointment notification",
      );
    } catch (error: any) {
      logger.error(
        {
          appId,
          appointmentNotificationId: id,
          appointmentNotificationName: update.name,
          error: error?.message || error?.toString(),
        },
        "Error updating appointment notification",
      );
      throw error;
    }
  }

  public async deleteAppointmentNotifications(
    appId: string,
    ids: string[],
  ): Promise<void> {
    const logger = this.loggerFactory("deleteAppointmentNotifications");
    logger.debug(
      { appId, appointmentNotificationIds: ids },
      "Deleting appointment notifications",
    );

    try {
      const db = await this.props.getDbConnection();
      const appointmentNotifications = db.collection<AppointmentNotification>(
        APPOINTMENT_NOTIFICATIONS_COLLECTION_NAME,
      );

      await appointmentNotifications.deleteMany({
        appId,
        organizationId: this.props.organizationId,
        _id: {
          $in: ids,
        },
      });

      logger.info(
        { appId, appointmentNotificationIds: ids },
        "Successfully deleted appointment notifications",
      );
    } catch (error: any) {
      logger.error(
        {
          appId,
          appointmentNotificationIds: ids,
          error: error?.message || error?.toString(),
        },
        "Error deleting appointment notifications",
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
      { appId, name, appointmentNotificationId: id },
      "Checking unique name",
    );

    try {
      const db = await this.props.getDbConnection();
      const appointmentNotifications = db.collection<AppointmentNotification>(
        APPOINTMENT_NOTIFICATIONS_COLLECTION_NAME,
      );

      const filter: Filter<AppointmentNotification> = {
        name,
        appId,
      };

      if (id) {
        filter._id = {
          $ne: id,
        };
      }

      const result = appointmentNotifications.aggregate([
        {
          $match: filter,
        },
      ]);
      const isUnique = !(await result.hasNext());

      logger.debug(
        { appId, name, appointmentNotificationId: id, isUnique },
        "Name uniqueness check completed",
      );

      return isUnique;
    } catch (error: any) {
      logger.error(
        {
          appId,
          name,
          appointmentNotificationId: id,
          error: error?.message || error?.toString(),
        },
        "Error checking unique name",
      );
      throw error;
    }
  }

  public async onUninstall(appId: string): Promise<void> {
    const logger = this.loggerFactory("onUninstall");
    try {
      const db = await this.props.getDbConnection();
      const collection = db.collection<AppointmentNotification>(
        APPOINTMENT_NOTIFICATIONS_COLLECTION_NAME,
      );

      logger.debug({ appId }, "Deleting appointment notifications for app");

      await collection.deleteMany({
        appId,
      });

      const count = await collection.countDocuments({});
      if (count === 0) {
        logger.debug(
          { appId },
          "No appointment notifications left, dropping collection",
        );
        await db.dropCollection(APPOINTMENT_NOTIFICATIONS_COLLECTION_NAME);
      }

      logger.info(
        { appId },
        "Successfully cleaned up appointment notifications",
      );
    } catch (error: any) {
      logger.error(
        { appId, error: error?.message || error?.toString() },
        "Error cleaning up appointment notifications",
      );
      throw error;
    }
  }

  public async installAppointmentNotificationsApp() {
    const logger = this.loggerFactory("installAppointmentNotificationsApp");
    logger.debug("Installing appointment notifications app");

    const db = await this.props.getDbConnection();
    const collection = await db.createCollection<AppointmentNotification>(
      APPOINTMENT_NOTIFICATIONS_COLLECTION_NAME,
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

    logger.debug("Appointment notifications app installed");
  }
}
