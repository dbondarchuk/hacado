import { renderToStaticMarkup } from "@hacado/email-builder/static";
import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import { resolvePlanTierFromOrganization } from "@hacado/services/billing";
import { appointmentSkipsSmsConsent } from "@hacado/services/sms-compliance";
import { ConnectedAppData, IConnectedAppProps } from "@hacado/types/apps";
import { Appointment } from "@hacado/types/booking";
import { AppJobRequest } from "@hacado/types/jobs";
import { getArguments } from "@hacado/utils/get-arguments";
import {
  appendSharedPoolSuffix,
  isPlatformSmsCountry,
  smsCustomerName,
} from "@hacado/utils/sms";
import { template, templateSafeWithError } from "@hacado/utils/string";
import { canUseFeature } from "@hacado/utils/subscription";
import { getAdminUrl, getWebsiteUrl } from "@hacado/utils/website";
import { DateTime } from "luxon";
import pLimit from "p-limit";
import { getAppointmentReminderSms } from "./messages";
import {
  AppointmentReminder,
  AppointmentRemindersJobPayload,
  readAppointmentReminderChannels,
} from "./models";
import { AppointmentRemindersRepository } from "./repository";
import { AppointmentRemindersAdminAllKeys } from "./translations/types";
import {
  calculateAppointmentReminderTime,
  compareAppointmentCount,
} from "./utils";

export const BATCH_SIZE = 100;
export const JOB_CONCURRENCY_LIMIT = 10;

const getJobKey = (appointmentReminderId: string, appointmentId: string) => {
  return `appointment-notification-${appointmentReminderId}-${appointmentId}`;
};

export class AppointmentRemindersJobProcessor {
  protected readonly loggerFactory: LoggerFactory;
  protected readonly repository: AppointmentRemindersRepository;

  public constructor(protected readonly props: IConnectedAppProps) {
    this.repository = new AppointmentRemindersRepository(props);
    this.loggerFactory = getLoggerFactory(
      "AppointmentRemindersJobProcessor",
      props.organizationId,
    );
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

    switch (jobData.payload.type) {
      case "send-appointment-reminder":
        return this.sendAppointmentReminder(
          appData,
          jobData.payload.appointmentId,
          jobData.payload.appointmentReminderId,
        );

      case "update-appointment-reminder":
        return this.updateAppointmentReminder(
          appData,
          jobData.payload.appointmentReminderId,
          false,
        );
      case "update-appointment":
        return this.updateAppointment(appData, jobData.payload.appointmentId);
      case "delete-appointment-reminder":
        return this.deleteAppointmentReminders(appData, [
          jobData.payload.appointmentReminderId,
        ]);
      case "delete-appointment-reminders":
        return this.deleteAppointmentReminders(
          appData,
          jobData.payload.appointmentReminderIds,
        );
      default:
        logger.warn({ appId: appData._id, jobData }, "Unsupported job type");
        return;
    }
  }

  private async sendAppointmentReminder(
    appData: ConnectedAppData,
    appointmentId: string,
    appointmentReminderId: string,
  ): Promise<void> {
    const logger = this.loggerFactory("sendAppointmentReminder");
    logger.debug(
      {
        appId: appData._id,
        appointmentReminderId,
        appointmentId,
      },
      "Sending appointment reminder",
    );

    try {
      const appointment =
        await this.props.services.bookingService.getAppointment(appointmentId);

      const appointmentReminder = await this.repository.getAppointmentReminder(
        appData._id,
        appointmentReminderId,
      );

      if (!appointmentReminder) {
        logger.warn(
          { appId: appData._id, appointmentReminderId },
          "Appointment reminder not found",
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

      const channels = readAppointmentReminderChannels(appointmentReminder);

      if (!channels.emailEnabled && !channels.textEnabled) {
        logger.info(
          {
            appId: appData._id,
            appointmentReminderId: appointmentReminder._id,
          },
          "Appointment reminder has no channels selected",
        );

        return;
      }

      if (
        appointmentReminder.appointmentCount &&
        appointmentReminder.appointmentCount.type !== "none"
      ) {
        logger.debug(
          {
            appId: appData._id,
            appointmentReminderId: appointmentReminder._id,
          },
          "Checking if enough appointments for appointment reminder",
        );

        const appointments =
          await this.props.services.bookingService.getAppointments({
            customerId: appointment.customer._id,
            status: ["confirmed"],
            limit: 0,
          });

        if (!compareAppointmentCount(appointmentReminder, appointments.total)) {
          logger.warn(
            {
              appId: appData._id,
              appointmentReminderId: appointmentReminder._id,
            },
            "Not enough appointments for appointment reminder",
          );

          return;
        }

        logger.debug(
          {
            appId: appData._id,
            appointmentReminderId: appointmentReminder._id,
          },
          "Enough appointments for appointment reminder",
        );
      }

      logger.debug(
        {
          appId: appData._id,
          appointmentReminderId: appointmentReminder._id,
          emailEnabled: channels.emailEnabled,
          textEnabled: channels.textEnabled,
        },
        "Sending appointment reminder",
      );

      if (channels.emailEnabled) {
        const emailTemplate = channels.emailTemplateId
          ? await this.props.services.templatesService.getTemplate(
              channels.emailTemplateId,
            )
          : null;

        if (!emailTemplate || emailTemplate.type !== "email") {
          logger.warn(
            {
              appId: appData._id,
              appointmentReminderId: appointmentReminder._id,
              templateId: channels.emailTemplateId,
            },
            "Template is not an email template, skipping email appointment reminder",
          );
        } else {
          logger.debug(
            {
              appId: appData._id,
              appointmentReminderId: appointmentReminder._id,
              appointmentId: appointment._id,
              email: appointment.fields.email,
            },
            "Sending email appointment reminder",
          );

          await this.props.services.notificationService.sendEmail({
            email: {
              body: await renderToStaticMarkup({
                args: args,
                document: emailTemplate.value,
              }),
              subject: templateSafeWithError(emailTemplate.subject, args),
              to: appointment.fields.email,
            },
            participantType: "customer",
            handledBy: {
              key: `app_appointment-reminders_admin.handler` satisfies AppointmentRemindersAdminAllKeys,
              args: {
                appointmentReminderName: appointmentReminder.name,
              },
            },
            appointmentId: appointment._id,
            memberId: appointment.memberId,
          });

          logger.info(
            {
              appId: appData._id,
              appointmentReminderId: appointmentReminder._id,
              appointmentId: appointment._id,
            },
            "Successfully sent email appointment reminder",
          );
        }
      }

      if (!channels.textEnabled) return;

      const planTier = resolvePlanTierFromOrganization(organization);
      if (!canUseFeature(planTier, "sms")) {
        logger.info(
          {
            appId: appData._id,
            appointmentReminderId: appointmentReminder._id,
            appointmentId: appointment._id,
          },
          "Skipping text message appointment reminder for subscription plan tier",
        );

        return;
      }

      const phone = appointment.fields?.phone ?? appointment.customer?.phone;
      if (!phone) {
        logger.warn(
          {
            appId: appData._id,
            appointmentReminderId: appointmentReminder._id,
            appointmentId: appointment._id,
          },
          "Phone number not found for text message appointment reminder",
        );

        return;
      }

      logger.debug(
        {
          appId: appData._id,
          appointmentReminderId: appointmentReminder._id,
          appointmentId: appointment._id,
          phone,
        },
        "Sending text message appointment reminder",
      );

      const manageLink = isPlatformSmsCountry(phone)
        ? await this.props.services.pagesService.findManageAppointmentUrl(
            websiteUrl,
          )
        : undefined;

      const smsArgs = {
        ...args,
        manageLink,
        customerName: smsCustomerName(appointment.fields?.name),
      };

      const platformCountry = isPlatformSmsCountry(phone);
      const allowCustom = (
        await this.props.services.textMessageConfigurationService.getSmsMessagingAccess()
      ).allowCustomTemplates;

      const builtIn = template(
        getAppointmentReminderSms(config.brand.language),
        smsArgs,
        true,
      );

      const stored =
        allowCustom && channels.textTemplateId
          ? await this.props.services.templatesService.getTemplate(
              channels.textTemplateId,
            )
          : null;

      const customBody =
        stored?.type === "text-message"
          ? templateSafeWithError(stored.value, smsArgs, true)
          : undefined;

      const smsBody =
        customBody ??
        (platformCountry && !allowCustom
          ? appendSharedPoolSuffix(builtIn)
          : builtIn);

      await this.props.services.notificationService.sendTextMessage({
        phone,
        sender: config.general.name,
        body: smsBody,
        ...(appointmentSkipsSmsConsent(appointment.createdAt)
          ? { dontRequireConsent: true }
          : {}),
        idempotencyKey: `sms_${appointment.organizationId}_${appointment._id}_reminder_${appointmentReminder._id}`,
        webhookData: {
          appointmentId: appointment._id,
          appId: appData._id,
        },
        participantType: "customer",
        handledBy: {
          key: `app_appointment-reminders_admin.handler` satisfies AppointmentRemindersAdminAllKeys,
          args: {
            appointmentReminderName: appointmentReminder.name,
          },
        },
        appointmentId: appointment._id,
        memberId: appointment.memberId,
      });

      logger.info(
        {
          appId: appData._id,
          appointmentReminderId: appointmentReminder._id,
          appointmentId: appointment._id,
        },
        "Successfully sent text message appointment reminder",
      );
    } catch (error: any) {
      logger.error(
        {
          appId: appData._id,
          appointmentReminderId,
          appointmentId,
          error: error?.message || error?.toString(),
        },
        "Error sending appointment reminder",
      );

      throw error;
    }
  }

  private async updateAppointmentReminder(
    appData: ConnectedAppData,
    appointmentReminderId: string,
    onlyDeleteJobs: boolean = false,
  ): Promise<void> {
    const logger = this.loggerFactory("updateAppointmentReminder");
    logger.debug(
      { appId: appData._id, appointmentReminderId },
      "Updating appointment reminder",
    );

    try {
      const appointmentReminder = await this.repository.getAppointmentReminder(
        appData._id,
        appointmentReminderId,
      );

      if (!appointmentReminder) {
        logger.warn(
          { appId: appData._id, appointmentReminderId },
          "Appointment reminder not found, removing jobs",
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
          { appointmentReminderId, appointmentsCount: appointments.length },
          "Processing appointments batch",
        );

        await Promise.all(
          appointments.map((appointment) =>
            limit(async () => {
              try {
                logger.debug(
                  { appointmentReminderId, appointmentId: appointment._id },
                  "Deleting existing job",
                );

                await this.deleteExistingJob(
                  appointmentReminderId,
                  appointment._id,
                );

                logger.debug(
                  { appointmentReminderId, appointmentId: appointment._id },
                  "Successfully deleted existing job, sending appointment reminder",
                );

                if (onlyDeleteJobs || !appointmentReminder) {
                  logger.debug(
                    {
                      appointmentReminderId,
                      appointmentId: appointment._id,
                      onlyDeleteJobs,
                      hasAppointmentReminder: !!appointmentReminder,
                    },
                    "Only deleting jobs or appointment reminder not found, skipping sending appointment reminder",
                  );

                  return;
                }

                await this.scheduleAppointmentReminder(
                  appData,
                  appointment,
                  appointmentReminder,
                );

                logger.debug(
                  { appointmentReminderId, appointmentId: appointment._id },
                  "Successfully scheduled appointment reminder",
                );
              } catch (error: any) {
                logger.error(
                  {
                    appointmentReminderId,
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
        { appointmentReminderId },
        "Successfully updated appointment reminder",
      );

      return;
    } catch (error: any) {
      logger.error(
        {
          appId: appData._id,
          appointmentReminderId,
          error: error?.message || error?.toString(),
        },
        "Error updating appointment reminder",
      );

      throw error;
    }
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
            appointmentReminderIds,
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
                    appointmentReminderIds,
                    appointmentId: appointment._id,
                  },
                  "Deleting existing job",
                );

                await Promise.all(
                  appointmentReminderIds.map(async (appointmentReminderId) => {
                    try {
                      logger.debug(
                        {
                          appointmentReminderId,
                          appointmentId: appointment._id,
                        },
                        "Deleting existing job",
                      );

                      await this.deleteExistingJob(
                        appointmentReminderId,
                        appointment._id,
                      );

                      logger.debug(
                        {
                          appointmentReminderId,
                          appointmentId: appointment._id,
                        },
                        "Successfully deleted existing job",
                      );
                    } catch (error: any) {
                      logger.error(
                        {
                          appointmentReminderId,
                          appointmentId: appointment._id,
                          error: error?.message || error?.toString(),
                        },
                        "Error deleting existing job",
                      );
                    }
                  }),
                );

                logger.debug(
                  {
                    appointmentReminderIds,
                    appointmentId: appointment._id,
                  },
                  "Successfully deleted existing jobs",
                );
              } catch (error: any) {
                logger.error(
                  {
                    appointmentReminderIds,
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
        { appointmentReminderIds },
        "Successfully deleted appointment reminders",
      );

      return;
    } catch (error: any) {
      logger.error(
        {
          appId: appData._id,
          appointmentReminderIds,
          error: error?.message || error?.toString(),
        },
        "Error deleting appointment reminders",
      );

      throw error;
    }
  }

  private async updateAppointment(
    appData: ConnectedAppData,
    appointmentId: string,
  ): Promise<void> {
    const logger = this.loggerFactory("updateAppointment");
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
        const appointmentReminders = await this.getAppointmentRemindersBatch(
          appData._id,
          offset,
          BATCH_SIZE,
        );

        if (appointmentReminders.length === 0) {
          break;
        }

        const limit = pLimit(JOB_CONCURRENCY_LIMIT);

        logger.debug(
          {
            appId: appData._id,
            appointmentReminderCount: appointmentReminders.length,
          },
          "Processing appointment reminders batch",
        );

        await Promise.all(
          appointmentReminders.map((appointmentReminder) =>
            limit(async () => {
              try {
                logger.debug(
                  {
                    appId: appData._id,
                    appointmentReminderId: appointmentReminder._id,
                  },
                  "Deleting existing job",
                );

                await this.deleteExistingJob(
                  appointmentReminder._id,
                  appointmentId,
                );

                logger.debug(
                  {
                    appId: appData._id,
                    appointmentReminderId: appointmentReminder._id,
                  },
                  "Successfully deleted existing job",
                );

                if (appointment?.status !== "confirmed") {
                  logger.debug(
                    {
                      appId: appData._id,
                      appointmentReminderId: appointmentReminder._id,
                    },
                    "Appointment is not confirmed, skipping sending appointment reminder",
                  );

                  return;
                }

                await this.scheduleAppointmentReminder(
                  appData,
                  appointment,
                  appointmentReminder,
                );

                logger.debug(
                  {
                    appId: appData._id,
                    appointmentReminderId: appointmentReminder._id,
                  },
                  "Successfully scheduled appointment reminder",
                );
              } catch (error: any) {
                logger.error(
                  {
                    appId: appData._id,
                    appointmentReminderId: appointmentReminder._id,
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

  private async getAppointmentRemindersBatch(
    appId: string,
    offset: number,
    limit: number,
  ): Promise<AppointmentReminder[]> {
    const logger = this.loggerFactory("getAppointmentRemindersBatch");
    logger.debug(
      { appId, offset, limit },
      "Getting appointment reminders batch",
    );

    const result = await this.repository.getAppointmentReminders(appId, {
      offset,
      limit,
    });

    logger.debug(
      {
        appId,
        offset,
        limit,
        appointmentReminderCount: result.items.length,
      },
      "Successfully retrieved appointment reminders batch",
    );

    return result.items;
  }

  private async deleteExistingJob(
    appointmentReminderId: string,
    appointmentId: string,
  ): Promise<void> {
    const logger = this.loggerFactory("deleteExistingJob");
    logger.debug(
      { appointmentReminderId, appointmentId },
      "Deleting existing job",
    );

    const jobKey = getJobKey(appointmentReminderId, appointmentId);
    await this.props.services.jobService.cancelJob(jobKey);

    logger.debug(
      { appointmentReminderId, appointmentId },
      "Successfully deleted existing job",
    );
  }

  private async scheduleAppointmentReminder(
    appData: ConnectedAppData,
    appointment: Appointment,
    appointmentReminder: AppointmentReminder,
  ): Promise<void> {
    const logger = this.loggerFactory("scheduleAppointmentReminder");
    const jobKey = getJobKey(appointmentReminder._id, appointment._id);
    const executeAt = calculateAppointmentReminderTime(
      appointmentReminder,
      appointment,
    );

    if (executeAt < DateTime.now()) {
      logger.debug(
        {
          appId: appData._id,
          appointmentReminderId: appointmentReminder._id,
          appointmentId: appointment._id,
          jobKey,
          executeAt,
        },
        "Appointment reminder is in the past, skipping",
      );

      return;
    }

    logger.debug(
      {
        appId: appData._id,
        appointmentReminderId: appointmentReminder._id,
        appointmentId: appointment._id,
        jobKey,
        executeAt,
      },
      "Scheduling appointment reminder",
    );

    await this.props.services.jobService.scheduleJob({
      type: "app",
      id: jobKey,
      executeAt: executeAt.toJSDate(),
      appId: appData._id,
      payload: {
        type: "send-appointment-reminder",
        appointmentId: appointment._id,
        appointmentReminderId: appointmentReminder._id,
      } satisfies AppointmentRemindersJobPayload,
    });

    logger.debug(
      {
        appId: appData._id,
        appointmentReminderId: appointmentReminder._id,
        appointmentId: appointment._id,
        jobKey,
        executeAt,
      },
      "Successfully scheduled appointment reminder",
    );
  }
}
