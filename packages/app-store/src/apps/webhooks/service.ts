import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import {
  ApiRequest,
  ApiResponse,
  ConnectedAppData,
  ConnectedAppRequestError,
  ConnectedAppStatusWithText,
  ConnectedAppUninstallResult,
  EventEnvelope,
  IConnectedApp,
  IConnectedAppProps,
  IEventSubscriber,
} from "@hacado/types";
import { decrypt, encrypt } from "@hacado/utils";
import crypto from "crypto";
import {
  LIST_SELECTABLE_EVENT_TYPES_REQUEST_TYPE,
  MASKED_SECRET,
  WebhookEventType,
  WebhooksConfiguration,
  webhooksConfigurationSchema,
} from "./models";
import {
  WebhooksAdminAllKeys,
  WebhooksAdminKeys,
  WebhooksAdminNamespace,
} from "./translations/types";
import { getWebhookSelectableEventTypes } from "./selectable-event-types";

export class WebhooksConnectedApp implements IConnectedApp, IEventSubscriber {
  protected readonly loggerFactory: LoggerFactory;

  public constructor(protected readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "WebhooksConnectedApp",
      props.organizationId,
    );
  }

  public async processAppData(
    appData: WebhooksConfiguration,
  ): Promise<WebhooksConfiguration> {
    return {
      ...appData,
      secret: appData.secret ? MASKED_SECRET : "",
    };
  }

  public async processStaticRequest(
    data: any,
  ): Promise<{ eventTypes: string[] }> {
    if (data?.type !== LIST_SELECTABLE_EVENT_TYPES_REQUEST_TYPE) {
      throw new ConnectedAppRequestError(
        "invalid_webhooks_static_request",
        { data },
        400,
        "Unsupported static request",
      );
    }
    return {
      eventTypes: await getWebhookSelectableEventTypes(this.props),
    };
  }

  public async processRequest(
    appData: ConnectedAppData,
    data: unknown,
  ): Promise<
    ConnectedAppStatusWithText<WebhooksAdminNamespace, WebhooksAdminKeys>
  > {
    const logger = this.loggerFactory("processRequest");

    logger.debug(
      { appId: appData._id },
      "Processing webhooks configuration request",
    );

    const parsed = webhooksConfigurationSchema.safeParse(data);
    if (!parsed.success) {
      logger.warn(
        { appId: appData._id, error: parsed.error },
        "Invalid webhooks configuration data",
      );

      throw new ConnectedAppRequestError(
        "invalid_webhooks_configuration",
        { data },
        400,
        parsed.error.message,
      );
    }

    const nextData = { ...parsed.data };

    // Handle secret encryption
    if (nextData.secret === MASKED_SECRET && appData?.data?.secret) {
      nextData.secret = appData.data.secret;
    } else if (nextData.secret) {
      nextData.secret = encrypt(nextData.secret);
    }

    const status: ConnectedAppStatusWithText<
      WebhooksAdminNamespace,
      WebhooksAdminKeys
    > = {
      status: "connected",
      statusText: "app_webhooks_admin.statusText.successfullyConfigured",
    };

    this.props.update({
      data: nextData,
      ...status,
    });

    logger.info({ appId: appData._id }, "Successfully configured webhooks");
    return status;
  }

  public async unInstall(
    appData: ConnectedAppData,
  ): Promise<ConnectedAppUninstallResult> {
    const logger = this.loggerFactory("unInstall");
    logger.debug({ appId: appData._id }, "Uninstalling webhooks app");

    // No cleanup needed for webhooks
    logger.info(
      { appId: appData._id },
      "Successfully uninstalled webhooks app",
    );
    return { success: true, code: "ok" };
  }

  public async processAppCall(
    appData: ConnectedAppData,
    slug: string[],
    request: ApiRequest,
  ): Promise<ApiResponse> {
    return Response.json(
      { success: false, error: "Unknown request" },
      { status: 404 },
    );
  }

  public async onEvent(
    appData: ConnectedAppData<WebhooksConfiguration>,
    envelope: EventEnvelope,
  ): Promise<void> {
    await this.relayEvent(appData, envelope);
  }

  private async relayEvent(
    appData: ConnectedAppData<WebhooksConfiguration>,
    envelope: EventEnvelope,
  ): Promise<void> {
    const logger = this.loggerFactory("relayEvent");
    const config = appData.data;

    if (!config) {
      logger.warn(
        { appId: appData._id, type: envelope.type },
        "No webhooks configuration found",
      );
      return;
    }

    const eventType = envelope.type as WebhookEventType;
    if (!config.eventTypes.includes(eventType)) {
      logger.debug(
        { appId: appData._id, type: envelope.type },
        "Event type not selected for this webhook",
      );
      return;
    }

    const body = JSON.stringify({
      id: envelope.id,
      type: envelope.type,
      organizationId: envelope.organizationId,
      payload: envelope.payload,
      createdAt: envelope.createdAt,
      source: envelope.source,
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Webhook-Event": envelope.type,
    };

    if (config.secret) {
      const decryptedSecret = decrypt(config.secret);
      const signature = this.generateSignature(body, decryptedSecret);
      headers["X-Webhook-Signature"] = signature;
    }

    try {
      logger.debug(
        { appId: appData._id, type: envelope.type, url: config.url },
        "Sending webhook",
      );

      const response = await fetch(config.url, {
        method: "POST",
        headers,
        body,
      });

      if (!response.ok) {
        logger.error(
          {
            appId: appData._id,
            type: envelope.type,
            url: config.url,
            status: response.status,
            statusText: response.statusText,
          },
          "Webhook request failed",
        );

        this.props.update({
          status: "failed",
          statusText: {
            key: "app_webhooks_admin.statusText.webhook_request_failed" satisfies WebhooksAdminAllKeys,
            args: {
              status: response.status,
              statusText: response.statusText,
            },
          },
        });
      } else {
        logger.info(
          {
            appId: appData._id,
            type: envelope.type,
            url: config.url,
            status: response.status,
          },
          "Webhook sent successfully",
        );
      }
    } catch (error: any) {
      logger.error(
        {
          appId: appData._id,
          type: envelope.type,
          url: config.url,
          error: error?.message || error?.toString(),
        },
        "Error sending webhook",
      );
    }
  }

  private generateSignature(payload: string, secret: string): string {
    return `sha256=${crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex")}`;
  }
}
