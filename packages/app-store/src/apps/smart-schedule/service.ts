import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import {
  ConnectedAppData,
  ConnectedAppError,
  ConnectedAppStatusWithText,
  DaySchedule,
  IAvailabilityProvider,
  IConnectedApp,
  IConnectedAppProps,
  parseTime,
  Period,
  TimeSlot,
} from "@hacado/types";
import { DateTime } from "luxon";
import { SmartScheduleConfiguration } from "./models";
import { SmartScheduleAdminAllKeys } from "./translations/types";
import { getAvailableTimeSlotsWithPriority } from "./utils";

export default class SmartScheduleConnectedApp
  implements IConnectedApp<SmartScheduleConfiguration>, IAvailabilityProvider
{
  protected readonly loggerFactory: LoggerFactory;

  public constructor(protected readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "SmartScheduleConnectedApp",
      props.organizationId,
    );
  }

  public async processRequest(
    appData: ConnectedAppData,
    data: SmartScheduleConfiguration,
  ): Promise<ConnectedAppStatusWithText> {
    const logger = this.loggerFactory("processRequest");

    logger.debug(
      {
        appId: appData._id,
        data,
      },
      "Processing Smart Schedule configuration request",
    );

    try {
      const status: ConnectedAppStatusWithText = {
        status: "connected",
        statusText:
          "app_smart-schedule_admin.statusText.successfully_connected" satisfies SmartScheduleAdminAllKeys,
      };

      this.props.update({
        data,
        ...status,
      });

      logger.info(
        { appId: appData._id, data },
        "Successfully configured Smart Schedule",
      );

      return status;
    } catch (e: any) {
      logger.error(
        { appId: appData._id, error: e?.message || e?.toString() },
        "Error processing Smart Schedule configuration request",
      );

      const status: ConnectedAppStatusWithText = {
        status: "failed",
        statusText:
          e instanceof ConnectedAppError
            ? {
                key: e.key,
                args: e.args,
              }
            : ("app_smart-schedule_admin.statusText.error_processing_configuration" satisfies SmartScheduleAdminAllKeys),
      };

      this.props.update({
        ...status,
      });

      return status;
    }
  }

  public async getAvailability(
    appData: ConnectedAppData<SmartScheduleConfiguration>,
    start: Date,
    end: Date,
    duration: number,
    events: Period[],
    schedule: Record<string, DaySchedule>,
  ): Promise<TimeSlot[]> {
    const logger = this.loggerFactory("getAvailability");

    logger.debug(
      { appId: appData._id, start, end, duration },
      "Getting availability with Smart Schedule",
    );

    const { general: generalConfig, booking: bookingConfig } =
      await this.props.services.configurationService.getConfigurations(
        "general",
        "booking",
      );

    const config = appData.data;
    const customSlots = bookingConfig?.customSlotTimes?.map((x) =>
      parseTime(x),
    );

    let servicesDurations: number[] | undefined = undefined;
    if (config?.maximizeForOption) {
      const service = await this.props.services.servicesService.getOption(
        config.maximizeForOption,
      );

      if (service?.durationType === "fixed") {
        servicesDurations = [service.duration];
      }
    }

    const availability = getAvailableTimeSlotsWithPriority({
      events: events.map((event) => ({
        ...event,
        startAt: DateTime.fromJSDate(event.startAt),
        endAt: DateTime.fromJSDate(event.endAt),
      })),
      duration,
      schedule,
      configuration: {
        timeZone: generalConfig.timeZone || DateTime.now().zoneName!,
        breakDuration: bookingConfig?.breakDuration ?? 0,
        slotStart: bookingConfig?.slotStart ?? 15,
        allowSkipBreak: config?.allowSkipBreak,
        filterLowPrioritySlots: true,
        lowerPriorityIfNoFollowingBooking: true,
        discourageLargeGaps: true,
        allowSmartSlotStarts: config?.allowSmartSlotStarts,
        preferBackToBack: config?.preferBackToBack,
        preferLaterStarts: config?.preferLaterStartsEarlierEnds,
        preferEarlierEnds: config?.preferLaterStartsEarlierEnds,
        customSlots,
      },
      start: DateTime.fromJSDate(start),
      end: DateTime.fromJSDate(end),
      allServiceDurations: servicesDurations, //  servicesDurations
    });

    return availability;
  }
}
