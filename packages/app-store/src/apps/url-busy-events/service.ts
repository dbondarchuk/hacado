import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import {
  CalendarBusyTime,
  ConnectedAppData,
  ConnectedAppError,
  ConnectedAppRequestError,
  ConnectedAppStatusWithText,
  ICalendarBusyTimeProvider,
  IConnectedApp,
  IConnectedAppProps,
} from "@hacado/types";
import { DateTime } from "luxon";
import {
  UrlBusyEventsConfiguration,
  urlBusyEventsConfigurationSchema,
} from "./models";
import {
  UrlBusyEventsAdminAllKeys,
  UrlBusyEventsAdminKeys,
  UrlBusyEventsAdminNamespace,
} from "./translations/types";

export default class UrlBusyEventsConnectedApp
  implements
    IConnectedApp<UrlBusyEventsConfiguration>,
    ICalendarBusyTimeProvider
{
  protected readonly loggerFactory: LoggerFactory;

  public constructor(protected readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "UrlBusyEventsConnectedApp",
      props.organizationId,
    );
  }

  public async processRequest(
    appData: ConnectedAppData,
    request: UrlBusyEventsConfiguration,
  ): Promise<
    ConnectedAppStatusWithText<
      UrlBusyEventsAdminNamespace,
      UrlBusyEventsAdminKeys
    >
  > {
    const logger = this.loggerFactory("processRequest");
    logger.debug(
      {
        appId: appData._id,
        url: request.url,
        headerCount: request.headers?.length || 0,
      },
      "Processing URL busy events configuration request",
    );

    const { data, success, error } =
      urlBusyEventsConfigurationSchema.safeParse(request);
    if (!success) {
      logger.error({ error }, "Invalid URL busy events configuration request");
      throw new ConnectedAppRequestError(
        "invalid_url-busy-events_configuration_request",
        { request, error },
        400,
        error.message,
      );
    }

    try {
      // Test the URL by making a simple request
      await this.testUrl(data);

      const status: ConnectedAppStatusWithText<
        UrlBusyEventsAdminNamespace,
        UrlBusyEventsAdminKeys
      > = {
        status: "connected",
        statusText:
          "app_url-busy-events_admin.statusText.successfully_connected" satisfies UrlBusyEventsAdminAllKeys,
      };

      this.props.update({
        account: {
          username: "URL Busy Events Provider",
          serverUrl: data.url,
        },
        data,
        ...status,
      });

      logger.info(
        { appId: appData._id, url: data.url },
        "Successfully connected to URL busy events provider",
      );

      return status;
    } catch (e: any) {
      logger.error(
        { appId: appData._id, error: e?.message || e?.toString() },
        "Error processing URL busy events configuration request",
      );

      const status: ConnectedAppStatusWithText<
        UrlBusyEventsAdminNamespace,
        UrlBusyEventsAdminKeys
      > = {
        status: "failed",
        statusText:
          e instanceof ConnectedAppError
            ? {
                key: e.key as UrlBusyEventsAdminAllKeys,
                args: e.args,
              }
            : ("app_url-busy-events_admin.statusText.error_processing_configuration" satisfies UrlBusyEventsAdminAllKeys),
      };

      this.props.update({
        ...status,
      });

      return status;
    }
  }

  public async getBusyTimes(
    app: ConnectedAppData,
    start: Date,
    end: Date,
  ): Promise<CalendarBusyTime[]> {
    const logger = this.loggerFactory("getBusyTimes");
    logger.debug(
      {
        appId: app._id,
        start: start.toISOString(),
        end: end.toISOString(),
        url: app.data.url,
        headerCount: app.data.headers?.length || 0,
      },
      "Getting busy times from URL",
    );

    try {
      const url = new URL(app.data.url);
      url.searchParams.set("start", start.toISOString());
      url.searchParams.set("end", end.toISOString());

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
          "HTTP error when fetching busy times",
        );
        throw new ConnectedAppError<
          UrlBusyEventsAdminNamespace,
          UrlBusyEventsAdminKeys
        >(
          "app_url-busy-events_admin.statusText.error_fetching_busy_times" satisfies UrlBusyEventsAdminAllKeys,
        );
      }

      const data = await response.json();
      logger.debug(
        {
          appId: app._id,
          dataLength: Array.isArray(data) ? data.length : "not array",
        },
        "Received response from URL",
      );

      // Validate and transform the response data
      const busyTimes = this.validateAndTransformResponse(data, app._id);

      logger.info(
        { appId: app._id, busyTimeCount: busyTimes.length },
        "Successfully retrieved busy times from URL",
      );

      return busyTimes;
    } catch (e: any) {
      logger.error(
        {
          appId: app._id,
          error: e?.message || e?.toString(),
        },
        "Error getting busy times from URL",
      );

      if (e instanceof ConnectedAppError) {
        throw e;
      }

      throw new ConnectedAppError<
        UrlBusyEventsAdminNamespace,
        UrlBusyEventsAdminKeys
      >(
        "app_url-busy-events_admin.statusText.error_fetching_busy_times" satisfies UrlBusyEventsAdminAllKeys,
      );
    }
  }

  private async testUrl(data: UrlBusyEventsConfiguration): Promise<void> {
    const logger = this.loggerFactory("testUrl");

    try {
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
      url.searchParams.set("end", DateTime.now().plus({ days: 1 }).toISO());

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
  ): CalendarBusyTime[] {
    const logger = this.loggerFactory("validateAndTransformResponse");

    if (!Array.isArray(data)) {
      logger.error(
        { appId, dataType: typeof data },
        "Response is not an array",
      );
      throw new ConnectedAppError<
        UrlBusyEventsAdminNamespace,
        UrlBusyEventsAdminKeys
      >(
        "app_url-busy-events_admin.statusText.invalid_response_format" satisfies UrlBusyEventsAdminAllKeys,
      );
    }

    return data.map((item, index) => {
      try {
        // Validate required fields
        if (!item.startAt || !item.endAt) {
          throw new Error(`Missing required fields: startAt or endAt`);
        }

        // Convert to Date objects
        const startAt = new Date(item.startAt);
        const endAt = new Date(item.endAt);

        // Validate dates
        if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) {
          throw new Error(`Invalid date format`);
        }

        // Validate date order
        if (startAt >= endAt) {
          throw new Error(`startAt must be before endAt`);
        }

        return {
          startAt,
          endAt,
          title: item.title || "Busy",
          uid: item.uid || `url-busy-event-${appId}-${index}-${Date.now()}`,
        };
      } catch (error: any) {
        logger.error(
          {
            appId,
            itemIndex: index,
            item,
            error: error?.message || error?.toString(),
          },
          "Error validating busy time item",
        );
        throw new ConnectedAppError<
          UrlBusyEventsAdminNamespace,
          UrlBusyEventsAdminKeys
        >(
          "app_url-busy-events_admin.statusText.invalid_response_format" satisfies UrlBusyEventsAdminAllKeys,
        );
      }
    });
  }
}
