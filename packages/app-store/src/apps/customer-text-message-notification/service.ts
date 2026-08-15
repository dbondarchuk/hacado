import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import {
  Appointment,
  AppointmentStatus,
  ConnectedAppData,
  ConnectedAppRequestError,
  ConnectedAppStatusWithText,
  EventEnvelope,
  IConnectedApp,
  IConnectedAppProps,
  IEventSubscriber,
} from "@hacado/types";
import {
  CustomerTextMessageNotificationConfiguration,
  customerTextMessageNotificationConfigurationSchema,
} from "./models";
import {
  CustomerTextMessageNotificationAdminAllKeys,
  CustomerTextMessageNotificationAdminKeys,
  CustomerTextMessageNotificationAdminNamespace,
} from "./translations/types";

import {
  dispatchAppointmentEventPayload,
  getAdminUrl,
  getArguments,
  getPhoneField,
  getWebsiteUrl,
  templateSafeWithError,
} from "@hacado/utils";

export default class CustomerTextMessageNotificationConnectedApp
  implements IConnectedApp, IEventSubscriber
{
  protected readonly loggerFactory: LoggerFactory;

  public constructor(protected readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "CustomerTextMessageNotificationConnectedApp",
      props.organizationId,
    );
  }

  public async onEvent(
    appData: ConnectedAppData,
    envelope: EventEnvelope,
  ): Promise<void> {
    await dispatchAppointmentEventPayload(envelope, {
      onAppointmentCreated: (appointment, confirmed) =>
        this.onAppointmentCreated(appData, appointment, confirmed),
      onAppointmentFullRescheduled: (
        appointment,
        newTime,
        newDuration,
        oldTime,
        oldDuration,
        doNotNotifyCustomer,
        _source,
      ) =>
        this.onAppointmentRescheduled(
          appData,
          appointment,
          newTime,
          newDuration,
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
        _source,
      ) =>
        this.onAppointmentRescheduled(
          appData,
          appointment,
          newTime,
          newDuration,
          oldTime,
          oldDuration,
          doNotNotifyCustomer,
        ),
      onAppointmentStatusChanged: (
        appointment,
        newStatus,
        oldStatus,
        _source,
      ) => this.onAppointmentStatusChanged(appData, appointment, newStatus),
    });
  }

  public async processRequest(
    appData: ConnectedAppData,
    request: CustomerTextMessageNotificationConfiguration,
  ): Promise<
    ConnectedAppStatusWithText<
      CustomerTextMessageNotificationAdminNamespace,
      CustomerTextMessageNotificationAdminKeys
    >
  > {
    const logger = this.loggerFactory("processRequest");
    logger.debug(
      { appId: appData._id },
      "Processing customer text message notification configuration request",
    );

    const { data, success, error } =
      customerTextMessageNotificationConfigurationSchema.safeParse(request);
    if (!success) {
      logger.error({ error }, "Invalid request");
      throw new ConnectedAppRequestError(
        "invalid_request",
        { request, error },
        400,
        error.message,
      );
    }

    try {
      const status: ConnectedAppStatusWithText<
        CustomerTextMessageNotificationAdminNamespace,
        CustomerTextMessageNotificationAdminKeys
      > = {
        status: "connected",
        statusText:
          "app_customer-text-message-notification_admin.statusText.successfully_set_up",
      };

      this.props.update({
        data,
        ...status,
      });

      logger.info(
        { appId: appData._id, status: status.status },
        "Successfully configured customer text message notification",
      );

      return status;
    } catch (error: any) {
      logger.error(
        { appId: appData._id, error },
        "Error processing customer text message notification configuration",
      );

      this.props.update({
        status: "failed",
        statusText:
          "app_customer-text-message-notification_admin.statusText.error_processing_configuration" satisfies CustomerTextMessageNotificationAdminAllKeys,
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
      "Appointment created, sending customer text message notification",
    );

    try {
      await this.sendNotification(
        appData,
        appointment,
        confirmed ? "confirmed" : "pending",
        "newRequest",
      );

      logger.info(
        { appId: appData._id, appointmentId: appointment._id, confirmed },
        "Successfully sent customer text message notification for new appointment",
      );
    } catch (error: any) {
      logger.error(
        { appId: appData._id, appointmentId: appointment._id, error },
        "Error sending customer text message notification for new appointment",
      );

      this.props.update({
        status: "failed",
        statusText:
          "app_customer-text-message-notification_admin.statusText.error_sending_customer_text_message_notification_for_new_appointment" satisfies CustomerTextMessageNotificationAdminAllKeys,
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
      "Appointment status changed, sending customer text message notification",
    );

    try {
      await this.sendNotification(appData, appointment, newStatus, newStatus);

      logger.info(
        { appId: appData._id, appointmentId: appointment._id, newStatus },
        "Successfully sent customer text message notification for status change",
      );
    } catch (error: any) {
      logger.error(
        {
          appId: appData._id,
          appointmentId: appointment._id,
          newStatus,
          error,
        },
        "Error sending customer text message notification for status change",
      );

      this.props.update({
        status: "failed",
        statusText:
          "app_customer-text-message-notification_admin.statusText.error_sending_customer_text_message_notification_for_status_change" satisfies CustomerTextMessageNotificationAdminAllKeys,
      });

      throw error;
    }
  }

  public async onAppointmentRescheduled(
    appData: ConnectedAppData,
    appointment: Appointment,
    newTime: Date,
    newDuration: number,
    _?: Date,
    __?: number,
    doNotNotifyCustomer?: boolean,
  ): Promise<void> {
    const logger = this.loggerFactory("onAppointmentRescheduled");
    if (doNotNotifyCustomer) {
      logger.debug(
        {
          appId: appData._id,
          appointmentId: appointment._id,
          newTime: newTime.toISOString(),
          newDuration,
          doNotNotifyCustomer,
        },
        "Appointment rescheduled, not sending customer text message notification - do not notify customer",
      );
      return;
    }

    logger.debug(
      {
        appId: appData._id,
        appointmentId: appointment._id,
        newTime: newTime.toISOString(),
        newDuration,
        doNotNotifyCustomer,
      },
      "Appointment rescheduled, sending customer text message notification",
    );

    const newAppointment: Appointment = {
      ...appointment,
      dateTime: newTime,
      totalDuration: newDuration,
    };

    try {
      await this.sendNotification(
        appData,
        newAppointment,
        "rescheduled",
        "rescheduled",
      );

      logger.info(
        {
          appId: appData._id,
          appointmentId: appointment._id,
          newTime: newTime.toISOString(),
          newDuration,
        },
        "Successfully sent customer text message notification for rescheduled appointment",
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
        "Error sending customer text message notification for rescheduled appointment",
      );

      this.props.update({
        status: "failed",
        statusText:
          "app_customer-text-message-notification_admin.statusText.error_sending_customer_text_message_notification_for_rescheduled_appointment" satisfies CustomerTextMessageNotificationAdminAllKeys,
      });

      throw error;
    }
  }

  private async sendNotification(
    appData: ConnectedAppData,
    appointment: Appointment,
    status: keyof CustomerTextMessageNotificationConfiguration["templates"],
    initiator:
      | keyof CustomerTextMessageNotificationConfiguration["templates"]
      | "newRequest",
  ) {
    const logger = this.loggerFactory("sendNotification");
    logger.debug(
      { appId: appData._id, appointmentId: appointment._id, status, initiator },
      "Sending customer text message notification",
    );

    try {
      const data = appData.data as CustomerTextMessageNotificationConfiguration;
      const templateId = data.templates[status].templateId;

      if (!templateId) {
        logger.warn(
          { appId: appData._id, appointmentId: appointment._id, status },
          "No template ID configured for status, skipping text message notification",
        );
        return;
      }

      logger.debug(
        { appId: appData._id, appointmentId: appointment._id, templateId },
        "Getting text message template",
      );

      const template =
        await this.props.services.templatesService.getTemplate(templateId);
      if (!template) {
        logger.error(
          { appId: appData._id, appointmentId: appointment._id, templateId },
          "Text message template not found",
        );
        console.error(`Can't find template with id ${templateId}`);
        return;
      }

      logger.debug(
        { appId: appData._id, appointmentId: appointment._id },
        "Retrieved text message template",
      );

      const config =
        await this.props.services.configurationService.getConfigurations(
          "booking",
          "general",
          "brand",
          "social",
        );

      logger.debug(
        { appId: appData._id, appointmentId: appointment._id },
        "Retrieved configuration for text message notification",
      );

      const phoneFields = (
        await this.props.services.servicesService.getFields({
          type: ["phone"],
        })
      ).items;

      logger.debug(
        {
          appId: appData._id,
          appointmentId: appointment._id,
          phoneFieldCount: phoneFields.length,
        },
        "Retrieved phone fields",
      );

      const phone =
        appointment.fields?.phone ?? getPhoneField(appointment, phoneFields);
      if (!phone) {
        logger.warn(
          { appId: appData._id, appointmentId: appointment._id },
          "Can't find the phone field for appointment",
        );
        console.warn(
          `Can't find the phone field for appointment ${appointment._id}`,
        );
        return;
      }

      logger.debug(
        { appId: appData._id, appointmentId: appointment._id, phone },
        "Found phone number for customer",
      );

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

      const args = getArguments({
        appointment,
        config,
        customer: appointment.customer,
        useAppointmentTimezone: true,
        locale: config.brand.language,
        adminUrl,
        websiteUrl,
      });

      logger.debug(
        { appId: appData._id, appointmentId: appointment._id },
        "Generated template arguments",
      );

      const templatedBody = templateSafeWithError(
        template.value as string,
        args,
        true,
      );

      logger.debug(
        {
          appId: appData._id,
          appointmentId: appointment._id,
          bodyLength: templatedBody.length,
        },
        "Generated templated message body",
      );

      logger.debug(
        { appId: appData._id, appointmentId: appointment._id, phone },
        "Sending text message notification",
      );

      await this.props.services.notificationService.sendTextMessage({
        phone,
        body: templatedBody,
        webhookData: {
          appointmentId: appointment._id,
          appId: appData._id,
        },
        appointmentId: appointment._id,
        participantType: "customer",
        memberId: appointment.memberId,
        handledBy:
          `app_customer-text-message-notification_admin.handlers.${initiator}` satisfies CustomerTextMessageNotificationAdminAllKeys,
      });

      logger.info(
        { appId: appData._id, appointmentId: appointment._id, status, phone },
        "Successfully sent customer text message notification",
      );
    } catch (error: any) {
      logger.error(
        { appId: appData._id, appointmentId: appointment._id, status, error },
        "Error sending customer text message notification",
      );
      throw error;
    }
  }
}
