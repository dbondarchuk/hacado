import { renderToStaticMarkup } from "@hacado/email-builder/static";
import { AllKeys } from "@hacado/i18n";
import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import {
  BookingConfiguration,
  BrandConfiguration,
  ConnectedAppData,
  ConnectedAppRequestError,
  ConnectedAppStatusWithText,
  ConnectedAppUninstallResult,
  EventEnvelope,
  GeneralConfiguration,
  IConnectedApp,
  IConnectedAppProps,
  IEventSubscriber,
  SocialConfiguration,
} from "@hacado/types";
import {
  durationToTime,
  getAdminUrl,
  getArguments,
  getWebsiteUrl,
  templateSafeWithError,
} from "@hacado/utils";
import { DateTime } from "luxon";
import {
  WAITLIST_ENTRY_CREATED_EVENT_TYPE,
  type WaitlistEntryCreatedEvent,
} from "../waitlist/models/events";
import { WaitlistEntry, waitlistTime } from "../waitlist/models/waitlist";
import {
  CustomerWaitlistNotificationsConfiguration,
  customerWaitlistNotificationsConfigurationSchema,
} from "./models";
import {
  CustomerWaitlistNotificationsAdminKeys,
  CustomerWaitlistNotificationsAdminNamespace,
} from "./translations/types";

export class CustomerWaitlistNotificationsConnectedApp
  implements IConnectedApp, IEventSubscriber
{
  protected readonly loggerFactory: LoggerFactory;

  public constructor(protected readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "CustomerWaitlistNotificationsConnectedApp",
      props.organizationId,
    );
  }

  public async onEvent(
    appData: ConnectedAppData,
    envelope: EventEnvelope,
  ): Promise<void> {
    if (envelope.type !== WAITLIST_ENTRY_CREATED_EVENT_TYPE) {
      return;
    }
    const { entry } = envelope.payload as WaitlistEntryCreatedEvent["payload"];
    await this.handleWaitlistEntryCreated(appData, entry);
  }

  public async processRequest(
    appData: ConnectedAppData,
    request: CustomerWaitlistNotificationsConfiguration,
  ): Promise<ConnectedAppStatusWithText> {
    const logger = this.loggerFactory("processRequest");
    logger.debug(
      { appId: appData._id },
      "Processing customer waitlist notifications configuration request",
    );

    const { data, success, error } =
      customerWaitlistNotificationsConfigurationSchema.safeParse(request);
    if (!success) {
      logger.error(
        { error },
        "Invalid customer waitlist notifications configuration request",
      );
      throw new ConnectedAppRequestError(
        "invalid_customer-waitlist-notifications_configuration_request",
        { request, error },
        400,
        error.message,
      );
    }

    try {
      const validatedConfig =
        customerWaitlistNotificationsConfigurationSchema.parse(data);

      logger.debug(
        { appId: appData._id },
        "Configuration validated successfully",
      );

      await this.props.update({
        data: validatedConfig,
        status: "connected",
        statusText:
          "app_customer-waitlist-notifications_admin.statusText.successfully_set_up",
      });

      logger.info(
        { appId: appData._id },
        "Successfully updated customer waitlist notifications configuration",
      );

      return {
        status: "connected",
        statusText:
          "app_customer-waitlist-notifications_admin.statusText.successfully_set_up",
      };
    } catch (error: any) {
      logger.error(
        { appId: appData._id, error },
        "Error processing customer waitlist notifications configuration",
      );

      await this.props.update({
        status: "failed",
        statusText:
          "app_customer-waitlist-notifications_admin.statusText.error_processing_configuration",
      });

      throw error;
    }
  }

  public async install(appData: ConnectedAppData): Promise<void> {
    const logger = this.loggerFactory("install");
    logger.debug(
      { appId: appData._id },
      "Installing customer waitlist notifications app",
    );

    await this.props.update({
      data: {} satisfies CustomerWaitlistNotificationsConfiguration,
    });
  }

  public async unInstall(
    appData: ConnectedAppData,
  ): Promise<ConnectedAppUninstallResult> {
    const logger = this.loggerFactory("unInstall");
    logger.debug(
      { appId: appData._id },
      "Uninstalling customer waitlist notifications app",
    );

    logger.info(
      { appId: appData._id },
      "Successfully uninstalled customer waitlist notifications app",
    );
    return { success: true, code: "ok" };
  }

  private async handleWaitlistEntryCreated(
    appData: ConnectedAppData,
    entry: WaitlistEntry,
  ): Promise<void> {
    const logger = this.loggerFactory("handleWaitlistEntryCreated");

    logger.debug(
      {
        appId: appData._id,
        entryId: entry._id,
      },
      "Waitlist entry created, checking customer notification settings",
    );

    const data = appData.data as CustomerWaitlistNotificationsConfiguration;

    if (!data?.customerNewEntryTemplateId) {
      logger.debug(
        {
          appId: appData._id,
          entryId: entry._id,
        },
        "No customer new entry template configured, skipping",
      );
      return;
    }

    try {
      const config =
        await this.props.services.configurationService.getConfigurations(
          "booking",
          "general",
          "brand",
          "social",
        );

      await this.sendCustomerNotification(appData, entry, config);

      logger.info(
        { appId: appData._id, entryId: entry._id },
        "Successfully sent customer waitlist notification",
      );
    } catch (error: any) {
      logger.error(
        { appId: appData._id, entryId: entry._id, error },
        "Error sending customer waitlist notification",
      );
    }
  }

  public async sendCustomerNotification(
    appData: ConnectedAppData,
    entry: WaitlistEntry,
    config: {
      booking: BookingConfiguration;
      general: GeneralConfiguration;
      brand: BrandConfiguration;
      social: SocialConfiguration;
    },
  ) {
    const logger = this.loggerFactory("sendCustomerNotification");
    logger.debug(
      { appId: appData._id, entryId: entry._id },
      "Sending waitlist email notification to customer",
    );

    try {
      const organization =
        await this.props.services.organizationService.getOrganization();
      if (!organization) {
        logger.error(
          { appId: appData._id, entryId: entry._id },
          "Organization not found",
        );
        throw new Error("Organization not found");
      }

      const adminUrl = getAdminUrl();
      const websiteUrl = getWebsiteUrl(organization);
      const args = getArguments({
        appointment: null,
        config,
        customer: entry.customer,
        useAppointmentTimezone: true,
        locale: config.brand.language,
        additionalProperties: {
          waitlistEntry: getWaitlistEntryArgs(entry),
        },
        adminUrl,
        websiteUrl,
      });

      const data = appData.data as CustomerWaitlistNotificationsConfiguration;

      if (!data.customerNewEntryTemplateId) {
        logger.warn(
          { appId: appData._id, entryId: entry._id },
          "No customer new entry template ID configured, skipping email notification",
        );
        return;
      }

      const template = await this.props.services.templatesService.getTemplate(
        data.customerNewEntryTemplateId,
      );

      if (!template) {
        logger.warn(
          { appId: appData._id, entryId: entry._id },
          "No customer new entry template found, skipping email notification",
        );
        return;
      }

      if (template.type !== "email") {
        logger.warn(
          { appId: appData._id, entryId: entry._id },
          "Template is not an email template, skipping email notification",
        );
        return;
      }

      const subject = templateSafeWithError(template.subject, args);

      const renderedTemplate = await renderToStaticMarkup({
        args: args,
        document: template.value,
      });

      const recipientEmail = entry.email;

      await this.props.services.notificationService.sendEmail({
        email: {
          to: recipientEmail,
          subject: subject,
          body: renderedTemplate,
        },
        participantType: "customer",
        memberId: entry.memberId,
        handledBy:
          "app_customer-waitlist-notifications_admin.handlers.newWaitlistEntry" satisfies AllKeys<
            CustomerWaitlistNotificationsAdminNamespace,
            CustomerWaitlistNotificationsAdminKeys
          >,
        customerId: entry.customer._id,
      });

      logger.info(
        {
          appId: appData._id,
          entryId: entry._id,
          recipientEmail,
        },
        "Successfully sent email notification to customer",
      );
    } catch (error: any) {
      logger.error(
        { appId: appData._id, entryId: entry._id, error },
        "Error sending email notification to customer",
      );
      throw error;
    }
  }
}

const getWaitlistEntryArgs = (entry: WaitlistEntry) => {
  return {
    ...entry,
    duration: entry.duration ? durationToTime(entry.duration) : undefined,
    dates:
      entry.dates?.map((date) => ({
        date: DateTime.fromISO(date.date).toJSDate(),
        time: date.time || [],
        isMorning: date.time?.includes("morning"),
        isAfternoon: date.time?.includes("afternoon"),
        isEvening: date.time?.includes("evening"),
        isAllDay: waitlistTime.every((time) =>
          date.time?.some((t) => t === time),
        ),
      })) || [],
  };
};
