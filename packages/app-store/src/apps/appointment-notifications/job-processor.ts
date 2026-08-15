import { renderToStaticMarkup } from "@hacado/email-builder/static";
import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import {
  canUseFeature,
  resolvePlanTierFromOrganization,
} from "@hacado/services/billing";
import {
  AppJobRequest,
  Appointment,
  ConnectedAppData,
  IConnectedAppProps,
} from "@hacado/types";
import {
  getAdminUrl,
  getArguments,
  getWebsiteUrl,
  templateSafeWithError,
} from "@hacado/utils";
import { DateTime } from "luxon";
import pLimit from "p-limit";
import {
  AppointmentNotification,
  AppointmentNotificationsJobPayload,
} from "./models";
import { AppointmentNotificationsRepository } from "./repository";
import { AppointmentNotificationsAdminAllKeys } from "./translations/types";
import {
  calculateAppointmentNotificationTime,
  compareAppointmentCount,
} from "./utils";

export const BATCH_SIZE = 100;
export const JOB_CONCURRENCY_LIMIT = 10;

const getJobKey = (
  appointmentNotificationId: string,
  appointmentId: string,
) => {
  return `appointment-notification-${appointmentNotificationId}-${appointmentId}`;
};

export class AppointmentNotificationsJobProcessor {
  protected readonly loggerFactory: LoggerFactory;
  protected readonly repository: AppointmentNotificationsRepository;

  public constructor(protected readonly props: IConnectedAppProps) {
    this.repository = new AppointmentNotificationsRepository(props);
    this.loggerFactory = getLoggerFactory(
      "AppointmentNotificationsJobProcessor",
      props.organizationId,
    );
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

    switch (jobData.payload.type) {
      case "send-appointment-notification":
        return this.sendAppointmentNotification(
          appData,
          jobData.payload.appointmentId,
          jobData.payload.appointmentNotificationId,
        );

      case "update-appointment-notification":
        return this.updateAppointmentNotification(
          appData,
          jobData.payload.appointmentNotificationId,
          false,
        );
      case "update-appointment":
        return this.updateAppointment(appData, jobData.payload.appointmentId);
      case "delete-appointment-notification":
        return this.deleteAppointmentNotifications(appData, [
          jobData.payload.appointmentNotificationId,
        ]);
      case "delete-appointment-notifications":
        return this.deleteAppointmentNotifications(
          appData,
          jobData.payload.appointmentNotificationIds,
        );
      default:
        logger.warn({ appId: appData._id, jobData }, "Unsupported job type");
        return;
    }
  }

  private async sendAppointmentNotification(
    appData: ConnectedAppData,
    appointmentId: string,
    appointmentNotificationId: string,
  ): Promise<void> {
    const logger = this.loggerFactory("sendAppointmentNotification");
    logger.debug(
      {
        appId: appData._id,
        appointmentNotificationId,
        appointmentId,
      },
      "Sending appointment notification",
    );

    try {
      const appointment =
        await this.props.services.bookingService.getAppointment(appointmentId);
      const appointmentNotification =
        await this.repository.getAppointmentNotification(
          appData._id,
          appointmentNotificationId,
        );

      if (!appointmentNotification) {
        logger.warn(
          { appId: appData._id, appointmentNotificationId },
          "Appointment notification not found",
        );
        return;
      }

      if (!appointment) {
        logger.warn(
          { appId: appData._id, appointmentId },
          "Appointment not found",
        );
        return;
      }

      if (appointment.status !== "confirmed") {
        logger.warn(
          { appId: appData._id, appointmentId },
          "Appointment is not confirmed",
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

      const channel = appointmentNotification.channel;
      const template = await this.props.services.templatesService.getTemplate(
        appointmentNotification.templateId,
      );

      if (!template) {
        logger.warn(
          {
            appId: appData._id,
            appointmentNotificationId: appointmentNotification._id,
            templateId: appointmentNotification.templateId,
          },
          "Template not found for appointment notification",
        );
        return;
      }

      if (
        appointmentNotification.appointmentCount &&
        appointmentNotification.appointmentCount.type !== "none"
      ) {
        logger.debug(
          {
            appId: appData._id,
            appointmentNotificationId: appointmentNotification._id,
          },
          "Checking if enough appointments for appointment notification",
        );

        const appointments =
          await this.props.services.bookingService.getAppointments({
            customerId: appointment.customer._id,
            status: ["confirmed"],
            limit: 0,
          });

        if (
          !compareAppointmentCount(appointmentNotification, appointments.total)
        ) {
          logger.warn(
            {
              appId: appData._id,
              appointmentNotificationId: appointmentNotification._id,
            },
            "Not enough appointments for appointment notification",
          );
          return;
        }

        logger.debug(
          {
            appId: appData._id,
            appointmentNotificationId: appointmentNotification._id,
          },
          "Enough appointments for appointment notification",
        );
      }

      logger.debug(
        {
          appId: appData._id,
          appointmentNotificationId: appointmentNotification._id,
          channel,
          templateId: appointmentNotification.templateId,
        },
        "Template found, sending appointment notification",
      );

      switch (channel) {
        case "email":
          logger.debug(
            {
              appId: appData._id,
              appointmentNotificationId: appointmentNotification._id,
              appointmentId: appointment._id,
              email: appointment.fields.email,
            },
            "Sending email appointment notification",
          );

          if (template.type !== "email") {
            logger.warn(
              {
                appId: appData._id,
                appointmentNotificationId: appointmentNotification._id,
              },
              "Template is not an email template, skipping email appointment notification",
            );

            throw new Error("Template is not an email template");
          }

          await this.props.services.notificationService.sendEmail({
            email: {
              body: await renderToStaticMarkup({
                args: args,
                document: template.value,
              }),
              subject: templateSafeWithError(template.subject, args),
              to: appointment.fields.email,
            },
            participantType: "customer",
            handledBy: {
              key: `app_appointment-notifications_admin.handler` satisfies AppointmentNotificationsAdminAllKeys,
              args: {
                appointmentNotificationName: appointmentNotification.name,
              },
            },
            appointmentId: appointment._id,
            memberId: appointment.memberId,
          });

          logger.info(
            {
              appId: appData._id,
              appointmentNotificationId: appointmentNotification._id,
              appointmentId: appointment._id,
            },
            "Successfully sent email appointment notification",
          );
          return;

        case "text-message": {
          const organization =
            await this.props.services.organizationService.getOrganization();
          const planTier = resolvePlanTierFromOrganization(organization);
          if (!canUseFeature(planTier, "sms")) {
            logger.info(
              {
                appId: appData._id,
                appointmentNotificationId: appointmentNotification._id,
                appointmentId: appointment._id,
              },
              "Skipping text message appointment notification for subscription plan tier",
            );
            return;
          }

          const phone =
            appointment.fields?.phone ?? appointment.customer?.phone;

          if (!phone) {
            logger.warn(
              {
                appId: appData._id,
                appointmentNotificationId: appointmentNotification._id,
                appointmentId: appointment._id,
              },
              "Phone number not found for text message appointment notification",
            );
            return;
          }

          logger.debug(
            {
              appId: appData._id,
              appointmentNotificationId: appointmentNotification._id,
              appointmentId: appointment._id,
              phone,
            },
            "Sending text message appointment notification",
          );

          await this.props.services.notificationService.sendTextMessage({
            phone,
            sender: config.general.name,
            body: templateSafeWithError(template.value, args),
            webhookData: {
              appointmentId: appointment._id,
              appId: appData._id,
            },
            participantType: "customer",
            handledBy: {
              key: `app_appointment-notifications_admin.handler` satisfies AppointmentNotificationsAdminAllKeys,
              args: {
                appointmentNotificationName: appointmentNotification.name,
              },
            },
            appointmentId: appointment._id,
            memberId: appointment.memberId,
          });

          logger.info(
            {
              appId: appData._id,
              appointmentNotificationId: appointmentNotification._id,
              appointmentId: appointment._id,
            },
            "Successfully sent text message appointment notification",
          );
          return;
        }

        default:
          logger.error(
            {
              appId: appData._id,
              appointmentNotificationId: (appointmentNotification as any)._id,
              channel,
            },
            "Unknown appointment notification channel type",
          );
          return;
      }
    } catch (error: any) {
      logger.error(
        {
          appId: appData._id,
          appointmentNotificationId,
          appointmentId,
          error: error?.message || error?.toString(),
        },
        "Error sending appointment notification",
      );
      throw error;
    }
  }

  private async updateAppointmentNotification(
    appData: ConnectedAppData,
    appointmentNotificationId: string,
    onlyDeleteJobs: boolean = false,
  ): Promise<void> {
    const logger = this.loggerFactory("updateAppointmentNotification");
    logger.debug(
      { appId: appData._id, appointmentNotificationId },
      "Updating appointment notification",
    );

    try {
      const appointmentNotification =
        await this.repository.getAppointmentNotification(
          appData._id,
          appointmentNotificationId,
        );

      if (!appointmentNotification) {
        logger.warn(
          { appId: appData._id, appointmentNotificationId },
          "Appointment notification not found, removing jobs",
        );
      }

      const start = new Date();
      let offset = 0;
      do {
        const appointments = await this.getAppointmentsBatch(
          appData,
          start,
          offset,
          BATCH_SIZE,
        );

        if (appointments.length === 0) {
          break;
        }

        const limit = pLimit(JOB_CONCURRENCY_LIMIT);

        logger.debug(
          { appointmentNotificationId, appointmentsCount: appointments.length },
          "Processing appointments batch",
        );
        await Promise.all(
          appointments.map((appointment) =>
            limit(async () => {
              try {
                logger.debug(
                  { appointmentNotificationId, appointmentId: appointment._id },
                  "Deleting existing job",
                );
                await this.deleteExistingJob(
                  appointmentNotificationId,
                  appointment._id,
                );
                logger.debug(
                  { appointmentNotificationId, appointmentId: appointment._id },
                  "Successfully deleted existing job, sending appointment notification",
                );

                if (onlyDeleteJobs || !appointmentNotification) {
                  logger.debug(
                    {
                      appointmentNotificationId,
                      appointmentId: appointment._id,
                      onlyDeleteJobs,
                      hasAppointmentNotification: !!appointmentNotification,
                    },
                    "Only deleting jobs or appointment notification not found, skipping sending appointment notification",
                  );
                  return;
                }

                await this.scheduleAppointmentNotification(
                  appData,
                  appointment,
                  appointmentNotification,
                );
                logger.debug(
                  { appointmentNotificationId, appointmentId: appointment._id },
                  "Successfully appointment appointment notification",
                );
              } catch (error: any) {
                logger.error(
                  {
                    appointmentNotificationId,
                    appointmentId: appointment._id,
                    error: error?.message || error?.toString(),
                  },
                  "Error processing appointment",
                );
                return;
              }
            }),
          ),
        );

        offset += BATCH_SIZE;
      } while (true);

      logger.debug(
        { appointmentNotificationId },
        "Successfully updated appointment notification",
      );
      return;
    } catch (error: any) {
      logger.error(
        {
          appId: appData._id,
          appointmentNotificationId,
          error: error?.message || error?.toString(),
        },
        "Error updating appointment notification",
      );
      throw error;
    }
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

    try {
      const start = new Date();
      let offset = 0;
      do {
        const appointments = await this.getAppointmentsBatch(
          appData,
          start,
          offset,
          BATCH_SIZE,
        );

        if (appointments.length === 0) {
          break;
        }

        const limit = pLimit(JOB_CONCURRENCY_LIMIT);

        logger.debug(
          {
            appointmentNotificationIds,
            appointmentsCount: appointments.length,
          },
          "Processing appointments batch",
        );
        await Promise.all(
          appointments.map((appointment) =>
            limit(async () => {
              try {
                logger.debug(
                  {
                    appointmentNotificationIds,
                    appointmentId: appointment._id,
                  },
                  "Deleting existing job",
                );

                await Promise.all(
                  appointmentNotificationIds.map(
                    async (appointmentNotificationId) => {
                      try {
                        logger.debug(
                          {
                            appointmentNotificationId,
                            appointmentId: appointment._id,
                          },
                          "Deleting existing job",
                        );

                        await this.deleteExistingJob(
                          appointmentNotificationId,
                          appointment._id,
                        );
                        logger.debug(
                          {
                            appointmentNotificationId,
                            appointmentId: appointment._id,
                          },
                          "Successfully deleted existing job",
                        );
                      } catch (error: any) {
                        logger.error(
                          {
                            appointmentNotificationId,
                            appointmentId: appointment._id,
                            error: error?.message || error?.toString(),
                          },
                          "Error deleting existing job",
                        );
                      }
                    },
                  ),
                );

                logger.debug(
                  {
                    appointmentNotificationIds,
                    appointmentId: appointment._id,
                  },
                  "Successfully deleted existing jobs",
                );
              } catch (error: any) {
                logger.error(
                  {
                    appointmentNotificationIds,
                    appointmentId: appointment._id,
                    error: error?.message || error?.toString(),
                  },
                  "Error processing appointment",
                );
                return;
              }
            }),
          ),
        );

        offset += BATCH_SIZE;
      } while (true);

      logger.debug(
        { appointmentNotificationIds },
        "Successfully deleted appointment notifications",
      );
      return;
    } catch (error: any) {
      logger.error(
        {
          appId: appData._id,
          appointmentNotificationIds,
          error: error?.message || error?.toString(),
        },
        "Error deleting appointment notifications",
      );
      throw error;
    }
  }

  private async updateAppointment(
    appData: ConnectedAppData,
    appointmentId: string,
  ): Promise<void> {
    const logger = this.loggerFactory("updateAppointmentNotification");
    logger.debug({ appId: appData._id, appointmentId }, "Updating appointment");

    try {
      const appointment =
        await this.props.services.bookingService.getAppointment(appointmentId);

      if (!appointment) {
        logger.warn(
          { appId: appData._id, appointmentId },
          "Appointment not found",
        );
      }

      let offset = 0;
      do {
        const appointmentNotifications =
          await this.getAppointmentNotificationsBatch(
            appData._id,
            offset,
            BATCH_SIZE,
          );
        if (appointmentNotifications.length === 0) {
          break;
        }

        const limit = pLimit(JOB_CONCURRENCY_LIMIT);

        logger.debug(
          {
            appId: appData._id,
            appointmentNotificationCount: appointmentNotifications.length,
          },
          "Processing appointment notifications batch",
        );
        await Promise.all(
          appointmentNotifications.map((appointmentNotification) =>
            limit(async () => {
              try {
                logger.debug(
                  {
                    appId: appData._id,
                    appointmentNotificationId: appointmentNotification._id,
                  },
                  "Deleting existing job",
                );
                await this.deleteExistingJob(
                  appointmentNotification._id,
                  appointmentId,
                );
                logger.debug(
                  {
                    appId: appData._id,
                    appointmentNotificationId: appointmentNotification._id,
                  },
                  "Successfully deleted existing job",
                );

                if (appointment?.status !== "confirmed") {
                  logger.debug(
                    {
                      appId: appData._id,
                      appointmentNotificationId: appointmentNotification._id,
                    },
                    "Appointment is not confirmed, skipping sending appointment notification",
                  );
                  return;
                }

                await this.scheduleAppointmentNotification(
                  appData,
                  appointment,
                  appointmentNotification,
                );
                logger.debug(
                  {
                    appId: appData._id,
                    appointmentNotificationId: appointmentNotification._id,
                  },
                  "Successfully appointment appointment notification",
                );
              } catch (error: any) {
                logger.error(
                  {
                    appId: appData._id,
                    appointmentNotificationId: appointmentNotification._id,
                    error: error?.message || error?.toString(),
                  },
                  "Error processing appointment",
                );
              }
            }),
          ),
        );

        offset += BATCH_SIZE;
      } while (true);

      logger.debug(
        { appId: appData._id, appointmentId },
        "Successfully updated appointment",
      );
      return;
    } catch (error: any) {
      logger.error(
        {
          appId: appData._id,
          appointmentId,
          error: error?.message || error?.toString(),
        },
        "Error updating appointment",
      );
      throw error;
    }
  }

  private async getAppointmentsBatch(
    appData: ConnectedAppData,
    date: Date,
    offset: number,
    limit: number,
  ): Promise<Appointment[]> {
    const logger = this.loggerFactory("getAppointmentsBatch");
    logger.debug({ offset, limit, date }, "Getting appointments batch");

    const appointments =
      await this.props.services.bookingService.getAppointments({
        status: ["confirmed"],
        range: {
          start: date,
        },
        offset,
        limit,
      });

    return appointments.items;
  }

  private async getAppointmentNotificationsBatch(
    appId: string,
    offset: number,
    limit: number,
  ): Promise<AppointmentNotification[]> {
    const logger = this.loggerFactory("getAppointmentNotificationsBatch");
    logger.debug(
      { appId, offset, limit },
      "Getting appointment notifications batch",
    );
    const result = await this.repository.getAppointmentNotifications(appId, {
      offset,
      limit,
    });

    logger.debug(
      {
        appId,
        offset,
        limit,
        appointmentNotificationCount: result.items.length,
      },
      "Successfully retrieved appointment notifications batch",
    );
    return result.items;
  }

  private async deleteExistingJob(
    appointmentNotificationId: string,
    appointmentId: string,
  ): Promise<void> {
    const logger = this.loggerFactory("deleteExistingJob");
    logger.debug(
      { appointmentNotificationId, appointmentId },
      "Deleting existing job",
    );

    const jobKey = getJobKey(appointmentNotificationId, appointmentId);
    await this.props.services.jobService.cancelJob(jobKey);

    logger.debug(
      { appointmentNotificationId, appointmentId },
      "Successfully deleted existing job",
    );
  }

  private async scheduleAppointmentNotification(
    appData: ConnectedAppData,
    appointment: Appointment,
    appointmentNotification: AppointmentNotification,
  ): Promise<void> {
    const logger = this.loggerFactory("scheduleAppointmentNotification");
    const jobKey = getJobKey(appointmentNotification._id, appointment._id);
    const executeAt = calculateAppointmentNotificationTime(
      appointmentNotification,
      appointment,
    );

    if (executeAt < DateTime.now()) {
      logger.debug(
        {
          appId: appData._id,
          appointmentNotificationId: appointmentNotification._id,
          appointmentId: appointment._id,
          jobKey,
          executeAt,
        },
        "Appointment notification is in the past, skipping",
      );

      return;
    }

    logger.debug(
      {
        appId: appData._id,
        appointmentNotificationId: appointmentNotification._id,
        appointmentId: appointment._id,
        jobKey,
        executeAt,
      },
      "Scheduling appointment notification",
    );

    await this.props.services.jobService.scheduleJob({
      type: "app",
      id: jobKey,
      executeAt: executeAt.toJSDate(),
      appId: appData._id,
      payload: {
        type: "send-appointment-notification",
        appointmentId: appointment._id,
        appointmentNotificationId: appointmentNotification._id,
      } satisfies AppointmentNotificationsJobPayload,
    });

    logger.debug(
      {
        appId: appData._id,
        appointmentNotificationId: appointmentNotification._id,
        appointmentId: appointment._id,
        jobKey,
        executeAt,
      },
      "Successfully appointment appointment notification",
    );
  }
}
