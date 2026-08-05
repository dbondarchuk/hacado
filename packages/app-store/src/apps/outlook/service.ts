import {
  AuthenticationResult,
  AuthorizationUrlRequest,
  ConfidentialClientApplication,
  LogLevel,
  Configuration as MsalConfig,
} from "@azure/msal-node";
import { Client } from "@microsoft/microsoft-graph-client";
import {
  Attachment,
  FileAttachment,
  OnlineMeeting,
  Event as OutlookEvent,
  Message as OutlookMessage,
  ResponseType,
} from "@microsoft/microsoft-graph-types";
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
  ConnectedAppResponse,
  ConnectedOauthAppTokens,
  Email,
  EmailResponse,
  ICalendarBusyTimeProvider,
  ICalendarWriter,
  IConnectedApp,
  IConnectedAppProps,
  IMailSenderApp,
  IMeetingUrlProvider,
  IOAuthConnectedApp,
  WithDatabaseId,
} from "@hacado/types";
import { decrypt, encrypt, getAdminUrl } from "@hacado/utils";
import { createEvent } from "ics";
import { DateTime } from "luxon";
import { Readable } from "stream";
import { v4 } from "uuid";
import { OutlookAdminAllKeys } from "./translations/types";

export async function readableToBase64(readable: Readable): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of readable) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const buffer = Buffer.concat(chunks);
  return buffer.toString("base64");
}

const offlineAccessScope = "offline_access";

const uidPropertyName = `String {d0594c28-e3bf-4348-aa31-32829298f576} Name uid`;

// Redirect request won't contain offline access
const requiredScopes = [
  "openid",
  "profile",
  "Calendars.ReadWrite",
  "Mail.Send",
];

const attendeeStatusToResponseStatusMap: Record<
  CalendarWriterEventAttendee["status"],
  ResponseType
> = {
  confirmed: "accepted",
  declined: "declined",
  tentative: "tentativelyAccepted",
  organizer: "organizer",
};

const scopes = [
  ...requiredScopes,
  // This scope is only supported for business accounts, we should not fail if it's not present
  "OnlineMeetings.ReadWrite",
  offlineAccessScope,
];

export class OutlookConnectedApp
  implements
    IOAuthConnectedApp,
    ICalendarBusyTimeProvider,
    IMailSenderApp,
    ICalendarWriter,
    IMeetingUrlProvider
{
  protected readonly loggerFactory: LoggerFactory;

  public constructor(protected readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "OutlookConnectedApp",
      props.organizationId,
    );
  }

  /** OAuth-only; admin does not call processRequest for Outlook. */
  processRequest?: IConnectedApp["processRequest"];

  public async getLoginUrl(appId: string): Promise<string> {
    const logger = this.loggerFactory("getLoginUrl");
    logger.debug({ appId }, "Generating Outlook login URL");

    try {
      const client = this.getMsalClient();
      const authParams = await this.getAuthParams(appId);

      const authUrl = await client.getAuthCodeUrl(authParams);

      logger.debug({ appId, url: authUrl }, "Generated Outlook login URL");

      return authUrl;
    } catch (error: any) {
      logger.error(
        { appId, error: error?.message || error?.toString() },
        "Error generating Outlook login URL",
      );
      throw error;
    }
  }

  public async processRedirect(
    request: ApiRequest,
  ): Promise<ConnectedAppResponse> {
    const logger = this.loggerFactory("processRedirect");
    logger.debug({ url: request.url }, "Processing Outlook OAuth redirect");

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
          "outlook.statusText.redirect_request_does_not_contain_app_id",
        );
      }

      if (!code) {
        logger.error(
          { appId },
          "Redirect request does not contain authorization code",
        );
        return {
          appId,
          error:
            "outlook.statusText.redirect_request_does_not_contain_authorization_code",
        };
      }

      logger.debug({ appId }, "Exchanging authorization code for tokens");

      const client = this.getMsalClient();
      const tokenRequest = {
        ...(await this.getAuthParams(appId)),
        code,
      };

      const _tokenResponse = await client.acquireTokenByCode(tokenRequest);

      try {
        const { tokens, username } = this.parseAuthResult(
          client,
          _tokenResponse,
          true,
        );

        logger.info(
          { appId, username },
          "Successfully processed Outlook OAuth redirect",
        );

        return {
          appId,
          token: {
            ...tokens,
            accessToken: tokens.accessToken
              ? encrypt(tokens.accessToken)
              : undefined,
            refreshToken: tokens.refreshToken
              ? encrypt(tokens.refreshToken)
              : undefined,
          },
          account: {
            username,
          },
        };
      } catch (e: any) {
        logger.error(
          { appId, error: e?.message || e?.toString() },
          "Error parsing authorization result",
        );
        return {
          appId,
          error:
            e instanceof ConnectedAppError
              ? e.key
              : "outlook.statusText.error_processing_configuration",
          errorArgs: e instanceof ConnectedAppError ? e.args : undefined,
        };
      }
    } catch (e: any) {
      logger.error(
        { url: request.url, error: e?.message || e?.toString() },
        "Error processing Outlook OAuth redirect",
      );
      return {
        appId: new URL(request.url).searchParams.get("state") as string,
        error:
          e instanceof ConnectedAppError
            ? e.key
            : "outlook.statusText.error_processing_configuration",
        errorArgs: e instanceof ConnectedAppError ? e.args : undefined,
      };
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
      },
      "Getting busy times from Outlook",
    );

    const tokens = app.token as ConnectedOauthAppTokens;
    if (!tokens?.accessToken) {
      logger.error({ appId: app._id }, "No token provided");
      throw new ConnectedAppError(
        "outlook.statusText.error_processing_configuration",
      );
    }

    try {
      const client = await this.getClient(app._id, tokens);

      logger.debug(
        { appId: app._id, start: start.toISOString(), end: end.toISOString() },
        "Retrieved Outlook client, fetching events",
      );

      const events = await this.getEvents(
        client,
        DateTime.fromJSDate(start),
        DateTime.fromJSDate(end),
      );

      logger.debug(
        { appId: app._id, eventCount: events.length },
        "Retrieved events from Outlook",
      );

      const result = events
        .filter(
          (event) =>
            event.start &&
            event.end &&
            event.subject &&
            event.showAs !== "free",
        )
        .map((event) => {
          const startAt = DateTime.fromISO(event.start?.dateTime!, {
            zone: "utc",
          }).toJSDate();

          const endAt = DateTime.fromISO(event.end?.dateTime!, {
            zone: "utc",
          }).toJSDate();

          const uid: string =
            event.singleValueExtendedProperties?.find(
              (p) => p.id === uidPropertyName,
            )?.value ??
            (event as any).uid ??
            event.iCalUId;

          return {
            startAt,
            endAt,
            uid,
            title: event.subject!,
          } satisfies CalendarBusyTime;
        });

      logger.info(
        { appId: app._id, busyTimeCount: result.length },
        "Successfully processed busy times from Outlook",
      );

      this.props.update({
        status: "connected",
        statusText:
          "app_outlook_admin.statusText.successfully_set_up" satisfies OutlookAdminAllKeys,
      });

      return result;
    } catch (e: any) {
      logger.error(
        { appId: app._id, error: e?.message || e?.toString() },
        "Error getting busy times from Outlook",
      );

      this.props.update({
        status: "failed",
        statusText:
          e instanceof ConnectedAppError
            ? e.key
            : ("app_outlook_admin.statusText.error_getting_busy_times" satisfies OutlookAdminAllKeys),
      });

      throw e;
    }
  }

  public async sendMail(
    app: ConnectedAppData,
    email: Email,
  ): Promise<EmailResponse> {
    const logger = this.loggerFactory("sendMail");
    logger.debug(
      {
        appId: app._id,
        subject: email.subject,
        to: Array.isArray(email.to) ? email.to : [email.to],
        hasAttachments: !!email.attachments?.length,
        hasIcalEvent: !!email.icalEvent,
      },
      "Sending email via Outlook",
    );

    const tokens = app.token as ConnectedOauthAppTokens;
    if (!tokens?.accessToken) {
      logger.error({ appId: app._id }, "No token provided");
      throw new ConnectedAppError(
        "outlook.statusText.error_processing_configuration",
      );
    }

    try {
      const client = await this.getClient(app._id, tokens);

      logger.debug(
        { appId: app._id, subject: email.subject },
        "Retrieved Outlook client, preparing email",
      );

      const to = Array.isArray(email.to) ? email.to : [email.to];
      const cc = email.cc
        ? Array.isArray(email.cc)
          ? email.cc
          : [email.cc]
        : [];

      const attachments: Attachment[] = [];
      if (email.icalEvent) {
        logger.debug(
          { appId: app._id, subject: email.subject },
          "Processing iCal event attachment",
        );

        const { value: icsContent, error: icsError } = createEvent(
          email.icalEvent.content,
        );

        if (!icsContent || !!icsError) {
          logger.error(
            { appId: app._id, icsError },
            "Failed to parse iCal event",
          );
          console.error(icsError || "Failed to parse event");
        } else {
          attachments.push({
            // @ts-expect-error This is required
            // "@odata.type": "#microsoft.graph.itemAttachment",
            "@odata.type": "#microsoft.graph.fileAttachment",
            isInline: false,
            contentType: `text/calendar; charset=utf-8; method=${email.icalEvent.method.toUpperCase()}`,
            name: email.icalEvent.filename || "invitation.ics",
            contentBytes: Buffer.from(icsContent).toString("base64"),
          } satisfies FileAttachment);
        }
      }

      if (email.attachments) {
        logger.debug(
          { appId: app._id, attachmentCount: email.attachments.length },
          "Processing email attachments",
        );

        for (const attachment of email.attachments) {
          const result = await this.props.services.assetsStorage.getFile(
            attachment.storageFilename,
          );
          if (!result) {
            throw new Error("Attachment not found");
          }
          const contentBytes = await readableToBase64(result.stream);
          attachments.push({
            // @ts-expect-error This is required
            "@odata.type": "#microsoft.graph.fileAttachment",
            name: attachment.filename,
            contentType: attachment.contentType,
            contentBytes,
            contentId: attachment.cid,
          } satisfies FileAttachment);
        }
      }

      const messageId = v4();
      const sendMail: {
        message: OutlookMessage;
        saveToSentItems: boolean;
      } = {
        message: {
          id: messageId,
          subject: email.subject,
          body: {
            contentType: "html",
            content: email.body,
          },
          toRecipients: to.map((address) => ({
            emailAddress: {
              address,
            },
          })),
          ccRecipients: cc.map((address) => ({
            emailAddress: {
              address,
            },
          })),
          attachments: attachments,
        },
        saveToSentItems: true,
      };

      logger.debug(
        { appId: app._id, messageId, subject: email.subject },
        "Sending email via Outlook API",
      );

      await client
        .api("/me/sendMail")
        // .header("Content-type", "text/plain")
        .post(sendMail);

      logger.info(
        { appId: app._id, messageId, subject: email.subject },
        "Successfully sent email via Outlook",
      );

      this.props.update({
        status: "connected",
        statusText:
          "app_outlook_admin.statusText.successfully_set_up" satisfies OutlookAdminAllKeys,
      });

      return {
        messageId,
      };
    } catch (e: any) {
      logger.error(
        {
          appId: app._id,
          subject: email.subject,
          error: e?.message || e?.toString(),
        },
        "Error sending email via Outlook",
      );

      this.props.update({
        status: "failed",
        statusText:
          e instanceof ConnectedAppError
            ? e.key
            : ("app_outlook_admin.statusText.error_sending_email" satisfies OutlookAdminAllKeys),
      });

      throw e;
    }
  }

  public async createEvent(
    app: ConnectedAppData,
    event: CalendarWriterEvent,
  ): Promise<CalendarWriterEventResult> {
    const logger = this.loggerFactory("createEvent");
    logger.debug(
      {
        appId: app._id,
        eventId: event.id,
        eventTitle: event.title,
      },
      "Creating event in Outlook",
    );

    const tokens = app.token as ConnectedOauthAppTokens;
    if (!tokens?.accessToken) {
      logger.error({ appId: app._id }, "No token provided");
      throw new ConnectedAppError(
        "app_outlook_admin.statusText.error_processing_configuration" satisfies OutlookAdminAllKeys,
      );
    }

    try {
      const client = await this.getClient(app._id, tokens);

      logger.debug(
        { appId: app._id, eventId: event.id, eventTitle: event.title },
        "Preparing Outlook event",
      );

      const result = (await client
        .api("/me/calendar/events")
        .post(this.getOutlookEvent(event))) as OutlookEvent;

      logger.info(
        {
          appId: app._id,
          eventId: event.id,
          eventTitle: event.title,
          outlookEventId: result.id,
        },
        "Successfully created event in Outlook",
      );

      return {
        uid: result.id!,
      };
    } catch (error: any) {
      logger.error(
        { appId: app._id, eventId: event.id, error },
        "Error creating event in Outlook",
      );

      this.props.update({
        status: "failed",
        statusText:
          error instanceof ConnectedAppError
            ? error.key
            : ("app_outlook_admin.statusText.error_creating_calendar_event" satisfies OutlookAdminAllKeys),
      });

      throw error;
    }
  }

  public async updateEvent(
    app: ConnectedAppData,
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
      },
      "Updating event in Outlook",
    );

    const tokens = app.token as ConnectedOauthAppTokens;
    if (!tokens?.accessToken) {
      logger.error({ appId: app._id }, "No token provided");
      throw new ConnectedAppError(
        "app_outlook_admin.statusText.error_processing_configuration" satisfies OutlookAdminAllKeys,
      );
    }

    try {
      const client = await this.getClient(app._id, tokens);
      const eventId = await this.getOutlookEventId(client, uid);

      logger.debug(
        { appId: app._id, eventId: event.id, uid, outlookEventId: eventId },
        "Preparing to update Outlook event",
      );

      const result = (await client
        .api(`/me/calendar/events/${eventId}`)
        .patch(this.getOutlookEvent(event))) as OutlookEvent;

      logger.info(
        {
          appId: app._id,
          eventId: event.id,
          uid,
          eventTitle: event.title,
          outlookEventId: result.id,
        },
        "Successfully updated event in Outlook",
      );

      return {
        uid: result.id!,
      };
    } catch (error: any) {
      logger.error(
        { appId: app._id, eventId: event.id, uid, error },
        "Error updating event in Outlook",
      );

      this.props.update({
        status: "failed",
        statusText:
          error instanceof ConnectedAppError
            ? error.key
            : ("app_outlook_admin.statusText.error_updating_calendar_event" satisfies OutlookAdminAllKeys),
      });

      throw error;
    }
  }

  public async deleteEvent(app: ConnectedAppData, uid: string): Promise<void> {
    const logger = this.loggerFactory("deleteEvent");
    logger.debug({ appId: app._id, uid }, "Deleting event from Outlook");

    const tokens = app.token as ConnectedOauthAppTokens;
    if (!tokens?.accessToken) {
      logger.error({ appId: app._id }, "No token provided");
      throw new ConnectedAppError(
        "outlook.statusText.error_processing_configuration",
      );
    }

    try {
      const client = await this.getClient(app._id, tokens);

      const id = await this.getOutlookEventId(client, uid);

      logger.debug(
        { appId: app._id, uid, outlookEventId: id },
        "Deleting Outlook event",
      );

      await client.api(`/me/calendar/events/${id}`).delete();

      logger.info(
        { appId: app._id, uid },
        "Successfully deleted event from Outlook",
      );
    } catch (error: any) {
      logger.error(
        { appId: app._id, uid, error },
        "Error deleting event from Outlook",
      );

      this.props.update({
        status: "failed",
        statusText:
          error instanceof ConnectedAppError
            ? error.key
            : ("app_outlook_admin.statusText.error_deleting_calendar_event" satisfies OutlookAdminAllKeys),
      });

      throw error;
    }
  }

  public async getMeetingUrl(
    app: ConnectedAppData,
    appointment: WithDatabaseId<AppointmentEvent>,
  ): Promise<AppointmentOnlineMeetingInformation> {
    const logger = this.loggerFactory("getMeetingUrl");
    logger.debug(
      { appointmentId: appointment._id },
      "Getting meeting URL for appointment",
    );

    const tokens = app.token as ConnectedOauthAppTokens;
    if (!tokens?.accessToken) {
      logger.error({ appId: app._id }, "No token provided");
      throw new ConnectedAppError(
        "app_outlook_admin.statusText.error_processing_configuration" satisfies OutlookAdminAllKeys,
      );
    }
    try {
      const client = await this.getClient(app._id, tokens);
      const startDateTime = DateTime.fromJSDate(appointment.dateTime)
        .setZone(appointment.timeZone)
        .toUTC();
      const response = (await client.api(`/me/onlineMeetings`).post({
        subject: appointment.option.name,
        startDateTime: startDateTime.toISO(),
        endDateTime: startDateTime
          .plus({ minutes: appointment.totalDuration })
          .toISO(),
      } satisfies OnlineMeeting)) as OnlineMeeting;

      if (
        !response.joinWebUrl ||
        !response.joinMeetingIdSettings?.joinMeetingId
      ) {
        throw new ConnectedAppError(
          "app_outlook_admin.statusText.failed_to_get_meeting_url_for_appointment" satisfies OutlookAdminAllKeys,
        );
      }

      return {
        url: response.joinWebUrl,
        meetingId: response.joinMeetingIdSettings.joinMeetingId,
        meetingPassword: response.joinMeetingIdSettings?.passcode ?? undefined,
        type: "microsoft_teams",
      };
    } catch (error: any) {
      logger.error(
        { appointmentId: appointment._id, error },
        "Error getting meeting URL for appointment",
      );
      throw error;
    }
  }

  private async getOutlookEventId(
    client: Client,
    uid: string,
  ): Promise<string> {
    const logger = this.loggerFactory("getOutlookEventId");
    logger.debug({ uid }, "Looking up Outlook Event ID for UID");

    try {
      const response = await client
        .api("/me/calendar/events")
        .filter(
          `singleValueExtendedProperties/Any(ep: ep/id eq '${uidPropertyName}' and ep/value eq '${uid}')`,
        )
        .select("id")
        .get();

      const id = (response.value as OutlookEvent[])?.[0]?.id;
      if (!id) {
        logger.error({ uid }, "Failed to find Outlook Event ID for UID");
        throw new ConnectedAppError(
          "outlook.statusText.failed_to_find_event_id_for_uid",
          { uid },
        );
      }

      logger.debug(
        { uid, outlookEventId: id },
        "Found Outlook Event ID for UID",
      );
      return id;
    } catch (error: any) {
      logger.error({ uid, error }, "Error looking up Outlook Event ID for UID");
      throw error;
    }
  }

  private getOutlookEvent(event: CalendarWriterEvent): OutlookEvent {
    const logger = this.loggerFactory("getOutlookEvent");
    logger.debug(
      {
        eventId: event.id,
        eventTitle: event.title,
        attendeeCount: event.attendees?.length || 0,
      },
      "Converting event to Outlook format",
    );

    const start = DateTime.fromJSDate(event.startTime)
      .setZone(event.timeZone)
      .toUTC();

    const end = start.plus({ minutes: event.duration });

    const outlookEvent: OutlookEvent = {
      subject: event.title,
      body: {
        content: event.description.html,
        contentType: "html",
      },
      start: {
        dateTime: start.toISO()!,
        timeZone: "UTC",
      },
      end: {
        dateTime: end.toISO()!,
        timeZone: "UTC",
      },
      attendees: event.attendees
        ?.filter((attendee) => attendee.status !== "organizer") // Will be added automatically
        .map((attendee) => ({
          emailAddress: {
            address: attendee.email,
            name: attendee.name,
          },
          type: attendee.type,
          status: {
            response: attendeeStatusToResponseStatusMap[attendee.status],
          },
        })),
      location: {
        displayName: `${event.location.name}${event.location.address ? `, ${event.location.address}` : ""}`,
      },
      singleValueExtendedProperties: [
        {
          id: uidPropertyName,
          value: event.uid,
        },
      ],
    };

    logger.debug(
      {
        eventId: event.id,
        eventTitle: event.title,
        startTime: start.toISO(),
        endTime: end.toISO(),
      },
      "Converted event to Outlook format",
    );

    return outlookEvent;
  }

  private async getEventsPaginated(
    client: Client,
    start: DateTime,
    end: DateTime,
    skip: number,
    top: number,
  ) {
    return await client
      .api("/me/calendarview")
      .query(`startDateTime=${start.toISO()}&endDateTime=${end.toISO()}`)
      .expand(
        `singleValueExtendedProperties($filter=id eq '${uidPropertyName}')`,
      )
      // .select("uid,start,end,showAs,subject")
      .count(true)
      .skip(skip)
      .top(top)
      .get();
  }

  private async getEvents(
    client: Client,
    start: DateTime,
    end: DateTime,
  ): Promise<OutlookEvent[]> {
    const logger = this.loggerFactory("getEvents");
    logger.debug(
      { start: start.toISO(), end: end.toISO() },
      "Fetching events from Outlook",
    );

    const results: OutlookEvent[] = [];
    let skip = 0;
    let count = 0;
    const top = 1000;

    do {
      logger.debug(
        { skip, top, currentCount: results.length },
        "Fetching paginated events from Outlook",
      );

      const response = await this.getEventsPaginated(
        client,
        start,
        end,
        skip,
        top,
      );
      count = response["@odata.count"];

      results.push(...(response.value as OutlookEvent[]));
      skip += top;
    } while (skip < count);

    logger.debug(
      { totalCount: results.length, start: start.toISO(), end: end.toISO() },
      "Retrieved all events from Outlook",
    );

    return results;
  }

  private async getClient(
    appId: string,
    tokens: ConnectedOauthAppTokens,
  ): Promise<Client> {
    const accessToken = this.getOrRefreshAuthToken(appId, tokens);

    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => await accessToken,
      },
    });

    return client;
  }

  private async getOrRefreshAuthToken(
    appId: string,
    currentTokens: ConnectedOauthAppTokens,
  ): Promise<string> {
    const logger = this.loggerFactory("getOrRefreshAuthToken");
    if (!currentTokens.expiresOn || currentTokens.expiresOn >= new Date()) {
      logger.debug({ appId }, "Using existing access token");
      return decrypt(currentTokens.accessToken);
    }

    logger.debug({ appId }, "Access token expired, refreshing");

    const client = this.getMsalClient();
    const refreshToken = decrypt(currentTokens.refreshToken);

    const tokenRequest = {
      ...(await this.getAuthParams(appId)),
      refreshToken,
    };

    try {
      const result = await client.acquireTokenByRefreshToken(tokenRequest);
      if (!result) {
        logger.error({ appId }, "Failed to refresh access token");
        throw new ConnectedAppError(
          "outlook.statusText.error_refreshing_access_token",
        );
      }

      const { username, tokens } = this.parseAuthResult(client, result, false);
      this.props.update({
        account: {
          username,
        },
        token: {
          refreshToken: currentTokens.refreshToken,
          ...tokens,
          accessToken: encrypt(tokens.accessToken!),
        },
      });

      logger.debug({ appId, username }, "Successfully refreshed access token");
      return tokens.accessToken!;
    } catch (e: any) {
      logger.error(
        { appId, error: e?.message || e?.toString() },
        "Failed to refresh access token",
      );

      this.props.update({
        status: "failed",
        statusText:
          "app_outlook_admin.statusText.error_refreshing_access_token" satisfies OutlookAdminAllKeys,
      });

      throw e;
    }
  }

  private parseAuthResult(
    client: ConfidentialClientApplication,
    authResult: AuthenticationResult,
    expectRefreshToken: boolean,
  ): {
    tokens: Partial<ConnectedOauthAppTokens>;
    username: string;
  } {
    const logger = this.loggerFactory("parseAuthResult");
    logger.debug(
      { expectRefreshToken, hasAccessToken: !!authResult.accessToken },
      "Parsing authorization result",
    );

    const username = authResult.account?.username;
    if (!authResult.accessToken) {
      logger.error("Authorization result does not contain access token");
      throw new ConnectedAppError(
        "outlook.statusText.authorization_result_no_access_token",
      );
    }

    if (!username) {
      logger.error("Authorization result does not contain account information");
      throw new ConnectedAppError(
        "app_outlook_admin.statusText.authorization_result_no_account_info" satisfies OutlookAdminAllKeys,
      );
    }

    if (requiredScopes.some((s) => authResult.scopes.indexOf(s) < 0)) {
      logger.error(
        { requiredScopes, actualScopes: authResult.scopes },
        "Authorization result does not contain enough scopes",
      );
      throw new ConnectedAppError(
        "app_outlook_admin.statusText.authorization_result_not_enough_scopes" satisfies OutlookAdminAllKeys,
      );
    }

    const tokens: Partial<ConnectedOauthAppTokens> = {
      accessToken: authResult.accessToken,
      expiresOn: authResult.expiresOn,
    };

    if (expectRefreshToken) {
      const tokenCache = client.getTokenCache().serialize();
      const refreshTokenObject = JSON.parse(tokenCache).RefreshToken;
      const refreshToken =
        refreshTokenObject[Object.keys(refreshTokenObject)[0]].secret;

      if (!refreshToken) {
        logger.error("Authorization result does not contain refresh token");
        throw new ConnectedAppError(
          "app_outlook_admin.statusText.authorization_result_no_refresh_token" satisfies OutlookAdminAllKeys,
        );
      }

      tokens.refreshToken = refreshToken;
      logger.debug(
        { username },
        "Successfully parsed authorization result with refresh token",
      );
    } else {
      logger.debug({ username }, "Successfully parsed authorization result");
    }

    return { tokens, username };
  }

  private async getAuthParams(appId: string): Promise<AuthorizationUrlRequest> {
    const url = getAdminUrl();
    const redirectUri = `${url}/apps/oauth/outlook/redirect`;
    return {
      scopes,
      redirectUri,
      state: appId,
    };
  }

  private getMsalClient() {
    const msalConfig: MsalConfig = {
      auth: {
        clientId: process.env.OUTLOOK_APP_CLIENT_ID!,
        clientSecret: process.env.OUTLOOK_APP_CLIENT_SECRET!,
        authority: `https://login.microsoftonline.com/${
          process.env.OUTLOOK_APP_TENNANT_ID || "common"
        }`,
      },
      system: {
        loggerOptions: {
          loggerCallback(loglevel, message, containsPii) {
            console.log(message);
          },
          piiLoggingEnabled: false,
          logLevel: LogLevel.Info,
        },
      },
    };

    return new ConfidentialClientApplication(msalConfig);
  }
}

export default OutlookConnectedApp;
