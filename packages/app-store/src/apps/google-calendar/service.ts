import {
  calendar_v3,
  auth as googleAuth,
  calendar as googleCalendar,
} from "@googleapis/calendar";
import { meet as googleMeet } from "@googleapis/meet";
import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import {
  ApiRequest,
  AppointmentEvent,
  AppointmentOnlineMeetingInformation,
  CalendarBusyTime,
  CalendarWriterEvent,
  CalendarWriterEventAttendee,
  CalendarWriterEventResult,
  ConnectedAppData,
  ConnectedAppError,
  ConnectedAppRequestError,
  ConnectedAppResponse,
  ICalendarBusyTimeProvider,
  ICalendarWriter,
  IConnectedAppProps,
  IMeetingUrlProvider,
  IOAuthConnectedApp,
  okStatus,
  WithDatabaseId,
} from "@hacado/types";
import { decrypt, encrypt, getAdminUrl } from "@hacado/utils";
import { Credentials, OAuth2Client } from "google-auth-library";
import { DateTime } from "luxon";
import {
  CalendarListItem,
  GoogleCalendarConfiguration,
  RequestAction,
  requestActionSchema,
} from "./models";

import {
  GoogleCalendarAdminAllKeys,
  GoogleCalendarAdminKeys,
  GoogleCalendarAdminNamespace,
} from "./translations/types";

const accessType = "offline";

// Redirect request won't contain offline access
const requiredScopes = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
  "https://www.googleapis.com/auth/meetings.space.created",
];

const attendeeStatusToResponseStatusMap: Record<
  CalendarWriterEventAttendee["status"],
  string
> = {
  confirmed: "accepted",
  declined: "declined",
  tentative: "tentative",
  organizer: "accepted",
};

const evetStatusToGoogleEventStatus: Record<
  CalendarWriterEvent["status"],
  string
> = {
  confirmed: "confirmed",
  declined: "cancelled",
  canceled: "cancelled",
  noShow: "cancelled",
  pending: "tentative",
};

const base32hexAlphabet = "0123456789abcdefghijklmnopqrstuv";
const base32hexEncode = (str: string): string => {
  let binary = "";
  for (let i = 0; i < str.length; i++) {
    const byte = str.charCodeAt(i);
    binary += byte.toString(2).padStart(8, "0");
  }

  let encoded = "";
  for (let i = 0; i < binary.length; i += 5) {
    const chunk = binary.slice(i, i + 5).padEnd(5, "0");
    const index = parseInt(chunk, 2);
    encoded += base32hexAlphabet[index];
  }

  return encoded;
};

class GoogleCalendarConnectedApp
  implements
    IOAuthConnectedApp,
    ICalendarBusyTimeProvider,
    ICalendarWriter,
    IMeetingUrlProvider
{
  protected readonly loggerFactory: LoggerFactory;
  public constructor(protected readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "GoogleCalendarConnectedApp",
      props.organizationId,
    );
  }

  public async processRequest(
    appData: ConnectedAppData<GoogleCalendarConfiguration>,
    request: RequestAction,
  ) {
    const logger = this.loggerFactory("processRequest");
    logger.debug(
      { appId: appData._id, type: request.type },
      "Processing Google Calendar request",
    );

    const { data, success, error } = requestActionSchema.safeParse(request);
    if (!success) {
      logger.error({ error }, "Invalid Google Calendar request");
      throw new ConnectedAppRequestError(
        "invalid_google_calendar_request",
        { request },
        400,
        error.message,
      );
    }

    try {
      switch (data.type) {
        case "get-selected-calendar":
          logger.debug({ appId: appData._id }, "Getting selected calendar ID");
          const calendarId = appData.data?.calendar?.id;
          logger.debug(
            { appId: appData._id, calendarId },
            "Retrieved selected calendar ID",
          );
          return calendarId;

        case "get-calendar-list":
          logger.debug({ appId: appData._id }, "Getting calendar list");
          const calendarList = await this.getCalendarList(appData);
          logger.info(
            { appId: appData._id, calendarCount: calendarList?.length },
            "Successfully retrieved calendar list",
          );
          return calendarList;

        case "set-calendar":
          logger.debug(
            {
              appId: appData._id,
              calendarId: data.calendar.id,
              calendarName: data.calendar.name,
            },
            "Setting calendar configuration",
          );
          await this.props.update({
            data: {
              ...(appData.data ?? {}),
              calendar: data.calendar,
            },
            account: {
              ...((appData.account as any) ?? {}),
              additional: data.calendar.name,
            },
          });
          logger.info(
            {
              appId: appData._id,
              calendarId: data.calendar.id,
              calendarName: data.calendar.name,
            },
            "Successfully set calendar configuration",
          );
          return;

        default:
          logger.debug(
            { appId: appData._id, type: request.type },
            "Processing default request",
          );
          return okStatus;
      }
    } catch (error: any) {
      logger.error(
        { appId: appData._id, type: data.type, error },
        "Error processing Google Calendar request",
      );
      throw error;
    }
  }

  public async getLoginUrl(appId: string): Promise<string> {
    const logger = this.loggerFactory("getLoginUrl");
    logger.debug({ appId }, "Generating Google Calendar login URL");

    try {
      const client = await this.getOAuthClient();
      const url = client.generateAuthUrl({
        access_type: accessType,
        scope: requiredScopes,
        state: appId,
        prompt: "consent",
        include_granted_scopes: true,
      });

      logger.debug({ appId, url }, "Generated Google Calendar login URL");

      return url;
    } catch (error: any) {
      logger.error(
        { appId, error },
        "Error generating Google Calendar login URL",
      );
      throw error;
    }
  }

  public async processRedirect(
    request: ApiRequest,
  ): Promise<ConnectedAppResponse> {
    const logger = this.loggerFactory("processRedirect");
    logger.debug(
      { url: request.url },
      "Processing Google Calendar OAuth redirect",
    );

    try {
      const url = new URL(request.url);
      const appId = url.searchParams.get("state") as string;
      const code = url.searchParams.get("code") as string;

      logger.debug(
        { appId, hasCode: !!code },
        "Extracted OAuth parameters from redirect",
      );

      const client = await this.getOAuthClient();

      if (!appId) {
        logger.error(
          { url: request.url },
          "Redirect request does not contain app ID",
        );

        throw new ConnectedAppError(
          "app_google-calendar_admin.statusText.redirect_request_does_not_contain_app_id" satisfies GoogleCalendarAdminAllKeys,
        );
      }

      if (!code) {
        logger.error(
          { appId },
          "Redirect request does not contain authorization code",
        );
        throw new ConnectedAppError(
          "app_google-calendar_admin.statusText.redirect_request_does_not_contain_authorization_code" satisfies GoogleCalendarAdminAllKeys,
        );
      }

      logger.debug({ appId }, "Exchanging authorization code for tokens");

      const tokenResponse = await client.getToken(code);
      const tokens = tokenResponse.tokens;

      if (!tokens?.access_token || !tokens.refresh_token || !tokens.id_token) {
        logger.error(
          {
            appId,
            hasAccessToken: !!tokens?.access_token,
            hasRefreshToken: !!tokens?.refresh_token,
            hasIdToken: !!tokens?.id_token,
          },
          "App was not authorized properly",
        );

        throw new ConnectedAppError(
          "app_google-calendar_admin.statusText.app_was_not_authorized_properly" satisfies GoogleCalendarAdminAllKeys,
        );
      }

      logger.debug(
        { appId, scopes: tokens.scope },
        "Verifying required scopes",
      );

      if (!requiredScopes.every((s) => !!tokens.scope?.includes(s))) {
        logger.error(
          { appId, requiredScopes, actualScopes: tokens.scope },
          "App was not given required scopes",
        );
        throw new ConnectedAppError(
          "app_google-calendar_admin.statusText.app_was_not_given_required_scopes" satisfies GoogleCalendarAdminAllKeys,
        );
      }

      logger.debug({ appId }, "Verifying ID token");

      const ticket = await client.verifyIdToken({ idToken: tokens.id_token });
      const email = ticket.getPayload()?.email;

      if (!email) {
        logger.error({ appId }, "Failed to get user email from ID token");
        throw new ConnectedAppError(
          "app_google-calendar_admin.statusText.failed_to_get_user_email" satisfies GoogleCalendarAdminAllKeys,
        );
      }

      logger.info(
        { appId, email },
        "Successfully processed Google Calendar OAuth redirect",
      );

      return {
        appId,
        token: {
          ...tokens,
          access_token: encrypt(tokens.access_token),
          refresh_token: encrypt(tokens.refresh_token),
        },
        account: {
          username: email,
        },
      };
    } catch (e: any) {
      logger.error(
        { url: request.url, error: e?.message || e?.toString() },
        "Error processing Google Calendar OAuth redirect",
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

  public async getBusyTimes(
    app: ConnectedAppData<GoogleCalendarConfiguration>,
    start: Date,
    end: Date,
  ): Promise<CalendarBusyTime[]> {
    const logger = this.loggerFactory("getBusyTimes");
    logger.debug(
      {
        appId: app._id,
        start: start.toISOString(),
        end: end.toISOString(),
        calendarId: app.data?.calendar?.id,
      },
      "Getting busy times from Google Calendar",
    );

    try {
      const client = await this.getOAuthClientWithCredentials(app);

      logger.debug(
        { appId: app._id, start: start.toISOString(), end: end.toISOString() },
        "Retrieved OAuth client, fetching events",
      );

      const events = await this.getEvents(
        client,
        DateTime.fromJSDate(start),
        DateTime.fromJSDate(end),
        app.data?.calendar?.id,
      );

      logger.debug(
        { appId: app._id, eventCount: events.length },
        "Retrieved events from Google Calendar",
      );

      const result = events
        .filter(
          (event) =>
            event.start &&
            event.end &&
            event.summary &&
            event.transparency !== "transparent",
        )
        .map((event) => {
          const startAt = DateTime.fromISO(event.start?.dateTime!, {
            zone: "utc",
          }).toJSDate();

          const endAt = DateTime.fromISO(event.end?.dateTime!, {
            zone: "utc",
          }).toJSDate();

          const uid =
            event.extendedProperties?.private?.uid ??
            (event as any).uid ??
            event.iCalUID;

          return {
            startAt,
            endAt,
            uid,
            title: event.summary!,
          } satisfies CalendarBusyTime;
        });

      logger.info(
        { appId: app._id, busyTimeCount: result.length },
        "Successfully processed busy times from Google Calendar",
      );

      await this.props.update({
        status: "connected",
        statusText:
          "app_google-calendar_admin.statusText.successfully_set_up" satisfies GoogleCalendarAdminAllKeys,
      });

      return result;
    } catch (e: any) {
      logger.error(
        { appId: app._id, error: e?.message || e?.toString() },
        "Error getting busy times from Google Calendar",
      );

      await this.props.update({
        status: "failed",
        statusText:
          "app_google-calendar_admin.statusText.error_getting_busy_times" satisfies GoogleCalendarAdminAllKeys,
      });

      throw e;
    }
  }

  public async createEvent(
    app: ConnectedAppData<GoogleCalendarConfiguration>,
    event: CalendarWriterEvent,
  ): Promise<CalendarWriterEventResult> {
    const logger = this.loggerFactory("createEvent");
    logger.debug(
      {
        appId: app._id,
        eventId: event.id,
        eventTitle: event.title,
        calendarId: app.data?.calendar?.id,
      },
      "Creating event in Google Calendar",
    );

    try {
      const client = await this.getOAuthClientWithCredentials(app);
      const calendarClient = googleCalendar({
        version: "v3",
        auth: client,
      });

      logger.debug(
        { appId: app._id, eventId: event.id },
        "Preparing Google Calendar event",
      );

      const googleEvent = this.getGoogleEvent(event);

      logger.debug(
        {
          appId: app._id,
          eventId: event.id,
          calendarId: app.data?.calendar?.id || "primary",
        },
        "Inserting event into Google Calendar",
      );

      const result = await calendarClient.events.insert({
        calendarId: app.data?.calendar?.id ?? "primary",
        sendNotifications: true,
        requestBody: googleEvent,
      });

      logger.info(
        {
          appId: app._id,
          eventId: event.id,
          eventTitle: event.title,
          googleEventId: result.data.id,
        },
        "Successfully created event in Google Calendar",
      );

      return {
        uid: result.data.iCalUID ?? event.uid,
      };
    } catch (error: any) {
      logger.error(
        { appId: app._id, eventId: event.id, error },
        "Error creating event in Google Calendar",
      );

      this.props.update({
        status: "failed",
        statusText:
          error instanceof ConnectedAppError
            ? error.key
            : ("app_google-calendar_admin.statusText.error_creating_calendar_event" satisfies GoogleCalendarAdminAllKeys),
      });

      throw error;
    }
  }

  public async updateEvent(
    app: ConnectedAppData<GoogleCalendarConfiguration>,
    uid: string,
    event: CalendarWriterEvent,
  ): Promise<CalendarWriterEventResult> {
    const logger = this.loggerFactory("updateEvent");
    logger.debug(
      {
        appId: app._id,
        eventId: event.id,
        uid,
        eventTitle: event.title,
        calendarId: app.data?.calendar?.id,
      },
      "Updating event in Google Calendar",
    );

    try {
      const client = await this.getOAuthClientWithCredentials(app);
      const calendarClient = googleCalendar({
        version: "v3",
        auth: client,
      });

      const encodedUid = base32hexEncode(uid);
      logger.debug(
        { appId: app._id, eventId: event.id, uid, encodedUid },
        "Preparing to update Google Calendar event",
      );

      const result = await calendarClient.events.patch({
        calendarId: app.data?.calendar?.id ?? "primary",
        eventId: encodedUid,
        requestBody: this.getGoogleEvent(event),
      });

      logger.info(
        {
          appId: app._id,
          eventId: event.id,
          uid,
          eventTitle: event.title,
          googleEventId: result.data.id,
        },
        "Successfully updated event in Google Calendar",
      );

      return {
        uid: result.data.iCalUID ?? event.uid,
      };
    } catch (error: any) {
      logger.error(
        { appId: app._id, eventId: event.id, uid, error },
        "Error updating event in Google Calendar",
      );

      await this.props.update({
        status: "failed",
        statusText:
          error instanceof ConnectedAppError
            ? error.key
            : ("app_google-calendar_admin.statusText.error_updating_calendar_event" satisfies GoogleCalendarAdminAllKeys),
      });

      throw error;
    }
  }

  public async deleteEvent(
    app: ConnectedAppData<GoogleCalendarConfiguration>,
    uid: string,
  ): Promise<void> {
    const logger = this.loggerFactory("deleteEvent");
    logger.debug(
      { appId: app._id, uid, calendarId: app.data?.calendar?.id },
      "Deleting event from Google Calendar",
    );

    try {
      const client = await this.getOAuthClientWithCredentials(app);
      const calendarClient = googleCalendar({
        version: "v3",
        auth: client,
      });

      const encodedUid = base32hexEncode(uid);
      logger.debug(
        { appId: app._id, uid, encodedUid },
        "Deleting Google Calendar event",
      );

      await calendarClient.events.delete({
        eventId: encodedUid,
        calendarId: app.data?.calendar?.id ?? "primary",
      });

      logger.info(
        { appId: app._id, uid },
        "Successfully deleted event from Google Calendar",
      );
    } catch (error: any) {
      logger.error(
        { appId: app._id, uid, error },
        "Error deleting event from Google Calendar",
      );

      await this.props.update({
        status: "failed",
        statusText:
          error instanceof ConnectedAppError
            ? error.key
            : ("app_google-calendar_admin.statusText.error_deleting_calendar_event" satisfies GoogleCalendarAdminAllKeys),
      });

      throw error;
    }
  }

  public async getMeetingUrl(
    app: ConnectedAppData<GoogleCalendarConfiguration>,
    appointment: WithDatabaseId<AppointmentEvent>,
  ): Promise<AppointmentOnlineMeetingInformation> {
    const logger = this.loggerFactory("getMeetingUrl");
    logger.debug(
      { appId: app._id, appointmentId: appointment._id },
      "Getting meeting URL from Google Calendar",
    );

    try {
      const client = await this.getOAuthClientWithCredentials(app);
      const meetClient = googleMeet({
        version: "v2",
        auth: client,
      });

      const result = await meetClient.spaces.create({
        requestBody: {},
      });

      if (!result.ok || !result.data.meetingUri) {
        throw new ConnectedAppError<
          GoogleCalendarAdminNamespace,
          GoogleCalendarAdminKeys
        >(
          "app_google-calendar_admin.statusText.app_was_not_authorized_properly",
        );
      }

      return {
        url: result.data.meetingUri,
        meetingId: result.data.meetingCode!,
        type: "google_meet",
      };
    } catch (e: any) {
      logger.error(
        { appId: app._id, error: e?.message || e?.toString() },
        "Error getting busy times from Google Calendar",
      );

      await this.props.update({
        status: "failed",
        statusText:
          "app_google-calendar_admin.statusText.error_getting_busy_times" satisfies GoogleCalendarAdminAllKeys,
      });

      throw e;
    }
  }

  private async getCalendarList(app: ConnectedAppData) {
    const logger = this.loggerFactory("getCalendarList");
    logger.debug({ appId: app._id }, "Getting Google Calendar list");

    try {
      const client = await this.getOAuthClientWithCredentials(app);
      const calendarClient = googleCalendar({
        version: "v3",
        auth: client,
      });

      logger.debug(
        { appId: app._id },
        "Fetching calendar list from Google Calendar API",
      );

      const list = await calendarClient.calendarList.list({});
      const calendars = list.data.items?.map(
        (item) =>
          ({
            id: item.id!,
            name: item.summary!,
          }) as CalendarListItem,
      );

      logger.debug(
        { appId: app._id, calendarCount: calendars?.length },
        "Retrieved calendar list from Google Calendar API",
      );

      return calendars;
    } catch (error: any) {
      logger.error(
        { appId: app._id, error },
        "Error getting Google Calendar list",
      );

      await this.props.update({
        status: "failed",
        statusText:
          error instanceof ConnectedAppError
            ? error.key
            : ("app_google-calendar_admin.statusText.error_retrieving_calendar_list" satisfies GoogleCalendarAdminAllKeys),
      });

      throw error;
    }
  }

  private getGoogleEvent(event: CalendarWriterEvent): calendar_v3.Schema$Event {
    const logger = this.loggerFactory("getGoogleEvent");
    logger.debug(
      {
        eventId: event.id,
        eventTitle: event.title,
        attendeeCount: event.attendees.length,
      },
      "Converting event to Google Calendar format",
    );

    const start = DateTime.fromJSDate(event.startTime).setZone(event.timeZone);
    const end = start.plus({ minutes: event.duration });

    const googleEvent = {
      summary: event.title,
      description: event.description.plainText,
      source: {
        title: event.title,
        url: event.description.url,
      },
      start: {
        dateTime: start.toISO(),
        timeZone: event.timeZone,
      },
      id: base32hexEncode(event.uid),
      status: evetStatusToGoogleEventStatus[event.status],
      end: {
        dateTime: end.toISO(),
        timeZone: event.timeZone,
      },
      location:
        event.location.onlineUrl ??
        event.location.address ??
        event.location.name,
      extendedProperties: {
        private: {
          uid: event.uid,
        },
      },
      attendees: event.attendees.map((attendee) => ({
        email: attendee.email,
        displayName: attendee.name,
        organizer: attendee.status === "organizer",
        optional: attendee.type === "optional",
        responseStatus: attendeeStatusToResponseStatusMap[attendee.status],
      })),
    };

    logger.debug(
      { eventId: event.id, googleEventId: googleEvent.id },
      "Converted event to Google Calendar format",
    );

    return googleEvent;
  }

  private async getEventsPaginated(
    client: OAuth2Client,
    start: DateTime,
    end: DateTime,
    top: number,
    pageToken?: string,
    calendarId?: string,
  ) {
    const logger = this.loggerFactory("getEventsPaginated");
    logger.debug(
      {
        start: start.toISO(),
        end: end.toISO(),
        top,
        pageToken: !!pageToken,
        calendarId,
      },
      "Fetching paginated events from Google Calendar",
    );

    try {
      const calendarClient = googleCalendar({
        version: "v3",
        auth: client,
      });

      const response = await calendarClient.events.list({
        calendarId: calendarId ?? "primary",
        timeMin: start.toISO()!,
        timeMax: end.toISO()!,
        singleEvents: true,
        maxResults: top,
        pageToken: pageToken,
      });

      logger.debug(
        {
          eventCount: response.data.items?.length,
          hasNextPage: !!response.data.nextPageToken,
        },
        "Retrieved paginated events from Google Calendar",
      );

      return response;
    } catch (error: any) {
      logger.error(
        { start: start.toISO(), end: end.toISO(), top, calendarId, error },
        "Error fetching paginated events from Google Calendar",
      );
      throw error;
    }
  }

  private async getEvents(
    client: OAuth2Client,
    start: DateTime,
    end: DateTime,
    calendarId?: string,
  ) {
    const logger = this.loggerFactory("getEvents");
    logger.debug(
      { start: start.toISO(), end: end.toISO(), calendarId },
      "Getting all events from Google Calendar",
    );

    try {
      const results: calendar_v3.Schema$Event[] = [];
      let pageToken: string | undefined | null = undefined;
      const top = 1000;
      let pageCount = 0;

      do {
        pageCount++;
        logger.debug(
          {
            start: start.toISO(),
            end: end.toISO(),
            pageCount,
            hasPageToken: !!pageToken,
          },
          "Fetching page of events from Google Calendar",
        );

        const response = await this.getEventsPaginated(
          client,
          start,
          end,
          top,
          pageToken,
          calendarId,
        );

        results.push(...(response.data.items || []));
        pageToken = response.data.nextPageToken;
      } while (!!pageToken);

      logger.info(
        {
          start: start.toISO(),
          end: end.toISO(),
          totalEvents: results.length,
          pageCount,
        },
        "Successfully retrieved all events from Google Calendar",
      );

      return results;
    } catch (error: any) {
      logger.error(
        { start: start.toISO(), end: end.toISO(), calendarId, error },
        "Error getting events from Google Calendar",
      );

      await this.props.update({
        status: "failed",
        statusText:
          error instanceof ConnectedAppError
            ? error.key
            : ("app_google-calendar_admin.statusText.error_getting_busy_times" satisfies GoogleCalendarAdminAllKeys),
      });

      throw error;
    }
  }

  private async getOAuthClient() {
    const logger = this.loggerFactory("getOAuthClient");
    logger.debug("Creating Google OAuth client");

    try {
      const url = getAdminUrl();
      const redirectUri = `${url}/apps/oauth/google-calendar/redirect`;

      logger.debug({ redirectUri }, "Created Google OAuth client");

      return new googleAuth.OAuth2(
        process.env.GOOGLE_CALENDAR_APP_CLIENT_ID!,
        process.env.GOOGLE_CALENDAR_APP_CLIENT_SECRET!,
        redirectUri,
      );
    } catch (error: any) {
      logger.error({ error }, "Error creating Google OAuth client");
      throw error;
    }
  }

  private async getOAuthClientWithCredentials(appData: ConnectedAppData) {
    const logger = this.loggerFactory("getOAuthClientWithCredentials");
    logger.debug(
      { appId: appData._id },
      "Creating Google OAuth client with credentials",
    );

    try {
      const client = await this.getOAuthClient();
      const credentials = { ...appData.token } as Credentials;

      if (!credentials) {
        logger.error({ appId: appData._id }, "App is not authorized");
        throw new Error("App is not authorized");
      }

      credentials.access_token = decrypt(credentials.access_token);
      credentials.refresh_token = decrypt(credentials.refresh_token);

      client.setCredentials(credentials);
      client.on("tokens", async (tokens) => {
        logger.debug(
          { appId: appData._id },
          "Received new tokens from Google OAuth",
        );

        const token = {
          ...appData.token,
          ...tokens,
          access_token: encrypt(tokens.access_token),
        } as Credentials;

        if (tokens.refresh_token) {
          token.refresh_token = encrypt(tokens.refresh_token);
        }

        await this.props.update({
          token,
        });
      });

      logger.debug(
        { appId: appData._id },
        "Successfully created Google OAuth client with credentials",
      );

      return client;
    } catch (error: any) {
      logger.error(
        { appId: appData._id, error },
        "Error creating Google OAuth client with credentials",
      );
      throw error;
    }
  }
}

export default GoogleCalendarConnectedApp;
