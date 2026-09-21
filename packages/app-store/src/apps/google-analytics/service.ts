import { analyticsadmin, auth as googleAuth } from "@googleapis/analyticsadmin";
import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import {
  ApiRequest,
  ConnectedAppData,
  ConnectedAppError,
  ConnectedAppRequestError,
  ConnectedAppResponse,
  EventEnvelope,
  IConnectedAppProps,
  IEventSubscriber,
  IOAuthConnectedApp,
  IScriptProvider,
  LayoutScriptProviderContext,
  okStatus,
  ScriptContribution,
} from "@hacado/types";
import { getAdminUrl } from "@hacado/utils";
import { decrypt, encrypt } from "@hacado/utils/server";
import {
  GA4_USER_DATA_COLLECTION_ACKNOWLEDGEMENT,
  GOOGLE_ANALYTICS_APP_NAME,
  HACADO_MEASUREMENT_PROTOCOL_SECRET_NAME,
} from "./const";
import { buildGtagScripts } from "./gtag-scripts";
import { mapGa4Event, stableGaClientId } from "./map-ga4-event";
import {
  DataStreamListItem,
  GoogleAnalyticsConfiguration,
  RequestAction,
  requestActionSchema,
} from "./models";
import { GoogleAnalyticsAdminAllKeys } from "./translations/types";

/** Token shape stored on the connected app (encrypted at rest). */
type GoogleOAuthTokens = {
  access_token?: string | null;
  refresh_token?: string | null;
  scope?: string | null;
  id_token?: string | null;
  expiry_date?: number | null;
  token_type?: string | null;
};

const accessType = "offline";

const requiredScopes = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/analytics.edit",
];

class GoogleAnalyticsConnectedApp
  implements IOAuthConnectedApp, IScriptProvider, IEventSubscriber
{
  protected readonly loggerFactory: LoggerFactory;

  public constructor(protected readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "GoogleAnalyticsConnectedApp",
      props.organizationId,
    );
  }

  public async processRequest(
    appData: ConnectedAppData<GoogleAnalyticsConfiguration>,
    request: RequestAction,
  ) {
    const logger = this.loggerFactory("processRequest");
    logger.debug(
      { appId: appData._id, type: request.type },
      "Processing Google Analytics request",
    );

    const { data, success, error } = requestActionSchema.safeParse(request);
    if (!success) {
      logger.error({ error }, "Invalid Google Analytics request");
      throw new ConnectedAppRequestError(
        "invalid_google_analytics_request",
        { request },
        400,
        error.message,
      );
    }

    try {
      switch (data.type) {
        case "get-selected-data-stream": {
          if (
            !appData.data?.propertyId ||
            !appData.data?.streamId ||
            !appData.data?.measurementId
          ) {
            return undefined;
          }

          return {
            propertyId: appData.data.propertyId,
            propertyName: appData.data.propertyName ?? "",
            streamId: appData.data.streamId,
            streamName: appData.data.streamName ?? "",
            measurementId: appData.data.measurementId,
          } satisfies DataStreamListItem;
        }

        case "get-data-stream-list": {
          const streamList = await this.getDataStreamList(appData);
          logger.info(
            { appId: appData._id, streamCount: streamList.length },
            "Retrieved Google Analytics data stream list",
          );
          return streamList;
        }

        case "set-data-stream": {
          const stream = data.stream;
          const apiSecret = await this.ensureMeasurementProtocolSecret(
            appData,
            stream.propertyId,
            stream.streamId,
          );

          const label = `${stream.propertyName} — ${stream.streamName}`;
          await this.props.update({
            data: {
              ...(appData.data ?? {}),
              propertyId: stream.propertyId,
              propertyName: stream.propertyName,
              streamId: stream.streamId,
              streamName: stream.streamName,
              measurementId: stream.measurementId,
              apiSecret: encrypt(apiSecret),
            },
            account: {
              ...((appData.account as any) ?? {}),
              additional: label,
            },
            status: "connected",
            statusText:
              "app_google-analytics_admin.statusText.successfully_set_up" satisfies GoogleAnalyticsAdminAllKeys,
          });

          logger.info(
            {
              appId: appData._id,
              propertyId: stream.propertyId,
              streamId: stream.streamId,
              measurementId: stream.measurementId,
            },
            "Set Google Analytics data stream",
          );
          return;
        }

        default:
          return okStatus;
      }
    } catch (err: any) {
      logger.error(
        { appId: appData._id, type: data.type, error: err },
        "Error processing Google Analytics request",
      );
      throw err;
    }
  }

  public async getLoginUrl(appId: string): Promise<string> {
    const logger = this.loggerFactory("getLoginUrl");
    logger.debug({ appId }, "Generating Google Analytics login URL");

    try {
      const client = this.getOAuthClient();
      const redirectUri = this.getRedirectUri();
      return client.generateAuthUrl({
        access_type: accessType,
        scope: requiredScopes,
        state: appId,
        prompt: "consent",
        include_granted_scopes: true,
        redirect_uri: redirectUri,
      });
    } catch (error: any) {
      logger.error(
        { appId, error },
        "Error generating Google Analytics login URL",
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
      "Processing Google Analytics OAuth redirect",
    );

    try {
      const url = new URL(request.url);
      const appId = url.searchParams.get("state") as string;
      const code = url.searchParams.get("code") as string;
      const client = this.getOAuthClient();

      if (!appId) {
        throw new ConnectedAppError(
          "app_google-analytics_admin.statusText.redirect_request_does_not_contain_app_id" satisfies GoogleAnalyticsAdminAllKeys,
        );
      }

      if (!code) {
        throw new ConnectedAppError(
          "app_google-analytics_admin.statusText.redirect_request_does_not_contain_authorization_code" satisfies GoogleAnalyticsAdminAllKeys,
        );
      }

      const tokenResponse = await client.getToken({
        code,
        redirect_uri: this.getRedirectUri(),
      });
      const tokens = tokenResponse.tokens;

      if (!tokens?.access_token || !tokens.refresh_token || !tokens.id_token) {
        throw new ConnectedAppError(
          "app_google-analytics_admin.statusText.app_was_not_authorized_properly" satisfies GoogleAnalyticsAdminAllKeys,
        );
      }

      if (!requiredScopes.every((s) => !!tokens.scope?.includes(s))) {
        throw new ConnectedAppError(
          "app_google-analytics_admin.statusText.app_was_not_given_required_scopes" satisfies GoogleAnalyticsAdminAllKeys,
        );
      }

      const ticket = await client.verifyIdToken({ idToken: tokens.id_token });
      const email = ticket.getPayload()?.email;

      if (!email) {
        throw new ConnectedAppError(
          "app_google-analytics_admin.statusText.failed_to_get_user_email" satisfies GoogleAnalyticsAdminAllKeys,
        );
      }

      logger.info(
        { appId, email },
        "Successfully processed Google Analytics OAuth redirect",
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
        "Error processing Google Analytics OAuth redirect",
      );
      throw e;
    }
  }

  public async afterOAuthConnected(
    appData: ConnectedAppData<GoogleAnalyticsConfiguration>,
  ): Promise<void> {
    const logger = this.loggerFactory("afterOAuthConnected");
    logger.debug(
      {
        appId: appData._id,
        status: appData.status,
        hasMeasurementId: !!appData.data?.measurementId,
      },
      "Running afterOAuthConnected",
    );

    if (appData.data?.measurementId) {
      logger.info(
        { appId: appData._id, measurementId: appData.data.measurementId },
        "Data stream already configured; leaving connected",
      );
      return;
    }

    logger.info(
      { appId: appData._id },
      "OAuth complete; setting pending until data stream is selected",
    );

    await this.props.update({
      status: "pending",
      statusText:
        "app_google-analytics_admin.statusText.requires_data_stream" satisfies GoogleAnalyticsAdminAllKeys,
    });
  }

  public async provideLayoutHeaderScripts(
    appData: ConnectedAppData<GoogleAnalyticsConfiguration>,
    _ctx: LayoutScriptProviderContext,
  ): Promise<ScriptContribution[] | undefined> {
    if (appData.status !== "connected") return undefined;

    const measurementId = appData.data?.measurementId;
    if (!measurementId) return undefined;

    return buildGtagScripts(measurementId);
  }

  public async onEvent(
    appData: ConnectedAppData<GoogleAnalyticsConfiguration>,
    envelope: EventEnvelope,
  ): Promise<void> {
    const logger = this.loggerFactory("onEvent");

    logger.info(
      {
        appId: appData._id,
        eventType: envelope.type,
        eventId: envelope.id,
        actor: envelope.source?.actor,
        status: appData.status,
      },
      "Google Analytics received event",
    );

    if (appData.status !== "connected") {
      logger.info(
        {
          appId: appData._id,
          status: appData.status,
          eventType: envelope.type,
        },
        "Google Analytics is not connected; skipping event",
      );
      return;
    }

    const measurementId = appData.data?.measurementId;
    const encryptedSecret = appData.data?.apiSecret;
    if (!measurementId || !encryptedSecret) {
      logger.info(
        {
          appId: appData._id,
          eventType: envelope.type,
          hasMeasurementId: !!measurementId,
          hasApiSecret: !!encryptedSecret,
        },
        "Google Analytics Measurement Protocol is not configured; skipping event",
      );
      return;
    }

    try {
      const { general } =
        await this.props.services.configurationService.getConfigurations(
          "general",
        );

      const currency = general?.currency ?? "USD";
      const mapped = mapGa4Event(envelope, currency);
      if (!mapped) {
        logger.info(
          {
            appId: appData._id,
            eventType: envelope.type,
            actor: envelope.source?.actor,
          },
          "Google Analytics event is not mapped (non-public or unsupported); skipping",
        );
        return;
      }

      const apiSecret = decrypt(encryptedSecret);
      const body = {
        client_id: stableGaClientId(mapped.clientIdSeed),
        events: [
          {
            name: mapped.name,
            params: mapped.params,
          },
        ],
      };

      const url = new URL("https://www.google-analytics.com/mp/collect");
      url.searchParams.set("measurement_id", measurementId);
      url.searchParams.set("api_secret", apiSecret);

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        logger.warn(
          {
            appId: appData._id,
            eventType: envelope.type,
            measurementId,
            status: response.status,
          },
          "Google Analytics Measurement Protocol request failed",
        );
        return;
      }

      logger.info(
        {
          appId: appData._id,
          eventType: envelope.type,
          measurementId,
          gaEvent: mapped.name,
          transactionId: mapped.params.transaction_id,
        },
        "Sent Google Analytics Measurement Protocol event",
      );
    } catch (error: any) {
      logger.error(
        {
          appId: appData._id,
          eventType: envelope.type,
          error: error?.message || error?.toString(),
        },
        "Error sending Google Analytics Measurement Protocol event",
      );
    }
  }

  private async getDataStreamList(
    appData: ConnectedAppData,
  ): Promise<DataStreamListItem[]> {
    const logger = this.loggerFactory("getDataStreamList");

    logger.debug(
      { appId: appData._id },
      "Listing Google Analytics data streams",
    );

    try {
      const client = await this.getAnalyticsAdminClient(appData);
      const streams: DataStreamListItem[] = [];
      let pageToken: string | undefined;

      do {
        logger.debug(
          { appId: appData._id, pageToken },
          "Listing Google Analytics data streams",
        );

        const response = await client.accountSummaries.list({
          pageSize: 200,
          pageToken,
        });

        logger.debug(
          { appId: appData._id, response },
          "Google Analytics data streams response",
        );

        pageToken = response.data.nextPageToken ?? undefined;

        for (const account of response.data.accountSummaries ?? []) {
          logger.debug(
            { appId: appData._id, account },
            "Google Analytics data streams account",
          );

          for (const property of account.propertySummaries ?? []) {
            logger.debug(
              { appId: appData._id, property },
              "Google Analytics data streams property",
            );

            const propertyName = property.property;
            if (!propertyName) continue;

            const propertyId = propertyName.replace(/^properties\//, "");
            const displayName = property.displayName || propertyId;

            logger.debug(
              { appId: appData._id, displayName },
              "Google Analytics data streams displayName",
            );

            let streamPageToken: string | undefined;
            do {
              const streamResponse = await client.properties.dataStreams.list({
                parent: propertyName,
                pageSize: 200,
                pageToken: streamPageToken,
              });

              logger.debug(
                { appId: appData._id, streamResponse },
                "Google Analytics data streams stream response",
              );

              streamPageToken = streamResponse.data.nextPageToken ?? undefined;

              for (const stream of streamResponse.data.dataStreams ?? []) {
                if (stream.type !== "WEB_DATA_STREAM") {
                  logger.debug(
                    { appId: appData._id, stream },
                    "Google Analytics data streams stream is not a web data stream; skipping",
                  );

                  continue;
                }

                const measurementId = stream.webStreamData?.measurementId;
                const streamResource = stream.name;
                if (!measurementId || !streamResource) {
                  logger.debug(
                    { appId: appData._id, stream },
                    "Google Analytics data streams stream is not a web data stream; skipping",
                  );

                  continue;
                }

                const streamId = streamResource.split("/").pop();
                if (!streamId) continue;

                streams.push({
                  propertyId,
                  propertyName: displayName,
                  streamId,
                  streamName: stream.displayName || measurementId,
                  measurementId,
                });
              }
            } while (streamPageToken);
          }
        }
      } while (pageToken);

      logger.debug(
        { appId: appData._id, streamsCount: streams.length },
        "Google Analytics data streams",
      );

      return streams;
    } catch (error: any) {
      logger.error(
        { appId: appData._id, error },
        "Failed to list data streams",
      );
      throw new ConnectedAppError(
        "app_google-analytics_admin.statusText.failed_to_retrieve_data_stream_list" satisfies GoogleAnalyticsAdminAllKeys,
      );
    }
  }

  private async ensureMeasurementProtocolSecret(
    appData: ConnectedAppData<GoogleAnalyticsConfiguration>,
    propertyId: string,
    streamId: string,
  ): Promise<string> {
    const logger = this.loggerFactory("ensureMeasurementProtocolSecret");
    const parent = `properties/${propertyId}/dataStreams/${streamId}`;

    logger.debug(
      { appId: appData._id, parent },
      "Ensuring Measurement Protocol secret",
    );

    // List API never returns secretValue; reuse our stored secret for the same stream.
    if (
      appData.data?.streamId === streamId &&
      appData.data?.propertyId === propertyId &&
      appData.data?.apiSecret
    ) {
      logger.debug(
        { appId: appData._id },
        "Reusing existing Measurement Protocol secret",
      );

      return decrypt(appData.data.apiSecret);
    }

    try {
      logger.debug(
        { appId: appData._id },
        "Creating Google Analytics admin client",
      );

      const client = await this.getAnalyticsAdminClient(appData);

      // Required by Google before Measurement Protocol secrets can be created.
      await client.properties.acknowledgeUserDataCollection({
        property: `properties/${propertyId}`,
        requestBody: {
          acknowledgement: GA4_USER_DATA_COLLECTION_ACKNOWLEDGEMENT,
        },
      });

      logger.debug(
        { appId: appData._id },
        "Acknowledged Google Analytics user data collection",
      );

      const existingNames = new Set<string>();
      let pageToken: string | undefined;

      do {
        const listed =
          await client.properties.dataStreams.measurementProtocolSecrets.list({
            parent,
            pageSize: 200,
            pageToken,
          });

        logger.debug(
          { appId: appData._id, listed },
          "Google Analytics data streams measurement protocol secrets list",
        );

        pageToken = listed.data.nextPageToken ?? undefined;

        for (const secret of listed.data.measurementProtocolSecrets ?? []) {
          if (secret.displayName) existingNames.add(secret.displayName);
        }
      } while (pageToken);

      logger.debug(
        { appId: appData._id, existingNamesCount: existingNames.size },
        "Google Analytics data streams measurement protocol secrets",
      );

      const displayName = existingNames.has(
        HACADO_MEASUREMENT_PROTOCOL_SECRET_NAME,
      )
        ? `${HACADO_MEASUREMENT_PROTOCOL_SECRET_NAME}-${Date.now()}`
        : HACADO_MEASUREMENT_PROTOCOL_SECRET_NAME;

      logger.debug(
        { appId: appData._id, displayName },
        "Creating Google Analytics data streams measurement protocol secret",
      );

      const created =
        await client.properties.dataStreams.measurementProtocolSecrets.create({
          parent,
          requestBody: { displayName },
        });

      logger.debug(
        { appId: appData._id, created },
        "Google Analytics data streams measurement protocol secret created",
      );

      const secretValue = created.data.secretValue;
      if (!secretValue) {
        logger.error(
          { appId: appData._id },
          "Failed to create Google Analytics data streams measurement protocol secret",
        );

        throw new ConnectedAppError(
          "app_google-analytics_admin.statusText.failed_to_create_measurement_protocol_secret" satisfies GoogleAnalyticsAdminAllKeys,
        );
      }

      logger.debug(
        { appId: appData._id, secretValue },
        "Google Analytics data streams measurement protocol secret value",
      );

      return secretValue;
    } catch (error: any) {
      if (error instanceof ConnectedAppError) throw error;

      logger.error(
        { appId: appData._id, propertyId, streamId, error },
        "Failed to ensure Measurement Protocol secret",
      );
      throw new ConnectedAppError(
        "app_google-analytics_admin.statusText.failed_to_create_measurement_protocol_secret" satisfies GoogleAnalyticsAdminAllKeys,
      );
    }
  }

  private async getAnalyticsAdminClient(appData: ConnectedAppData) {
    const authClient = await this.getOAuthClientWithCredentials(appData);
    return analyticsadmin({
      version: "v1beta",
      auth: authClient,
    });
  }

  private getRedirectUri() {
    return `${getAdminUrl()}/apps/oauth/${GOOGLE_ANALYTICS_APP_NAME}/redirect`;
  }

  private getOAuthClient() {
    const logger = this.loggerFactory("getOAuthClient");
    const clientId = process.env.GOOGLE_ANALYTICS_APP_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_ANALYTICS_APP_CLIENT_SECRET;
    const redirectUri = this.getRedirectUri();

    if (!clientId || !clientSecret) {
      logger.error(
        {
          hasClientId: !!clientId,
          hasClientSecret: !!clientSecret,
          redirectUri,
        },
        "Google Analytics OAuth env vars are not configured",
      );
      throw new ConnectedAppError(
        "app_google-analytics_admin.statusText.missing_oauth_config" satisfies GoogleAnalyticsAdminAllKeys,
      );
    }

    if (!process.env.ADMIN_DOMAIN) {
      logger.error({ redirectUri }, "ADMIN_DOMAIN is not configured");
      throw new ConnectedAppError(
        "app_google-analytics_admin.statusText.missing_oauth_config" satisfies GoogleAnalyticsAdminAllKeys,
      );
    }

    logger.debug({ redirectUri }, "Creating Google OAuth client");

    // Use analyticsadmin's AuthPlus.OAuth2 so the client type matches analyticsadmin({ auth }).
    // Pass an options object — positional args drop redirectUri when clientId is undefined.
    return new googleAuth.OAuth2({
      clientId,
      clientSecret,
      redirectUri,
    });
  }

  private async getOAuthClientWithCredentials(appData: ConnectedAppData) {
    const logger = this.loggerFactory("getOAuthClientWithCredentials");
    logger.debug(
      { appId: appData._id },
      "Creating Google OAuth client with credentials",
    );

    try {
      const client = this.getOAuthClient();
      const token = appData.token as GoogleOAuthTokens | undefined;

      // `{ ...undefined }` is still a truthy object — check the source tokens.
      if (!token?.access_token || !token?.refresh_token) {
        logger.error({ appId: appData._id }, "App is not authorized");
        throw new Error("App is not authorized");
      }

      const credentials = {
        ...token,
        access_token: decrypt(token.access_token),
        refresh_token: decrypt(token.refresh_token),
      };

      // Nested google-auth-library under @googleapis/analyticsadmin has a distinct Credentials type.
      client.setCredentials(
        credentials as Parameters<typeof client.setCredentials>[0],
      );
      client.on("tokens", async (tokens) => {
        logger.debug(
          { appId: appData._id },
          "Received new tokens from Google OAuth",
        );

        await this.props.update({
          token: {
            ...token,
            ...tokens,
            access_token: encrypt(tokens.access_token!),
            refresh_token: encrypt(
              tokens.refresh_token || token.refresh_token!,
            ),
          },
        });
      });

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

export default GoogleAnalyticsConnectedApp;
