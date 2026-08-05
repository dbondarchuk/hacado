import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import {
  AppJobRequest,
  Appointment,
  ConnectedAppData,
  ConnectedAppRequestError,
  ConnectedAppStatusWithText,
  ConnectedAppUninstallResult,
  EventEnvelope,
  ICommunicationTemplatesProvider,
  IConnectedApp,
  IConnectedAppProps,
  IEventSubscriber,
  IScheduled,
  TemplateTemplatesList,
} from "@hacado/types";
import { dispatchAppointmentEventPayload } from "@hacado/utils";
import { AppointmentNotificationsJobProcessor } from "./job-processor";
import {
  AppointmentNotification,
  AppointmentNotificationsJobPayload,
  AppointmentNotificationUpdateModel,
  RequestAction,
  requestActionSchema,
} from "./models";
import { AppointmentNotificationsRepository } from "./repository";
import { AppointmentNotificationsTemplates } from "./templates";
import {
  AppointmentNotificationsAdminKeys,
  AppointmentNotificationsAdminNamespace,
} from "./translations/types";

export default class AppointmentNotificationsConnectedApp
  implements
    IConnectedApp,
    IScheduled,
    IEventSubscriber,
    ICommunicationTemplatesProvider
{
  protected readonly loggerFactory: LoggerFactory;
  protected readonly repository: AppointmentNotificationsRepository;
  protected readonly jobProcessor: AppointmentNotificationsJobProcessor;

  public constructor(protected readonly props: IConnectedAppProps) {
    this.repository = new AppointmentNotificationsRepository(props);
    this.jobProcessor = new AppointmentNotificationsJobProcessor(props);
    this.loggerFactory = getLoggerFactory(
      "AppointmentNotificationsConnectedApp",
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
      onAppointmentStatusChanged: (appointment, _newStatus, _oldStatus, _source) =>
        this.onAppointmentStatusChanged(appData, appointment),
    });
  }

  public async processRequest(
    appData: ConnectedAppData,
    request: RequestAction,
  ): Promise<any> {
    const logger = this.loggerFactory("processRequest");
    logger.debug(
      { appId: appData._id, actionType: request.type },
      "Processing appointment notifications request",
    );

    const { data, success, error } = requestActionSchema.safeParse(request);
    if (!success) {
      logger.error({ error }, "Invalid appointment notifications request");
      throw new ConnectedAppRequestError(
        "invalid_appointment_notifications_request",
        { request },
        400,
        error.message,
      );
    }

    try {
      switch (data.type) {
        case "get-appointment-notification":
          logger.debug(
            { appId: appData._id, appointmentNotificationId: data.id },
            "Getting appointment notification",
          );
          return await this.repository.getAppointmentNotification(
            appData._id,
            data.id,
          );

        case "get-appointment-notifications":
          logger.debug(
            { appId: appData._id, query: data.query },
            "Getting appointment notifications",
          );
          return await this.repository.getAppointmentNotifications(
            appData._id,
            data.query,
          );

        case "delete-appointment-notifications":
          logger.debug(
            { appId: appData._id, appointmentNotificationIds: data.ids },
            "Deleting appointment notifications",
          );

          return await this.deleteAppointmentNotifications(appData, data.ids);

        case "create-appointment-notification":
          logger.debug(
            {
              appId: appData._id,
              appointmentNotificationName: data.appointmentNotification.name,
            },
            "Creating appointment notification",
          );

          return await this.createAppointmentNotification(
            appData,
            data.appointmentNotification,
          );

        case "update-appointment-notification":
          logger.debug(
            {
              appId: appData._id,
              appointmentNotificationId: data.id,
              appointmentNotificationName: data.update.name,
            },
            "Updating appointment notification",
          );

          return await this.updateAppointmentNotification(
            appData,
            data.id,
            data.update,
          );

        case "check-unique-name":
          logger.debug(
            {
              appId: appData._id,
              name: data.name,
              appointmentNotificationId: data.id,
            },
            "Checking unique name",
          );
          return await this.repository.checkUniqueName(
            appData._id,
            data.name,
            data.id,
          );

        default: {
          logger.debug(
            { appId: appData._id },
            "Processing default request - setting up appointment notifications app",
          );

          const status: ConnectedAppStatusWithText<
            AppointmentNotificationsAdminNamespace,
            AppointmentNotificationsAdminKeys
          > = {
            status: "connected",
            statusText:
              "app_appointment-notifications_admin.statusText.successfully_set_up",
          };

          this.props.update({
            data,
            ...status,
          });

          logger.info(
            { appId: appData._id },
            "Successfully set up appointment notifications app",
          );

          return status;
        }
      }
    } catch (error: any) {
      logger.error(
        {
          appId: appData._id,
          actionType: data.type,
          error: error?.message || error?.toString(),
        },
        "Error processing appointment notifications request",
      );
      throw error;
    }
  }

  public async install(appData: ConnectedAppData): Promise<void> {
    const logger = this.loggerFactory("install");
    logger.debug(
      { appId: appData._id },
      "Installing appointment notifications app",
    );

    await this.repository.installAppointmentNotificationsApp();

    logger.debug(
      { appId: appData._id },
      "Appointment notifications app installed successfully",
    );
  }

  public async unInstall(
    appData: ConnectedAppData,
  ): Promise<ConnectedAppUninstallResult> {
    const logger = this.loggerFactory("unInstall");
    logger.debug(
      { appId: appData._id },
      "Uninstalling appointment notifications app",
    );

    await this.repository.onUninstall(appData._id);

    logger.info(
      { appId: appData._id },
      "Successfully uninstalled appointment notifications app",
    );
    return { success: true, code: "ok" };
  }

  public async processJob(
    appData: ConnectedAppData,
    jobData: AppJobRequest<AppointmentNotificationsJobPayload>,
  ): Promise<void> {
    const logger = this.loggerFactory("processJob");
    logger.debug(
      { appId: appData._id, jobData },
      "Processing appointment notifications job",
    );

    await this.jobProcessor.processJob(appData, jobData);

    logger.info(
      { appId: appData._id, jobData },
      "Successfully processed appointment notifications job",
    );

    return;
  }

  public async onAppointmentCreated(
    appData: ConnectedAppData,
    appointment: Appointment,
    confirmed: boolean,
  ): Promise<void> {
    const logger = this.loggerFactory("onAppointmentCreated");
    logger.debug({ appId: appData._id, appointment }, "On appointment created");
    if (!confirmed) {
      logger.debug(
        { appId: appData._id, appointment },
        "Appointment is not confirmed, skipping on appointment created hook",
      );
      return;
    }

    await this.props.services.jobService.scheduleJob({
      type: "app",
      executeAt: "now",
      appId: appData._id,
      payload: {
        type: "update-appointment",
        appointmentId: appointment._id,
      } satisfies AppointmentNotificationsJobPayload,
    });
  }

  public async onAppointmentStatusChanged(
    appData: ConnectedAppData,
    appointment: Appointment,
  ): Promise<void> {
    const logger = this.loggerFactory("onAppointmentStatusChanged");
    logger.debug({ appId: appData._id, appointment }, "On appointment updated");

    await this.props.services.jobService.scheduleJob({
      type: "app",
      executeAt: "now",
      appId: appData._id,
      payload: {
        type: "update-appointment",
        appointmentId: appointment._id,
      } satisfies AppointmentNotificationsJobPayload,
    });

    logger.info(
      { appId: appData._id, appointment },
      "Successfully appointment appointment notifications update appointment job",
    );
  }

  public async getCommunicationTemplates(): Promise<TemplateTemplatesList> {
    return AppointmentNotificationsTemplates;
  }

  private async createAppointmentNotification(
    appData: ConnectedAppData,
    updateModel: AppointmentNotificationUpdateModel,
  ): Promise<AppointmentNotification> {
    const logger = this.loggerFactory("createAppointmentNotification");
    logger.debug(
      { appId: appData._id, updateModel },
      "Creating appointment notification",
    );

    const appointmentNotification =
      await this.repository.createAppointmentNotification(
        appData._id,
        updateModel,
      );

    logger.debug(
      {
        appId: appData._id,
        appointmentNotificationId: appointmentNotification._id,
      },
      "Successfully created appointment notification, scheduling update appointment notification job",
    );

    await this.props.services.jobService.scheduleJob({
      type: "app",
      executeAt: "now",
      appId: appData._id,
      payload: {
        type: "update-appointment-notification",
        appointmentNotificationId: appointmentNotification._id,
      } satisfies AppointmentNotificationsJobPayload,
    });

    logger.info(
      {
        appId: appData._id,
        appointmentNotificationId: appointmentNotification._id,
      },
      "Successfully appointment update appointment notification job",
    );

    return appointmentNotification;
  }

  private async updateAppointmentNotification(
    appData: ConnectedAppData,
    appointmentNotificationId: string,
    updateModel: AppointmentNotificationUpdateModel,
  ): Promise<void> {
    const logger = this.loggerFactory("updateAppointmentNotification");
    logger.debug(
      { appId: appData._id, appointmentNotificationId },
      "Updating appointment notification",
    );

    await this.repository.updateAppointmentNotification(
      appData._id,
      appointmentNotificationId,
      updateModel,
    );

    logger.debug(
      { appId: appData._id, appointmentNotificationId },
      "Successfully updated appointment notification, scheduling update appointment notification job",
    );

    await this.props.services.jobService.scheduleJob({
      type: "app",
      executeAt: "now",
      appId: appData._id,
      payload: {
        type: "update-appointment-notification",
        appointmentNotificationId,
      } satisfies AppointmentNotificationsJobPayload,
    });

    logger.info(
      { appId: appData._id, appointmentNotificationId },
      "Successfully appointment update appointment notification job",
    );
  }

  private async deleteAppointmentNotifications(
    appData: ConnectedAppData,
    appointmentNotificationIds: string[],
  ): Promise<void> {
    const logger = this.loggerFactory("deleteAppointmentNotifications");
    logger.debug(
      { appId: appData._id, appointmentNotificationIds },
      "Deleting appointment notifications",
    );

    await this.repository.deleteAppointmentNotifications(
      appData._id,
      appointmentNotificationIds,
    );

    logger.info(
      { appId: appData._id, appointmentNotificationIds },
      "Successfully deleted appointment notifications, deleting appointment notification jobs",
    );

    await this.props.services.jobService.scheduleJob({
      type: "app",
      appId: appData._id,
      executeAt: "now",
      payload: {
        type: "delete-appointment-notifications",
        appointmentNotificationIds,
      } satisfies AppointmentNotificationsJobPayload,
    });

    logger.info(
      { appId: appData._id, appointmentNotificationIds },
      "Successfully deleted appointment notification jobs",
    );
  }
}
