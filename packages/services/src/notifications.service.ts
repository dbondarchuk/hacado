import { getLoggerFactory } from "@hacado/logger";
import {
  Email,
  EmailResponse,
  IMailSender,
  IMailSenderApp,
  ITextMessageSender,
  ITextMessageSenderApp,
  TextMessage,
  TextMessageResponse,
} from "@hacado/types/apps";
import {
  BillingPlanTier,
  SubscriptionUpgradeRequiredError,
} from "@hacado/types/billing";
import { CommunicationLogReason } from "@hacado/types/communication";
import {
  EmailNotificationRequest,
  IBillingService,
  ICommunicationLogsService,
  IConfigurationService,
  IConnectedAppsService,
  IEventService,
  INotificationService,
  IOrganizationService,
  IShortLinksService,
  ISystemNotificationService,
  ITextMessageConfigurationService,
  TextMessageNotificationRequest,
} from "@hacado/types/services";
import { normalizeToE164 } from "@hacado/utils/phone";
import { isSmsLinkShorteningEnabled } from "@hacado/utils/short-links";
import { isPlatformSmsCountry } from "@hacado/utils/sms";
import { maskify } from "@hacado/utils/string";
import { convert } from "html-to-text";
import type { Redis } from "ioredis";
import { resolvePlanTierFromOrganization } from "./billing/subscription-entitlements";
import {
  appendRatesSentence,
  canSendCustomerSms,
  prepareTextbeltSmsBody,
  shouldSkipDuplicateSend,
} from "./text-message/compliance";
import { SmsTransientError } from "./text-message/errors";
import { consumeSmsPlatformLimit } from "./text-message/rate-limit";
import { SmsRegistrationStore } from "./text-message/registration-store";
import { SmsStore } from "./text-message/sms-store";
import { getClientMessagingProfileId } from "./text-message/telnyx/config";
import { TelnyxService } from "./text-message/telnyx/service";
import { TextBeltService } from "./text-message/textbelt/service";
import { getTextBeltConfiguration } from "./text-message/textbelt/utils";
import {
  getUnverifiedSmsProvider,
  resolvePlatformSmsRoute,
} from "./text-message/verification";

const smsFailureReason = (error: string): CommunicationLogReason => {
  switch (error) {
    case "opted out":
      return { key: "admin.communications.reason.optedOut" };
    case "no consent":
      return { key: "admin.communications.reason.noConsent" };
    case "sms disabled":
      return { key: "admin.communications.reason.smsDisabled" };
    case "invalid phone":
      return { key: "admin.communications.reason.invalidPhone" };
    case "credits exhausted":
      return { key: "admin.communications.reason.creditsExhausted" };
    case "rate":
    case "daily":
      return {
        key: "admin.communications.reason.platformLimit",
        args: { limit: error },
      };
    case "sms number not ready":
      return { key: "admin.communications.reason.numberNotReady" };
    case "message had only a link":
      return { key: "admin.communications.reason.linkOnly" };
    default:
      return error;
  }
};

const permanentFailureCounts = (attempt?: { made: number; max: number }) => ({
  retryable: false,
  retriesDone: (attempt?.made ?? 0) + 1,
  retriesLeft: 0,
});

export class NotificationService implements INotificationService {
  protected readonly loggerFactory = getLoggerFactory("NotificationService");

  constructor(
    private readonly organizationId: string,
    private readonly configurationService: IConfigurationService,
    private readonly connectedAppService: IConnectedAppsService,
    private readonly communicationLogService: ICommunicationLogsService,
    private readonly defaultEmailService: IMailSender,
    private readonly billingService: IBillingService,
    private readonly eventService: IEventService,
    private readonly organizationService: IOrganizationService,
    private readonly shortLinksService: IShortLinksService,
    private readonly redisClient: Redis,
    private readonly textMessageConfigurationService: ITextMessageConfigurationService,
    private readonly smsStore: SmsStore = new SmsStore(),
    private readonly registrationStore: SmsRegistrationStore = new SmsRegistrationStore(),
  ) {}

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

      if (props.communicationLogId) {
        await this.recordSent({
          logId: props.communicationLogId,
          providerMessageId: response.messageId,
          attempt: props.deliveryAttempt,
          data: response,
        });
      } else {
        await this.communicationLogService.create({
          direction: "outbound",
          channel: "email",
          status: "sent",
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
      }
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
      dontRequireConsent,
      idempotencyKey,
    } = props;
    const logger = this.loggerFactory("sendTextMessage");
    const trimmedPhone = normalizeToE164(phone);
    if (!trimmedPhone) {
      logger.warn(
        { organizationId: this.organizationId, appointmentId, customerId },
        "SMS skipped: invalid phone",
      );

      await this.recordFailed({
        logId: props.communicationLogId,
        reason: "invalid phone",
        attempt: props.deliveryAttempt,
      });

      return { success: true, skipped: true, error: "invalid phone" };
    }

    logger.debug(
      { appointmentId, customerId, phone: maskify(trimmedPhone) },
      "Sending text message",
    );

    if (!(await this.textMessageConfigurationService.isEnabled())) {
      logger.info(
        { organizationId: this.organizationId, appointmentId, customerId },
        "SMS skipped: text messaging is off",
      );

      await this.recordFailed({
        logId: props.communicationLogId,
        reason: "sms disabled",
        attempt: props.deliveryAttempt,
      });

      return { success: true, skipped: true, error: "sms disabled" };
    }

    const requireConsent =
      participantType === "customer" && !dontRequireConsent;

    const consent = canSendCustomerSms({
      requireConsent,
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

      await this.recordFailed({
        logId: props.communicationLogId,
        reason: consent.reason,
        attempt: props.deliveryAttempt,
      });

      return { success: true, skipped: true, error: consent.reason };
    }

    if (idempotencyKey) {
      const existing = await this.smsStore.findSend(idempotencyKey);
      if (shouldSkipDuplicateSend(existing)) {
        await this.recordSent({
          logId: props.communicationLogId,
          providerMessageId: existing?.textId,
          attempt: props.deliveryAttempt,
        });

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
    let platformKind = "app";
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

      const access =
        await this.textMessageConfigurationService.getSmsMessagingAccess();
      const dedicated = access.customVerified
        ? await this.registrationStore.getAssignedProfileNumber(
            this.organizationId,
          )
        : null;

      const registration = access.customVerified
        ? await this.registrationStore.get(this.organizationId)
        : null;

      const dedicatedProfileId =
        dedicated?.messagingProfileId?.trim() ||
        registration?.telnyxMessagingProfileId?.trim() ||
        getClientMessagingProfileId();

      const poolNumbers = await this.registrationStore.listPoolNumbers();
      const route = resolvePlatformSmsRoute({
        customVerified: access.customVerified,
        dedicatedNumber: dedicated?.phoneNumber,
        platformCountry: isPlatformSmsCountry(trimmedPhone),
        poolNumber: poolNumbers[0],
        messagingProfileId: access.customVerified
          ? dedicatedProfileId
          : getClientMessagingProfileId(),
        unverifiedProvider: getUnverifiedSmsProvider(),
      });

      if (route.kind === "skip") {
        logger.info(
          {
            organizationId: this.organizationId,
            appointmentId,
            reason: route.reason,
          },
          "SMS skipped",
        );

        await this.recordFailed({
          logId: props.communicationLogId,
          reason: route.reason,
          attempt: props.deliveryAttempt,
        });

        return { success: true, skipped: true, error: route.reason };
      }

      platformKind = route.kind;

      const availableTotal =
        await this.billingService.getCurrentSmsBalanceTotal();
      if (availableTotal !== null && availableTotal < 1) {
        logger.warn(
          { organizationId: this.organizationId, appointmentId },
          "SMS skipped: credits exhausted",
        );

        await this.recordFailed({
          logId: props.communicationLogId,
          reason: "credits exhausted",
          attempt: props.deliveryAttempt,
        });

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

        await this.recordFailed({
          logId: props.communicationLogId,
          reason: limit,
          attempt: props.deliveryAttempt,
        });

        return { success: true, skipped: true, error: limit };
      }

      if (participantType === "customer" && route.kind === "telnyx") {
        const alreadySent = await this.smsStore.hasAcceptedCustomerSend(
          this.organizationId,
          trimmedPhone,
        );

        if (!alreadySent) {
          messageBody = appendRatesSentence(messageBody);
        }
      }

      if (route.kind === "textbelt") {
        const prepared = prepareTextbeltSmsBody(messageBody);
        if (!prepared.send) {
          logger.info(
            {
              organizationId: this.organizationId,
              appointmentId,
              reason: prepared.reason,
            },
            "SMS skipped",
          );

          await this.recordFailed({
            logId: props.communicationLogId,
            reason: prepared.reason,
            attempt: props.deliveryAttempt,
          });

          return { success: true, skipped: true, error: prepared.reason };
        }

        messageBody = prepared.message;
      }

      sendTextMessage = async (message: TextMessage) => {
        const response =
          route.kind === "telnyx"
            ? await new TelnyxService().sendTextMessage(
                message,
                this.organizationId,
                {
                  from: route.from,
                  messagingProfileId: route.messagingProfileId,
                },
              )
            : await new TextBeltService(
                getTextBeltConfiguration(),
              ).sendTextMessage(message, this.organizationId);

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

      if (response.skipped || response.error || !response.success) {
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

        await this.recordFailed({
          logId: props.communicationLogId,
          reason: response.error || "SMS send failed",
          attempt: props.deliveryAttempt,
        });

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
            textMessageSender: `built-in-${platformKind}`,
            textMessageSenderParticipant: handledBy,
            textMessageSenderPhone: maskify(trimmedPhone),
            appointmentId,
            customerId,
          },
          "Text Message sent via built-in SMS service",
        );
      }

      if (props.communicationLogId) {
        await this.recordSent({
          logId: props.communicationLogId,
          providerMessageId: response.textId,
          attempt: props.deliveryAttempt,
          text: messageBody,
          data: response,
        });
      } else {
        await this.communicationLogService.create({
          direction: "outbound",
          channel: "text-message",
          status: "sent",
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
      }

      return response;
    } catch (error) {
      logger.error({ error }, "Error sending text message");
      throw error;
    }
  }

  private async recordSent(input: {
    logId?: string;
    providerMessageId?: string;
    attempt?: { made: number; max: number };
    text?: string;
    data?: unknown;
  }) {
    if (!input.logId) {
      return;
    }

    try {
      await this.communicationLogService.update(input.logId, {
        status: "sent",
        reason: null,
        retryable: false,
        retriesLeft: 0,
        retriesDone: input.attempt?.made ?? 0,
        ...(input.providerMessageId
          ? { providerMessageId: input.providerMessageId }
          : {}),
        ...(input.text !== undefined ? { text: input.text } : {}),
        ...(input.data !== undefined ? { data: input.data } : {}),
      });
    } catch (error) {
      this.loggerFactory("recordSent").error(
        { error, logId: input.logId },
        "Failed to update communication log",
      );
    }
  }

  private async recordFailed(input: {
    logId?: string;
    reason: string;
    attempt?: { made: number; max: number };
  }) {
    if (!input.logId) {
      return;
    }

    try {
      await this.communicationLogService.update(input.logId, {
        status: "failed",
        reason: smsFailureReason(input.reason),
        ...permanentFailureCounts(input.attempt),
      });
    } catch (error) {
      this.loggerFactory("recordFailed").error(
        { error, logId: input.logId },
        "Failed to update communication log",
      );
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
