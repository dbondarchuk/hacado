import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import {
  Appointment,
  AppointmentStatus,
  BookingConfiguration,
  BrandConfiguration,
  ConnectedAppData,
  ConnectedAppRequestError,
  ConnectedAppStatusWithText,
  EventEnvelope,
  GeneralConfiguration,
  IConnectedApp,
  IConnectedAppProps,
  IEventSubscriber,
  ITextMessageResponder,
  RespondResult,
  SessionUser,
  SocialConfiguration,
  TextMessageReply,
} from "@hacado/types";
import {
  dispatchAppointmentEventPayload,
  formatAmountString,
  getAdminUrl,
  getArguments,
  getWebsiteUrl,
  resolveAppointmentEventForMemberId,
  resolveProcessOtherMembersAppointmentsConfig,
  template,
} from "@hacado/utils";
import { TextMessageNotificationMessages } from "./messages";
import {
  TextMessageNotificationConfiguration,
  textMessageNotificationConfigurationSchema,
} from "./models";
import {
  TextMessageNotificationAdminAllKeys,
  TextMessageNotificationAdminKeys,
  TextMessageNotificationAdminNamespace,
} from "./translations/types";

export class TextMessageNotificationConnectedApp
  implements IConnectedApp, IEventSubscriber, ITextMessageResponder
{
  protected readonly loggerFactory: LoggerFactory;

  public constructor(protected readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "TextMessageNotificationConnectedApp",
      props.organizationId,
    );
  }

  public async onEvent(
    appData: ConnectedAppData,
    envelope: EventEnvelope,
  ): Promise<void> {
    const config = (appData.data ?? {}) as TextMessageNotificationConfiguration;
    const organization =
      await this.props.services.organizationService.getOrganization();
    const forMemberId = await resolveAppointmentEventForMemberId(
      async (memberId) => {
        const member =
          await this.props.services.teamService.getMemberById(memberId);
        return member?.role ?? null;
      },
      appData.memberId,
      config.processOtherMembersAppointments,
      (organization?.availableUsers ?? 1) > 1,
    );

    await dispatchAppointmentEventPayload(
      envelope,
      {
        onAppointmentCreated: (appointment, confirmed) =>
          this.onAppointmentCreated(appData, appointment, confirmed),
        onAppointmentFullRescheduled: (
          appointment,
          newTime,
          newDuration,
          _oldTime,
          _oldDuration,
          _doNotNotify,
          _source,
        ) =>
          this.onAppointmentRescheduled(
            appData,
            appointment,
            newTime,
            newDuration,
          ),
        onAppointmentSlotRescheduled: (
          appointment,
          newTime,
          newDuration,
          _oldTime,
          _oldDuration,
          _doNotNotify,
          _source,
        ) =>
          this.onAppointmentRescheduled(
            appData,
            appointment,
            newTime,
            newDuration,
          ),
        onAppointmentStatusChanged: (
          appointment,
          newStatus,
          _oldStatus,
          _source,
        ) => this.onAppointmentStatusChanged(appData, appointment, newStatus),
      },
      forMemberId,
    );
  }

  public async processRequest(
    appData: ConnectedAppData,
    request: TextMessageNotificationConfiguration,
    _apiRequest?: unknown,
    user?: SessionUser,
  ): Promise<
    ConnectedAppStatusWithText<
      TextMessageNotificationAdminNamespace,
      TextMessageNotificationAdminKeys
    >
  > {
    const logger = this.loggerFactory("processRequest");
    const { data, success, error } =
      textMessageNotificationConfigurationSchema.safeParse(request);
    if (!success) {
      logger.error(
        { error },
        "Invalid Text Message Notification configuration request",
      );
      throw new ConnectedAppRequestError(
        "invalid_text-message-notification_configuration_request",
        { request, error },
        400,
        error.message,
      );
    }

    const savedData: TextMessageNotificationConfiguration = {
      ...data,
      processOtherMembersAppointments:
        resolveProcessOtherMembersAppointmentsConfig(
          data.processOtherMembersAppointments,
          user,
        ),
    };

    logger.debug(
      { appId: appData._id, phone: savedData?.phone },
      "Processing text message notification configuration request",
    );

    try {
      const status: ConnectedAppStatusWithText<
        TextMessageNotificationAdminNamespace,
        TextMessageNotificationAdminKeys
      > = {
        status: "connected",
        statusText:
          "app_text-message-notification_admin.statusText.successfully_set_up",
      };

      this.props.update({
        data: savedData,
        ...status,
      });

      logger.info(
        { appId: appData._id, status: status.status },
        "Successfully configured text message notification",
      );

      return status;
    } catch (error: any) {
      logger.error(
        { appId: appData._id, error },
        "Error processing text message notification configuration",
      );

      this.props.update({
        status: "failed",
        statusText:
          "app_text-message-notification_admin.statusText.error_processing_configuration" satisfies TextMessageNotificationAdminAllKeys,
      });

      throw error;
    }
  }

  public async onAppointmentCreated(
    appData: ConnectedAppData,
    appointment: Appointment,
    confirmed: boolean,
  ): Promise<void> {
    const logger = this.loggerFactory("onAppointmentCreated");
    logger.debug(
      { appId: appData._id, appointmentId: appointment._id, confirmed },
      "Appointment created, sending owner text message notification",
    );

    try {
      const data = appData.data as TextMessageNotificationConfiguration;
      const config =
        await this.props.services.configurationService.getConfigurations(
          "booking",
          "general",
          "brand",
          "social",
        );

      const totalAmountPaid = appointment.payments
        ?.filter((payment) => payment.status === "paid")
        .reduce((sum, payment) => sum + payment.amount, 0);

      const totalAmountPaidFormatted = totalAmountPaid
        ? formatAmountString(totalAmountPaid)
        : undefined;

      const organization =
        await this.props.services.organizationService.getOrganization();
      if (!organization) {
        logger.error(
          { appId: appData._id, appointmentId: appointment._id },
          "Organization not found",
        );
        return;
      }

      const adminUrl = getAdminUrl();
      const websiteUrl = getWebsiteUrl(organization);

      const member = await this.props.services.teamService.getMemberById(
        appData.memberId,
      );

      if (!member) {
        logger.error(
          {
            appId: appData._id,
            appointmentId: appointment._id,
            memberId: appData.memberId,
          },
          "Member not found",
        );
        return;
      }

      const args = getArguments({
        appointment,
        config,
        customer: appointment.customer,
        locale: config.brand.language,
        additionalProperties: {
          confirmed,
          totalAmountPaidFormatted,
        },
        adminUrl,
        websiteUrl,
        user: member,
      });

      const body = template(
        TextMessageNotificationMessages[config.brand.language]
          .newAppointmentRequested ??
          TextMessageNotificationMessages["en"].newAppointmentRequested,
        args,
      );

      const phone = data?.phone || member?.phone || config.general.phone;
      if (!phone) {
        logger.warn(
          { appId: appData._id, appointmentId: appointment._id },
          "Phone field not found for owner notification",
        );

        return;
      }

      logger.debug(
        {
          appId: appData._id,
          appointmentId: appointment._id,
          phone: phone.replace(/(\d{3})\d{3}(\d{4})/, "$1***$2"),
          messageLength: body.length,
        },
        "Sending appointment created notification",
      );

      this.props.services.notificationService.sendTextMessage({
        phone,
        body,
        webhookData: {
          appointmentId: appointment._id,
          appId: appData._id,
        },
        appointmentId: appointment._id,
        participantType: "member",
        memberId: appData.memberId,
        handledBy:
          "app_text-message-notification_admin.handlers.newRequest" satisfies TextMessageNotificationAdminAllKeys,
      });

      logger.info(
        { appId: appData._id, appointmentId: appointment._id, confirmed },
        "Successfully sent owner text message notification for new appointment",
      );
    } catch (error: any) {
      logger.error(
        { appId: appData._id, appointmentId: appointment._id, error },
        "Error sending owner text message notification for new appointment",
      );

      this.props.update({
        status: "failed",
        statusText:
          "app_text-message-notification_admin.statusText.error_sending_owner_text_message_notification_for_new_appointment" satisfies TextMessageNotificationAdminAllKeys,
      });

      throw error;
    }
  }

  public async onAppointmentStatusChanged(
    appData: ConnectedAppData,
    appointment: Appointment,
    newStatus: AppointmentStatus,
  ): Promise<void> {
    const logger = this.loggerFactory("onAppointmentStatusChanged");
    logger.debug(
      { appId: appData._id, appointmentId: appointment._id, newStatus },
      "Appointment status changed (no action required)",
    );
    // do nothing
  }

  public async onAppointmentRescheduled(
    appData: ConnectedAppData,
    appointment: Appointment,
    newTime: Date,
    newDuration: number,
  ): Promise<void> {
    const logger = this.loggerFactory("onAppointmentRescheduled");
    logger.debug(
      {
        appId: appData._id,
        appointmentId: appointment._id,
        newTime: newTime.toISOString(),
        newDuration,
      },
      "Appointment rescheduled (no action required)",
    );
    // do nothing
  }

  public async respond(
    appData: ConnectedAppData,
    reply: TextMessageReply,
  ): Promise<RespondResult | null> {
    const logger = this.loggerFactory("respond");
    logger.debug(
      {
        appId: appData._id,
        appointmentId: reply?.data?.appointmentId,
        from: reply.from?.replace(/(\d{3})\d{3}(\d{4})/, "$1***$2"),
        message: reply.message,
      },
      "Processing text message reply",
    );

    try {
      if (!reply?.data?.appointmentId) {
        logger.error(
          { appId: appData._id, replyData: reply?.data },
          "Appointment ID missing in reply",
        );
        throw new Error(`Appointment Id is missing`);
      }

      const appointment =
        await this.props.services.bookingService.getAppointment(
          reply.data.appointmentId,
        );

      const config =
        await this.props.services.configurationService.getConfigurations(
          "general",
          "booking",
          "brand",
          "social",
        );

      if (!appointment) {
        logger.warn(
          {
            appId: appData._id,
            appointmentId: reply.data.appointmentId,
            from: reply.from?.replace(/(\d{3})\d{3}(\d{4})/, "$1***$2"),
          },
          "Unknown appointment in reply",
        );

        const memberId = reply.memberId ?? appData.memberId;
        if (!memberId) {
          logger.warn(
            { appId: appData._id, memberId },
            "Member ID is required in text message reply",
          );
          return null;
        }

        const user =
          await this.props.services.teamService.getMemberById(memberId);
        if (!user) {
          logger.warn({ appId: appData._id, memberId }, "User not found");
          return null;
        }

        const body = template(
          TextMessageNotificationMessages[config.brand.language]
            .unknownAppointment ??
            TextMessageNotificationMessages["en"].unknownAppointment,
          {
            config,
            user,
          },
        );

        await this.props.services.notificationService.sendTextMessage({
          phone: reply.from,
          sender: config.general.name,
          body,
          webhookData: reply.data,
          participantType: "member",
          memberId: reply.memberId ?? appData.memberId,
          handledBy:
            "app_text-message-notification_admin.handlers.autoReply" satisfies TextMessageNotificationAdminAllKeys,
        });

        return {
          participantType: "member",
          handledBy:
            "app_text-message-notification_admin.handlers.autoReply" satisfies TextMessageNotificationAdminAllKeys,
        };
      }

      const replyMessage = reply.message.toLocaleLowerCase();

      logger.debug(
        {
          appId: appData._id,
          appointmentId: appointment._id,
          replyMessage,
          currentStatus: appointment.status,
        },
        "Processing reply message",
      );

      if (
        (replyMessage === "y" || replyMessage === "yes") &&
        appointment.status === "pending"
      ) {
        logger.info(
          { appId: appData._id, appointmentId: appointment._id, replyMessage },
          "Processing confirmation reply",
        );

        return await this.processReply(
          appointment,
          "confirmed",
          reply,
          config,
          appData,
        );
      } else if (
        (replyMessage === "n" || replyMessage === "no") &&
        appointment.status !== "declined"
      ) {
        logger.info(
          { appId: appData._id, appointmentId: appointment._id, replyMessage },
          "Processing decline reply",
        );

        return await this.processReply(
          appointment,
          "declined",
          reply,
          config,
          appData,
        );
      } else {
        logger.warn(
          {
            appId: appData._id,
            appointmentId: appointment._id,
            replyMessage,
            currentStatus: appointment.status,
          },
          "Unknown reply message",
        );

        const organization =
          await this.props.services.organizationService.getOrganization();
        if (!organization) {
          logger.error(
            { appId: appData._id, appointmentId: appointment._id },
            "Organization not found",
          );

          throw new Error("Organization not found");
        }

        const adminUrl = getAdminUrl();
        const websiteUrl = getWebsiteUrl(organization);

        const memberId = reply.memberId ?? appData.memberId;
        if (!memberId) {
          logger.warn(
            { appId: appData._id, memberId },
            "Member ID is required in text message reply",
          );
          return null;
        }

        const user =
          await this.props.services.teamService.getMemberById(memberId);
        if (!user) {
          logger.warn({ appId: appData._id, memberId }, "User not found");
          return null;
        }

        const args = getArguments({
          appointment,
          config,
          locale: config.brand.language,
          adminUrl,
          websiteUrl,
          user,
        });

        const body = template(
          TextMessageNotificationMessages[config.brand.language]
            .unknownAppointment ??
            TextMessageNotificationMessages["en"].unknownOption,
          args,
        );

        await this.props.services.notificationService.sendTextMessage({
          phone: reply.from,
          sender: config.general.name,
          body,
          webhookData: reply.data,
          participantType: "member",
          memberId: appData.memberId,
          handledBy:
            "app_text-message-notification_admin.handlers.autoReply" satisfies TextMessageNotificationAdminAllKeys,
        });

        return {
          participantType: "member",
          handledBy:
            "app_text-message-notification_admin.handlers.autoReply" satisfies TextMessageNotificationAdminAllKeys,
        };
      }
    } catch (error: any) {
      logger.error(
        {
          appId: appData._id,
          appointmentId: reply?.data?.appointmentId,
          error,
        },
        "Error processing text message reply",
      );

      this.props.update({
        status: "failed",
        statusText:
          "app_text-message-notification_admin.statusText.error_processing_text_message_reply" satisfies TextMessageNotificationAdminAllKeys,
      });

      throw error;
    }
  }

  private async processReply(
    appointment: Appointment,
    newStatus: Extract<AppointmentStatus, "confirmed" | "declined">,
    reply: TextMessageReply,
    config: {
      general: GeneralConfiguration;
      brand: BrandConfiguration;
      booking: BookingConfiguration;
      social: SocialConfiguration;
    },
    appData: ConnectedAppData,
  ): Promise<RespondResult | null> {
    const logger = this.loggerFactory("processReply");
    logger.info(
      {
        appId: reply.data.appId,
        appointmentId: appointment._id,
        oldStatus: appointment.status,
        newStatus,
      },
      "Processing appointment status change",
    );

    try {
      await this.props.services.bookingService.changeAppointmentStatus(
        appointment._id,
        newStatus,
        { actor: "customer" },
      );

      const organization =
        await this.props.services.organizationService.getOrganization();
      if (!organization) {
        logger.error(
          { appointmentId: appointment._id },
          "Organization not found",
        );
        throw new Error("Organization not found");
      }

      const adminUrl = getAdminUrl();
      const websiteUrl = getWebsiteUrl(organization);

      const memberId =
        reply.memberId ?? appointment.memberId ?? appData.memberId;
      if (!memberId) {
        logger.warn(
          { appId: reply.data.appId, memberId },
          "Member ID is required in text message reply",
        );
        return null;
      }

      const user =
        await this.props.services.teamService.getMemberById(memberId);
      if (!user) {
        logger.warn({ appId: reply.data.appId, memberId }, "User not found");
        return null;
      }

      const args = getArguments({
        appointment,
        config,
        locale: config.brand.language,
        adminUrl,
        websiteUrl,
        user,
      });

      const responseBody = template(
        TextMessageNotificationMessages[config.brand.language][
          newStatus === "confirmed"
            ? "appointmentConfirmed"
            : "appointmentDeclined"
        ] ??
          TextMessageNotificationMessages["en"][
            newStatus === "confirmed"
              ? "appointmentConfirmed"
              : "appointmentDeclined"
          ],
        args,
      );

      logger.debug(
        {
          appId: reply.data.appId,
          appointmentId: appointment._id,
          newStatus,
          phone: reply.from?.replace(/(\d{3})\d{3}(\d{4})/, "$1***$2"),
          messageLength: responseBody.length,
        },
        "Sending status change confirmation",
      );

      await this.props.services.notificationService.sendTextMessage({
        phone: reply.from,
        sender: config.general.name,
        body: responseBody,
        webhookData: reply.data,
        participantType: "member",
        memberId,
        handledBy:
          "app_text-message-notification_admin.handlers.autoReply" satisfies TextMessageNotificationAdminAllKeys,
      });

      logger.info(
        { appId: reply.data.appId, appointmentId: appointment._id, newStatus },
        "Successfully processed appointment status change",
      );

      return {
        participantType: "member",
        handledBy:
          "app_text-message-notification_admin.handlers.autoReply" satisfies TextMessageNotificationAdminAllKeys,
      };
    } catch (error: any) {
      logger.error(
        {
          appId: reply.data.appId,
          appointmentId: appointment._id,
          newStatus,
          error,
        },
        "Error processing appointment status change",
      );

      throw error;
    }
  }
}
