import { getLoggerFactory } from "@hacado/logger";
import {
  BillingPlanTier,
  CustomerSmsConsentStatus,
  Email,
  EmailNotificationRequest,
  EmailResponse,
  IBillingService,
  ICommunicationLogsService,
  IConfigurationService,
  IConnectedAppsService,
  IEventService,
  IMailSender,
  IMailSenderApp,
  INotificationService,
  IOrganizationService,
  IShortLinksService,
  ISystemNotificationService,
  ITextMessageSender,
  ITextMessageSenderApp,
  SubscriptionUpgradeRequiredError,
  TextMessage,
  TextMessageNotificationRequest,
  TextMessageResponse,
} from "@hacado/types";
import {
  isSmsLinkShorteningEnabled,
  maskify,
  normalizeToE164,
} from "@hacado/utils";
import { convert } from "html-to-text";
import type { Redis } from "ioredis";
import { resolvePlanTierFromOrganization } from "./billing/subscription-entitlements";
import {
  appendRatesSentence,
  canSendCustomerSms,
  shouldSkipDuplicateSend,
} from "./text-message/compliance";
import { SmsTransientError } from "./text-message/errors";
import { getSmsProvider } from "./text-message/factory";
import { consumeSmsPlatformLimit } from "./text-message/rate-limit";
import { SmsStore } from "./text-message/sms-store";

export class NotificationService implements INotificationService {
  protected readonly loggerFactory = getLoggerFactory("NotificationService");

  constructor(
    private readonly organizationId: string,
    private readonly configurationService: IConfigurationService,
    private readonly connectedAppService: IConnectedAppsService,
    private readonly communicationLogService: ICommunicationLogsService,
    private readonly defaultEmailService: IMailSender,
    private readonly defaultTextMessageSender: ITextMessageSender,
    private readonly billingService: IBillingService,
    private readonly eventService: IEventService,
    private readonly organizationService: IOrganizationService,
    private readonly shortLinksService: IShortLinksService,
    private readonly redisClient: Redis,
    private readonly smsStore: SmsStore = new SmsStore(),
  ) {}

  public async recordCustomerSmsConsent(input: {
    phone: string;
    consented: boolean;
    source: "web_form" | "owner_attested";
    ip?: string;
  }): Promise<void> {
    const phone = normalizeToE164(input.phone);
    if (!phone) {
      return;
    }

    await this.smsStore.recordConsent({
      organizationId: this.organizationId,
      phone,
      consented: input.consented,
      source: input.source,
      ip: input.ip,
    });
  }

  public async hasActiveCustomerSmsConsent(phone: string): Promise<boolean> {
    const normalized = normalizeToE164(phone);
    if (!normalized) {
      return false;
    }

    if (await this.smsStore.isOptedOut(normalized)) {
      return false;
    }

    return this.smsStore.latestConsent(this.organizationId, normalized);
  }

  public async getCustomerSmsConsentStatus(
    phone: string,
  ): Promise<CustomerSmsConsentStatus> {
    const normalized = normalizeToE164(phone);
    if (!normalized) {
      return { consented: false, optedOut: false };
    }

    const [consented, optedOut] = await Promise.all([
      this.smsStore.latestConsent(this.organizationId, normalized),
      this.smsStore.isOptedOut(normalized),
    ]);

    return { consented, optedOut };
  }

  public async sendEmail(props: EmailNotificationRequest): Promise<void> {
    const { email, handledBy, participantType, appointmentId, customerId } =
      props;
    const logger = this.loggerFactory("sendEmail");
    const memberId = props.memberId;
    const defaultAppsConfiguration =
      await this.configurationService.getConfiguration("defaultApps");

    const emailAppId = defaultAppsConfiguration?.emailSenderAppId;

    let sendMail: (email: Email, fromName?: string) => Promise<EmailResponse>;
    let useCustomerEmailApp = false;
    if (participantType === "customer" && emailAppId) {
      logger.debug({ appId: emailAppId }, "Using customer email app");

      const { app, service } =
        await this.connectedAppService.getAppService<IMailSenderApp>(
          emailAppId,
        );

      sendMail = async (email: Email) => await service.sendMail(app, email);
      useCustomerEmailApp = true;
    } else {
      let fromName: string | undefined = undefined;
      if (participantType === "customer") {
        const generalConfiguration =
          await this.configurationService.getConfiguration("general");
        fromName = generalConfiguration?.name;
      }

      sendMail = async (email: Email) =>
        await this.defaultEmailService.sendMail(
          email,
          participantType,
          fromName,
        );
    }

    logger.info(
      {
        emailAppId,
        useCustomerEmailApp,
        emailTo: (Array.isArray(email.to) ? email.to : [email.to])
          .map((to) => maskify(to))
          .join("; "),
        emailSubject: email.subject,
        appointmentId,
        customerId,
        memberId,
      },
      "Sending email",
    );

    try {
      const response = await sendMail(email);

      logger.info({ response }, "Successfully sent email");

      this.communicationLogService.log({
        direction: "outbound",
        channel: "email",
        handledBy,
        ...(participantType === "member"
          ? { participantType, memberId: memberId! }
          : { participantType, ...(memberId ? { memberId } : {}) }),
        participant: Array.isArray(email.to) ? email.to.join("; ") : email.to,
        text: convert(email.body, { wordwrap: 130 }),
        html: email.body,
        subject: email.subject,
        appointmentId,
        customerId,
        data: response,
      });
    } catch (error) {
      logger.error({ error }, "Error sending email");
      throw error;
    }
  }

  public async sendTextMessage(
    props: TextMessageNotificationRequest,
  ): Promise<TextMessageResponse> {
    const {
      phone,
      body,
      sender,
      handledBy,
      participantType,
      webhookData,
      appointmentId,
      customerId,
      memberId,
      requireConsent,
      idempotencyKey,
    } = props;
    const logger = this.loggerFactory("sendTextMessage");
    const trimmedPhone = normalizeToE164(phone);
    if (!trimmedPhone) {
      logger.warn(
        { organizationId: this.organizationId, appointmentId, customerId },
        "SMS skipped: invalid phone",
      );

      return { success: true, skipped: true, error: "invalid phone" };
    }

    logger.debug(
      { appointmentId, customerId, phone: maskify(trimmedPhone) },
      "Sending text message",
    );

    const consent = canSendCustomerSms({
      requireConsent: Boolean(requireConsent) && participantType === "customer",
      latestConsent: requireConsent
        ? await this.smsStore.latestConsent(this.organizationId, trimmedPhone)
        : true,
      optedOut: await this.smsStore.isOptedOut(trimmedPhone),
    });

    if (!consent.ok) {
      logger.info(
        {
          organizationId: this.organizationId,
          appointmentId,
          customerId,
          reason: consent.reason,
        },
        "SMS skipped",
      );

      return { success: true, skipped: true, error: consent.reason };
    }

    if (idempotencyKey) {
      const existing = await this.smsStore.findSend(idempotencyKey);
      if (shouldSkipDuplicateSend(existing)) {
        return {
          success: true,
          skipped: true,
          textId: existing?.textId,
          error: "already sent",
        };
      }
    }

    const organization = await this.organizationService.getOrganization();
    const planTier = resolvePlanTierFromOrganization(organization);

    const defaultAppsConfiguration =
      await this.configurationService.getConfiguration("defaultApps");
    const textMessageSenderAppId =
      defaultAppsConfiguration?.textMessageSenderAppId;

    let messageBody = body;
    if (isSmsLinkShorteningEnabled()) {
      messageBody = await this.shortLinksService.shortenUrlsInText(body);
    }

    let sendTextMessage: (message: TextMessage) => Promise<TextMessageResponse>;
    if (textMessageSenderAppId) {
      logger.debug(
        { textMessageSenderAppId },
        "Using app-based text message sender app",
      );
      const { app, service } =
        await this.connectedAppService.getAppService<ITextMessageSenderApp>(
          textMessageSenderAppId,
        );

      if (planTier === BillingPlanTier.Free) {
        logger.warn("TextBelt app is not available on the Free plan");
        throw new SubscriptionUpgradeRequiredError(
          "The 3rd party text message sender app requires a Solo subscription.",
          { feature: "sms", appSlug: app.name },
        );
      }

      sendTextMessage = async (message: TextMessage) =>
        await service.sendTextMessage(app, message);
    } else {
      logger.debug(
        "No app-based text message sender app is configured, using default text message sender service",
      );

      const availableTotal =
        await this.billingService.getCurrentSmsBalanceTotal();
      if (availableTotal !== null && availableTotal < 1) {
        logger.warn(
          { organizationId: this.organizationId, appointmentId },
          "SMS skipped: credits exhausted",
        );

        return { success: true, skipped: true, error: "credits exhausted" };
      }

      const limit = await consumeSmsPlatformLimit(
        this.redisClient,
        this.organizationId,
      );

      if (limit !== "ok") {
        logger.warn(
          { organizationId: this.organizationId, appointmentId, limit },
          "SMS skipped: platform limit",
        );

        return { success: true, skipped: true, error: limit };
      }

      if (participantType === "customer" && getSmsProvider() === "telnyx") {
        const alreadySent = await this.smsStore.hasAcceptedCustomerSend(
          this.organizationId,
          trimmedPhone,
        );

        if (!alreadySent) {
          messageBody = appendRatesSentence(messageBody);
        }
      }

      sendTextMessage = async (message: TextMessage) => {
        const response = await this.defaultTextMessageSender.sendTextMessage(
          message,
          this.organizationId,
        );

        if (response.errorCode === "40300") {
          await this.smsStore.optOut(trimmedPhone, "telnyx_40300");
        }

        if (response.skipped || response.error || !response.success) {
          return response;
        }

        await this.billingService.consumeSmsCredits({
          amount: 1,
          direction: "outbound",
          textId: response.textId,
        });

        await this.smsStore.recordAccepted({
          organizationId: this.organizationId,
          idempotencyKey:
            idempotencyKey ||
            `sms_${this.organizationId}_${trimmedPhone}_${response.textId || Date.now()}`,
          phone: trimmedPhone,
          participantType,
          appointmentId,
          customerId,
          appId: webhookData?.appId,
          data: webhookData?.data,
          textId: response.textId,
        });
        return response;
      };
    }

    try {
      const response = await sendTextMessage({
        message: messageBody,
        phone: trimmedPhone,
        data: webhookData,
        sender,
        memberId,
      });

      if (response.skipped) {
        return response;
      }

      if (response.error || !response.success) {
        if (response.retryable) {
          throw new SmsTransientError(response.error || "SMS send failed");
        }

        logger.error(
          {
            organizationId: this.organizationId,
            appointmentId,
            errorCode: response.errorCode,
          },
          "SMS send failed",
        );

        return response;
      }

      if (textMessageSenderAppId) {
        logger.info(
          {
            textMessageSenderAppId,
            textMessageSenderParticipant: handledBy,
            textMessageSenderPhone: maskify(trimmedPhone),
            appointmentId,
            customerId,
          },
          "Text Message sent via app-based sender",
        );
      } else {
        logger.info(
          {
            textMessageSender: `built-in-${getSmsProvider()}`,
            textMessageSenderParticipant: handledBy,
            textMessageSenderPhone: maskify(trimmedPhone),
            appointmentId,
            customerId,
          },
          "Text Message sent via built-in SMS service",
        );
      }

      this.communicationLogService.log({
        direction: "outbound",
        channel: "text-message",
        handledBy,
        ...(participantType === "member"
          ? { participantType, memberId: memberId! }
          : { participantType, ...(memberId ? { memberId } : {}) }),
        participant: phone,
        text: messageBody,
        appointmentId,
        customerId,
        data: response,
      });

      return response;
    } catch (error) {
      logger.error({ error }, "Error sending text message");
      throw error;
    }
  }
}

export class SystemNotificationService implements ISystemNotificationService {
  protected readonly loggerFactory = getLoggerFactory(
    "SystemNotificationService",
  );

  public constructor(
    private readonly emailService: IMailSender,
    private readonly textMessageSender: ITextMessageSender,
  ) {}

  public async sendSystemEmail(email: Email): Promise<void> {
    const logger = this.loggerFactory("sendSystemEmail");
    logger.info({ email }, "Sending system email");
    try {
      await this.emailService.sendMail(email, "member");
      logger.info({ email }, "System email sent");
    } catch (error) {
      logger.error({ error }, "Error sending system email");
      throw error;
    }
  }

  public async sendSystemTextMessage(text: TextMessage): Promise<void> {
    const logger = this.loggerFactory("sendSystemTextMessage");
    logger.info({ text }, "Sending system text message");
    try {
      await this.textMessageSender.sendTextMessage(text);
      logger.info({ text }, "System text message sent");
    } catch (error) {
      logger.error({ error }, "Error sending system text message");
      throw error;
    }
  }
}
