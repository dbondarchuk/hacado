import { getLoggerFactory } from "@hacado/logger";
import {
  BillingPlanTier,
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
  SmsCreditsExhaustedError,
  SubscriptionUpgradeRequiredError,
  TextMessage,
  TextMessageNotificationRequest,
  TextMessageResponse,
} from "@hacado/types";
import { isSmsLinkShorteningEnabled, maskify } from "@hacado/utils";
import { convert } from "html-to-text";
import { resolvePlanTierFromOrganization } from "./billing/subscription-entitlements";

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
    } = props;
    const trimmedPhone = phone.replaceAll(/[^+0-9]/gi, "");
    const logger = this.loggerFactory("sendTextMessage");

    logger.debug(
      { appointmentId, customerId, phone: maskify(trimmedPhone) },
      "Sending text message",
    );

    const organization = await this.organizationService.getOrganization();
    const planTier = resolvePlanTierFromOrganization(organization);

    const defaultAppsConfiguration =
      await this.configurationService.getConfiguration("defaultApps");
    const textMessageSenderAppId =
      defaultAppsConfiguration?.textMessageSenderAppId;

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
        logger.warn("Sms credits exhausted");
        throw new SmsCreditsExhaustedError();
      }

      sendTextMessage = async (message: TextMessage) => {
        const response = await this.defaultTextMessageSender.sendTextMessage(
          this.organizationId,
          message,
        );

        if (!response.error) {
          await this.billingService.consumeSmsCredits({
            amount: 1,
            direction: "outbound",
            textId: response.textId,
          });
        }
        return response;
      };
    }

    let messageBody = body;
    if (isSmsLinkShorteningEnabled()) {
      messageBody = await this.shortLinksService.shortenUrlsInText(body);
    }

    try {
      const response = await sendTextMessage({
        message: messageBody,
        phone: trimmedPhone,
        data: webhookData,
        sender,
        memberId,
      });

      if (response.error) {
        throw Error(response.error);
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
            textMessageSender: "built-in-textbelt",
            textMessageSenderParticipant: handledBy,
            textMessageSenderPhone: maskify(trimmedPhone),
            appointmentId,
            customerId,
          },
          "Text Message sent via built-in TextBelt",
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

  public constructor(private readonly emailService: IMailSender) {}

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
}
