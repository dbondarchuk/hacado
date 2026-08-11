import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import {
  ApiRequest,
  ApiResponse,
  ConnectedAppData,
  ConnectedAppError,
  ConnectedAppRequestError,
  ConnectedAppStatusWithText,
  IConnectedApp,
  IConnectedAppProps,
  IConnectedAppWithWebhook,
  ITextMessageResponder,
  ITextMessageSenderApp,
  RespondResult,
  TextMessage,
  TextMessageReply,
  TextMessageResponse,
} from "@hacado/types";
import {
  decrypt,
  encrypt,
  getAdminUrl,
  getAppsExternalUrl,
  getArguments,
  getWebsiteUrl,
  maskify,
} from "@hacado/utils";
import crypto from "crypto";
import { getEmailTemplate } from "./emails/utils";
import { TextBeltConfiguration, textBeltConfigurationSchema } from "./models";
import { TextBeltAdminAllKeys } from "./translations/types";

const MASKED_API_KEY = "this-is-a-masked-api-key";

const scrambleKey = (key: string) => {
  if (key.length < 6) {
    return key
      .split("")
      .map((c, i) => (i < key.length - 2 ? "*" : c))
      .join("");
  }

  if (key.length < 12) {
    return key
      .split("")
      .map((c, i) => (i >= 2 && i < key.length - 2 ? "*" : c))
      .join("");
  }

  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
};

type TextbeltWebhookData = {
  textId: string;
  fromNumber: string;
  text: string;
  data?: string;
};

function verify(
  apiKey: string,
  timestamp: string,
  requestSignature: string,
  requestPayload: string,
) {
  const mySignature = crypto
    .createHmac("sha256", apiKey)
    .update(timestamp + requestPayload)
    .digest("hex");

  return crypto.timingSafeEqual(
    // @ts-ignore It's valid
    Buffer.from(requestSignature),
    Buffer.from(mySignature),
  );
}

type SmsRequest = {
  phone: string;
  message: string;
  key: string;
  sender?: string;
  replyWebhookUrl?: string;
  webhookData?: string;
};

type SmsResponse = {
  success: boolean;
  quotaRemaining: number;
  textId?: string;
  error?: string;
};

export default class TextBeltConnectedApp
  implements
    IConnectedApp<TextBeltConfiguration>,
    IConnectedAppWithWebhook,
    ITextMessageSenderApp
{
  protected readonly loggerFactory: LoggerFactory;

  public constructor(protected readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "TextBeltConnectedApp",
      props.organizationId,
    );
  }

  public async processAppData(
    appData: TextBeltConfiguration,
  ): Promise<TextBeltConfiguration> {
    return {
      ...appData,
      apiKey: appData.apiKey ? MASKED_API_KEY : "",
    };
  }

  public async sendTextMessage(
    app: ConnectedAppData,
    message: TextMessage,
  ): Promise<TextMessageResponse> {
    const logger = this.loggerFactory("sendTextMessage");
    logger.debug(
      {
        appId: app._id,
        phone: maskify(message.phone),
        sender: message.sender,
        messageLength: message.message.length,
        hasData: !!message.data,
        memberId: message.memberId,
      },
      "Sending text message via TextBelt",
    );

    try {
      const { general, brand } =
        await this.props.services.configurationService.getConfigurations(
          "general",
          "brand",
        );

      const apiKey = decrypt(app.data.apiKey);
      const url = getAppsExternalUrl();

      const request: SmsRequest = {
        message: message.message,
        key: apiKey,
        phone: message.phone,
        sender: message.sender,
        replyWebhookUrl: `${url}/api/webhooks/apps/id/${this.props.organizationId}/${app._id}`,
        webhookData: message.data
          ? `${message.data.appId ?? ""}|${message.data.appointmentId ?? ""}|${message.data.customerId ?? ""}|${message.memberId ?? ""}|${message.data.data ?? ""}`
          : undefined,
      };

      logger.debug(
        {
          appId: app._id,
          phone: maskify(message.phone),
          hasWebhookData: !!request.webhookData,
        },
        "Prepared TextBelt request, sending SMS",
      );

      const result = await fetch("https://textbelt.com/text", {
        method: "post",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      const response = (await result.json()) as SmsResponse;

      if (!response.success) {
        logger.error(
          {
            appId: app._id,
            phone: maskify(message.phone),
            error: response.error,
          },
          "Failed to send SMS via TextBelt",
        );
        throw new ConnectedAppError(
          "app_text-belt_admin.statusText.failed_to_send_sms" satisfies TextBeltAdminAllKeys,
          {
            error: response.error || "unknown error",
          },
        );
      }

      logger.info(
        {
          appId: app._id,
          phone: maskify(message.phone),
          textId: response.textId,
          quotaRemaining: response.quotaRemaining,
        },
        "Successfully sent SMS via TextBelt",
      );

      this.props.update({
        status: "connected",
        statusText: {
          key: "app_text-belt_admin.statusText.remaining_quota" satisfies TextBeltAdminAllKeys,
          args: { quota: response.quotaRemaining },
        },
      });

      if (response.quotaRemaining < 100) {
        const member = await this.props.services.teamService.getMemberById(
          app.memberId,
        );
        const { template: description, subject } = await getEmailTemplate(
          "user-notify-low-quota",
          member?.language ?? brand.language,
          url,
          {
            quotaRemaining: response.quotaRemaining,
            name: member?.name ?? general.name,
          },
        );

        await this.props.services.notificationService.sendEmail({
          email: {
            to: member?.email ?? general.email,
            subject,
            body: description,
          },
          handledBy:
            "app_text-belt_admin.lowQuotaHandler" satisfies TextBeltAdminAllKeys,
          participantType: "member",
          memberId: app.memberId,
        });
      }

      return {
        success: response.success,
        error: response.error,
        textId: response.textId,
        data: {
          quotaRemaining: response.quotaRemaining,
        },
      };
    } catch (e: any) {
      logger.error(
        {
          appId: app._id,
          phone: maskify(message.phone),
          error: e?.message || e?.toString(),
        },
        "Error sending text message via TextBelt",
      );

      this.props.update({
        status: "failed",
        statusText:
          e instanceof ConnectedAppError
            ? {
                key: e.key,
                args: e.args,
              }
            : ("app_text-belt_admin.statusText.error_sending_sms" satisfies TextBeltAdminAllKeys),
      });

      throw e;
    }
  }

  public async processWebhook(
    appData: ConnectedAppData,
    request: ApiRequest,
  ): Promise<ApiResponse> {
    const logger = this.loggerFactory("processWebhook");
    logger.debug({ appId: appData._id }, "Processing TextBelt webhook");

    try {
      const config = appData.data as TextBeltConfiguration;

      const apiKey = config.apiKey ? decrypt(config.apiKey) : "";

      const bodyText = await request.text();
      const timestamp = request.headers.get("X-textbelt-timestamp");
      const signature = request.headers.get("X-textbelt-signature");

      logger.debug(
        {
          appId: appData._id,
          hasTimestamp: !!timestamp,
          hasSignature: !!signature,
        },
        "Extracted webhook headers",
      );

      if (!timestamp || !signature) {
        logger.warn(
          { appId: appData._id, bodyText },
          "Malformed headers in SMS webhook",
        );

        return Response.json({ success: false }, { status: 400 });
      }

      if (!verify(apiKey, timestamp, signature, bodyText)) {
        logger.warn({ appId: appData._id, bodyText }, "Unverified SMS webhook");

        return Response.json({ success: false }, { status: 400 });
      }

      logger.debug(
        { appId: appData._id },
        "Webhook signature verified successfully",
      );

      const reply = JSON.parse(bodyText) as TextbeltWebhookData;
      if (!reply.fromNumber) {
        logger.warn(
          { appId: appData._id, bodyText },
          "Malformed body in SMS webhook",
        );
        return Response.json({ success: false }, { status: 400 });
      }

      logger.info(
        {
          appId: appData._id,
          fromNumber: maskify(reply.fromNumber),
          textId: reply.textId,
          hasData: !!reply.data,
        },
        "Received TextBelt reply webhook",
      );

      const parts = (reply?.data || "").split("|", 4);

      const appId = parts[0] || undefined;
      const appointmentId = parts[1] || undefined;
      const customerId = parts[2] || undefined;
      const memberId = parts[3] || undefined;
      const data = parts[4] || undefined;

      logger.debug(
        {
          appId: appData._id,
          parsedAppId: appId,
          appointmentId,
          customerId,
          hasData: !!data,
        },
        "Parsed webhook data",
      );

      const appointment = appointmentId
        ? await this.props.services.bookingService.getAppointment(appointmentId)
        : null;

      const customer = customerId
        ? await this.props.services.customersService.getCustomer(customerId)
        : (appointment?.customer ?? null);

      const replyData: TextMessageReply = {
        from: reply.fromNumber,
        message: reply.text,
        data: {
          appId,
          data,
          appointmentId,
          customerId,
        },
        appointment,
        customer,
        memberId,
        messageId: reply.textId,
      };

      logger.debug(
        { appId: appData._id, fromNumber: maskify(reply.fromNumber) },
        "Processing text message reply",
      );

      await this.respond(appData, replyData);

      logger.info(
        { appId: appData._id, fromNumber: maskify(reply.fromNumber) },
        "Successfully processed TextBelt webhook",
      );

      return Response.json({ success: true }, { status: 201 });
    } catch (error: any) {
      logger.error(
        { appId: appData._id, error: error?.message || error?.toString() },
        "Error processing TextBelt webhook",
      );
      throw error;
    }
  }

  public async processRequest(
    appData: ConnectedAppData,
    request: TextBeltConfiguration,
  ): Promise<ConnectedAppStatusWithText> {
    const logger = this.loggerFactory("processRequest");

    const { data, success, error } =
      textBeltConfigurationSchema.safeParse(request);
    if (!success) {
      logger.error({ error }, "Invalid TextBelt configuration request");
      throw new ConnectedAppRequestError(
        "invalid_text-belt_configuration_request",
        { request, error },
        400,
        error.message,
      );
    }

    if (data.apiKey === MASKED_API_KEY && appData?.data?.apiKey) {
      data.apiKey = appData.data.apiKey;
    } else if (data.apiKey) {
      data.apiKey = encrypt(data.apiKey);
    }

    const defaultApps =
      await this.props.services.configurationService.getConfiguration(
        "defaultApps",
      );
    const textMessageResponderAppId = defaultApps.textMessageResponderAppId;

    logger.debug(
      {
        appId: appData._id,
        apiKey: scrambleKey(data.apiKey),
        textMessageResponderAppId,
      },
      "Processing TextBelt configuration request",
    );

    try {
      if (textMessageResponderAppId) {
        logger.debug(
          {
            appId: appData._id,
            responderAppId: textMessageResponderAppId,
          },
          "Validating text message responder app",
        );

        const { app, service } =
          await this.props.services.connectedAppsService.getAppService<ITextMessageResponder>(
            textMessageResponderAppId,
          );

        if (!app || !service || !service.respond) {
          logger.error(
            {
              appId: appData._id,
              responderAppId: textMessageResponderAppId,
            },
            "Provided app does not exist or does not support responding to text messages",
          );
          throw new ConnectedAppError(
            "app_text-belt_admin.statusText.invalid_responder_app" satisfies TextBeltAdminAllKeys,
          );
        }

        logger.debug(
          { appId: appData._id, responderAppName: app.name },
          "Text message responder app validated successfully",
        );
      }

      logger.debug({ appId: appData._id }, "Checking TextBelt quota");

      const apiKey = data?.apiKey ? decrypt(data.apiKey) : "";
      const response = await fetch(`https://textbelt.com/quota/${apiKey}`);
      if (response.status >= 400) {
        logger.error(
          { appId: appData._id, statusCode: response.status },
          "Failed to fetch TextBelt quota",
        );
        throw new ConnectedAppError(
          "app_text-belt_admin.statusText.failed_to_fetch_quota" satisfies TextBeltAdminAllKeys,
          {
            statusCode: response.status,
          },
        );
      }

      const json = (await response.json()) as SmsResponse;

      if (!json.success || !json.quotaRemaining) {
        logger.error(
          {
            appId: appData._id,
            success: json.success,
            quotaRemaining: json.quotaRemaining,
          },
          "Failed to get remaining quota or quota is zero",
        );
        throw new ConnectedAppError(
          "app_text-belt_admin.statusText.failed_to_get_quota" satisfies TextBeltAdminAllKeys,
        );
      }

      logger.debug(
        { appId: appData._id, quotaRemaining: json.quotaRemaining },
        "Successfully retrieved TextBelt quota",
      );

      const status: ConnectedAppStatusWithText = {
        status: "connected",
        statusText: {
          key: "app_text-belt_admin.statusText.remaining_quota" satisfies TextBeltAdminAllKeys,
          args: { quota: json.quotaRemaining },
        },
      };

      this.props.update({
        account: {
          username: scrambleKey(data.apiKey),
        },
        data,
        ...status,
      });

      logger.info(
        { appId: appData._id, quotaRemaining: json.quotaRemaining },
        "Successfully connected to TextBelt",
      );

      return status;
    } catch (e: any) {
      logger.error(
        { appId: appData._id, error: e?.message || e?.toString() },
        "Error processing TextBelt configuration request",
      );

      const status: ConnectedAppStatusWithText = {
        status: "failed",
        statusText:
          e instanceof ConnectedAppError
            ? {
                key: e.key,
                args: e.args,
              }
            : ("app_text-belt_admin.statusText.error_processing_configuration" satisfies TextBeltAdminAllKeys),
      };

      this.props.update({
        ...status,
      });

      return status;
    }
  }

  private async respond(
    appData: ConnectedAppData<TextBeltConfiguration>,
    textMessageReply: TextMessageReply,
  ): Promise<void> {
    const logger = this.loggerFactory("respond");
    logger.debug(
      {
        appId: appData._id,
        fromNumber: maskify(textMessageReply.from),
        messageLength: textMessageReply.message.length,
        hasAppointment: !!textMessageReply.appointment,
        hasCustomer: !!textMessageReply.customer,
      },
      "Processing text message reply",
    );

    const config =
      await this.props.services.configurationService.getConfigurations(
        "booking",
        "general",
        "brand",
        "social",
      );

    const {
      appointment,
      customer,
      memberId: _memberId,
      ...reply
    } = textMessageReply;

    const organization =
      await this.props.services.organizationService.getOrganization();
    if (!organization) {
      logger.error(
        { appId: appData._id, appointmentId: appointment?._id },
        "Organization not found",
      );
      return;
    }

    let memberId = _memberId;
    if (!memberId) {
      memberId = appointment?.memberId ?? appData.memberId;
    }

    const member =
      await this.props.services.teamService.getMemberById(memberId);
    if (!member) {
      logger.error({ appId: appData._id, memberId }, "Member not found");
      return;
    }

    const adminUrl = getAdminUrl();
    const websiteUrl = getWebsiteUrl(organization);

    const args = getArguments({
      appointment,
      config,
      customer,
      useAppointmentTimezone: true,
      additionalProperties: {
        reply: {
          ...reply,
          message: reply.message?.trim(),
        },
      },
      member,
      locale: config.brand.language,
      adminUrl,
      websiteUrl,
    });

    const url = getAdminUrl();
    const { template: description, subject } = await getEmailTemplate(
      "user-notify-reply",
      config.brand.language,
      url,
      args,
      appointment?._id,
      customer?._id,
    );

    logger.debug(
      { appId: appData._id, ownerEmail: member.email },
      "Sending email to owner about incoming message",
    );

    await this.props.services.notificationService.sendEmail({
      email: {
        to: member.email,
        subject,
        body: description,
      },
      handledBy:
        "app_text-belt_admin.webhookHandlerUser" satisfies TextBeltAdminAllKeys,
      participantType: "member",
      memberId: member._id,
      appointmentId: appointment?._id,
      customerId: customer?._id,
    });

    let result: RespondResult | null | undefined;
    try {
      try {
        if (reply.data.appId && reply.data.appId.length) {
          logger.debug(
            { appId: appData._id, responderAppId: reply.data.appId },
            "Processing message with responder app",
          );

          const { app, service } =
            await this.props.services.connectedAppsService.getAppService<ITextMessageResponder>(
              reply.data.appId,
            );

          if (!!service?.respond) {
            logger.debug(
              { appId: appData._id, responderAppName: app?.name },
              "Incoming message will be processed by responder app",
            );
          }

          result = await service?.respond?.(app, textMessageReply);
        }
      } finally {
        if (!result) {
          logger.debug(
            { appId: appData._id },
            "No service has processed the incoming text message. Will try to use responder app",
          );

          const defaultApps =
            await this.props.services.configurationService.getConfiguration(
              "defaultApps",
            );
          const textMessageResponderAppId =
            defaultApps.textMessageResponderAppId;

          if (textMessageResponderAppId) {
            logger.debug(
              { appId: appData._id, responderAppId: textMessageResponderAppId },
              "Using default text message responder app",
            );

            const { app, service } =
              await this.props.services.connectedAppsService.getAppService<ITextMessageResponder>(
                textMessageResponderAppId,
              );

            result = await service.respond(app, textMessageReply);
          } else {
            logger.debug(
              { appId: appData._id },
              "No default text message responder app was found",
            );
          }
        }
      }
    } finally {
      if (!result) {
        logger.warn(
          { appId: appData._id },
          "No responder app was registered with TextBelt Webhook app or it was not processed",
        );

        result = {
          handledBy:
            "app_text-belt_admin.webhookHandler" satisfies TextBeltAdminAllKeys,
          participantType: "customer",
        };
      }

      logger.debug(
        {
          appId: appData._id,
          handledBy: result.handledBy,
          participantType: result.participantType,
        },
        "Logging communication",
      );

      await this.props.services.communicationLogsService.log({
        channel: "text-message",
        direction: "inbound",
        participant: reply.from,
        handledBy: result.handledBy,
        text: reply.message,
        data: reply.data,
        appointmentId: appointment?._id,
        customerId: customer?._id,
        ...(result.participantType === "member"
          ? {
              participantType: "member" as const,
              memberId: appointment?.memberId ?? appData.memberId,
            }
          : {
              participantType: "customer" as const,
              ...(appointment?.memberId
                ? { memberId: appointment.memberId }
                : {}),
            }),
      });

      logger.info(
        {
          appId: appData._id,
          fromNumber: maskify(textMessageReply.from),
          handledBy: result.handledBy,
        },
        "Successfully processed text message reply",
      );
    }
  }
}
