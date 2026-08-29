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
  SCHEDULE_CHANGED_EVENT_TYPE,
  ScheduleDaySource,
  ScheduleExceptionEntity,
  ScheduleRecurrenceInfo,
  ScheduleWeekDay,
  systemEventSource,
  WeekIdentifier,
  type ScheduleChangedPayload,
} from "@hacado/types";
import {
  coveringExceptions,
  eachOfInterval,
  getDateFromWeekIdentifier,
  getWeekIdentifier,
  isRecurringException,
  resolveDaySchedule,
  WEEKLY_SCHEDULE_EXCEPTIONS_COLLECTION_NAME,
  weekToDateRange,
} from "@hacado/utils";
import { DateTime } from "luxon";
import { ObjectId } from "mongodb";
import { RequestAction, requestActionSchema } from "./models";
import {
  WeeklyScheduleAdminAllKeys,
  WeeklyScheduleAdminKeys,
  WeeklyScheduleAdminNamespace,
} from "./translations/types";

export const SCHEDULE_COLLECTION_NAME =
  WEEKLY_SCHEDULE_EXCEPTIONS_COLLECTION_NAME;

function scopeFromMemberId(memberId?: string): "company" | "member" {
  return memberId ? "member" : "company";
}

function daySchedulesEqual(a: DaySchedule = [], b: DaySchedule = []): boolean {
  if (a.length !== b.length) return false;
  const normalize = (shifts: DaySchedule) =>
    [...shifts]
      .map((shift) => ({ start: shift.start, end: shift.end }))
      .sort((left, right) =>
        left.start === right.start
          ? left.end.localeCompare(right.end)
          : left.start.localeCompare(right.start),
      );
  return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
}

/** Match single-week docs only - never upsert into a recurring series. */
function singleWeekExceptionFilter(args: {
  appId: string;
  scope: "company" | "member";
  startDate: string;
  endDate: string;
  memberId?: string;
}) {
  return {
    appId: args.appId,
    scope: args.scope,
    startDate: args.startDate,
    endDate: args.endDate,
    ...(args.memberId
      ? { memberId: args.memberId }
      : { memberId: { $exists: false } }),
    $or: [
      { repeatEveryWeeks: { $exists: false } },
      { repeatEveryWeeks: { $lt: 1 } },
    ],
  };
}

/** Mongo stores object keys as strings; normalize weekdays back to 1–7 numbers. */
function normalizeExceptionEntity(
  exception: ScheduleExceptionEntity,
): ScheduleExceptionEntity {
  const days: ScheduleExceptionEntity["days"] = {};
  for (const [key, shifts] of Object.entries(exception.days ?? {})) {
    const weekDay = Number(key) as ScheduleWeekDay;
    if (weekDay >= 1 && weekDay <= 7) {
      days[weekDay] = shifts;
    }
  }
  const holidays = (exception.holidays ?? [])
    .map((day) => Number(day) as ScheduleWeekDay)
    .filter((day) => day >= 1 && day <= 7);

  const excludeWeeks = (exception.excludeWeeks ?? [])
    .map((week) => Number(week))
    .filter((week) => Number.isFinite(week));

  return {
    ...exception,
    days,
    ...(exception.holidays !== undefined ? { holidays } : {}),
    ...(exception.excludeWeeks !== undefined ? { excludeWeeks } : {}),
  };
}

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

  private async emitScheduleChanged(memberId?: string): Promise<void> {
    await this.props.services.eventService.emit(
      SCHEDULE_CHANGED_EVENT_TYPE,
      {
        memberIds: memberId ? [memberId] : undefined,
      } satisfies ScheduleChangedPayload,
      systemEventSource,
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
            "Setting weekly schedule exceptions",
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
            "Removing weekly schedule exception",
          );
          return await this.removeSchedule(
            appData._id,
            data.week,
            data.memberId,
          );

        case "remove-all-schedules":
          logger.info(
            { appId: appData._id, week: data.week, memberId: data.memberId },
            "Removing all weekly schedule exceptions from week",
          );
          return await this.removeAllSchedules(
            appData._id,
            data.week,
            data.memberId,
          );

        case "set-company-holidays":
          logger.info(
            {
              appId: appData._id,
              week: data.week,
              holidayCount: data.holidays.length,
            },
            "Setting company holidays for week",
          );
          return await this.setCompanyHolidays(
            appData._id,
            data.week,
            data.holidays as ScheduleWeekDay[],
          );

        case "repeat-schedule":
          logger.info(
            {
              appId: appData._id,
              week: data.week,
              interval: data.interval,
              maxWeek: data.maxWeek,
              replaceExisting: data.replaceExisting,
              memberId: data.memberId,
            },
            "Creating recurring weekly schedule",
          );
          return await this.repeatSchedule(
            appData._id,
            data.week,
            data.interval,
            data.maxWeek,
            data.replaceExisting,
            data.memberId,
          );

        case "remove-recurring-schedule":
          logger.info(
            {
              appId: appData._id,
              exceptionId: data.exceptionId,
              memberId: data.memberId,
            },
            "Removing recurring weekly schedule",
          );
          return await this.removeRecurringSchedule(
            appData._id,
            data.exceptionId,
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
          this.props.update({ ...status });

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

    let collection;
    try {
      collection = await db.createCollection<ScheduleExceptionEntity>(
        SCHEDULE_COLLECTION_NAME,
      );
      logger.debug(
        { appId: appData._id },
        "Created weekly-schedule-exceptions collection",
      );
    } catch (error: any) {
      if (error?.codeName === "NamespaceExists" || error?.code === 48) {
        collection = db.collection<ScheduleExceptionEntity>(
          SCHEDULE_COLLECTION_NAME,
        );
        logger.debug(
          { appId: appData._id },
          "weekly-schedule-exceptions collection already exists",
        );
      } else {
        throw error;
      }
    }

    const indexes: Record<string, Record<string, 1 | -1>> = {
      appId_scope_memberId_startDate_endDate_1: {
        appId: 1,
        scope: 1,
        memberId: 1,
        startDate: 1,
        endDate: 1,
      },
      appId_startDate_endDate_1: {
        appId: 1,
        startDate: 1,
        endDate: 1,
      },
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
      const collection = db.collection<ScheduleExceptionEntity>(
        SCHEDULE_COLLECTION_NAME,
      );

      logger.debug(
        { appId: appData._id },
        "Deleting weekly schedule exceptions for app",
      );
      await collection.deleteMany({ appId: appData._id });

      const remaining = await collection.countDocuments({});
      logger.debug(
        { appId: appData._id, remainingDocuments: remaining },
        "Checked remaining documents in collection",
      );

      if (remaining === 0) {
        logger.debug(
          { appId: appData._id },
          "Collection is empty, dropping weekly-schedule-exceptions",
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

  /**
   * Returns sparse day overrides for ScheduleService.
   * Company holidays and hour exceptions are included; days with no exception
   * are omitted so the core service can fall back to the org default schedule.
   */
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
      "Getting schedule overrides for date range",
    );

    try {
      const days = eachOfInterval(start, end, "day");
      const startDate = days[0]?.toISODate()!;
      const endDate = days[days.length - 1]?.toISODate()!;

      const { companyExceptions, memberExceptions } =
        await this.loadExceptionsForRange(
          appData._id,
          startDate,
          endDate,
          memberId,
        );

      const result = days.reduce(
        (map, day) => {
          const dayStr = day.toISODate()!;
          const weekDay = day.weekday as ScheduleWeekDay;
          const resolved = resolveDaySchedule({
            date: dayStr,
            weekDay,
            defaultShifts: undefined,
            companyExceptions,
            memberExceptions,
          });

          if (
            resolved.source !== "company" &&
            resolved.source !== "member" &&
            resolved.source !== "holiday"
          ) {
            return map;
          }

          return {
            ...map,
            [dayStr]: resolved.shifts,
          };
        },
        {} as Record<string, DaySchedule>,
      );

      logger.info(
        {
          appId: appData._id,
          dayCount: days.length,
          overrideDayCount: Object.keys(result).length,
          memberId,
        },
        "Successfully generated schedule overrides for date range",
      );

      return result;
    } catch (error: any) {
      logger.error(
        {
          appId: appData._id,
          start: start.toISOString(),
          end: end.toISOString(),
          memberId,
          error,
        },
        "Error getting schedule for date range",
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
      "Setting schedule exceptions",
    );

    try {
      const db = await this.props.getDbConnection();
      const exceptions = db.collection<ScheduleExceptionEntity>(
        SCHEDULE_COLLECTION_NAME,
      );
      const scope = scopeFromMemberId(memberId);

      const defaultSchedule = (
        await this.props.services.configurationService.getConfiguration(
          "schedule",
        )
      ).schedule;
      const defaultByWeekDay = defaultSchedule.reduce(
        (map, day) => {
          map[day.weekDay as ScheduleWeekDay] = day.shifts;
          return map;
        },
        {} as Partial<Record<ScheduleWeekDay, DaySchedule>>,
      );

      for (const [weekStr, schedule] of Object.entries(schedules)) {
        const week = parseInt(weekStr, 10);
        const { startDate, endDate } = weekToDateRange(week);
        const monday = DateTime.fromJSDate(getDateFromWeekIdentifier(week), {
          zone: "utc",
        });

        const { companyExceptions } = await this.loadExceptionsForWeek(
          appId,
          week,
          memberId,
          { excludeOwnWeekScope: true },
        );

        const filter = singleWeekExceptionFilter({
          appId,
          scope,
          startDate,
          endDate,
          memberId,
        });
        const existing = await exceptions.findOne(filter as any);
        const preservedHolidays: ScheduleWeekDay[] =
          scope === "company"
            ? ([...(existing?.holidays ?? [])] as ScheduleWeekDay[])
            : [];

        // Scheduler omits empty days - treat missing weekdays as [].
        const incomingByDay: Partial<Record<ScheduleWeekDay, DaySchedule>> = {};
        for (const day of schedule) {
          incomingByDay[day.weekDay as ScheduleWeekDay] = day.shifts;
        }

        const days: ScheduleExceptionEntity["days"] = {};
        for (let offset = 0; offset < 7; offset++) {
          const weekDay = (offset + 1) as ScheduleWeekDay;
          if (preservedHolidays.includes(weekDay)) {
            continue;
          }

          const date = monday.plus({ days: offset }).toISODate()!;
          const incoming = incomingByDay[weekDay] ?? [];

          // Parent layer this scope overrides:
          // - company scope → org default
          // - member scope → default + company (not existing member; incoming already
          //   is member-or-parent from the UI, and we store only diffs vs parent)
          const parent = resolveDaySchedule({
            date,
            weekDay,
            defaultShifts: defaultByWeekDay[weekDay],
            companyExceptions: scope === "company" ? [] : companyExceptions,
            memberExceptions: [],
          });

          if (!daySchedulesEqual(parent.shifts, incoming)) {
            days[weekDay] = incoming;
          }
        }

        logger.debug(
          {
            appId,
            week,
            scope,
            memberId,
            exceptionDayCount: Object.keys(days).length,
            holidayCount: preservedHolidays.length,
          },
          "Computed exception days for week",
        );

        const hasHolidays = preservedHolidays.length > 0;
        if (Object.keys(days).length === 0 && !hasHolidays) {
          await exceptions.deleteMany(filter as any);
        } else if (replaceExisting === false) {
          if (!existing) {
            await exceptions.insertOne({
              _id: new ObjectId().toString(),
              organizationId: this.props.organizationId,
              appId,
              scope,
              startDate,
              endDate,
              days,
              ...(hasHolidays ? { holidays: preservedHolidays } : {}),
              ...(memberId ? { memberId } : {}),
            });
          }
        } else {
          const unset: Record<string, ""> = {};
          if (!memberId) unset.memberId = "";
          if (scope === "member") unset.holidays = "";

          await exceptions.updateOne(
            filter as any,
            {
              $set: {
                days,
                scope,
                startDate,
                endDate,
                appId,
                organizationId: this.props.organizationId,
                ...(memberId ? { memberId } : {}),
                ...(scope === "company" ? { holidays: preservedHolidays } : {}),
              },
              $setOnInsert: {
                _id: new ObjectId().toString(),
              },
              ...(Object.keys(unset).length ? { $unset: unset } : {}),
            },
            { upsert: true },
          );
        }
      }

      logger.info(
        { appId, weekCount: Object.keys(schedules).length, memberId, scope },
        "Successfully set schedule exceptions",
      );

      await this.emitScheduleChanged(memberId);
    } catch (error: any) {
      logger.error(
        { appId, weekCount: Object.keys(schedules).length, memberId, error },
        "Error setting schedule exceptions",
      );
      throw error;
    }
  }

  protected async setCompanyHolidays(
    appId: string,
    weekIdentifier: WeekIdentifier,
    holidays: ScheduleWeekDay[],
  ): Promise<void> {
    const logger = this.loggerFactory("setCompanyHolidays");
    const uniqueHolidays = Array.from(
      new Set(holidays.filter((day) => day >= 1 && day <= 7)),
    ).sort((a, b) => a - b) as ScheduleWeekDay[];

    logger.debug(
      { appId, week: weekIdentifier, holidays: uniqueHolidays },
      "Setting company holidays",
    );

    try {
      const db = await this.props.getDbConnection();
      const exceptions = db.collection<ScheduleExceptionEntity>(
        SCHEDULE_COLLECTION_NAME,
      );
      const { startDate, endDate } = weekToDateRange(weekIdentifier);
      const filter = singleWeekExceptionFilter({
        appId,
        scope: "company",
        startDate,
        endDate,
      });

      const existing = await exceptions.findOne(filter as any);
      const days: ScheduleExceptionEntity["days"] = {
        ...(existing?.days ?? {}),
      };

      // Drop hour overrides for holiday days - holiday is the source of truth.
      for (const weekDay of uniqueHolidays) {
        delete days[weekDay];
      }

      if (Object.keys(days).length === 0 && uniqueHolidays.length === 0) {
        await exceptions.deleteMany(filter as any);
        logger.info(
          { appId, week: weekIdentifier },
          "Removed empty company exception after clearing holidays",
        );

        await this.emitScheduleChanged();
        return;
      }

      await exceptions.updateOne(
        filter as any,
        {
          $set: {
            days,
            holidays: uniqueHolidays,
            scope: "company",
            startDate,
            endDate,
            appId,
            organizationId: this.props.organizationId,
          },
          $setOnInsert: {
            _id: new ObjectId().toString(),
          },
          $unset: { memberId: "" as const },
        },
        { upsert: true },
      );

      logger.info(
        {
          appId,
          week: weekIdentifier,
          holidayCount: uniqueHolidays.length,
        },
        "Successfully set company holidays",
      );
      await this.emitScheduleChanged();
    } catch (error: any) {
      logger.error(
        { appId, week: weekIdentifier, holidays: uniqueHolidays, error },
        "Error setting company holidays",
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
      "Removing schedule exception for week",
    );

    try {
      const { startDate, endDate } = weekToDateRange(weekIdentifier);
      const db = await this.props.getDbConnection();
      const exceptions = db.collection<ScheduleExceptionEntity>(
        SCHEDULE_COLLECTION_NAME,
      );
      const scope = scopeFromMemberId(memberId);

      const filter = singleWeekExceptionFilter({
        appId,
        scope,
        startDate,
        endDate,
        memberId,
      });

      const result = await exceptions.deleteMany(filter as any);

      // Punch this week out of any same-scope recurrence that would still apply.
      const { companyExceptions, memberExceptions } =
        await this.loadExceptionsForRange(appId, startDate, endDate, memberId);
      const ownExceptions =
        scope === "company" ? companyExceptions : memberExceptions;
      const covering = coveringExceptions(ownExceptions, startDate).filter(
        (exception): exception is ScheduleExceptionEntity =>
          isRecurringException(exception) &&
          exception.scope === scope &&
          (scope === "member"
            ? exception.memberId === memberId
            : !exception.memberId) &&
          typeof (exception as ScheduleExceptionEntity)._id === "string",
      );

      for (const exception of covering) {
        await exceptions.updateOne({ _id: exception._id, appId } as any, {
          $addToSet: { excludeWeeks: weekIdentifier },
        });
      }

      logger.info(
        {
          appId,
          week: weekIdentifier,
          memberId,
          deletedCount: result.deletedCount,
          excludedFromRecurrences: covering.length,
        },
        "Successfully removed schedule exception for week",
      );

      await this.emitScheduleChanged(memberId);
    } catch (error: any) {
      logger.error(
        { appId, week: weekIdentifier, memberId, error },
        "Error removing schedule exception for week",
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
      "Removing all schedule exceptions from week onwards",
    );

    try {
      const { startDate } = weekToDateRange(weekIdentifier);
      const clipUntil = DateTime.fromISO(startDate, { zone: "utc" })
        .minus({ days: 1 })
        .toISODate()!;
      const db = await this.props.getDbConnection();
      const exceptions = db.collection<ScheduleExceptionEntity>(
        SCHEDULE_COLLECTION_NAME,
      );
      const scope = scopeFromMemberId(memberId);
      const scopeFilter = {
        appId,
        scope,
        ...(memberId ? { memberId } : { memberId: { $exists: false } }),
      };

      const weekDocsResult = await exceptions.deleteMany({
        ...scopeFilter,
        startDate: { $gte: startDate },
        $or: [
          { repeatEveryWeeks: { $exists: false } },
          { repeatEveryWeeks: { $lt: 1 } },
        ],
      } as any);

      const recurrings = await exceptions
        .find({
          ...scopeFilter,
          repeatEveryWeeks: { $gte: 1 },
          repeatUntil: { $gte: startDate },
        } as any)
        .toArray();

      let deletedRecurring = 0;
      let clippedRecurring = 0;
      for (const exception of recurrings) {
        if (exception.startDate >= startDate) {
          await exceptions.deleteOne({ _id: exception._id, appId } as any);
          deletedRecurring += 1;
        } else if (clipUntil >= exception.startDate) {
          await exceptions.updateOne({ _id: exception._id, appId } as any, {
            $set: { repeatUntil: clipUntil },
          });
          clippedRecurring += 1;
        } else {
          await exceptions.deleteOne({ _id: exception._id, appId } as any);
          deletedRecurring += 1;
        }
      }

      logger.info(
        {
          appId,
          week: weekIdentifier,
          memberId,
          deletedWeekDocs: weekDocsResult.deletedCount,
          deletedRecurring,
          clippedRecurring,
        },
        "Successfully removed schedule exceptions from week onwards",
      );

      await this.emitScheduleChanged(memberId);
    } catch (error: any) {
      logger.error(
        { appId, week: weekIdentifier, memberId, error },
        "Error removing schedule exceptions from week onwards",
      );
      throw error;
    }
  }

  protected async repeatSchedule(
    appId: string,
    weekIdentifier: WeekIdentifier,
    interval: number,
    maxWeek: WeekIdentifier,
    replaceExisting?: boolean,
    memberId?: string,
  ): Promise<void> {
    const logger = this.loggerFactory("repeatSchedule");
    logger.debug(
      {
        appId,
        week: weekIdentifier,
        interval,
        maxWeek,
        replaceExisting,
        memberId,
      },
      "Creating recurring schedule",
    );

    try {
      const scope = scopeFromMemberId(memberId);
      const { startDate, endDate } = weekToDateRange(weekIdentifier);
      const { hasOwnException, ownWeekException, winningRecurrence } =
        await this.loadExceptionsForWeek(appId, weekIdentifier, memberId);

      if (!hasOwnException) {
        throw new ConnectedAppRequestError(
          "week_has_no_custom_schedule",
          { week: weekIdentifier },
          400,
          `Week ${weekIdentifier} does not have custom schedule`,
        );
      }

      const patternSource = ownWeekException ?? winningRecurrence;
      if (!patternSource) {
        throw new ConnectedAppRequestError(
          "week_has_no_custom_schedule",
          { week: weekIdentifier },
          400,
          `Week ${weekIdentifier} does not have custom schedule`,
        );
      }

      const todayWeek = getWeekIdentifier(new Date());
      const occurrenceWeeks: WeekIdentifier[] = [];
      for (let w = weekIdentifier; w <= maxWeek; w += interval) {
        if (w < todayWeek) continue;
        occurrenceWeeks.push(w);
      }

      if (occurrenceWeeks.length === 0) {
        throw new ConnectedAppRequestError(
          "no_future_occurrence_weeks",
          { week: weekIdentifier, maxWeek, interval },
          400,
          "No future weeks to repeat into",
        );
      }

      const lastWeek = occurrenceWeeks[occurrenceWeeks.length - 1]!;
      const { endDate: repeatUntil } = weekToDateRange(lastWeek);

      const db = await this.props.getDbConnection();
      const exceptions = db.collection<ScheduleExceptionEntity>(
        SCHEDULE_COLLECTION_NAME,
      );

      if (replaceExisting) {
        for (const occurrenceWeek of occurrenceWeeks) {
          const range = weekToDateRange(occurrenceWeek);
          await exceptions.deleteMany(
            singleWeekExceptionFilter({
              appId,
              scope,
              startDate: range.startDate,
              endDate: range.endDate,
              memberId,
            }) as any,
          );
        }
      }

      const holidays =
        scope === "company"
          ? ([...(patternSource.holidays ?? [])] as ScheduleWeekDay[])
          : undefined;

      await exceptions.insertOne({
        _id: new ObjectId().toString(),
        organizationId: this.props.organizationId,
        appId,
        scope,
        startDate,
        endDate,
        days: { ...patternSource.days },
        ...(holidays && holidays.length ? { holidays } : {}),
        ...(memberId ? { memberId } : {}),
        repeatEveryWeeks: interval,
        repeatUntil,
        createdAt: new Date().toISOString(),
      });

      logger.info(
        {
          appId,
          week: weekIdentifier,
          interval,
          maxWeek,
          occurrenceCount: occurrenceWeeks.length,
          memberId,
          scope,
        },
        "Successfully created recurring schedule",
      );

      await this.emitScheduleChanged(memberId);
    } catch (error: any) {
      logger.error(
        {
          appId,
          week: weekIdentifier,
          interval,
          maxWeek,
          memberId,
          error,
        },
        "Error creating recurring schedule",
      );
      throw error;
    }
  }

  protected async removeRecurringSchedule(
    appId: string,
    exceptionId: string,
    memberId?: string,
  ): Promise<void> {
    const logger = this.loggerFactory("removeRecurringSchedule");
    logger.debug(
      { appId, exceptionId, memberId },
      "Removing recurring schedule",
    );

    try {
      const db = await this.props.getDbConnection();
      const scope = scopeFromMemberId(memberId);
      const result = await db
        .collection<ScheduleExceptionEntity>(SCHEDULE_COLLECTION_NAME)
        .deleteOne({
          _id: exceptionId,
          appId,
          scope,
          repeatEveryWeeks: { $gte: 1 },
          ...(memberId ? { memberId } : { memberId: { $exists: false } }),
        } as any);

      if (result.deletedCount === 0) {
        throw new ConnectedAppRequestError(
          "recurring_schedule_not_found",
          { exceptionId },
          404,
          "Recurring schedule not found",
        );
      }

      logger.info(
        { appId, exceptionId, memberId },
        "Successfully removed recurring schedule",
      );

      await this.emitScheduleChanged(memberId);
    } catch (error: any) {
      logger.error(
        { appId, exceptionId, memberId, error },
        "Error removing recurring schedule",
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
    daySources: Record<number, ScheduleDaySource>;
    holidays: ScheduleWeekDay[];
    recurrence: ScheduleRecurrenceInfo | null;
  }> {
    const logger = this.loggerFactory("getWeekSchedule");
    logger.debug(
      { appId, week: weekIdentifier, memberId },
      "Getting week schedule",
    );

    try {
      const defaultSchedule = (
        await this.props.services.configurationService.getConfiguration(
          "schedule",
        )
      ).schedule;

      const defaultByWeekDay = defaultSchedule.reduce(
        (map, day) => {
          map[day.weekDay as ScheduleWeekDay] = day.shifts;
          return map;
        },
        {} as Partial<Record<ScheduleWeekDay, DaySchedule>>,
      );

      const {
        companyExceptions,
        memberExceptions,
        hasOwnException,
        ownWeekException,
        winningRecurrence,
      } = await this.loadExceptionsForWeek(appId, weekIdentifier, memberId);

      const { startDate } = weekToDateRange(weekIdentifier);
      const companyCovering = coveringExceptions(companyExceptions, startDate);
      const holidaysSource = companyCovering.find(
        (exception) => (exception.holidays?.length ?? 0) > 0,
      );
      const holidays = (holidaysSource?.holidays ?? []) as ScheduleWeekDay[];

      const monday = DateTime.fromJSDate(
        getDateFromWeekIdentifier(weekIdentifier),
        { zone: "utc" },
      );
      const schedule: Schedule = [];
      const daySources: Record<number, ScheduleDaySource> = {};

      for (let offset = 0; offset < 7; offset++) {
        const day = monday.plus({ days: offset });
        const date = day.toISODate()!;
        const weekDay = day.weekday as ScheduleWeekDay;
        const resolved = resolveDaySchedule({
          date,
          weekDay,
          defaultShifts: defaultByWeekDay[weekDay],
          companyExceptions,
          memberExceptions,
        });
        schedule.push({ weekDay, shifts: resolved.shifts });
        daySources[weekDay] = resolved.source;
      }

      const recurrence: ScheduleRecurrenceInfo | null = winningRecurrence
        ? {
            id: winningRecurrence._id,
            everyWeeks: winningRecurrence.repeatEveryWeeks!,
            until: winningRecurrence.repeatUntil!,
            isWeekOverride: !!ownWeekException,
          }
        : null;

      logger.debug(
        {
          appId,
          week: weekIdentifier,
          memberId,
          isDefault: !hasOwnException,
          scheduleDayCount: schedule.length,
          companyExceptionCount: companyExceptions.length,
          memberExceptionCount: memberExceptions.length,
          holidayCount: holidays.length,
          hasRecurrence: !!recurrence,
        },
        "Retrieved week schedule",
      );

      return {
        schedule,
        isDefault: !hasOwnException,
        daySources,
        holidays,
        recurrence,
      };
    } catch (error: any) {
      logger.error(
        { appId, week: weekIdentifier, memberId, error },
        "Error getting week schedule",
      );
      throw error;
    }
  }

  protected async loadExceptionsForRange(
    appId: string,
    startDate: string,
    endDate: string,
    memberId?: string,
  ): Promise<{
    companyExceptions: ScheduleExceptionEntity[];
    memberExceptions: ScheduleExceptionEntity[];
  }> {
    const db = await this.props.getDbConnection();
    const stored = await db
      .collection<ScheduleExceptionEntity>(SCHEDULE_COLLECTION_NAME)
      .find({
        appId,
        $and: [
          {
            $or: [
              {
                $and: [
                  {
                    $or: [
                      { repeatEveryWeeks: { $exists: false } },
                      { repeatEveryWeeks: { $lt: 1 } },
                    ],
                  },
                  { startDate: { $lte: endDate } },
                  { endDate: { $gte: startDate } },
                ],
              },
              {
                repeatEveryWeeks: { $gte: 1 },
                startDate: { $lte: endDate },
                repeatUntil: { $gte: startDate },
              },
            ],
          },
          {
            $or: [
              { scope: "company" },
              ...(memberId ? [{ scope: "member" as const, memberId }] : []),
            ],
          },
        ],
      } as any)
      .toArray();

    const normalized = stored.map(normalizeExceptionEntity);

    return {
      companyExceptions: normalized.filter((e) => e.scope === "company"),
      memberExceptions: normalized.filter((e) => e.scope === "member"),
    };
  }

  protected async loadExceptionsForWeek(
    appId: string,
    week: WeekIdentifier,
    memberId?: string,
    options?: { excludeOwnWeekScope?: boolean },
  ): Promise<{
    companyExceptions: ScheduleExceptionEntity[];
    memberExceptions: ScheduleExceptionEntity[];
    hasOwnException: boolean;
    ownWeekException: ScheduleExceptionEntity | null;
    winningRecurrence: ScheduleExceptionEntity | null;
  }> {
    const logger = this.loggerFactory("loadExceptionsForWeek");
    const { startDate, endDate } = weekToDateRange(week);
    const scope = scopeFromMemberId(memberId);

    logger.debug(
      {
        appId,
        week,
        memberId,
        startDate,
        endDate,
        excludeOwnWeekScope: options?.excludeOwnWeekScope,
      },
      "Loading schedule exceptions for week",
    );

    let { companyExceptions, memberExceptions } =
      await this.loadExceptionsForRange(appId, startDate, endDate, memberId);

    const isOwnWeekException = (e: ScheduleExceptionEntity) =>
      e.scope === scope &&
      e.startDate === startDate &&
      e.endDate === endDate &&
      !isRecurringException(e) &&
      (scope === "member" ? e.memberId === memberId : !e.memberId);

    const ownPool = scope === "company" ? companyExceptions : memberExceptions;
    const ownWeekException = ownPool.find((e) => isOwnWeekException(e)) ?? null;

    const coveringOwn = coveringExceptions(ownPool, startDate).filter(
      (e) =>
        e.scope === scope &&
        (scope === "member" ? e.memberId === memberId : !e.memberId),
    );
    const winningRecurrence =
      (coveringOwn.find((e) => isRecurringException(e)) as
        | ScheduleExceptionEntity
        | undefined) ?? null;

    const hasOwnException = !!ownWeekException || !!winningRecurrence;

    if (options?.excludeOwnWeekScope) {
      if (scope === "company") {
        companyExceptions = companyExceptions.filter(
          (e) => !isOwnWeekException(e),
        );
      } else {
        memberExceptions = memberExceptions.filter(
          (e) => !isOwnWeekException(e),
        );
      }
    }

    logger.debug(
      {
        appId,
        week,
        memberId,
        companyExceptionCount: companyExceptions.length,
        memberExceptionCount: memberExceptions.length,
        hasOwnException,
        hasWeekOverride: !!ownWeekException,
        hasRecurrence: !!winningRecurrence,
      },
      "Loaded schedule exceptions for week",
    );

    return {
      companyExceptions,
      memberExceptions,
      hasOwnException,
      ownWeekException,
      winningRecurrence,
    };
  }
}
