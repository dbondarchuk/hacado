import { getTextBeltWebhookEmailTemplate } from "@hacado/app-store/exports";
import { BaseAllKeys } from "@hacado/i18n";
import { getLoggerFactory } from "@hacado/logger";
import {
  ITextMessageResponder,
  RespondResult,
  TextMessageData,
  TextMessageReply,
} from "@hacado/types/apps";
import {
  IBookingService,
  ICommunicationLogsService,
  IConfigurationService,
  IConnectedAppsService,
  ICustomersService,
  INotificationService,
  IOrganizationService,
  ITeamService,
} from "@hacado/types/services";
import {
  getAdminUrl,
  getArguments,
  getWebsiteUrl,
  maskify,
} from "@hacado/utils";

export class InboundTextMessageService {
  protected readonly loggerFactory = getLoggerFactory(
    "InboundTextMessageService",
  );

  constructor(
    private readonly organizationId: string,
    private readonly configurationService: IConfigurationService,
    private readonly connectedAppsService: IConnectedAppsService,
    private readonly bookingService: IBookingService,
    private readonly customersService: ICustomersService,
    private readonly communicationLogsService: ICommunicationLogsService,
    private readonly notificationService: INotificationService,
    private readonly organizationService: IOrganizationService,
    private readonly teamService: ITeamService,
  ) {}

  public async handle(input: {
    from: string;
    message: string;
    messageId?: string;
    data: TextMessageData;
    appointmentId?: string;
    customerId?: string;
    memberId?: string;
  }): Promise<void> {
    const appointment = input.appointmentId
      ? await this.bookingService.getAppointment(input.appointmentId)
      : null;

    const customer = input.customerId
      ? await this.customersService.getCustomer(input.customerId)
      : (appointment?.customer ?? null);

    await this.respond({
      from: input.from,
      message: input.message,
      messageId: input.messageId,
      data: input.data,
      appointment,
      customer,
      memberId: input.memberId,
    });
  }

  private async respond(textMessageReply: TextMessageReply): Promise<void> {
    const logger = this.loggerFactory("respond");
    logger.debug(
      {
        organizationId: this.organizationId,
        fromNumber: maskify(textMessageReply.from),
        messageLength: textMessageReply.message.length,
        hasAppointment: !!textMessageReply.appointment,
        hasCustomer: !!textMessageReply.customer,
      },
      "Processing text message reply",
    );

    const config = await this.configurationService.getConfigurations(
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

    const organization = await this.organizationService.getOrganization();
    if (!organization) {
      logger.error(
        { appointmentId: appointment?._id },
        "Organization not found",
      );

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
      locale: config.brand.language,
      adminUrl,
      websiteUrl,
    });

    const { template: description, subject } =
      await getTextBeltWebhookEmailTemplate(
        "user-notify-reply",
        config.brand.language,
        adminUrl,
        args,
        appointment?._id,
        customer?._id,
      );

    logger.debug(
      { ownerEmail: config.general.email },
      "Sending email to owner about incoming message",
    );

    let memberId = _memberId;
    if (!memberId) {
      memberId =
        appointment?.memberId ?? (await this.teamService.getOwnerMember())._id;
    }

    await this.notificationService.sendEmail({
      email: {
        to: config.general.email,
        subject,
        body: description,
      },
      handledBy: "admin.text-message-reply.handledBy" satisfies BaseAllKeys,
      participantType: "member",
      memberId,
      appointmentId: appointment?._id,
      customerId: customer?._id,
    });

    let result: RespondResult | null | undefined;
    try {
      try {
        if (reply.data.appId && reply.data.appId.length) {
          logger.debug(
            { responderAppId: reply.data.appId },
            "Processing message with responder app",
          );

          const { app, service } =
            await this.connectedAppsService.getAppService<ITextMessageResponder>(
              reply.data.appId,
            );

          if (!!service?.respond) {
            logger.debug(
              { responderAppName: app?.name },
              "Incoming message will be processed by responder app",
            );
          }

          result = await service?.respond?.(app, textMessageReply);
        }
      } finally {
        if (!result) {
          logger.debug(
            "No service has processed the incoming text message. Will try to use responder app",
          );

          const defaultApps =
            await this.configurationService.getConfiguration("defaultApps");

          const textMessageResponderAppId =
            defaultApps.textMessageResponderAppId;

          if (textMessageResponderAppId) {
            const { app, service } =
              await this.connectedAppsService.getAppService<ITextMessageResponder>(
                textMessageResponderAppId,
              );

            result = await service?.respond?.(app, textMessageReply);
          }
        }
      }
    } finally {
      if (!result) {
        logger.warn(
          "No responder app was registered or the incoming text was not processed",
        );

        result = {
          handledBy: "admin.text-message-reply.handledBy" satisfies BaseAllKeys,
          participantType: "customer",
        };
      }

      logger.debug(
        {
          handledBy: result.handledBy,
          participantType: result.participantType,
        },
        "Logging communication",
      );

      await this.communicationLogsService.create({
        channel: "text-message",
        direction: "inbound",
        status: "received",
        participant: reply.from,
        handledBy: result.handledBy,
        text: reply.message,
        data: reply.data,
        appointmentId: appointment?._id,
        customerId: customer?._id,
        ...(result.participantType === "member"
          ? { participantType: "member" as const, memberId }
          : {
              participantType: "customer" as const,
              ...(appointment?.memberId
                ? { memberId: appointment.memberId }
                : {}),
            }),
      });

      logger.info(
        {
          fromNumber: maskify(textMessageReply.from),
          handledBy: result.handledBy,
        },
        "Successfully processed text message reply",
      );
    }
  }
}
