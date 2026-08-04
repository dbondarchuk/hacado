import { getLoggerFactory, LoggerFactory } from "@timelish/logger";
import {
  ConnectedAppData,
  ConnectedAppError,
  ConnectedAppRequestError,
  ConnectedAppStatusWithText,
  DaySchedule,
  IConnectedApp,
  IConnectedAppProps,
  IScheduleProvider,
} from "@timelish/types";
import { DateTime } from "luxon";
import {
  UrlScheduleProviderConfiguration,
  urlScheduleProviderConfigurationSchema,
} from "./models";
import {
  UrlScheduleProviderAdminAllKeys,
  UrlScheduleProviderAdminKeys,
  UrlScheduleProviderAdminNamespace,
} from "./translations/types";

export default class UrlScheduleProviderConnectedApp
  implements IConnectedApp<UrlScheduleProviderConfiguration>, IScheduleProvider
{
  protected readonly loggerFactory: LoggerFactory;
  public constructor(protected readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "UrlScheduleProviderConnectedApp",
      props.organizationId,
    );
  }

  public async processRequest(
    appData: ConnectedAppData,
    request: UrlScheduleProviderConfiguration,
  ): Promise<
    ConnectedAppStatusWithText<
      UrlScheduleProviderAdminNamespace,
      UrlScheduleProviderAdminKeys
    >
  > {
    const logger = this.loggerFactory("processRequest");
    logger.debug(
      {
        appId: appData._id,
        url: request.url,
        headerCount: request.headers?.length || 0,
      },
      "Processing URL schedule provider configuration request",
    );

    const { data, success, error } =
      urlScheduleProviderConfigurationSchema.safeParse(request);
    if (!success) {
      logger.error(
        { error },
        "Invalid URL schedule provider configuration request",
      );
      throw new ConnectedAppRequestError(
        "invalid_url-schedule-provider_configuration_request",
        { request, error },
        400,
        error.message,
      );
    }

    try {
      // Test the URL by making a simple request
      await this.testUrl(data, appData.memberId);

      const status: ConnectedAppStatusWithText<
        UrlScheduleProviderAdminNamespace,
        UrlScheduleProviderAdminKeys
      > = {
        status: "connected",
        statusText:
          "app_url-schedule-provider_admin.statusText.successfully_connected" satisfies UrlScheduleProviderAdminAllKeys,
      };

      this.props.update({
        account: {
          username: "URL Schedule Provider",
          serverUrl: data.url,
        },
        data,
        ...status,
      });

      logger.info(
        { appId: appData._id, url: data.url },
        "Successfully connected to URL schedule provider",
      );

      return status;
    } catch (e: any) {
      logger.error(
        { appId: appData._id, error: e?.message || e?.toString() },
        "Error processing URL schedule provider configuration request",
      );

      const status: ConnectedAppStatusWithText<
        UrlScheduleProviderAdminNamespace,
        UrlScheduleProviderAdminKeys
      > = {
        status: "failed",
        statusText:
          e instanceof ConnectedAppError
            ? {
                key: e.key as UrlScheduleProviderAdminAllKeys,
                args: e.args,
              }
            : ("app_url-schedule-provider_admin.statusText.error_processing_configuration" satisfies UrlScheduleProviderAdminAllKeys),
      };

      this.props.update({
        ...status,
      });

      return status;
    }
  }

  public async getSchedule(
    app: ConnectedAppData,
    start: Date,
    end: Date,
    memberId: string,
  ): Promise<Record<string, DaySchedule>> {
    const logger = this.loggerFactory("getSchedule");
    logger.debug(
      {
        appId: app._id,
        start: start.toISOString(),
        end: end.toISOString(),
        url: app.data.url,
        headerCount: app.data.headers?.length || 0,
      },
      "Getting schedule from URL",
    );

    try {
      const member =
        await this.props.services.teamService.getMemberById(memberId);
      if (!member) {
        logger.error(
          {
            appId: app._id,
            memberId,
          },
          "Member not found",
        );

        throw new ConnectedAppError<
          UrlScheduleProviderAdminNamespace,
          UrlScheduleProviderAdminKeys
        >(
          "app_url-schedule-provider_admin.statusText.error_fetching_schedule" satisfies UrlScheduleProviderAdminAllKeys,
          {
            message: "Member not found",
          },
        );
      }

      const url = new URL(app.data.url);
      url.searchParams.set("start", start.toISOString());
      url.searchParams.set("end", end.toISOString());
      url.searchParams.set("memberId", memberId);
      url.searchParams.set("email", member.email);

      // Convert headers array to object
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (app.data.headers) {
        app.data.headers.forEach((header: { key: string; value: string }) => {
          if (header.key && header.value) {
            headers[header.key] = header.value;
          }
        });
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        logger.error(
          {
            appId: app._id,
            status: response.status,
            statusText: response.statusText,
          },
          "HTTP error when fetching schedule",
        );
        throw new ConnectedAppError<
          UrlScheduleProviderAdminNamespace,
          UrlScheduleProviderAdminKeys
        >(
          "app_url-schedule-provider_admin.statusText.error_fetching_schedule" satisfies UrlScheduleProviderAdminAllKeys,
        );
      }

      const data = await response.json();
      logger.debug(
        {
          appId: app._id,
          dataType: typeof data,
          dayCount:
            typeof data === "object" ? Object.keys(data).length : "not object",
        },
        "Received response from URL",
      );

      // Validate and transform the response data
      const schedule = this.validateAndTransformResponse(data, app._id);

      logger.info(
        { appId: app._id, dayCount: Object.keys(schedule).length },
        "Successfully retrieved schedule from URL",
      );

      return schedule;
    } catch (e: any) {
      logger.error(
        {
          appId: app._id,
          error: e?.message || e?.toString(),
        },
        "Error getting schedule from URL",
      );

      if (e instanceof ConnectedAppError) {
        throw e;
      }

      throw new ConnectedAppError<
        UrlScheduleProviderAdminNamespace,
        UrlScheduleProviderAdminKeys
      >(
        "app_url-schedule-provider_admin.statusText.error_fetching_schedule" satisfies UrlScheduleProviderAdminAllKeys,
      );
    }
  }

  private async testUrl(
    data: UrlScheduleProviderConfiguration,
    memberId: string,
  ): Promise<void> {
    const logger = this.loggerFactory("testUrl");

    try {
      const member =
        await this.props.services.teamService.getMemberById(memberId);

      if (!member) {
        logger.error(
          {
            memberId,
          },
          "Member not found",
        );

        throw new ConnectedAppError<
          UrlScheduleProviderAdminNamespace,
          UrlScheduleProviderAdminKeys
        >(
          "app_url-schedule-provider_admin.statusText.error_fetching_schedule" satisfies UrlScheduleProviderAdminAllKeys,
          {
            message: "Member not found",
          },
        );
      }

      // Convert headers array to object
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (data.headers) {
        data.headers.forEach((header: { key: string; value: string }) => {
          if (header.key && header.value) {
            headers[header.key] = header.value;
          }
        });
      }

      const url = new URL(data.url);
      url.searchParams.set("start", DateTime.now().toISO());
      url.searchParams.set("end", DateTime.now().plus({ days: 7 }).toISO());
      url.searchParams.set("memberId", memberId);
      url.searchParams.set("email", member.email);

      const response = await fetch(url.toString(), {
        method: "HEAD",
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      logger.debug({ url: url.toString() }, "URL test successful");
    } catch (error: any) {
      logger.error(
        { url: data.url, error: error?.message || error?.toString() },
        "URL test failed",
      );
      throw error;
    }
  }

  private validateAndTransformResponse(
    data: any,
    appId: string,
  ): Record<string, DaySchedule> {
    const logger = this.loggerFactory("validateAndTransformResponse");

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      logger.error(
        { appId, dataType: typeof data },
        "Response is not an object",
      );
      throw new ConnectedAppError<
        UrlScheduleProviderAdminNamespace,
        UrlScheduleProviderAdminKeys
      >(
        "app_url-schedule-provider_admin.statusText.invalid_response_format" satisfies UrlScheduleProviderAdminAllKeys,
      );
    }

    const result: Record<string, DaySchedule> = {};

    for (const [dateStr, daySchedule] of Object.entries(data)) {
      try {
        // Validate date format (should be YYYY-MM-DD)
        const date = new Date(dateStr);
        if (
          isNaN(date.getTime()) ||
          dateStr !== date.toISOString().split("T")[0]
        ) {
          throw new Error(`Invalid date format: ${dateStr}`);
        }

        // Validate day schedule structure
        if (!Array.isArray(daySchedule)) {
          throw new Error(`Day schedule must be an array for date: ${dateStr}`);
        }

        const validatedShifts = daySchedule.map((shift: any, index: number) => {
          if (!shift || typeof shift !== "object") {
            throw new Error(
              `Shift ${index} must be an object for date: ${dateStr}`,
            );
          }

          if (!shift.start || typeof shift.start !== "string") {
            throw new Error(
              `Shift ${index} must have a start time for date: ${dateStr}`,
            );
          }

          if (!shift.end || typeof shift.end !== "string") {
            throw new Error(
              `Shift ${index} must have an end time for date: ${dateStr}`,
            );
          }

          // Validate time format (HH:mm)
          const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
          if (!timeRegex.test(shift.start)) {
            throw new Error(
              `Invalid start time format: ${shift.start} for date: ${dateStr}`,
            );
          }
          if (!timeRegex.test(shift.end)) {
            throw new Error(
              `Invalid end time format: ${shift.end} for date: ${dateStr}`,
            );
          }

          return {
            start: shift.start,
            end: shift.end,
          };
        });

        result[dateStr] = validatedShifts;
      } catch (error: any) {
        logger.error(
          {
            appId,
            dateStr,
            error: error?.message || error?.toString(),
          },
          "Error validating schedule for date",
        );
        throw new ConnectedAppError<
          UrlScheduleProviderAdminNamespace,
          UrlScheduleProviderAdminKeys
        >(
          "app_url-schedule-provider_admin.statusText.invalid_response_format" satisfies UrlScheduleProviderAdminAllKeys,
        );
      }
    }

    return result;
  }
}
