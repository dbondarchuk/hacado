import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import {
  APP_UNINSTALLED_EVENT_TYPE,
  Appointment,
  AppointmentStatus,
  AppUninstalledPayload,
  CalendarWriterEvent,
  ConnectedApp,
  ConnectedAppData,
  ConnectedAppError,
  ConnectedAppRequestError,
  ConnectedAppStatusWithText,
  EventEnvelope,
  EventSource,
  ICalendarWriter,
  IConnectedApp,
  IConnectedAppProps,
  IEventSubscriber,
  SessionUser,
} from "@hacado/types";
import {
  AppointmentStatusToICalMethodMap,
  dispatchAppointmentEventPayload,
  getAdminUrl,
  getArguments,
  getIcsEventUid,
  getWebsiteUrl,
  resolveAppointmentEventForMemberId,
  resolveProcessOtherMembersAppointmentsConfig,
} from "@hacado/utils";
import { convert } from "html-to-text";
import {
  CalendarWriterConfiguration,
  calendarWriterConfigurationSchema,
  CalendarWriterStoredConfiguration,
} from "./models";

import { AvailableApps } from "../../apps";
import { getEmailTemplate } from "../email-notification/emails/utils";
import {
  CalendarWriterAdminAllKeys,
  CalendarWriterAdminKeys,
  CalendarWriterAdminNamespace,
} from "./translations/types";

export class CalendarWriterConnectedApp
  implements IConnectedApp, IEventSubscriber
{
  protected readonly loggerFactory: LoggerFactory;

  public constructor(protected readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "CalendarWriterConnectedApp",
      props.organizationId,
    );
  }

  public async onEvent(
    appData: ConnectedAppData,
    envelope: EventEnvelope,
  ): Promise<void> {
    if (envelope.type === APP_UNINSTALLED_EVENT_TYPE) {
      await this.onAppUninstalled(
        appData,
        envelope as EventEnvelope<AppUninstalledPayload>,
      );
      return;
    }

    const config = (appData.data ??
      {}) as Partial<CalendarWriterStoredConfiguration>;
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

  private async onAppUninstalled(
    appData: ConnectedAppData,
    envelope: EventEnvelope<AppUninstalledPayload>,
  ): Promise<void> {
    const logger = this.loggerFactory("onAppUninstalled");
    const data = (appData.data ??
      {}) as Partial<CalendarWriterStoredConfiguration>;

    if (!data.appId || data.appId !== envelope.payload.appId) {
      logger.debug(
        {
          appId: appData._id,
          removedTargetAppId: envelope.payload.appId,
        },
        "Skipping calendar writer uninstall: target app not configured or not the same as the uninstalled app",
      );

      return;
    }

    logger.warn(
      {
        appId: appData._id,
        removedTargetAppId: envelope.payload.appId,
      },
      "Configured calendar target app was removed, clearing configuration",
    );

    await this.props.update({
      data: {
        appId: null,
        processOtherMembersAppointments:
          data.processOtherMembersAppointments ?? false,
      },
      status: "failed",
      statusText:
        "app_calendar-writer_admin.statusText.target_app_removed_select_new_app" satisfies CalendarWriterAdminAllKeys,
    });
  }

  public async processRequest(
    appData: ConnectedAppData,
    request: CalendarWriterConfiguration,
    _apiRequest?: unknown,
    user?: SessionUser,
  ): Promise<
    ConnectedAppStatusWithText<
      CalendarWriterAdminNamespace,
      CalendarWriterAdminKeys
    >
  > {
    const logger = this.loggerFactory("processRequest");
    logger.debug(
      { appId: appData._id, targetAppId: request.appId },
      "Processing calendar writer configuration request",
    );

    const { data, success, error } =
      calendarWriterConfigurationSchema.safeParse(request);
    if (!success) {
      logger.error({ error }, "Invalid request");
      throw new ConnectedAppRequestError(
        "invalid_request",
        { request, error },
        400,
        error.message,
      );
    }

    const savedData: CalendarWriterConfiguration = {
      ...data,
      processOtherMembersAppointments:
        resolveProcessOtherMembersAppointmentsConfig(
          data.processOtherMembersAppointments,
          user,
        ),
    };

    let targetApp: ConnectedApp;

    try {
      targetApp = await this.props.services.connectedAppsService.getApp(
        savedData.appId,
      );

      logger.debug(
        {
          appId: appData._id,
          targetAppId: savedData.appId,
          targetAppName: targetApp.name,
        },
        "Retrieved target app information",
      );

      const app = AvailableApps[targetApp.name];

      if (!app.scope.includes("calendar-write")) {
        logger.error(
          {
            appId: appData._id,
            targetAppId: savedData.appId,
            targetAppName: targetApp.name,
            scope: app.scope,
          },
          "Target app does not support calendar-write scope",
        );

        throw new ConnectedAppError<
          CalendarWriterAdminNamespace,
          CalendarWriterAdminKeys
        >("app_calendar-writer_admin.statusText.calendar_app_not_found");
      }

      logger.debug(
        {
          appId: appData._id,
          targetAppId: savedData.appId,
          targetAppName: targetApp.name,
        },
        "Target app supports calendar-write scope",
      );
    } catch (error: any) {
      logger.error(
        { appId: appData._id, targetAppId: savedData.appId, error },
        "Failed to validate calendar app configuration",
      );

      return {
        status: "failed",
        statusText:
          "app_calendar-writer_admin.statusText.calendar_app_not_found",
      };
    }

    const status: ConnectedAppStatusWithText<
      CalendarWriterAdminNamespace,
      CalendarWriterAdminKeys
    > = {
      status: "connected",
      statusText: "app_calendar-writer_admin.statusText.successfully_set_up",
    };

    this.props.update({
      data: savedData,
      ...status,
      account: {
        targetAppName: targetApp.name,
        targetAppId: targetApp._id,
      },
    });

    logger.info(
      {
        appId: appData._id,
        targetAppId: savedData.appId,
        status: status.status,
      },
      "Successfully configured calendar writer",
    );

    return status;
  }

  public async onAppointmentCreated(
    appData: ConnectedAppData,
    appointment: Appointment,
    confirmed: boolean,
  ): Promise<void> {
    const logger = this.loggerFactory("onAppointmentCreated");
    logger.debug(
      { appId: appData._id, appointmentId: appointment._id, confirmed },
      "Appointment created, creating calendar event",
    );

    try {
      await this.makeEvent(
        appData,
        appointment,
        confirmed ? "auto-confirmed" : "pending",
        "New Request",
      );

      logger.info(
        { appId: appData._id, appointmentId: appointment._id, confirmed },
        "Successfully created calendar event for new appointment",
      );
    } catch (error: any) {
      logger.error(
        { appId: appData._id, appointmentId: appointment._id, error },
        "Error creating calendar event for new appointment",
      );

      this.props.update({
        status: "failed",
        statusText:
          "app_calendar-writer_admin.statusText.error_creating_calendar_event_for_new_appointment" satisfies CalendarWriterAdminAllKeys,
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
        oldStatus,
        source,
      },
      "Appointment status changed, updating calendar event",
    );

    try {
      const status =
        source.actor === "customer" && newStatus === "declined"
          ? "cancelledByCustomer"
          : newStatus;
      await this.makeEvent(appData, appointment, status, newStatus);

      logger.info(
        {
          appId: appData._id,
          appointmentId: appointment._id,
          newStatus,
          oldStatus,
          source,
        },
        "Successfully updated calendar event for status change",
      );
    } catch (error: any) {
      logger.error(
        {
          appId: appData._id,
          appointmentId: appointment._id,
          newStatus,
          error,
        },
        "Error updating calendar event for status change",
      );

      this.props.update({
        status: "failed",
        statusText:
          "app_calendar-writer_admin.statusText.error_updating_calendar_event_for_status_change" satisfies CalendarWriterAdminAllKeys,
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
        newTime,
        newDuration,
      },
      "Appointment rescheduled, updating calendar event",
    );

    try {
      await this.makeEvent(
        appData,
        appointment,
        source.actor === "customer" ? "rescheduledByCustomer" : "rescheduled",
        "Rescheduled",
      );

      logger.info(
        {
          appId: appData._id,
          appointmentId: appointment._id,
          newTime,
          newDuration,
        },
        "Successfully updated calendar event for rescheduled appointment",
      );
    } catch (error: any) {
      logger.error(
        {
          appId: appData._id,
          appointmentId: appointment._id,
          newTime,
          newDuration,
          error,
        },
        "Error updating calendar event for rescheduled appointment",
      );

      await this.props.update({
        status: "failed",
        statusText:
          "app_calendar-writer_admin.statusText.error_updating_calendar_event_for_rescheduled_appointment" satisfies CalendarWriterAdminAllKeys,
      });

      throw error;
    }
  }

  private async makeEvent(
    appData: ConnectedAppData,
    appointment: Appointment,
    status:
      | keyof typeof AppointmentStatusToICalMethodMap
      | "auto-confirmed"
      | "cancelledByCustomer"
      | "rescheduledByCustomer",
    initiator: string,
  ) {
    const logger = this.loggerFactory("makeEvent");
    logger.debug(
      { appId: appData._id, appointmentId: appointment._id, status, initiator },
      "Making calendar event",
    );

    try {
      const config =
        await this.props.services.configurationService.getConfigurations(
          "booking",
          "general",
          "brand",
          "social",
        );
      logger.debug(
        { appId: appData._id, appointmentId: appointment._id },
        "Retrieved configuration for calendar event",
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

      const data = appData.data as CalendarWriterStoredConfiguration;
      if (!data?.appId) {
        logger.warn(
          { appId: appData._id, appointmentId: appointment._id },
          "Skipping calendar write: no target app configured",
        );
        return;
      }

      const url = getAdminUrl();
      const { template: description, subject } = await getEmailTemplate(
        status,
        config.brand.language,
        url,
        appointment,
        args,
      );

      logger.debug(
        {
          appId: appData._id,
          appointmentId: appointment._id,
          targetAppId: data.appId,
        },
        "Getting calendar writer service",
      );

      const { app, service } =
        await this.props.services.connectedAppsService.getAppService<ICalendarWriter>(
          data.appId,
        );

      const uid = getIcsEventUid(appointment._id, url);
      let newStatus: AppointmentStatus;
      if (status === "rescheduled" || status === "rescheduledByCustomer") {
        newStatus = appointment.status;
      } else if (status === "auto-confirmed") {
        newStatus = "confirmed";
      } else if (status === "cancelledByCustomer") {
        newStatus = "declined";
      } else {
        newStatus = status;
      }

      const event: CalendarWriterEvent = {
        id: appointment._id,
        title: subject,
        description: {
          html: description,
          plainText: convert(description, { wordwrap: 130 })
            .trim()
            .replace(/(\r\n|\r|\n)+/g, "\n"),
          url: `${url}/dashboard/appointments/${appointment._id}`,
        },
        location: {
          name: config.general.name,
          address: config.general.address,
          onlineUrl: appointment.option.isOnline
            ? appointment.meetingInformation?.url
            : undefined,
        },
        startTime: appointment.dateTime,
        duration: appointment.totalDuration,
        timeZone: config.general.timeZone,
        uid,
        status: newStatus,
        attendees: [
          // {
          //   name: config.general.name,
          //   email: config.general.email,
          //   status: "organizer",
          //   type: "required",
          // },
          {
            name: config.general.name,
            email: config.general.email,
            status: newStatus === "confirmed" ? "confirmed" : "tentative",
            type: "required",
          },
          {
            name: appointment.fields.name,
            email: appointment.fields.email,
            status: "confirmed",
            type: "required",
          },
        ],
      };

      logger.debug(
        {
          appId: appData._id,
          appointmentId: appointment._id,
          status,
          eventId: event.id,
          uid,
        },
        "Created calendar event object",
      );

      if (status === "pending" || status === "auto-confirmed") {
        logger.debug(
          { appId: appData._id, appointmentId: appointment._id, status },
          "Creating new calendar event",
        );
        await service.createEvent(app, event);
      } else if (status === "declined") {
        logger.debug(
          { appId: appData._id, appointmentId: appointment._id, status },
          "Deleting calendar event",
        );
        await service.deleteEvent(app, uid, event.id);
      } else {
        logger.debug(
          { appId: appData._id, appointmentId: appointment._id, status },
          "Updating calendar event",
        );
        await service.updateEvent(app, uid, event);
      }

      logger.info(
        {
          appId: appData._id,
          appointmentId: appointment._id,
          status,
          eventId: event.id,
          uid,
        },
        "Successfully processed calendar event",
      );
    } catch (error: any) {
      logger.error(
        { appId: appData._id, appointmentId: appointment._id, status, error },
        "Error making calendar event",
      );

      throw error;
    }
  }
}
