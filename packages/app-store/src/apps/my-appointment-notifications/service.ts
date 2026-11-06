import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import {
  ConnectedAppData,
  ConnectedAppRequestError,
  ConnectedAppStatusWithText,
  IConnectedApp,
  IConnectedAppProps,
  IEventSubscriber,
  ITextMessageResponder,
  RespondResult,
  TextMessageReply,
} from "@hacado/types/apps";
import {
  Appointment,
  AppointmentStatus,
  isClosedAppointmentStatus,
} from "@hacado/types/booking";
import { BookingConfiguration } from "@hacado/types/configuration/booking";
import { BrandConfiguration } from "@hacado/types/configuration/brand";
import { GeneralConfiguration } from "@hacado/types/configuration/general";
import { SocialConfiguration } from "@hacado/types/configuration/social";
import { EventEnvelope, EventSource } from "@hacado/types/events";
import { Organization } from "@hacado/types/organizations";
import { OrganizationMember, SessionUser } from "@hacado/types/users";
import {
  dispatchAppointmentEventPayload,
  resolveAppointmentEventForMemberId,
} from "@hacado/utils/appointment-event-dispatch";
import {
  AppointmentStatusToICalMethodMap,
  getEventCalendarContent,
} from "@hacado/utils/email";
import { getArguments } from "@hacado/utils/get-arguments";
import {
  resolveProcessOtherMembersAppointmentsConfig,
  roleCanProcessOtherMembersAppointments,
  roleHasPermission,
  subscriptionAllowsMultipleUsers,
} from "@hacado/utils/permissions";
import { template } from "@hacado/utils/string";
import { getAdminUrl, getWebsiteUrl } from "@hacado/utils/website";
import { getEmailTemplate } from "./emails/utils";
import { getMyAppointmentNotificationsMessages } from "./messages";
import {
  defaultMyAppointmentNotificationEvent,
  MyAppointmentNotificationEventKey,
  myAppointmentNotificationEventKeys,
  MyAppointmentNotificationsConfiguration,
  myAppointmentNotificationsConfigurationSchema,
} from "./models";
import {
  MyAppointmentNotificationsAdminAllKeys,
  MyAppointmentNotificationsAdminKeys,
  MyAppointmentNotificationsAdminNamespace,
} from "./translations/types";

type EmailTemplateStatus =
  | keyof typeof AppointmentStatusToICalMethodMap
  | "auto-confirmed"
  | "cancelledByCustomer"
  | "rescheduledByCustomer";

type NotificationHandler = MyAppointmentNotificationEventKey | "newRequest";

export class MyAppointmentNotificationsConnectedApp
  implements IConnectedApp, IEventSubscriber, ITextMessageResponder
{
  protected readonly loggerFactory: LoggerFactory;

  public constructor(protected readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "MyAppointmentNotificationsConnectedApp",
      props.organizationId,
    );
  }

  public async onEvent(
    appData: ConnectedAppData,
    envelope: EventEnvelope,
  ): Promise<void> {
    const config = (appData.data ??
      {}) as MyAppointmentNotificationsConfiguration;

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
      subscriptionAllowsMultipleUsers(
        organization?.availableUsers,
        organization?.feesExempt,
      ),
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
          _oldDuration,
          _doNotNotifyCustomer,
          source,
        ) =>
          this.onAppointmentRescheduled(
            appData,
            appointment,
            newTime,
            newDuration,
            source,
            oldTime,
          ),
        onAppointmentSlotRescheduled: (
          appointment,
          newTime,
          newDuration,
          oldTime,
          _oldDuration,
          _doNotNotifyCustomer,
          source,
        ) =>
          this.onAppointmentRescheduled(
            appData,
            appointment,
            newTime,
            newDuration,
            source,
            oldTime,
          ),
        onAppointmentStatusChanged: (
          appointment,
          newStatus,
          _oldStatus,
          source,
        ) =>
          this.onAppointmentStatusChanged(
            appData,
            appointment,
            newStatus,
            source,
          ),
      },
      forMemberId,
    );
  }

  public async processRequest(
    appData: ConnectedAppData,
    request: MyAppointmentNotificationsConfiguration,
    _apiRequest?: unknown,
    user?: SessionUser,
  ): Promise<
    ConnectedAppStatusWithText<
      MyAppointmentNotificationsAdminNamespace,
      MyAppointmentNotificationsAdminKeys
    >
  > {
    const logger = this.loggerFactory("processRequest");
    logger.debug(
      { appId: appData._id },
      "Processing my appointment notifications configuration request",
    );

    const { data, success, error } =
      myAppointmentNotificationsConfigurationSchema.safeParse(request);

    if (!success) {
      logger.error({ error }, "Invalid request");

      throw new ConnectedAppRequestError(
        "invalid_request",
        { request, error },
        400,
        error.message,
      );
    }

    const member = await this.props.services.teamService.getMemberById(
      appData.memberId,
    );

    const canUseText = roleHasPermission(
      member?.role,
      "app",
      "installPrivileged",
    );

    const canProcessOthers = roleCanProcessOtherMembersAppointments(
      member?.role,
    );

    if (!canUseText) {
      const textRequested = myAppointmentNotificationEventKeys.some(
        (key) => data.events?.[key]?.textEnabled === true,
      );

      if (textRequested) {
        throw new ConnectedAppRequestError(
          "invalid_request",
          { request: data },
          400,
          "Text alerts require the app installPrivileged permission",
        );
      }
    }

    if (!canProcessOthers && data.processOtherMembersAppointments === true) {
      throw new ConnectedAppRequestError(
        "invalid_request",
        { request: data },
        400,
        "Processing other members' appointments requires appointment readAll and updateAll",
      );
    }

    const savedData: MyAppointmentNotificationsConfiguration = {
      ...data,
      processOtherMembersAppointments: !canProcessOthers
        ? false
        : resolveProcessOtherMembersAppointmentsConfig(
            data.processOtherMembersAppointments,
            user,
          ),
      events: !canUseText ? this.withoutTextChannel(data.events) : data.events,
    };

    try {
      const status: ConnectedAppStatusWithText<
        MyAppointmentNotificationsAdminNamespace,
        MyAppointmentNotificationsAdminKeys
      > = {
        status: "connected",
        statusText:
          "app_my-appointment-notifications_admin.statusText.successfully_set_up",
      };

      this.props.update({
        data: savedData,
        ...status,
      });

      logger.info(
        { appId: appData._id, status: status.status },
        "Successfully configured my appointment notifications",
      );

      return status;
    } catch (error: any) {
      logger.error(
        { appId: appData._id, error },
        "Error processing my appointment notifications configuration",
      );

      this.props.update({
        status: "failed",
        statusText:
          "app_my-appointment-notifications_admin.statusText.error_processing_configuration" satisfies MyAppointmentNotificationsAdminAllKeys,
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
      "Appointment created, sending notification",
    );

    try {
      await this.sendNotification(appData, appointment, {
        key: confirmed ? "confirmed" : "pending",
        emailStatus: confirmed ? "auto-confirmed" : "pending",
        handler: "newRequest",
      });

      logger.info(
        { appId: appData._id, appointmentId: appointment._id, confirmed },
        "Successfully sent notification for new appointment",
      );
    } catch (error: any) {
      logger.error(
        { appId: appData._id, appointmentId: appointment._id, error },
        "Error sending notification for new appointment",
      );

      this.props.update({
        status: "failed",
        statusText:
          "app_my-appointment-notifications_admin.statusText.error_sending_email_notification_for_new_appointment" satisfies MyAppointmentNotificationsAdminAllKeys,
      });

      throw error;
    }
  }

  public async onAppointmentStatusChanged(
    appData: ConnectedAppData,
    appointment: Appointment,
    newStatus: AppointmentStatus,
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
      "Appointment status changed, sending notification",
    );

    if (!myAppointmentNotificationEventKeys.includes(newStatus)) {
      logger.debug(
        { appId: appData._id, appointmentId: appointment._id, newStatus },
        "No notification channel for status, skipping",
      );

      return;
    }

    try {
      await this.sendNotification(appData, appointment, {
        key: newStatus,
        emailStatus:
          newStatus === "canceled" ? "cancelledByCustomer" : newStatus,
        handler: newStatus,
      });

      logger.info(
        { appId: appData._id, appointmentId: appointment._id, newStatus },
        "Successfully sent notification for status change",
      );
    } catch (error: any) {
      logger.error(
        {
          appId: appData._id,
          appointmentId: appointment._id,
          newStatus,
          error,
        },
        "Error sending notification for status change",
      );

      this.props.update({
        status: "failed",
        statusText:
          "app_my-appointment-notifications_admin.statusText.error_sending_email_notification_for_status_change" satisfies MyAppointmentNotificationsAdminAllKeys,
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
  ): Promise<void> {
    const logger = this.loggerFactory("onAppointmentRescheduled");
    logger.debug(
      {
        appId: appData._id,
        appointmentId: appointment._id,
        newTime: newTime.toISOString(),
        newDuration,
        oldTime: oldTime?.toISOString(),
      },
      "Appointment rescheduled, sending notification",
    );

    try {
      const newAppointment: Appointment = {
        ...appointment,
        dateTime: newTime,
        totalDuration: newDuration,
      };

      await this.sendNotification(appData, newAppointment, {
        key: "rescheduled",
        emailStatus:
          source.actor === "customer" ? "rescheduledByCustomer" : "rescheduled",
        handler: "rescheduled",
        additionalProperties: oldTime ? { oldDateTime: oldTime } : undefined,
      });

      logger.info(
        {
          appId: appData._id,
          appointmentId: appointment._id,
          newTime: newTime.toISOString(),
          newDuration,
        },
        "Successfully sent notification for rescheduled appointment",
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
        "Error sending notification for rescheduled appointment",
      );

      this.props.update({
        status: "failed",
        statusText:
          "app_my-appointment-notifications_admin.statusText.error_sending_email_notification_for_rescheduled_appointment" satisfies MyAppointmentNotificationsAdminAllKeys,
      });

      throw error;
    }
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
          getMyAppointmentNotificationsMessages(config.brand.language)
            .unknownAppointment,
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
            "app_my-appointment-notifications_admin.handlers.autoReply" satisfies MyAppointmentNotificationsAdminAllKeys,
        });

        return {
          participantType: "member",
          handledBy:
            "app_my-appointment-notifications_admin.handlers.autoReply" satisfies MyAppointmentNotificationsAdminAllKeys,
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
        !isClosedAppointmentStatus(appointment.status)
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
          getMyAppointmentNotificationsMessages(config.brand.language)
            .unknownAppointment,
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
            "app_my-appointment-notifications_admin.handlers.autoReply" satisfies MyAppointmentNotificationsAdminAllKeys,
        });

        return {
          participantType: "member",
          handledBy:
            "app_my-appointment-notifications_admin.handlers.autoReply" satisfies MyAppointmentNotificationsAdminAllKeys,
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
          "app_my-appointment-notifications_admin.statusText.error_processing_text_message_reply" satisfies MyAppointmentNotificationsAdminAllKeys,
      });

      throw error;
    }
  }

  /**
   * Staff members cannot receive text messages. Keeps every enabled event
   * deliverable by falling back to email when text was the only channel.
   */
  private withoutTextChannel(
    events: MyAppointmentNotificationsConfiguration["events"],
  ): MyAppointmentNotificationsConfiguration["events"] {
    return Object.fromEntries(
      myAppointmentNotificationEventKeys.map((key) => {
        const event = events[key];

        return [
          key,
          {
            ...event,
            textEnabled: false,
            emailEnabled: event.enabled ? true : event.emailEnabled,
          },
        ];
      }),
    ) as MyAppointmentNotificationsConfiguration["events"];
  }

  private async sendNotification(
    appData: ConnectedAppData,
    appointment: Appointment,
    options: {
      key: MyAppointmentNotificationEventKey;
      emailStatus: EmailTemplateStatus;
      handler: NotificationHandler;
      additionalProperties?: Record<string, unknown>;
    },
  ) {
    const { key, emailStatus, handler, additionalProperties } = options;
    const logger = this.loggerFactory("sendNotification");
    logger.debug(
      { appId: appData._id, appointmentId: appointment._id, key, handler },
      "Sending notification",
    );

    const data = (appData.data ??
      {}) as MyAppointmentNotificationsConfiguration;

    const event = data.events?.[key] ?? defaultMyAppointmentNotificationEvent();

    if (event.enabled !== true) {
      logger.debug(
        { appId: appData._id, appointmentId: appointment._id, key },
        "Notification disabled for event, skipping",
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

    const config =
      await this.props.services.configurationService.getConfigurations(
        "booking",
        "general",
        "brand",
        "social",
      );

    const sendEmail = event.emailEnabled === true;
    const sendText =
      event.textEnabled === true &&
      roleHasPermission(member.role, "app", "installPrivileged");

    const errors: unknown[] = [];

    if (sendEmail) {
      try {
        await this.sendEmailNotification({
          appData,
          appointment,
          config,
          data,
          member,
          organization,
          emailStatus,
          handler,
          additionalProperties,
        });
      } catch (error) {
        logger.error(
          { appId: appData._id, appointmentId: appointment._id, key, error },
          "Error sending email notification",
        );

        errors.push(error);
      }
    }

    if (sendText) {
      try {
        await this.sendTextNotification({
          appData,
          appointment,
          config,
          data,
          member,
          organization,
          key,
          handler,
        });
      } catch (error) {
        logger.error(
          { appId: appData._id, appointmentId: appointment._id, key, error },
          "Error sending text message notification",
        );

        errors.push(error);
      }
    }

    if (errors.length > 0) {
      throw errors[0];
    }
  }

  private async sendEmailNotification({
    appData,
    appointment,
    config,
    data,
    member,
    organization,
    emailStatus,
    handler,
    additionalProperties,
  }: {
    appData: ConnectedAppData;
    appointment: Appointment;
    config: {
      booking: BookingConfiguration;
      general: GeneralConfiguration;
      brand: BrandConfiguration;
      social: SocialConfiguration;
    };
    data: MyAppointmentNotificationsConfiguration;
    member: OrganizationMember;
    organization: Organization;

    emailStatus: EmailTemplateStatus;
    handler: NotificationHandler;
    additionalProperties?: Record<string, unknown>;
  }) {
    const logger = this.loggerFactory("sendEmailNotification");
    const args = getArguments({
      appointment,
      config,
      adminUrl: getAdminUrl(),
      websiteUrl: getWebsiteUrl(organization),
      customer: appointment.customer,
      useAppointmentTimezone: true,
      locale: config.brand.language,
      user: member,
      additionalProperties,
    });

    const {
      template: description,
      subject,
      eventTitle,
    } = await getEmailTemplate(
      emailStatus,
      config.brand.language,
      getAdminUrl(),
      appointment,
      args,
    );

    let icalStatus: keyof typeof AppointmentStatusToICalMethodMap;

    if (emailStatus === "rescheduledByCustomer") {
      icalStatus = "rescheduled";
    } else if (emailStatus === "cancelledByCustomer") {
      icalStatus = "canceled";
    } else if (emailStatus === "auto-confirmed") {
      icalStatus = "confirmed";
    } else {
      icalStatus = emailStatus;
    }

    const method =
      emailStatus === "auto-confirmed"
        ? "REQUEST"
        : AppointmentStatusToICalMethodMap[icalStatus];

    const eventContent = getEventCalendarContent(
      config.general,
      appointment,
      eventTitle,
      description,
      method,
    );

    const recipientEmail = data?.email || member?.email || config.general.email;

    logger.debug(
      { appId: appData._id, appointmentId: appointment._id, recipientEmail },
      "Sending email notification",
    );

    await this.props.services.notificationService.sendEmail({
      email: {
        to: recipientEmail,
        subject,
        body: description,
        icalEvent: {
          method,
          content: eventContent,
        },
      },
      participantType: "member",
      memberId: appData.memberId,
      handledBy:
        `app_my-appointment-notifications_admin.handlers.${handler}` satisfies MyAppointmentNotificationsAdminAllKeys,
      appointmentId: appointment._id,
    });

    logger.info(
      {
        appId: appData._id,
        appointmentId: appointment._id,
        emailStatus,
        recipientEmail,
      },
      "Successfully sent email notification",
    );
  }

  private async sendTextNotification({
    appData,
    appointment,
    config,
    data,
    member,
    organization,
    key,
    handler,
  }: {
    appData: ConnectedAppData;
    appointment: Appointment;
    config: {
      booking: BookingConfiguration;
      general: GeneralConfiguration;
      brand: BrandConfiguration;
      social: SocialConfiguration;
    };
    data: MyAppointmentNotificationsConfiguration;
    member: OrganizationMember;
    organization: Organization;

    key: MyAppointmentNotificationEventKey;
    handler: NotificationHandler;
  }) {
    const logger = this.loggerFactory("sendTextNotification");
    const phone = data?.phone || member?.phone || config.general.phone;

    if (!phone) {
      logger.warn(
        { appId: appData._id, appointmentId: appointment._id },
        "Phone field not found for member notification",
      );

      return;
    }

    const args = getArguments({
      appointment,
      config,
      customer: appointment.customer,
      locale: config.brand.language,
      adminUrl: getAdminUrl(),
      websiteUrl: getWebsiteUrl(organization),
      user: member,
    });

    const body = template(
      getMyAppointmentNotificationsMessages(config.brand.language)[key],
      args,
    );

    logger.debug(
      {
        appId: appData._id,
        appointmentId: appointment._id,
        phone: phone.replace(/(\d{3})\d{3}(\d{4})/, "$1***$2"),
        messageLength: body.length,
      },
      "Sending text message notification",
    );

    await this.props.services.notificationService.sendTextMessage({
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
        `app_my-appointment-notifications_admin.handlers.${handler}` satisfies MyAppointmentNotificationsAdminAllKeys,
    });

    logger.info(
      { appId: appData._id, appointmentId: appointment._id, key },
      "Successfully sent text message notification",
    );
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
        getMyAppointmentNotificationsMessages(config.brand.language)[
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
          "app_my-appointment-notifications_admin.handlers.autoReply" satisfies MyAppointmentNotificationsAdminAllKeys,
      });

      logger.info(
        { appId: reply.data.appId, appointmentId: appointment._id, newStatus },
        "Successfully processed appointment status change",
      );

      return {
        participantType: "member",
        handledBy:
          "app_my-appointment-notifications_admin.handlers.autoReply" satisfies MyAppointmentNotificationsAdminAllKeys,
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

export default MyAppointmentNotificationsConnectedApp;
