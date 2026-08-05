import { getLoggerFactory } from "@hacado/logger";
import {
  DaySchedule,
  IConfigurationService,
  IConnectedAppsService,
  IScheduleProvider,
  IScheduleService,
} from "@hacado/types";
import { eachOfInterval } from "@hacado/utils";

export class ScheduleService implements IScheduleService {
  protected readonly loggerFactory = getLoggerFactory("ScheduleService");

  constructor(
    protected readonly connectedAppsService: IConnectedAppsService,
    protected readonly configurationService: IConfigurationService,
  ) {}

  public async getSchedule(
    start: Date,
    end: Date,
    memberId: string,
  ): Promise<Record<string, DaySchedule>> {
    const logger = this.loggerFactory("getSchedule");
    logger.debug({ start, end, memberId }, "Getting schedule");

    const days = eachOfInterval(start, end, "day");

    const {
      booking: { scheduleAppId },
      schedule: defaultSchedule,
    } = await this.configurationService.getConfigurations(
      "booking",
      "schedule",
    );

    let scheduleFromApp: Record<string, DaySchedule> = {};
    if (scheduleAppId) {
      logger.debug({ scheduleAppId }, "Using schedule from app");
      const { app: scheduleApp, service: scheduleAppService } =
        await this.connectedAppsService.getAppService<IScheduleProvider>(
          scheduleAppId,
        );

      scheduleFromApp = await scheduleAppService.getSchedule(
        scheduleApp,
        start,
        end,
        memberId,
      );
    } else {
      logger.debug("Using default schedule");
    }

    const result = days.reduce(
      (map, day) => {
        const dayStr = day.toISODate()!;
        const weekDay = day.weekday;

        const daySchedule =
          scheduleFromApp?.[dayStr] ??
          defaultSchedule.schedule.find((s) => s.weekDay === weekDay)?.shifts;

        return {
          ...map,
          [dayStr]: daySchedule || [],
        };
      },
      {} as Record<string, DaySchedule>,
    );

    logger.debug(
      { start, end, dayCount: Object.keys(result).length },
      "Successfully retrieved schedule",
    );

    return result;
  }
}
