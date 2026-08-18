import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import {
  ApiRequest,
  Appointment,
  AppointmentEvent,
  AppointmentOnlineMeetingInformation,
  AppointmentStatus,
  CalendarBusyTime,
  ConnectedAppData,
  ConnectedAppError,
  ConnectedAppResponse,
  ConnectedOauthAppTokens,
  EventEnvelope,
  EventSource,
  ICalendarBusyTimeProvider,
  IConnectedApp,
  IConnectedAppProps,
  IEventSubscriber,
  IMeetingUrlProvider,
  IOAuthConnectedApp,
  isClosedAppointmentStatus,
  WithDatabaseId,
} from "@hacado/types";
import {
  dispatchAppointmentEventPayload,
  encrypt,
  getAdminUrl,
  stripMarkdown,
} from "@hacado/utils";
import { DateTime } from "luxon";
import {
  ZOOM_API_BASE_URL,
  ZOOM_OAUTH_AUTHORIZATION_URL,
  ZOOM_OAUTH_TOKEN_URL,
  ZoomApiClient,
} from "./client";
import { ZoomAdminAllKeys } from "./translations/types";
import {
  ZoomCreateMeetingResponse,
  ZoomMeeting,
  ZoomMeetingsResponse,
} from "./types";

const settingsApiFilterResp =
  "default_password_for_scheduled_meetings,auto_recording,waiting_room";

export class ZoomConnectedApp
  implements
    IOAuthConnectedApp,
    IMeetingUrlProvider,
    ICalendarBusyTimeProvider,
    IEventSubscriber
{
  protected readonly loggerFactory: LoggerFactory;

  /** OAuth-only; admin does not call processRequest for Zoom. */
  processRequest?: IConnectedApp["processRequest"];

  public constructor(protected readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "ZoomConnectedApp",
      props.organizationId,
    );
  }

  public async onEvent(
    appData: ConnectedAppData,
    envelope: EventEnvelope,
  ): Promise<void> {
    await dispatchAppointmentEventPayload(envelope, {
      onAppointmentFullRescheduled: (
        appointment,
        newTime,
        newDuration,
        oldTime,
        oldDuration,
        doNotNotifyCustomer,
        _source,
      ) =>
        this.onAppointmentRescheduled(
          appData,
          appointment,
          newTime,
          newDuration,
          oldTime,
          oldDuration,
          doNotNotifyCustomer,
          _source,
        ),
      onAppointmentSlotRescheduled: (
        appointment,
        newTime,
        newDuration,
        oldTime,
        oldDuration,
        doNotNotifyCustomer,
        _source,
      ) =>
        this.onAppointmentRescheduled(
          appData,
          appointment,
          newTime,
          newDuration,
          oldTime,
          oldDuration,
          doNotNotifyCustomer,
          _source,
        ),
      onAppointmentStatusChanged: (
        appointment,
        newStatus,
        oldStatus,
        _source,
      ) =>
        this.onAppointmentStatusChanged(
          appData,
          appointment,
          newStatus,
          oldStatus,
        ),
    });
  }

  public async getLoginUrl(appId: string): Promise<string> {
    const logger = this.loggerFactory("getLoginUrl");
    logger.debug({ appId }, "Generating Zoom login URL");

    try {
      const clientId = process.env.ZOOM_APP_CLIENT_ID!;
      const url = getAdminUrl();
      const redirectUri = `${url}/apps/oauth/zoom/redirect`;

      const params = {
        response_type: "code",
        client_id: clientId,
        redirect_uri: redirectUri,
        state: appId,
      };
      const authUrl = new URL(ZOOM_OAUTH_AUTHORIZATION_URL);
      Object.entries(params).forEach(([key, value]) => {
        authUrl.searchParams.set(key, value as string);
      });

      logger.debug(
        { appId, url: authUrl.toString() },
        "Generated Zoom login URL",
      );

      return authUrl.toString();
    } catch (error: any) {
      logger.error({ appId, error }, "Error generating Zoom login URL");
      throw error;
    }
  }

  public async processRedirect(
    request: ApiRequest,
  ): Promise<ConnectedAppResponse> {
    const logger = this.loggerFactory("processRedirect");
    logger.debug({ url: request.url }, "Processing Zoom OAuth redirect");

    try {
      const url = new URL(request.url);
      const appId = url.searchParams.get("state") as string;
      const code = url.searchParams.get("code") as string;

      logger.debug(
        { appId, hasCode: !!code },
        "Extracted OAuth parameters from redirect",
      );

      if (!appId) {
        logger.error(
          { url: request.url },
          "Redirect request does not contain app ID",
        );

        throw new ConnectedAppError(
          "app_zoom_admin.statusText.redirect_request_does_not_contain_app_id" satisfies ZoomAdminAllKeys,
        );
      }

      if (!code) {
        logger.error(
          { appId },
          "Redirect request does not contain authorization code",
        );
        throw new ConnectedAppError(
          "app_zoom_admin.statusText.redirect_request_does_not_contain_authorization_code" satisfies ZoomAdminAllKeys,
        );
      }

      logger.debug({ appId }, "Exchanging authorization code for tokens");

      const webAdminUrl = getAdminUrl();
      const clientId = process.env.ZOOM_APP_CLIENT_ID!;
      const clientSecret = process.env.ZOOM_APP_CLIENT_SECRET!;

      const redirectUri = `${webAdminUrl}/apps/oauth/zoom/redirect`;
      const authHeader = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
      const result = await fetch(
        `${ZOOM_OAUTH_TOKEN_URL}?grant_type=authorization_code&code=${code}&redirect_uri=${redirectUri}`,
        {
          method: "POST",
          headers: {
            Authorization: authHeader,
          },
        },
      );

      if (result.status !== 200) {
        let errorMessage = "Something is wrong with Zoom API";
        try {
          const responseBody = await result.json();
          errorMessage = responseBody.error;
        } catch (e) {
          errorMessage = await result.clone().text();
        }

        throw new ConnectedAppError(
          "app_zoom_admin.statusText.oauth_error" satisfies ZoomAdminAllKeys,
        );
      }

      const responseBody = await result.json();

      if (responseBody.error) {
        throw new ConnectedAppError(
          "app_zoom_admin.statusText.oauth_error" satisfies ZoomAdminAllKeys,
        );
      }

      const expiryDate = new Date(
        Math.round(Date.now() + responseBody.expires_in * 1000),
      );

      const tokens = {
        accessToken: responseBody.access_token,
        refreshToken: responseBody.refresh_token,
        expiresOn: expiryDate,
      } satisfies ConnectedOauthAppTokens;

      if (!tokens?.accessToken || !tokens.refreshToken) {
        logger.error(
          {
            appId,
            hasAccessToken: !!tokens?.accessToken,
            hasRefreshToken: !!tokens?.refreshToken,
          },
          "App was not authorized properly",
        );

        throw new ConnectedAppError(
          "app_zoom_admin.statusText.app_was_not_authorized_properly" satisfies ZoomAdminAllKeys,
        );
      }

      const zoomUser = await fetch(`${ZOOM_API_BASE_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      const me = await zoomUser.json();

      const email = me?.email as string;

      if (!email) {
        logger.error({ appId }, "Failed to get user email from ID token");
        throw new ConnectedAppError(
          "app_zoom_admin.statusText.failed_to_get_user_email" satisfies ZoomAdminAllKeys,
        );
      }

      logger.info(
        { appId, email },
        "Successfully processed Zoom OAuth redirect",
      );

      return {
        appId,
        token: {
          ...tokens,
          accessToken: encrypt(tokens.accessToken),
          refreshToken: encrypt(tokens.refreshToken),
        },
        account: {
          username: email,
        },
      };
    } catch (e: any) {
      logger.error(
        { url: request.url, error: e?.message || e?.toString() },
        "Error processing Zoom OAuth redirect",
      );

      return {
        appId: new URL(request.url).searchParams.get("state") as string,
        error:
          e instanceof ConnectedAppError
            ? e.key
            : e?.message || "Something went wrong",
        errorArgs: e instanceof ConnectedAppError ? e.args : undefined,
      };
    }
  }

  public async getMeetingUrl(
    app: ConnectedAppData,
    appointment: WithDatabaseId<AppointmentEvent>,
  ): Promise<AppointmentOnlineMeetingInformation> {
    const logger = this.loggerFactory("getMeetingUrl");
    logger.debug(
      { appId: app._id, appointmentId: appointment._id },
      "Getting meeting URL from Zoom",
    );

    try {
      const client = new ZoomApiClient(
        app,
        process.env.ZOOM_APP_CLIENT_ID!,
        process.env.ZOOM_APP_CLIENT_SECRET!,
        this.props.update,
      );

      logger.debug(
        { appId: app._id, appointmentId: appointment._id },
        "Creating scheduled meeting",
      );

      const event = await this.translateEvent(client, appointment);
      const response = await client.fetch("/users/me/meetings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      });

      if (response.status >= 400) {
        let errorMessage = "Something is wrong with Zoom API";
        try {
          const responseBody = await response.json();
          errorMessage = responseBody.error;
        } catch (e: any) {
          errorMessage = e?.message || e?.toString() || "Unknown error";
        }

        throw new Error(errorMessage);
      }

      const responseBody = (await response.json()) as ZoomCreateMeetingResponse;
      if (!responseBody.join_url) {
        throw new Error("Failed to create scheduled meeting");
      }

      logger.debug(
        { appId: app._id, appointmentId: appointment._id, responseBody },
        "Successfully created scheduled meeting URL",
      );

      return {
        url: responseBody.join_url,
        meetingId: responseBody.id.toString(),
        meetingPassword: responseBody.password,
        type: "zoom",
      };
    } catch (e: any) {
      logger.error(
        { appId: app._id, error: e?.message || e?.toString() },
        "Error getting meeting URL from Zoom",
      );

      await this.props.update({
        status: "failed",
        statusText: {
          key: "app_zoom_admin.statusText.error_getting_meeting_url" satisfies ZoomAdminAllKeys,
          args: { error: e?.message || e?.toString() },
        },
      });
      throw e;
    }
  }

  public async getBusyTimes(
    app: ConnectedAppData,
    start: Date,
    end: Date,
  ): Promise<CalendarBusyTime[]> {
    const logger = this.loggerFactory("getBusyTimes");
    logger.debug(
      { appId: app._id, start: start.toISOString(), end: end.toISOString() },
      "Getting busy times from Zoom",
    );

    const client = new ZoomApiClient(
      app,
      process.env.ZOOM_APP_CLIENT_ID!,
      process.env.ZOOM_APP_CLIENT_SECRET!,
      this.props.update,
    );

    const { timeZone } =
      await this.props.services.configurationService.getConfiguration(
        "general",
      );

    const results: ZoomMeeting[] = [];
    let nextPageToken: string | undefined = undefined;

    try {
      do {
        const response = await this.getMeetingsPaginated(
          client,
          start,
          end,
          timeZone,
          nextPageToken,
        );
        results.push(...response.meetings);
        nextPageToken = response.next_page_token;

        if (response.next_page_token) {
          logger.debug(
            { appId: app._id, nextPageToken: response.next_page_token },
            "Getting next page of busy times from Zoom",
          );
        } else {
          logger.debug(
            { appId: app._id, nextPageToken: response.next_page_token },
            "No more pages of busy times from Zoom",
          );
        }
      } while (!!nextPageToken);

      logger.info(
        { appId: app._id, busyTimeCount: results.length },
        "Successfully retrieved busy times from Zoom",
      );

      return results.map((meeting) => ({
        startAt: DateTime.fromISO(meeting.start_time)
          .setZone(timeZone)
          .toJSDate(),
        endAt: DateTime.fromISO(meeting.start_time)
          .setZone(timeZone)
          .plus({ minutes: meeting.duration })
          .toJSDate(),
        uid: meeting.uuid,
        title: meeting.topic,
      }));
    } catch (e: any) {
      logger.error(
        { appId: app._id, error: e?.message || e?.toString() },
        "Error getting busy times from Zoom",
      );

      await this.props.update({
        status: "failed",
        statusText: {
          key: "app_zoom_admin.statusText.error_getting_busy_times" satisfies ZoomAdminAllKeys,
          args: { error: e?.message || e?.toString() },
        },
      });
      throw e;
    }
  }

  public async onAppointmentRescheduled(
    appData: ConnectedAppData,
    appointment: Appointment,
    newTime: Date,
    newDuration: number,
    oldTime?: Date,
    oldDuration?: number,
    _doNotNotifyCustomer?: boolean,
    _source?: EventSource,
  ) {
    const logger = this.loggerFactory("onAppointmentRescheduled");
    if (appointment.meetingInformation?.type !== "zoom") {
      logger.debug(
        { appId: appData._id, appointmentId: appointment._id },
        "Appointment is not a Zoom meeting, skipping",
      );
      return;
    }

    logger.debug(
      {
        appId: appData._id,
        appointmentId: appointment._id,
        newTime,
        newDuration,
        oldTime,
        oldDuration,
      },
      "Rescheduling Zoom meeting",
    );

    const client = new ZoomApiClient(
      appData,
      process.env.ZOOM_APP_CLIENT_ID!,
      process.env.ZOOM_APP_CLIENT_SECRET!,
      this.props.update,
    );

    try {
      const event = await this.translateEvent(client, {
        ...appointment,
        dateTime: newTime,
        totalDuration: newDuration,
      });

      const response = await client.fetch(
        `/meetings/${appointment.meetingInformation.meetingId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        },
      );

      if (response.status >= 400) {
        const responseBody = await response.text();
        logger.error(
          {
            appId: appData._id,
            appointmentId: appointment._id,
            response: response.status,
            responseBody,
          },
          "Error rescheduling Zoom meeting",
        );
        throw new Error(responseBody);
      }

      logger.info(
        {
          appId: appData._id,
          appointmentId: appointment._id,
          newTime: newTime.toISOString(),
          newDuration,
          zoomMeetingId: appointment.meetingInformation.meetingId,
        },
        "Successfully rescheduled Zoom meeting",
      );
    } catch (e: any) {
      logger.error(
        {
          appId: appData._id,
          appointmentId: appointment._id,
          error: e?.message || e?.toString(),
        },
        "Error rescheduling Zoom meeting",
      );

      await this.props.update({
        status: "failed",
        statusText: {
          key: "app_zoom_admin.statusText.error_rescheduling_zoom_meeting" satisfies ZoomAdminAllKeys,
          args: { error: e?.message || e?.toString() },
        },
      });

      throw e;
    }
  }

  public async onAppointmentStatusChanged(
    appData: ConnectedAppData,
    appointment: Appointment,
    newStatus: AppointmentStatus,
    _oldStatus?: AppointmentStatus,
  ) {
    const logger = this.loggerFactory("onAppointmentStatusChanged");
    if (appointment.meetingInformation?.type !== "zoom") {
      logger.debug(
        { appId: appData._id, appointmentId: appointment._id },
        "Appointment is not a Zoom meeting, skipping",
      );
      return;
    }

    if (!isClosedAppointmentStatus(newStatus)) {
      logger.debug(
        { appId: appData._id, appointmentId: appointment._id },
        "Appointment status is not closed, skipping",
      );
      return;
    }

    const client = new ZoomApiClient(
      appData,
      process.env.ZOOM_APP_CLIENT_ID!,
      process.env.ZOOM_APP_CLIENT_SECRET!,
      this.props.update,
    );

    try {
      const response = await client.fetch(
        `/meetings/${appointment.meetingInformation.meetingId}`,
        {
          method: "DELETE",
        },
      );

      if (response.status >= 400) {
        const responseBody = await response.text();
        logger.error(
          {
            appId: appData._id,
            appointmentId: appointment._id,
            response: response.status,
            responseBody,
          },
          "Error deleting Zoom meeting",
        );
      }

      logger.info(
        {
          appId: appData._id,
          appointmentId: appointment._id,
          zoomMeetingId: appointment.meetingInformation.meetingId,
        },
        "Successfully deleted Zoom meeting",
      );
    } catch (e: any) {
      logger.error(
        {
          appId: appData._id,
          appointmentId: appointment._id,
          error: e?.message || e?.toString(),
        },
        "Error deleting Zoom meeting",
      );

      await this.props.update({
        status: "failed",
        statusText: {
          key: "app_zoom_admin.statusText.error_deleting_zoom_meeting" satisfies ZoomAdminAllKeys,
          args: { error: e?.message || e?.toString() },
        },
      });

      throw e;
    }
  }

  private async getMeetingsPaginated(
    client: ZoomApiClient,
    start: Date,
    end: Date,
    timeZone: string,
    nextPageToken?: string,
  ) {
    const logger = this.loggerFactory("getMeetingsPaginated");
    const startTime = DateTime.fromJSDate(start).toISODate();
    const endTime = DateTime.fromJSDate(end).toISODate();

    const searchParams = new URLSearchParams();
    searchParams.set("type", "scheduled");
    searchParams.set("page_size", "300");
    searchParams.set("from", startTime!);
    searchParams.set("to", endTime!);
    searchParams.set("timezone", timeZone);
    if (nextPageToken) {
      searchParams.set("next_page_token", nextPageToken);
    }

    const url = `/users/me/meetings?${searchParams.toString()}`;

    logger.debug(
      { startTime, endTime, timeZone, nextPageToken, url },
      "Fetching meetings from Zoom",
    );
    const response = await client.fetch(url, { method: "GET" });

    if (response.status >= 400) {
      const responseBody = await response.text();
      logger.error(
        {
          startTime,
          endTime,
          timeZone,
          nextPageToken,
          response: response.status,
          responseBody,
        },
        "Error getting busy times from Zoom",
      );

      throw new ConnectedAppError(
        "app_zoom_admin.statusText.error_getting_busy_times" satisfies ZoomAdminAllKeys,
      );
    }

    const responseBody = (await response.json()) as ZoomMeetingsResponse;
    logger.debug(
      {
        startTime,
        endTime,
        timeZone,
        nextPageToken,
        count: responseBody.total_records,
      },
      "Successfully retrieved meetings from Zoom",
    );
    return responseBody;
  }

  private async translateEvent(
    client: ZoomApiClient,
    appointment: AppointmentEvent,
  ) {
    const option = await this.props.services.servicesService.getOption(
      appointment.option._id,
    );
    const description = option?.description;

    return {
      agenda: this.truncateAgenda(description),
      topic: appointment.option.name,
      duration: appointment.totalDuration,
      start_time: DateTime.fromJSDate(appointment.dateTime)
        .set({ millisecond: 0 })
        .toISO({
          suppressMilliseconds: true,
        }),
      type: 2, // 2 for scheduled meeting
      timezone: appointment.timeZone,
      settings: {
        host_video: true,
        participant_video: true,
        mute_upon_entry: false,
        watermark: false,
        use_pmi: false,
        approval_type: 2,
        audio: "both",
        enforce_login: false,
        registrants_email_notification: true,
      },
    };
  }

  private truncateAgenda(description?: string | null) {
    if (!description) return description;

    const maxLength = 1900;
    const trimmed = stripMarkdown(description).trimEnd();
    if (trimmed.length > maxLength) {
      return `${trimmed.substring(0, maxLength).trimEnd()}...`;
    }

    return trimmed;
  }
}
