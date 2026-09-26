import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import {
  ApiRequest,
  ConnectedAppData,
  ConnectedAppError,
  ConnectedAppRequestError,
  ConnectedAppResponse,
  ConnectedAppStatusWithText,
  ConnectedAppUninstallResult,
  ConnectedOauthAppTokens,
  Email,
  EmailResponse,
  IConnectedAppProps,
  IMailSenderApp,
  INeedsAttentionApp,
  IOAuthConnectedApp,
  NeedsAttentionItem,
  OrganizationMember,
  SessionUser,
} from "@hacado/types";
import { getAdminUrl } from "@hacado/utils";
import { decrypt, encrypt } from "@hacado/utils/server";
import { createEvent } from "ics";
import { Resend } from "resend";
import { Readable } from "stream";
import {
  exchangeAuthorizationCode,
  generatePkcePair,
  getResendOAuthCredentials,
  loadConnectedApp,
  RESEND_OAUTH_AUTHORIZE_URL,
  RESEND_OAUTH_SCOPE,
  ResendOAuthClient,
  revokeResendToken,
} from "./client";
import { RESEND_APP_NAME } from "./const";
import {
  ResendAppData,
  ResendFromSettings,
  resendFromSettingsSchema,
} from "./models";
import {
  ResendAdminAllKeys,
  ResendAdminKeys,
  ResendAdminNamespace,
} from "./translations/types";

async function readableToBuffer(readable: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function statusTextKey(statusText: ConnectedAppData["statusText"]): string {
  if (typeof statusText === "string") {
    return statusText;
  }

  if (statusText && typeof statusText === "object" && "key" in statusText) {
    return String(statusText.key);
  }

  return "";
}

const REQUIRES_SENDER =
  "app_resend_admin.statusText.requires_sender_settings" satisfies ResendAdminAllKeys;

export class ResendConnectedApp
  implements
    IOAuthConnectedApp<ResendAppData, ConnectedOauthAppTokens>,
    IMailSenderApp,
    INeedsAttentionApp
{
  protected readonly loggerFactory: LoggerFactory;

  public constructor(protected readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "ResendConnectedApp",
      props.organizationId,
    );
  }

  public async getLoginUrl(appId: string): Promise<string> {
    const logger = this.loggerFactory("getLoginUrl");
    logger.debug({ appId }, "Generating Resend login URL");

    try {
      const { clientId } = getResendOAuthCredentials();
      logger.debug(
        { appId, hasClientId: !!clientId },
        "Loaded Resend OAuth client credentials",
      );

      const { codeVerifier, codeChallenge } = generatePkcePair();
      logger.debug(
        { appId },
        "Generated PKCE code_verifier and code_challenge",
      );

      const existing = await loadConnectedApp(
        this.props.getDbConnection,
        appId,
      );
      const existingData = existing?.data ?? {};
      logger.debug(
        {
          appId,
          appFound: !!existing,
          hasExistingFromEmail: !!existingData.fromEmail,
          previousStatus: existing?.status,
        },
        "Loaded pending connected app for PKCE storage",
      );

      await this.props.update({
        data: {
          ...existingData,
          pkceCodeVerifier: encrypt(codeVerifier),
        } satisfies ResendAppData,
      });
      logger.debug({ appId }, "Persisted encrypted PKCE code_verifier");

      const redirectUri = `${getAdminUrl()}/apps/oauth/${RESEND_APP_NAME}/redirect`;
      const authUrl = new URL(RESEND_OAUTH_AUTHORIZE_URL);
      authUrl.searchParams.set("client_id", clientId);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("scope", RESEND_OAUTH_SCOPE);
      authUrl.searchParams.set("state", appId);
      authUrl.searchParams.set("code_challenge", codeChallenge);
      authUrl.searchParams.set("code_challenge_method", "S256");

      logger.info(
        {
          appId,
          redirectUri,
          scope: RESEND_OAUTH_SCOPE,
          authorizeHost: authUrl.host,
        },
        "Generated Resend login URL",
      );
      return authUrl.toString();
    } catch (error: unknown) {
      logger.error(
        {
          appId,
          error: error instanceof Error ? error.message : String(error),
        },
        "Error generating Resend login URL",
      );
      throw error;
    }
  }

  public async processRedirect(
    request: ApiRequest,
  ): Promise<ConnectedAppResponse> {
    const logger = this.loggerFactory("processRedirect");
    logger.debug({ url: request.url }, "Processing Resend OAuth redirect");

    try {
      const url = new URL(request.url);
      const appId = url.searchParams.get("state") as string;
      const code = url.searchParams.get("code") as string;
      const oauthError = url.searchParams.get("error");
      const oauthErrorDescription = url.searchParams.get("error_description");

      logger.debug(
        {
          appId,
          hasCode: !!code,
          oauthError,
          oauthErrorDescription,
        },
        "Extracted OAuth parameters from redirect",
      );

      if (!appId) {
        logger.error(
          { url: request.url },
          "Redirect request does not contain app ID (state)",
        );
        throw new ConnectedAppError(
          "app_resend_admin.statusText.redirect_request_does_not_contain_app_id" satisfies ResendAdminAllKeys,
        );
      }

      if (oauthError) {
        logger.error(
          { appId, oauthError, oauthErrorDescription },
          "Resend authorization denied or failed",
        );
        return {
          appId,
          error:
            "app_resend_admin.statusText.oauth_error" satisfies ResendAdminAllKeys,
        };
      }

      if (!code) {
        logger.error(
          { appId },
          "Redirect request does not contain authorization code",
        );
        return {
          appId,
          error:
            "app_resend_admin.statusText.redirect_request_does_not_contain_authorization_code" satisfies ResendAdminAllKeys,
        };
      }

      const app = await loadConnectedApp(this.props.getDbConnection, appId);
      logger.debug(
        {
          appId,
          appFound: !!app,
          previousStatus: app?.status,
          hasPkceVerifier: !!app?.data?.pkceCodeVerifier,
          hasExistingFromEmail: !!app?.data?.fromEmail,
        },
        "Loaded connected app for token exchange",
      );

      const encryptedVerifier = app?.data?.pkceCodeVerifier;
      if (!encryptedVerifier) {
        logger.error({ appId }, "PKCE code_verifier missing on connected app");
        return {
          appId,
          error:
            "app_resend_admin.statusText.pkce_verifier_missing" satisfies ResendAdminAllKeys,
        };
      }

      const { clientId, clientSecret } = getResendOAuthCredentials();
      const redirectUri = `${getAdminUrl()}/apps/oauth/${RESEND_APP_NAME}/redirect`;
      logger.debug(
        { appId, redirectUri },
        "Exchanging authorization code for tokens",
      );

      const tokens = await exchangeAuthorizationCode({
        code,
        redirectUri,
        codeVerifier: decrypt(encryptedVerifier),
        clientId,
        clientSecret,
      });

      logger.debug(
        {
          appId,
          hasAccessToken: !!tokens.accessToken,
          hasRefreshToken: !!tokens.refreshToken,
          expiresOn: tokens.expiresOn,
        },
        "Received OAuth tokens from Resend",
      );

      if (!tokens.accessToken || !tokens.refreshToken) {
        logger.error(
          {
            appId,
            hasAccessToken: !!tokens.accessToken,
            hasRefreshToken: !!tokens.refreshToken,
          },
          "App was not authorized properly",
        );
        throw new ConnectedAppError(
          "app_resend_admin.statusText.app_was_not_authorized_properly" satisfies ResendAdminAllKeys,
        );
      }

      const { pkceCodeVerifier: _removed, ...restData } = app?.data ?? {};

      logger.info(
        {
          appId,
          hasFromEmail: !!restData.fromEmail,
          expiresOn: tokens.expiresOn,
        },
        "Successfully processed Resend OAuth redirect",
      );

      return {
        appId,
        token: {
          accessToken: encrypt(tokens.accessToken),
          refreshToken: encrypt(tokens.refreshToken),
          expiresOn: tokens.expiresOn,
        } satisfies ConnectedOauthAppTokens,
        data: restData,
        account: {
          username: restData.fromEmail ?? "resend",
        },
      };
    } catch (e: unknown) {
      logger.error(
        {
          url: request.url,
          error: e instanceof Error ? e.message : String(e),
          errorKey: e instanceof ConnectedAppError ? e.key : undefined,
        },
        "Error processing Resend OAuth redirect",
      );

      return {
        appId: new URL(request.url).searchParams.get("state") as string,
        error:
          e instanceof ConnectedAppError
            ? e.key
            : ("app_resend_admin.statusText.oauth_error" satisfies ResendAdminAllKeys),
        errorArgs: e instanceof ConnectedAppError ? e.args : undefined,
      };
    }
  }

  public async afterOAuthConnected(
    appData: ConnectedAppData<ResendAppData, ConnectedOauthAppTokens>,
  ): Promise<void> {
    const logger = this.loggerFactory("afterOAuthConnected");
    logger.debug(
      {
        appId: appData._id,
        status: appData.status,
        hasFromEmail: !!appData.data?.fromEmail,
        hasToken: !!appData.token?.accessToken,
      },
      "Running afterOAuthConnected",
    );

    if (appData.data?.fromEmail) {
      logger.info(
        { appId: appData._id, fromEmail: appData.data.fromEmail },
        "Sender already configured; leaving connected",
      );
      return;
    }

    logger.info(
      { appId: appData._id },
      "OAuth complete; setting pending until sender settings are saved",
    );

    await this.props.update({
      status: "pending",
      statusText:
        "app_resend_admin.statusText.requires_sender_settings" satisfies ResendAdminAllKeys,
    });

    logger.debug(
      { appId: appData._id },
      "Updated app status to pending (requires_sender_settings)",
    );
  }

  public getNeedAttentionItems(
    appData: ConnectedAppData,
    _member: OrganizationMember | null,
    _user: SessionUser,
  ): NeedsAttentionItem<ResendAdminNamespace, ResendAdminKeys>[] {
    const key = statusTextKey(appData.statusText);
    const needsSender =
      key === REQUIRES_SENDER || key.includes("requires_sender_settings");

    if (!needsSender) {
      return [];
    }

    return [
      {
        id: "requires-sender-settings",
        fingerprint: key || "requires-sender-settings",
        level: "warning",
        title: {
          key: "app_resend_admin.needsAttention.sender.title",
        },
        description: {
          key: "app_resend_admin.needsAttention.sender.description",
        },
        action: {
          type: "update-app",
          label: {
            key: "app_resend_admin.needsAttention.sender.action",
          },
        },
        order: 50,
      },
    ];
  }

  public async processRequest(
    appData: ConnectedAppData<ResendAppData, ConnectedOauthAppTokens>,
    request: ResendFromSettings,
  ): Promise<
    ConnectedAppStatusWithText<ResendAdminNamespace, ResendAdminKeys>
  > {
    const logger = this.loggerFactory("processRequest");
    logger.debug(
      {
        appId: appData._id,
        previousStatus: appData.status,
        hasToken: !!appData.token?.accessToken,
        previousFromEmail: appData.data?.fromEmail,
        requestFromEmail: request?.fromEmail,
        hasFromName: !!request?.fromName,
      },
      "Processing Resend from settings",
    );

    if (!appData.token?.accessToken) {
      logger.error(
        { appId: appData._id },
        "Cannot save sender settings: OAuth tokens missing",
      );
      throw new ConnectedAppError(
        "app_resend_admin.statusText.app_was_not_authorized_properly" satisfies ResendAdminAllKeys,
      );
    }

    const { data, success, error } =
      resendFromSettingsSchema.safeParse(request);

    if (!success) {
      logger.error(
        { appId: appData._id, error },
        "Invalid Resend from settings request",
      );
      throw new ConnectedAppRequestError(
        "invalid_resend_from_settings_request",
        { error },
        400,
        error.message,
      );
    }

    const { pkceCodeVerifier: _removed, ...existing } = appData.data ?? {};
    const merged: ResendAppData = {
      ...existing,
      fromEmail: data.fromEmail,
      fromName: data.fromName || undefined,
    };

    const status: ConnectedAppStatusWithText<
      ResendAdminNamespace,
      ResendAdminKeys
    > = {
      status: "connected",
      statusText: "app_resend_admin.statusText.successfully_configured",
    };

    await this.props.update({
      data: merged,
      account: {
        username: data.fromEmail,
      },
      ...status,
    });

    logger.info(
      {
        appId: appData._id,
        fromEmail: data.fromEmail,
        hasFromName: !!data.fromName,
        status: status.status,
      },
      "Saved Resend sender settings and marked connected",
    );

    return status;
  }

  public async sendMail(
    appData: ConnectedAppData<ResendAppData, ConnectedOauthAppTokens>,
    email: Email,
  ): Promise<EmailResponse> {
    const logger = this.loggerFactory("sendMail");
    const toList = Array.isArray(email.to) ? email.to : [email.to];
    logger.debug(
      {
        appId: appData._id,
        subject: email.subject,
        to: toList,
        cc: email.cc
          ? Array.isArray(email.cc)
            ? email.cc
            : [email.cc]
          : undefined,
        attachmentCount: email.attachments?.length || 0,
        hasIcalEvent: !!email.icalEvent,
        configuredFromEmail: appData.data?.fromEmail,
        appStatus: appData.status,
      },
      "Sending email via Resend app",
    );

    try {
      const fromEmail = appData.data?.fromEmail;
      if (!fromEmail) {
        logger.warn(
          { appId: appData._id, subject: email.subject },
          "From email not configured",
        );

        throw new ConnectedAppError(
          "app_resend_admin.statusText.from_email_not_configured" satisfies ResendAdminAllKeys,
        );
      }

      logger.debug(
        { appId: appData._id },
        "Resolving OAuth access token for send",
      );
      const { clientId, clientSecret } = getResendOAuthCredentials();
      const oauthClient = new ResendOAuthClient(
        appData,
        clientId,
        clientSecret,
        this.props.update,
        this.loggerFactory,
      );

      const accessToken = await oauthClient.getAccessToken();
      const client = new Resend(accessToken);
      logger.debug({ appId: appData._id }, "Resend SDK client ready");

      const config =
        await this.props.services.configurationService.getConfiguration(
          "general",
        );

      const fromName = appData.data?.fromName || config.name;
      const from = `${fromName} <${fromEmail}>`;
      logger.debug(
        {
          appId: appData._id,
          fromEmail,
          fromName,
          usedOrgNameFallback: !appData.data?.fromName,
        },
        "Resolved From header",
      );

      const attachments: {
        filename: string;
        content: Buffer;
        contentType?: string;
        contentId?: string;
      }[] = [];

      if (email.icalEvent) {
        logger.debug(
          {
            appId: appData._id,
            subject: email.subject,
            icalMethod: email.icalEvent.method,
          },
          "Processing iCal event attachment",
        );

        const { value: icsContent, error: icsError } = createEvent(
          email.icalEvent.content,
        );

        if (!icsContent || icsError) {
          logger.error(
            { appId: appData._id, icsError },
            "Failed to parse iCal event",
          );
          throw new ConnectedAppError(
            "app_resend_admin.statusText.error_parsing_ical_event" satisfies ResendAdminAllKeys,
          );
        }

        const filename = email.icalEvent.filename || "invitation.ics";
        attachments.push({
          filename,
          content: Buffer.from(icsContent, "utf8"),
          contentType: `text/calendar; method=${email.icalEvent.method}; charset=UTF-8`,
        });
        logger.debug(
          { appId: appData._id, filename },
          "Created iCal event attachment",
        );
      }

      if (email.attachments?.length) {
        logger.debug(
          {
            appId: appData._id,
            count: email.attachments.length,
          },
          "Loading file attachments from storage",
        );

        const fileAttachments = await Promise.all(
          email.attachments.map(async (attachment) => {
            const result = await this.props.services.assetsStorage.getFile(
              attachment.storageFilename,
            );

            if (!result) {
              logger.error(
                {
                  appId: appData._id,
                  storageFilename: attachment.storageFilename,
                  filename: attachment.filename,
                },
                "Attachment not found in storage",
              );
              throw new Error("Attachment not found");
            }

            const content = await readableToBuffer(result.stream);
            logger.debug(
              {
                appId: appData._id,
                filename: attachment.filename,
                bytes: content.length,
              },
              "Loaded attachment from storage",
            );
            return {
              filename: attachment.filename,
              content,
              contentType: attachment.contentType,
              contentId: attachment.cid,
            };
          }),
        );
        attachments.push(...fileAttachments);
      }

      const to = toList;
      const cc = email.cc
        ? Array.isArray(email.cc)
          ? email.cc
          : [email.cc]
        : undefined;

      logger.debug(
        {
          appId: appData._id,
          subject: email.subject,
          from: fromEmail,
          to,
          cc,
          attachmentCount: attachments.length,
        },
        "Prepared email payload, calling Resend API",
      );

      const { data, error } = await client.emails.send({
        from,
        to,
        cc,
        subject: email.subject,
        html: email.body,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      if (error) {
        logger.error(
          {
            appId: appData._id,
            subject: email.subject,
            resendError: error.message,
            resendErrorName: error.name,
          },
          "Resend API returned an error",
        );
        throw new Error(error.message || "Failed to send email via Resend");
      }

      const messageId = data?.id;
      if (!messageId) {
        logger.error(
          { appId: appData._id, subject: email.subject, data },
          "Resend did not return a message id",
        );
        throw new Error("Resend did not return a message id");
      }

      logger.info(
        {
          appId: appData._id,
          subject: email.subject,
          messageId,
          from: fromEmail,
          to,
          attachmentCount: attachments.length,
        },
        "Successfully sent email via Resend app",
      );

      if (appData.status === "failed") {
        try {
          await this.props.update({
            status: "connected",
            statusText:
              "app_resend_admin.statusText.successfully_configured" satisfies ResendAdminAllKeys,
          });

          logger.info(
            { appId: appData._id },
            "Restored Resend app status after a successful send",
          );
        } catch (statusError: unknown) {
          logger.warn(
            {
              appId: appData._id,
              error:
                statusError instanceof Error
                  ? statusError.message
                  : String(statusError),
            },
            "Failed to restore Resend app status after a successful send",
          );
        }
      }

      return { messageId };
    } catch (e: unknown) {
      logger.error(
        {
          appId: appData._id,
          subject: email.subject,
          error: e instanceof Error ? e.message : String(e),
          errorKey: e instanceof ConnectedAppError ? e.key : undefined,
        },
        "Error sending email via Resend app",
      );

      const status: ConnectedAppStatusWithText = {
        status: "failed",
        statusText:
          e instanceof ConnectedAppError
            ? { key: e.key, args: e.args }
            : ("app_resend_admin.statusText.error_sending_email" satisfies ResendAdminAllKeys),
      };

      logger.warn(
        {
          appId: appData._id,
          status: status.status,
          statusText: status.statusText,
        },
        "Marking Resend app as failed after send error",
      );
      await this.props.update({ ...status });
      throw e;
    }
  }

  public async unInstall(
    appData: ConnectedAppData<ResendAppData, ConnectedOauthAppTokens>,
  ): Promise<ConnectedAppUninstallResult> {
    const logger = this.loggerFactory("unInstall");
    logger.debug(
      {
        appId: appData._id,
        hasRefreshToken: !!appData.token?.refreshToken,
        fromEmail: appData.data?.fromEmail,
      },
      "Uninstalling Resend app",
    );

    try {
      if (appData.token?.refreshToken) {
        logger.debug({ appId: appData._id }, "Revoking Resend refresh token");
        const { clientId, clientSecret } = getResendOAuthCredentials();
        await revokeResendToken({
          token: decrypt(appData.token.refreshToken),
          clientId,
          clientSecret,
        });
        logger.info({ appId: appData._id }, "Revoked Resend OAuth token");
      } else {
        logger.debug(
          { appId: appData._id },
          "No refresh token to revoke on uninstall",
        );
      }
    } catch (error: unknown) {
      logger.warn(
        {
          appId: appData._id,
          error: error instanceof Error ? error.message : String(error),
        },
        "Best-effort Resend token revoke failed",
      );
    }

    logger.info({ appId: appData._id }, "Resend app uninstall completed");
    return { success: true, code: "ok" };
  }
}

export default ResendConnectedApp;
