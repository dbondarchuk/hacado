import { getLoggerFactory, LoggerFactory } from "@timelish/logger";
import {
  Appointment,
  AppointmentStatus,
  ConnectedAppData,
  ConnectedAppRequestError,
  ConnectedAppStatusWithText,
  EventEnvelope,
  EventSource,
  IConnectedApp,
  IConnectedAppProps,
  IEventSubscriber,
  SessionUser,
} from "@timelish/types";
import {
  AppointmentStatusToICalMethodMap,
  dispatchAppointmentEventPayload,
  getAdminUrl,
  getArguments,
  getEventCalendarContent,
  getWebsiteUrl,
  resolveAppointmentEventForMemberId,
  resolveProcessOtherMembersAppointmentsConfig,
} from "@timelish/utils";
import {
  EmailNotificationConfiguration,
  emailNotificationConfigurationSchema,
} from "./models";

import { getEmailTemplate } from "./emails/utils";
import {
  EmailNotificationAdminAllKeys,
  EmailNotificationAdminKeys,
  EmailNotificationAdminNamespace,
} from "./translations/types";

export class EmailNotificationConnectedApp
  implements IConnectedApp, IEventSubscriber
{
  protected readonly loggerFactory: LoggerFactory;

  public constructor(protected readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "EmailNotificationConnectedApp",
      props.organizationId,
    );
  }

  public async onEvent(
    appData: ConnectedAppData,
    envelope: EventEnvelope,
  ): Promise<void> {
    const config = (appData.data ?? {}) as EmailNotificationConfiguration;
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
          oldTime,
          oldDuration,
          doNotNotifyCustomer,
          source,
        ) =>
          this.onAppointmentRescheduled(
            appData,
            appointment,
            newTime,
            newDuration,
            source,
            oldTime,
            oldDuration,
            doNotNotifyCustomer,
          ),
        onAppointmentSlotRescheduled: (
          appointment,
          newTime,
          newDuration,
          oldTime,
          oldDuration,
          doNotNotifyCustomer,
          source,
        ) =>
          this.onAppointmentRescheduled(
            appData,
            appointment,
            newTime,
            newDuration,
            source,
            oldTime,
            oldDuration,
            doNotNotifyCustomer,
          ),
        onAppointmentStatusChanged: (
          appointment,
          newStatus,
          oldStatus,
          source,
        ) =>
          this.onAppointmentStatusChanged(
            appData,
            appointment,
            newStatus,
            oldStatus,
            source,
          ),
      },
      forMemberId,
    );
  }

  public async processRequest(
    appData: ConnectedAppData,
    request: EmailNotificationConfiguration,
    _apiRequest?: unknown,
    user?: SessionUser,
  ): Promise<
    ConnectedAppStatusWithText<
      EmailNotificationAdminNamespace,
      EmailNotificationAdminKeys
    >
  > {
    const logger = this.loggerFactory("processRequest");
    logger.debug(
      { appId: appData._id },
      "Processing email notification configuration request",
    );

    const { data, success, error } =
      emailNotificationConfigurationSchema.safeParse(request);
    if (!success) {
      logger.error({ error }, "Invalid request");
      throw new ConnectedAppRequestError(
        "invalid_request",
        { request, error },
        400,
        error.message,
      );
    }

    const savedData: EmailNotificationConfiguration = {
      ...data,
      processOtherMembersAppointments:
        resolveProcessOtherMembersAppointmentsConfig(
          data.processOtherMembersAppointments,
          user,
        ),
    };

    try {
      const status: ConnectedAppStatusWithText<
        EmailNotificationAdminNamespace,
        EmailNotificationAdminKeys
      > = {
        status: "connected",
        statusText:
          "app_email-notification_admin.statusText.successfully_set_up",
      };

      this.props.update({
        data: savedData,
        ...status,
      });

      logger.info(
        { appId: appData._id, status: status.status },
        "Successfully configured email notification",
      );

      return status;
    } catch (error: any) {
      logger.error(
        { appId: appData._id, error },
        "Error processing email notification configuration",
      );

      this.props.update({
        status: "failed",
        statusText:
          "app_email-notification_admin.statusText.error_processing_configuration" satisfies EmailNotificationAdminAllKeys,
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
      "Appointment created, sending email notification",
    );

    try {
      await this.sendNotification(
        appData,
        appointment,
        confirmed ? "auto-confirmed" : "pending",
        "newRequest",
      );

      logger.info(
        { appId: appData._id, appointmentId: appointment._id, confirmed },
        "Successfully sent email notification for new appointment",
      );
    } catch (error: any) {
      logger.error(
        { appId: appData._id, appointmentId: appointment._id, error },
        "Error sending email notification for new appointment",
      );

      this.props.update({
        status: "failed",
        statusText:
          "app_email-notification_admin.statusText.error_sending_email_notification_for_new_appointment" satisfies EmailNotificationAdminAllKeys,
      });

      throw error;
    }
  }

  public async onAppointmentStatusChanged(
    appData: ConnectedAppData,
    appointment: Appointment,
    newStatus: AppointmentStatus,
    oldStatus: AppointmentStatus | undefined,
    source: EventSource,
  ): Promise<void> {
    const logger = this.loggerFactory("onAppointmentStatusChanged");
    logger.debug(
      {
        appId: appData._id,
        appointmentId: appointment._id,
        newStatus,
        source,
      },
      "Appointment status changed, sending email notification",
    );

    const status =
      source.actor === "customer" && newStatus === "declined"
        ? "cancelledByCustomer"
        : newStatus;
    try {
      await this.sendNotification(appData, appointment, status, newStatus);

      logger.info(
        {
          appId: appData._id,
          appointmentId: appointment._id,
          newStatus,
          source,
        },
        "Successfully sent email notification for status change",
      );
    } catch (error: any) {
      logger.error(
        {
          appId: appData._id,
          appointmentId: appointment._id,
          newStatus,
          error,
        },
        "Error sending email notification for status change",
      );

      this.props.update({
        status: "failed",
        statusText:
          "app_email-notification_admin.statusText.error_sending_email_notification_for_status_change" satisfies EmailNotificationAdminAllKeys,
      });

      throw error;
    }
  }

  public async onAppointmentRescheduled(
    appData: ConnectedAppData,
    appointment: Appointment,
    newTime: Date,
    newDuration: number,
    source: EventSource,
    oldTime?: Date,
    oldDuration?: number,
    doNotNotifyCustomer?: boolean,
  ): Promise<void> {
    const logger = this.loggerFactory("onAppointmentRescheduled");
    logger.debug(
      {
        appId: appData._id,
        appointmentId: appointment._id,
        newTime: newTime.toISOString(),
        newDuration,
      },
      "Appointment rescheduled, sending email notification",
    );

    try {
      const newAppointment: Appointment = {
        ...appointment,
        dateTime: newTime,
        totalDuration: newDuration,
      };

      await this.sendNotification(
        appData,
        newAppointment,
        source.actor === "customer" ? "rescheduledByCustomer" : "rescheduled",
        "rescheduled",
      );

      logger.info(
        {
          appId: appData._id,
          appointmentId: appointment._id,
          newTime: newTime.toISOString(),
          newDuration,
        },
        "Successfully sent email notification for rescheduled appointment",
      );
    } catch (error: any) {
      logger.error(
        {
          appId: appData._id,
          appointmentId: appointment._id,
          newTime: newTime.toISOString(),
          newDuration,
          error,
        },
        "Error sending email notification for rescheduled appointment",
      );

      this.props.update({
        status: "failed",
        statusText:
          "app_email-notification_admin.statusText.error_sending_email_notification_for_rescheduled_appointment" satisfies EmailNotificationAdminAllKeys,
      });

      throw error;
    }
  }

  private async sendNotification(
    appData: ConnectedAppData,
    appointment: Appointment,
    status:
      | keyof typeof AppointmentStatusToICalMethodMap
      | "auto-confirmed"
      | "cancelledByCustomer"
      | "rescheduledByCustomer",
    initiator: keyof typeof AppointmentStatusToICalMethodMap | "newRequest",
  ) {
    const logger = this.loggerFactory("sendNotification");
    logger.debug(
      { appId: appData._id, appointmentId: appointment._id, status, initiator },
      "Sending email notification",
    );

    try {
      const organization =
        await this.props.services.organizationService.getOrganization();
      if (!organization) {
        logger.error(
          { appId: appData._id, appointmentId: appointment._id },
          "Organization not found",
        );
        return;
      }

      const config =
        await this.props.services.configurationService.getConfigurations(
          "booking",
          "general",
          "brand",
          "social",
        );

      logger.debug(
        { appId: appData._id, appointmentId: appointment._id },
        "Retrieved configuration for email notification",
      );

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
        adminUrl: getAdminUrl(),
        websiteUrl: getWebsiteUrl(organization),
        customer: appointment.customer,
        useAppointmentTimezone: true,
        locale: config.brand.language,
        user: member,
      });

      logger.debug(
        { appId: appData._id, appointmentId: appointment._id },
        "Generated template arguments",
      );

      const data = appData.data as EmailNotificationConfiguration;

      const {
        template: description,
        subject,
        eventTitle,
      } = await getEmailTemplate(
        status,
        config.brand.language,
        getAdminUrl(),
        appointment,
        args,
      );

      logger.debug(
        {
          appId: appData._id,
          appointmentId: appointment._id,
          status,
          descriptionLength: description.length,
        },
        "Generated email description from template",
      );

      let newStatus: keyof typeof AppointmentStatusToICalMethodMap;
      if (status === "rescheduledByCustomer") {
        newStatus = "rescheduled";
      } else if (status === "cancelledByCustomer") {
        newStatus = "declined";
      } else if (status === "auto-confirmed") {
        newStatus = "confirmed";
      } else {
        newStatus = status;
      }

      const eventContent = getEventCalendarContent(
        config.general,
        appointment,
        eventTitle,
        description,
        status === "auto-confirmed"
          ? "REQUEST"
          : AppointmentStatusToICalMethodMap[newStatus],
      );

      logger.debug(
        { appId: appData._id, appointmentId: appointment._id, status },
        "Generated event calendar content",
      );

      const recipientEmail =
        data?.email || member?.email || config.general.email;

      logger.debug(
        {
          appId: appData._id,
          appointmentId: appointment._id,
          recipientEmail,
          subject,
        },
        "Prepared email details",
      );

      logger.debug(
        { appId: appData._id, appointmentId: appointment._id, recipientEmail },
        "Sending email notification",
      );

      await this.props.services.notificationService.sendEmail({
        email: {
          to: recipientEmail,
          subject: subject,
          body: description,
          icalEvent: {
            method:
              status === "auto-confirmed"
                ? "REQUEST"
                : AppointmentStatusToICalMethodMap[newStatus],
            content: eventContent,
          },
        },
        participantType: "member",
        memberId: appData.memberId,
        handledBy:
          `app_email-notification_admin.handlers.${initiator}` satisfies EmailNotificationAdminAllKeys,
        appointmentId: appointment._id,
      });

      logger.info(
        {
          appId: appData._id,
          appointmentId: appointment._id,
          status,
          recipientEmail,
        },
        "Successfully sent email notification",
      );
    } catch (error: any) {
      logger.error(
        { appId: appData._id, appointmentId: appointment._id, status, error },
        "Error sending email notification",
      );
      throw error;
    }
  }
}
