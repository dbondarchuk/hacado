import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import {
  ConnectedAppData,
  ConnectedAppRequestError,
  ConnectedAppStatusWithText,
  ConnectedAppUninstallResult,
  CustomerAppointmentTextOffer,
  ICommunicationTemplatesProvider,
  IConnectedApp,
  IConnectedAppProps,
  ICustomerAppointmentTextMessage,
  IEventSubscriber,
  IScheduled,
} from "@hacado/types/apps";
import { Appointment } from "@hacado/types/booking";
import { EventEnvelope } from "@hacado/types/events";
import { AppJobRequest } from "@hacado/types/jobs";
import { TemplateTemplatesList } from "@hacado/types/templates";
import { dispatchAppointmentEventPayload } from "@hacado/utils/appointment-event-dispatch";
import { AppointmentRemindersJobProcessor } from "./job-processor";
import {
  AppointmentReminder,
  AppointmentRemindersJobPayload,
  AppointmentReminderUpdateModel,
  RequestAction,
  requestActionSchema,
} from "./models";
import { AppointmentRemindersRepository } from "./repository";
import { AppointmentRemindersTemplates } from "./templates";
import {
  AppointmentRemindersAdminKeys,
  AppointmentRemindersAdminNamespace,
} from "./translations/types";

export default class AppointmentRemindersConnectedApp
  implements
    IConnectedApp,
    IScheduled,
    IEventSubscriber,
    ICommunicationTemplatesProvider,
    ICustomerAppointmentTextMessage
{
  protected readonly loggerFactory: LoggerFactory;
  protected readonly repository: AppointmentRemindersRepository;
  protected readonly jobProcessor: AppointmentRemindersJobProcessor;

  public async getCustomerAppointmentTextOffer(
    appData: ConnectedAppData,
  ): Promise<CustomerAppointmentTextOffer> {
    const text = await this.repository.getTextMessageOffer(appData._id);
    return {
      notifications: false,
      reminders: text.reminders,
      other: text.other,
    };
  }

  public constructor(protected readonly props: IConnectedAppProps) {
    this.repository = new AppointmentRemindersRepository(props);
    this.jobProcessor = new AppointmentRemindersJobProcessor(props);
    this.loggerFactory = getLoggerFactory(
      "AppointmentRemindersConnectedApp",
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
      onAppointmentStatusChanged: (appointment) =>
        this.onAppointmentUpdated(appData, appointment),
      onAppointmentFullRescheduled: (appointment) =>
        this.onAppointmentUpdated(appData, appointment),
      onAppointmentSlotRescheduled: (appointment) =>
        this.onAppointmentUpdated(appData, appointment),
    });
  }

  public async processRequest(
    appData: ConnectedAppData,
    request: RequestAction,
  ): Promise<any> {
    const logger = this.loggerFactory("processRequest");
    logger.debug(
      { appId: appData._id, actionType: request.type },
      "Processing appointment reminders request",
    );

    const { data, success, error } = requestActionSchema.safeParse(request);
    if (!success) {
      logger.error({ error }, "Invalid appointment reminders request");
      throw new ConnectedAppRequestError(
        "invalid_appointment_reminders_request",
        { request },
        400,
        error.message,
      );
    }

    try {
      switch (data.type) {
        case "get-appointment-reminder":
          logger.debug(
            { appId: appData._id, appointmentReminderId: data.id },
            "Getting appointment reminder",
          );

          return await this.repository.getAppointmentReminder(
            appData._id,
            data.id,
          );

        case "get-appointment-reminders":
          logger.debug(
            { appId: appData._id, query: data.query },
            "Getting appointment reminders",
          );

          return await this.repository.getAppointmentReminders(
            appData._id,
            data.query,
          );

        case "delete-appointment-reminders":
          logger.debug(
            { appId: appData._id, appointmentReminderIds: data.ids },
            "Deleting appointment reminders",
          );

          return await this.deleteAppointmentReminders(appData, data.ids);

        case "create-appointment-reminder":
          logger.debug(
            {
              appId: appData._id,
              appointmentReminderName: data.appointmentReminder.name,
            },
            "Creating appointment reminder",
          );

          return await this.createAppointmentReminder(
            appData,
            data.appointmentReminder,
          );

        case "update-appointment-reminder":
          logger.debug(
            {
              appId: appData._id,
              appointmentReminderId: data.id,
              appointmentReminderName: data.update.name,
            },
            "Updating appointment reminder",
          );

          return await this.updateAppointmentReminder(
            appData,
            data.id,
            data.update,
          );

        case "check-unique-name":
          logger.debug(
            {
              appId: appData._id,
              name: data.name,
              appointmentReminderId: data.id,
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
            "Processing default request - setting up appointment reminders app",
          );

          const status: ConnectedAppStatusWithText<
            AppointmentRemindersAdminNamespace,
            AppointmentRemindersAdminKeys
          > = {
            status: "connected",
            statusText:
              "app_appointment-reminders_admin.statusText.successfully_set_up",
          };

          this.props.update({
            data,
            ...status,
          });

          logger.info(
            { appId: appData._id },
            "Successfully set up appointment reminders app",
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
        "Error processing appointment reminders request",
      );

      throw error;
    }
  }

  public async install(appData: ConnectedAppData): Promise<void> {
    const logger = this.loggerFactory("install");
    logger.debug(
      { appId: appData._id },
      "Installing appointment reminders app",
    );

    await this.repository.installAppointmentRemindersApp();

    logger.debug(
      { appId: appData._id },
      "Appointment reminders app installed successfully",
    );
  }

  public async unInstall(
    appData: ConnectedAppData,
  ): Promise<ConnectedAppUninstallResult> {
    const logger = this.loggerFactory("unInstall");
    logger.debug(
      { appId: appData._id },
      "Uninstalling appointment reminders app",
    );

    await this.repository.onUninstall(appData._id);

    logger.info(
      { appId: appData._id },
      "Successfully uninstalled appointment reminders app",
    );

    return { success: true, code: "ok" };
  }

  public async processJob(
    appData: ConnectedAppData,
    jobData: AppJobRequest<AppointmentRemindersJobPayload>,
  ): Promise<void> {
    const logger = this.loggerFactory("processJob");
    logger.debug(
      { appId: appData._id, jobData },
      "Processing appointment reminders job",
    );

    await this.jobProcessor.processJob(appData, jobData);

    logger.info(
      { appId: appData._id, jobData },
      "Successfully processed appointment reminders job",
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
      } satisfies AppointmentRemindersJobPayload,
    });
  }

  public async onAppointmentUpdated(
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
      } satisfies AppointmentRemindersJobPayload,
    });

    logger.info(
      { appId: appData._id, appointment },
      "Successfully scheduled appointment reminders update appointment job",
    );
  }

  public async getCommunicationTemplates(): Promise<TemplateTemplatesList> {
    return AppointmentRemindersTemplates;
  }

  private async createAppointmentReminder(
    appData: ConnectedAppData,
    updateModel: AppointmentReminderUpdateModel,
  ): Promise<AppointmentReminder> {
    const logger = this.loggerFactory("createAppointmentReminder");
    logger.debug(
      { appId: appData._id, updateModel },
      "Creating appointment reminder",
    );

    const appointmentReminder = await this.repository.createAppointmentReminder(
      appData._id,
      updateModel,
    );

    logger.debug(
      {
        appId: appData._id,
        appointmentReminderId: appointmentReminder._id,
      },
      "Successfully created appointment reminder, scheduling update appointment reminder job",
    );

    await this.props.services.jobService.scheduleJob({
      type: "app",
      executeAt: "now",
      appId: appData._id,
      payload: {
        type: "update-appointment-reminder",
        appointmentReminderId: appointmentReminder._id,
      } satisfies AppointmentRemindersJobPayload,
    });

    logger.info(
      {
        appId: appData._id,
        appointmentReminderId: appointmentReminder._id,
      },
      "Successfully appointment update appointment reminder job",
    );

    return appointmentReminder;
  }

  private async updateAppointmentReminder(
    appData: ConnectedAppData,
    appointmentReminderId: string,
    updateModel: AppointmentReminderUpdateModel,
  ): Promise<void> {
    const logger = this.loggerFactory("updateAppointmentReminder");
    logger.debug(
      { appId: appData._id, appointmentReminderId },
      "Updating appointment reminder",
    );

    await this.repository.updateAppointmentReminder(
      appData._id,
      appointmentReminderId,
      updateModel,
    );

    logger.debug(
      { appId: appData._id, appointmentReminderId },
      "Successfully updated appointment reminder, scheduling update appointment reminder job",
    );

    await this.props.services.jobService.scheduleJob({
      type: "app",
      executeAt: "now",
      appId: appData._id,
      payload: {
        type: "update-appointment-reminder",
        appointmentReminderId,
      } satisfies AppointmentRemindersJobPayload,
    });

    logger.info(
      { appId: appData._id, appointmentReminderId },
      "Successfully appointment update appointment reminder job",
    );
  }

  private async deleteAppointmentReminders(
    appData: ConnectedAppData,
    appointmentReminderIds: string[],
  ): Promise<void> {
    const logger = this.loggerFactory("deleteAppointmentReminders");
    logger.debug(
      { appId: appData._id, appointmentReminderIds },
      "Deleting appointment reminders",
    );

    await this.repository.deleteAppointmentReminders(
      appData._id,
      appointmentReminderIds,
    );

    logger.info(
      { appId: appData._id, appointmentReminderIds },
      "Successfully deleted appointment reminders, deleting appointment reminder jobs",
    );

    await this.props.services.jobService.scheduleJob({
      type: "app",
      appId: appData._id,
      executeAt: "now",
      payload: {
        type: "delete-appointment-reminders",
        appointmentReminderIds,
      } satisfies AppointmentRemindersJobPayload,
    });

    logger.info(
      { appId: appData._id, appointmentReminderIds },
      "Successfully deleted appointment reminder jobs",
    );
  }
}
