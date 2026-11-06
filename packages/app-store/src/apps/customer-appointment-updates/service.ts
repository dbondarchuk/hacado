import { renderToStaticMarkup } from "@hacado/email-builder/static";
import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import { appointmentSkipsSmsConsent } from "@hacado/services/sms-compliance";
import {
  ConnectedAppData,
  ConnectedAppRequestError,
  ConnectedAppStatusWithText,
  CustomerAppointmentTextOffer,
  IConnectedApp,
  IConnectedAppProps,
  ICustomerAppointmentTextMessage,
  IEventSubscriber,
} from "@hacado/types/apps";
import {
  Appointment,
  AppointmentStatus,
  isAppointmentCoveredByPackage,
} from "@hacado/types/booking";
import { EventEnvelope } from "@hacado/types/events";
import { dispatchAppointmentEventPayload } from "@hacado/utils/appointment-event-dispatch";
import {
  AppointmentStatusToICalMethodMap,
  getEventCalendarContent,
} from "@hacado/utils/email";
import { getArguments } from "@hacado/utils/get-arguments";
import { getPhoneField } from "@hacado/utils/phone";
import {
  appendSharedPoolSuffix,
  isPlatformSmsCountry,
  isSmsEnabled,
  smsCustomerName,
} from "@hacado/utils/sms";
import { template, templateSafeWithError } from "@hacado/utils/string";
import { getAdminUrl, getWebsiteUrl } from "@hacado/utils/website";
import { getCustomerTextMessageBodies } from "./messages";
import {
  AppointmentUpdateEventConfiguration,
  AppointmentUpdateEventKey,
  CustomerAppointmentUpdatesConfiguration,
  customerAppointmentUpdatesConfigurationSchema,
  isCustomerEmailEnabled,
} from "./models";
import {
  CustomerAppointmentUpdatesAdminAllKeys,
  CustomerAppointmentUpdatesAdminKeys,
  CustomerAppointmentUpdatesAdminNamespace,
} from "./translations/types";

type SendInitiator = AppointmentUpdateEventKey | "newRequest";

type SendContext = {
  appData: ConnectedAppData;
  appointment: Appointment;
  status: AppointmentUpdateEventKey;
  initiator: SendInitiator;
  event: AppointmentUpdateEventConfiguration;
  data: CustomerAppointmentUpdatesConfiguration;
};

export default class CustomerAppointmentUpdatesConnectedApp
  implements IConnectedApp, IEventSubscriber, ICustomerAppointmentTextMessage
{
  protected readonly loggerFactory: LoggerFactory;

  public constructor(protected readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "CustomerAppointmentUpdatesConnectedApp",
      props.organizationId,
    );
  }

  public async getCustomerAppointmentTextOffer(
    appData: ConnectedAppData,
  ): Promise<CustomerAppointmentTextOffer> {
    const data = appData.data as
      | CustomerAppointmentUpdatesConfiguration
      | undefined;

    const notifications = Object.values(data?.events ?? {}).some(
      (event) => event?.enabled === true && isSmsEnabled(event.textEnabled),
    );

    return { notifications, reminders: false, other: false };
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
        doNotNotifyCustomer,
      ) =>
        this.onAppointmentStatusChanged(
          appData,
          appointment,
          newStatus,
          doNotNotifyCustomer,
        ),
    });
  }

  public async processRequest(
    appData: ConnectedAppData,
    request: CustomerAppointmentUpdatesConfiguration,
  ): Promise<
    ConnectedAppStatusWithText<
      CustomerAppointmentUpdatesAdminNamespace,
      CustomerAppointmentUpdatesAdminKeys
    >
  > {
    const logger = this.loggerFactory("processRequest");

    logger.debug(
      { appId: appData._id },
      "Processing customer appointment updates configuration request",
    );

    const { data, success, error } =
      customerAppointmentUpdatesConfigurationSchema.safeParse(request);

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
        CustomerAppointmentUpdatesAdminNamespace,
        CustomerAppointmentUpdatesAdminKeys
      > = {
        status: "connected",
        statusText:
          "app_customer-appointment-updates_admin.statusText.successfully_set_up",
      };

      this.props.update({
        data,
        ...status,
      });

      logger.info(
        { appId: appData._id, status: status.status },
        "Successfully configured customer appointment updates",
      );

      return status;
    } catch (error: any) {
      logger.error(
        { appId: appData._id, error },
        "Error processing customer appointment updates configuration",
      );

      this.props.update({
        status: "failed",
        statusText:
          "app_customer-appointment-updates_admin.statusText.error_processing_configuration" satisfies CustomerAppointmentUpdatesAdminAllKeys,
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
      "Appointment created, sending customer appointment update",
    );

    try {
      await this.sendNotification(
        appData,
        appointment,
        confirmed ? "confirmed" : "pending",
        "newRequest",
        confirmed,
      );

      logger.info(
        { appId: appData._id, appointmentId: appointment._id, confirmed },
        "Successfully sent customer appointment update for new appointment",
      );
    } catch (error: any) {
      logger.error(
        { appId: appData._id, appointmentId: appointment._id, error },
        "Error sending customer appointment update for new appointment",
      );

      this.props.update({
        status: "failed",
        statusText:
          "app_customer-appointment-updates_admin.statusText.error_sending_customer_appointment_updates_for_new_appointment" satisfies CustomerAppointmentUpdatesAdminAllKeys,
      });

      throw error;
    }
  }

  public async onAppointmentStatusChanged(
    appData: ConnectedAppData,
    appointment: Appointment,
    newStatus: AppointmentStatus,
    doNotNotifyCustomer?: boolean,
  ): Promise<void> {
    const logger = this.loggerFactory("onAppointmentStatusChanged");

    if (doNotNotifyCustomer) {
      logger.debug(
        {
          appId: appData._id,
          appointmentId: appointment._id,
          newStatus,
          doNotNotifyCustomer,
        },
        "Appointment status changed, not sending customer appointment update - do not notify customer",
      );

      return;
    }

    logger.debug(
      { appId: appData._id, appointmentId: appointment._id, newStatus },
      "Appointment status changed, sending customer appointment update",
    );

    try {
      await this.sendNotification(appData, appointment, newStatus, newStatus);

      logger.info(
        { appId: appData._id, appointmentId: appointment._id, newStatus },
        "Successfully sent customer appointment update for status change",
      );
    } catch (error: any) {
      logger.error(
        {
          appId: appData._id,
          appointmentId: appointment._id,
          newStatus,
          error,
        },
        "Error sending customer appointment update for status change",
      );

      this.props.update({
        status: "failed",
        statusText:
          "app_customer-appointment-updates_admin.statusText.error_sending_customer_appointment_updates_for_status_change" satisfies CustomerAppointmentUpdatesAdminAllKeys,
      });

      throw error;
    }
  }

  public async onAppointmentRescheduled(
    appData: ConnectedAppData,
    appointment: Appointment,
    newTime: Date,
    newDuration: number,
    oldTime?: Date,
    _oldDuration?: number,
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
        "Appointment rescheduled, not sending customer appointment update - do not notify customer",
      );

      return;
    }

    logger.debug(
      {
        appId: appData._id,
        appointmentId: appointment._id,
        newTime: newTime.toISOString(),
        newDuration,
        oldTime: oldTime?.toISOString(),
      },
      "Appointment rescheduled, sending customer appointment update",
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
        "rescheduled",
        "rescheduled",
        undefined,
        oldTime ? { oldDateTime: oldTime } : undefined,
      );

      logger.info(
        {
          appId: appData._id,
          appointmentId: appointment._id,
          newTime: newTime.toISOString(),
          newDuration,
        },
        "Successfully sent customer appointment update for rescheduled appointment",
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
        "Error sending customer appointment update for rescheduled appointment",
      );

      this.props.update({
        status: "failed",
        statusText:
          "app_customer-appointment-updates_admin.statusText.error_sending_customer_appointment_updates_for_rescheduled_appointment" satisfies CustomerAppointmentUpdatesAdminAllKeys,
      });

      throw error;
    }
  }

  private async sendNotification(
    appData: ConnectedAppData,
    appointment: Appointment,
    status: AppointmentUpdateEventKey,
    initiator: SendInitiator,
    forceRequest?: boolean,
    additionalProperties?: Record<string, unknown>,
  ) {
    const logger = this.loggerFactory("sendNotification");
    logger.debug(
      {
        appId: appData._id,
        appointmentId: appointment._id,
        status,
        initiator,
        forceRequest,
      },
      "Sending customer appointment update",
    );

    const data = (appData.data ??
      {}) as CustomerAppointmentUpdatesConfiguration;

    const event = data.events?.[status];

    if (!event || event.enabled !== true) {
      logger.debug(
        { appId: appData._id, appointmentId: appointment._id, status },
        "Customer appointment update disabled for status, skipping",
      );

      return;
    }

    const context: SendContext = {
      appData,
      appointment,
      status,
      initiator,
      event,
      data,
    };

    const emailEnabled = isCustomerEmailEnabled(
      event.emailEnabled,
      event.emailTemplateId,
    );

    const textEnabled = isSmsEnabled(event.textEnabled);

    const results = await Promise.allSettled([
      emailEnabled
        ? this.sendEmail(context, forceRequest, additionalProperties)
        : Promise.resolve(),
      textEnabled ? this.sendText(context) : Promise.resolve(),
    ]);

    const failed = results.find(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );

    if (failed) {
      logger.error(
        { appId: appData._id, appointmentId: appointment._id, status },
        "Error sending customer appointment update",
      );

      throw failed.reason;
    }
  }

  private async sendEmail(
    { appData, appointment, status, initiator, event, data }: SendContext,
    forceRequest?: boolean,
    additionalProperties?: Record<string, unknown>,
  ) {
    const logger = this.loggerFactory("sendEmail");
    logger.debug(
      {
        appId: appData._id,
        appointmentId: appointment._id,
        status,
        initiator,
        forceRequest,
      },
      "Sending customer email",
    );

    try {
      const packageKey =
        status === "pending"
          ? "pendingPackage"
          : status === "confirmed"
            ? "confirmedPackage"
            : null;

      const packageChannel = packageKey
        ? data.packageEmails?.[packageKey]
        : undefined;

      const packageTemplateId =
        packageKey &&
        isAppointmentCoveredByPackage(appointment) &&
        isCustomerEmailEnabled(
          packageChannel?.enabled,
          packageChannel?.templateId,
        )
          ? packageChannel?.templateId
          : undefined;

      const templateId = packageTemplateId ?? event.emailTemplateId;

      if (!templateId) {
        logger.warn(
          { appId: appData._id, appointmentId: appointment._id, status },
          "No email template ID configured for status, skipping email",
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

      const organization =
        await this.props.services.organizationService.getOrganization();

      if (!organization) {
        logger.error(
          { appId: appData._id, appointmentId: appointment._id },
          "Organization not found",
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
        additionalProperties,
      });

      const eventTemplateId = data.event?.templateId;
      const includeEvent =
        isCustomerEmailEnabled(data.event?.enabled, eventTemplateId) &&
        Boolean(eventTemplateId);

      let eventContent: ReturnType<typeof getEventCalendarContent> | undefined;

      if (includeEvent && eventTemplateId) {
        const eventTemplate =
          await this.props.services.templatesService.getTemplate(
            eventTemplateId,
          );

        if (!eventTemplate) {
          logger.error(
            {
              appId: appData._id,
              appointmentId: appointment._id,
              eventTemplateId,
            },
            "Event template not found",
          );

          return;
        }

        if (eventTemplate.type !== "email") {
          logger.warn(
            {
              appId: appData._id,
              appointmentId: appointment._id,
              eventTemplateId,
            },
            "Event template is not an email template, skipping email",
          );

          return;
        }

        const renderedEventTemplate = await renderToStaticMarkup({
          document: eventTemplate.value,
          args: args,
        });

        eventContent = getEventCalendarContent(
          config.general,
          appointment,
          templateSafeWithError(eventTemplate.subject, args),
          renderedEventTemplate,
          forceRequest ? "REQUEST" : AppointmentStatusToICalMethodMap[status],
        );
      }

      const template =
        await this.props.services.templatesService.getTemplate(templateId);

      if (!template) {
        logger.error(
          { appId: appData._id, appointmentId: appointment._id, templateId },
          "Email template not found",
        );

        return;
      }

      if (template.type !== "email") {
        logger.warn(
          { appId: appData._id, appointmentId: appointment._id, templateId },
          "Email template is not an email template, skipping email",
        );

        return;
      }

      const renderedTemplate = await renderToStaticMarkup({
        args: args,
        document: template.value,
      });

      await this.props.services.notificationService.sendEmail({
        email: {
          to: appointment.fields.email,
          subject: templateSafeWithError(template.subject, args),
          body: renderedTemplate,
          ...(eventContent
            ? {
                icalEvent: {
                  method: forceRequest
                    ? "REQUEST"
                    : AppointmentStatusToICalMethodMap[status],
                  content: eventContent,
                },
              }
            : {}),
        },
        handledBy:
          `app_customer-appointment-updates_admin.handlers.${initiator}` satisfies CustomerAppointmentUpdatesAdminAllKeys,
        participantType: "customer",
        memberId: appointment.memberId,
        appointmentId: appointment._id,
      });

      logger.info(
        {
          appId: appData._id,
          appointmentId: appointment._id,
          status,
          customerEmail: appointment.fields.email,
        },
        "Successfully sent customer email",
      );
    } catch (error: any) {
      logger.error(
        { appId: appData._id, appointmentId: appointment._id, status, error },
        "Error sending customer email",
      );

      throw error;
    }
  }

  private async sendText({
    appData,
    appointment,
    status,
    initiator,
    event,
  }: SendContext) {
    const logger = this.loggerFactory("sendText");
    logger.debug(
      { appId: appData._id, appointmentId: appointment._id, status, initiator },
      "Sending customer text message",
    );

    try {
      const config =
        await this.props.services.configurationService.getConfigurations(
          "booking",
          "general",
          "brand",
          "social",
        );

      const phoneFields = (
        await this.props.services.catalogService.getFields({
          type: ["phone"],
        })
      ).items;

      const phone =
        appointment.fields?.phone ?? getPhoneField(appointment, phoneFields);

      if (!phone) {
        logger.warn(
          { appId: appData._id, appointmentId: appointment._id },
          "Can't find the phone field for appointment",
        );

        return;
      }

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
      const manageLink = isPlatformSmsCountry(phone)
        ? await this.props.services.pagesService.findManageAppointmentUrl(
            websiteUrl,
          )
        : undefined;

      const args = getArguments({
        appointment,
        config,
        customer: appointment.customer,
        useAppointmentTimezone: true,
        locale: config.brand.language,
        adminUrl,
        websiteUrl,
        additionalProperties: {
          manageLink,
          customerName: smsCustomerName(appointment.fields?.name),
        },
      });

      const templateId = event.textTemplateId;
      const allowCustom = (
        await this.props.services.textMessageConfigurationService.getSmsMessagingAccess()
      ).allowCustomTemplates;

      const platformCountry = isPlatformSmsCountry(phone);
      const builtIn = template(
        getCustomerTextMessageBodies(config.brand.language)[status],
        args,
        true,
      );

      const stored =
        allowCustom && templateId
          ? await this.props.services.templatesService.getTemplate(templateId)
          : null;

      const customBody =
        stored?.type === "text-message"
          ? templateSafeWithError(stored.value as string, args, true)
          : undefined;

      const templatedBody =
        customBody ??
        (platformCountry && !allowCustom
          ? appendSharedPoolSuffix(builtIn)
          : builtIn);

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
        ...(appointmentSkipsSmsConsent(appointment.createdAt)
          ? { dontRequireConsent: true }
          : {}),
        idempotencyKey: `sms_${appointment.organizationId}_${appointment._id}_${status}`,
        handledBy:
          `app_customer-appointment-updates_admin.handlers.${initiator}` satisfies CustomerAppointmentUpdatesAdminAllKeys,
      });

      logger.info(
        { appId: appData._id, appointmentId: appointment._id, status, phone },
        "Successfully sent customer text message",
      );
    } catch (error: any) {
      logger.error(
        { appId: appData._id, appointmentId: appointment._id, status, error },
        "Error sending customer text message",
      );

      throw error;
    }
  }
}
