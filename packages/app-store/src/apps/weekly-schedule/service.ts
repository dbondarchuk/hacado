import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import {
  ConnectedAppData,
  ConnectedAppRequestError,
  ConnectedAppStatusWithText,
  ConnectedAppUninstallResult,
  DaySchedule,
  IConnectedApp,
  IConnectedAppProps,
  IScheduleProvider,
  Schedule,
  ScheduleOverride,
  WeekIdentifier,
  WithDatabaseId,
} from "@hacado/types";
import { eachOfInterval, getWeekIdentifier } from "@hacado/utils";
import { AnyBulkWriteOperation, ObjectId } from "mongodb";
import { RequestAction, requestActionSchema } from "./models";
import {
  WeeklyScheduleAdminAllKeys,
  WeeklyScheduleAdminKeys,
  WeeklyScheduleAdminNamespace,
} from "./translations/types";

export const SCHEDULE_COLLECTION_NAME = "weekly-schedules";

type ScheduleOverrideEntity = WithDatabaseId<ScheduleOverride> & {
  appId: string;
  /** Assigned staff member; absent on legacy single-member documents. */
  memberId?: string;
};

export default class WeeklyScheduleConnectedApp
  implements IConnectedApp, IScheduleProvider
{
  protected readonly loggerFactory: LoggerFactory;
  public constructor(protected readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "WeeklyScheduleConnectedApp",
      props.organizationId,
    );
  }

  public async processRequest(
    appData: ConnectedAppData,
    request: RequestAction,
  ): Promise<any> {
    const logger = this.loggerFactory("processRequest");
    logger.debug(
      { appId: appData._id, requestType: request.type },
      "Processing weekly schedule request",
    );

    const { data, success, error } = requestActionSchema.safeParse(request);
    if (!success) {
      logger.error({ error }, "Invalid weekly schedule request");
      throw new ConnectedAppRequestError(
        "invalid_weekly_schedule_request",
        { request },
        400,
        error.message,
      );
    }

    try {
      switch (data.type) {
        case "get-weekly-schedule":
          logger.debug(
            { appId: appData._id, week: data.week, memberId: data.memberId },
            "Getting weekly schedule",
          );
          return await this.getWeekSchedule(
            appData._id,
            data.week,
            data.memberId,
          );

        case "set-schedules":
          logger.info(
            {
              appId: appData._id,
              weekCount: Object.keys(data.schedules).length,
              replaceExisting: data.replaceExisting,
              memberId: data.memberId,
            },
            "Setting weekly schedules",
          );
          return await this.setSchedules(
            appData._id,
            data.schedules,
            data.replaceExisting,
            data.memberId,
          );

        case "remove-schedule":
          logger.info(
            { appId: appData._id, week: data.week, memberId: data.memberId },
            "Removing weekly schedule",
          );
          return await this.removeSchedule(
            appData._id,
            data.week,
            data.memberId,
          );

        case "remove-all-schedules":
          logger.info(
            { appId: appData._id, week: data.week, memberId: data.memberId },
            "Removing all weekly schedules from week",
          );
          return await this.removeAllSchedules(
            appData._id,
            data.week,
            data.memberId,
          );

        default: {
          logger.debug(
            { appId: appData._id, requestType: request.type },
            "Processing default action - app installation",
          );

          const status: ConnectedAppStatusWithText<
            WeeklyScheduleAdminNamespace,
            WeeklyScheduleAdminKeys
          > = {
            status: "connected",
            statusText:
              "app_weekly-schedule_admin.statusText.successfully_installed",
          };

          this.props.update({
            ...status,
          });

          logger.info(
            { appId: appData._id, status: status.status },
            "Successfully installed weekly schedule app",
          );

          return status;
        }
      }
    } catch (error: any) {
      logger.error(
        { appId: appData._id, requestType: request.type, error },
        "Error processing weekly schedule request",
      );

      this.props.update({
        status: "failed",
        statusText:
          "app_weekly-schedule_admin.statusText.error_processing_request" satisfies WeeklyScheduleAdminAllKeys,
      });

      throw error;
    }
  }

  public async install(appData: ConnectedAppData): Promise<void> {
    const logger = this.loggerFactory("install");
    logger.debug({ appId: appData._id }, "Installing weekly schedule app");

    const db = await this.props.getDbConnection();
    const collection = await db.createCollection<ScheduleOverrideEntity>(
      SCHEDULE_COLLECTION_NAME,
    );

    const indexes = {
      organizationId_appId_week_1: { organizationId: 1, appId: 1, week: 1 },
      appId_week_1: { appId: 1, week: 1 },
    };

    for (const [name, index] of Object.entries(indexes)) {
      logger.debug(`Checking if index ${name} exists`);
      if (await collection.indexExists(name)) {
        logger.debug(`Index ${name} already exists`);
        continue;
      }

      logger.debug(`Creating index ${name}`);
      await collection.createIndex(index, { name });
      logger.debug(`Index ${name} created`);
    }

    logger.debug(
      { appId: appData._id },
      "Weekly schedule app installed successfully",
    );
  }

  public async unInstall(
    appData: ConnectedAppData,
  ): Promise<ConnectedAppUninstallResult> {
    const logger = this.loggerFactory("unInstall");
    logger.info({ appId: appData._id }, "Uninstalling weekly schedule app");

    try {
      const db = await this.props.getDbConnection();
      const collection = db.collection<ScheduleOverrideEntity>(
        SCHEDULE_COLLECTION_NAME,
      );

      logger.debug(
        { appId: appData._id },
        "Deleting all schedule overrides for app",
      );

      await collection.deleteMany({
        appId: appData._id,
      });

      const count = await collection.countDocuments({});
      logger.debug(
        { appId: appData._id, remainingDocuments: count },
        "Checked remaining documents in collection",
      );

      if (count === 0) {
        logger.debug(
          { appId: appData._id },
          "Collection is empty, dropping weekly-schedules collection",
        );
        await db.dropCollection(SCHEDULE_COLLECTION_NAME);
      }

      logger.info(
        { appId: appData._id },
        "Successfully uninstalled weekly schedule app",
      );
      return { success: true, code: "ok" };
    } catch (error: any) {
      logger.error(
        { appId: appData._id, error },
        "Error uninstalling weekly schedule app",
      );
      throw error;
    }
  }

  protected async setSchedule(
    appId: string,
    weekIdentifier: WeekIdentifier,
    schedule: Schedule,
    memberId?: string,
  ): Promise<void> {
    const logger = this.loggerFactory("setSchedule");
    logger.debug(
      { appId, week: weekIdentifier, scheduleDayCount: schedule.length },
      "Setting single week schedule",
    );

    try {
      await this.setSchedules(
        appId,
        {
          [weekIdentifier]: schedule,
        },
        true,
        memberId,
      );

      logger.debug(
        { appId, week: weekIdentifier },
        "Successfully set single week schedule",
      );
    } catch (error: any) {
      logger.error(
        { appId, week: weekIdentifier, error },
        "Error setting single week schedule",
      );
      throw error;
    }
  }

  protected async setSchedules(
    appId: string,
    schedules: Record<WeekIdentifier, Schedule>,
    replaceExisting?: boolean,
    memberId?: string,
  ): Promise<void> {
    const logger = this.loggerFactory("setSchedules");
    logger.debug(
      {
        appId,
        weekCount: Object.keys(schedules).length,
        replaceExisting,
        weeks: Object.keys(schedules),
        memberId,
      },
      "Setting multiple week schedules",
    );

    try {
      const db = await this.props.getDbConnection();
      const scheduleOverrides = db.collection<ScheduleOverrideEntity>(
        SCHEDULE_COLLECTION_NAME,
      );

      const operations: AnyBulkWriteOperation<ScheduleOverrideEntity>[] =
        Object.entries(schedules).map(([week, schedule]) => ({
          updateOne: {
            filter: {
              week: parseInt(week),
              appId,
              ...(memberId ? { memberId } : {}),
            },
            update: {
              $set: {
                ...(replaceExisting ? { schedule } : {}),
                ...(memberId ? { memberId } : {}),
              },
              $setOnInsert: {
                week: parseInt(week),
                appId,
                _id: new ObjectId().toString(),
                ...(replaceExisting ? {} : { schedule }),
              },
            },
            upsert: true,
          },
        }));

      logger.debug(
        { appId, operationCount: operations.length },
        "Executing bulk write operations",
      );

      await scheduleOverrides.bulkWrite(operations);

      logger.info(
        { appId, weekCount: Object.keys(schedules).length },
        "Successfully set multiple week schedules",
      );
    } catch (error: any) {
      logger.error(
        { appId, weekCount: Object.keys(schedules).length, error },
        "Error setting multiple week schedules",
      );
      throw error;
    }
  }

  protected async removeSchedule(
    appId: string,
    weekIdentifier: WeekIdentifier,
    memberId?: string,
  ): Promise<void> {
    const logger = this.loggerFactory("removeSchedule");
    logger.debug(
      { appId, week: weekIdentifier, memberId },
      "Removing single week schedule",
    );

    try {
      const db = await this.props.getDbConnection();
      const scheduleOverrides = db.collection<ScheduleOverrideEntity>(
        SCHEDULE_COLLECTION_NAME,
      );

      await scheduleOverrides.deleteOne({
        appId,
        week: weekIdentifier,
        ...(memberId ? { memberId } : {}),
      });

      logger.info(
        { appId, week: weekIdentifier },
        "Successfully removed single week schedule",
      );
    } catch (error: any) {
      logger.error(
        { appId, week: weekIdentifier, error },
        "Error removing single week schedule",
      );
      throw error;
    }
  }

  protected async removeAllSchedules(
    appId: string,
    weekIdentifier: WeekIdentifier,
    memberId?: string,
  ): Promise<void> {
    const logger = this.loggerFactory("removeAllSchedules");
    logger.debug(
      { appId, week: weekIdentifier, memberId },
      "Removing all schedules from week onwards",
    );

    try {
      const db = await this.props.getDbConnection();
      const scheduleOverrides = db.collection<ScheduleOverrideEntity>(
        SCHEDULE_COLLECTION_NAME,
      );

      const result = await scheduleOverrides.deleteMany({
        appId,
        week: {
          $gte: weekIdentifier,
        },
        ...(memberId ? { memberId } : {}),
      });

      logger.info(
        { appId, week: weekIdentifier, deletedCount: result.deletedCount },
        "Successfully removed all schedules from week onwards",
      );
    } catch (error: any) {
      logger.error(
        { appId, week: weekIdentifier, error },
        "Error removing all schedules from week onwards",
      );
      throw error;
    }
  }

  protected async getWeekSchedule(
    appId: string,
    weekIdentifier: WeekIdentifier,
    memberId?: string,
  ): Promise<{
    schedule: Schedule;
    isDefault: boolean;
  }> {
    const logger = this.loggerFactory("getWeekSchedule");
    logger.debug(
      { appId, week: weekIdentifier, memberId },
      "Getting week schedule",
    );

    try {
      const db = await this.props.getDbConnection();
      const scheduleOverrides = db.collection<ScheduleOverrideEntity>(
        SCHEDULE_COLLECTION_NAME,
      );

      const scheduleOverride = await scheduleOverrides.findOne({
        appId,
        week: weekIdentifier,
        ...(memberId ? { memberId } : {}),
      });

      const result = scheduleOverride?.schedule
        ? {
            schedule: scheduleOverride?.schedule,
            isDefault: false,
          }
        : {
            schedule: (
              await this.props.services.configurationService.getConfiguration(
                "schedule",
              )
            ).schedule,
            isDefault: true,
          };

      logger.debug(
        {
          appId,
          week: weekIdentifier,
          isDefault: result.isDefault,
          scheduleDayCount: result.schedule.length,
        },
        "Retrieved week schedule",
      );

      return result;
    } catch (error: any) {
      logger.error(
        { appId, week: weekIdentifier, error },
        "Error getting week schedule",
      );
      throw error;
    }
  }

  public async getSchedule(
    appData: ConnectedAppData,
    start: Date,
    end: Date,
    memberId?: string,
  ): Promise<Record<string, DaySchedule>> {
    const logger = this.loggerFactory("getSchedule");
    logger.debug(
      {
        appId: appData._id,
        start: start.toISOString(),
        end: end.toISOString(),
        memberId,
      },
      "Getting schedule for date range",
    );

    try {
      const days = eachOfInterval(start, end, "day");

      const weekMap = days.reduce(
        (map, day) => ({
          ...map,
          [day.toISODate()!]: getWeekIdentifier(day),
        }),
        {} as Record<string, WeekIdentifier>,
      );

      const weeks = Array.from(
        new Set(Object.values(weekMap).map((week) => week)),
      );

      logger.debug(
        {
          appId: appData._id,
          dayCount: days.length,
          uniqueWeekCount: weeks.length,
          weeks,
        },
        "Calculated week mapping for date range",
      );

      const db = await this.props.getDbConnection();
      const scheduleOverrides = db.collection<ScheduleOverrideEntity>(
        SCHEDULE_COLLECTION_NAME,
      );

      const weeksOverrides = await scheduleOverrides
        .find({
          appId: appData._id,
          week: {
            $in: weeks,
          },
          ...(memberId ? { memberId } : {}),
        })
        .toArray();

      logger.debug(
        {
          appId: appData._id,
          foundOverrideCount: weeksOverrides.length,
        },
        "Retrieved schedule overrides from database",
      );

      const weeksOverridesMap = weeksOverrides.reduce(
        (map, weeksOverride) => ({
          ...map,
          [weeksOverride.week]: weeksOverride.schedule,
        }),
        {} as Record<WeekIdentifier, Schedule>,
      );

      const result = days.reduce(
        (map, day) => {
          const dayStr = day.toISODate()!;
          const week = getWeekIdentifier(day);
          const weekSchedule = weeksOverridesMap[week];

          const weekDay = day.weekday;
          const daySchedule = weekSchedule?.find(
            (s) => s.weekDay === weekDay,
          )?.shifts;

          if (!daySchedule) return map;

          return {
            ...map,
            [dayStr]: daySchedule || [],
          };
        },
        {} as Record<string, DaySchedule>,
      );

      logger.info(
        {
          appId: appData._id,
          dayCount: days.length,
          scheduledDayCount: Object.keys(result).length,
        },
        "Successfully generated schedule for date range",
      );

      return result;
    } catch (error: any) {
      logger.error(
        {
          appId: appData._id,
          start: start.toISOString(),
          end: end.toISOString(),
          error,
        },
        "Error getting schedule for date range",
      );
      throw error;
    }
  }
}
