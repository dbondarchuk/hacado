import { renderToStaticMarkup } from "@hacado/email-builder/static";
import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import {
  AppJobRequest,
  ConnectedAppData,
  ConnectedAppRequestError,
  ConnectedAppStatusWithText,
  CUSTOMER_PACKAGE_ADJUSTED_EVENT_TYPE,
  CUSTOMER_PACKAGE_CANCELLED_EVENT_TYPE,
  CUSTOMER_PACKAGE_EXHAUSTED_EVENT_TYPE,
  CUSTOMER_PACKAGE_EXPIRED_EVENT_TYPE,
  CUSTOMER_PACKAGE_ISSUED_EVENT_TYPE,
  CustomerPackage,
  DemoArguments,
  EventEnvelope,
  ICommunicationTemplatesProvider,
  IConnectedApp,
  IConnectedAppProps,
  IDemoArgumentsProvider,
  IEventSubscriber,
  JobRequest,
  PackageAdjustRequest,
  resolveCustomerPackageStatus,
  systemEventSource,
  TemplateTemplatesList,
  type CustomerPackageAdjustedPayload,
  type CustomerPackageCancelledPayload,
  type CustomerPackageExhaustedPayload,
  type CustomerPackageExpiredPayload,
  type CustomerPackageIssuedPayload,
} from "@hacado/types";
import {
  getAdminUrl,
  getArguments,
  getWebsiteUrl,
  templateSafeWithError,
} from "@hacado/utils";
import { DateTime } from "luxon";
import { demoPackageEmailArguments } from "./demo-arguments";
import {
  CustomerPackageEmailNotificationConfiguration,
  customerPackageEmailNotificationConfigurationSchema,
  CustomerPackageEmailNotificationJobPayload,
  CustomerPackageEmailTemplateKeys,
} from "./models";
import { CustomerPackageEmailNotificationTemplates } from "./templates";
import {
  CustomerPackageEmailNotificationAdminAllKeys,
  CustomerPackageEmailNotificationAdminKeys,
  CustomerPackageEmailNotificationAdminNamespace,
} from "./translations/types";

const DEFAULT_EXPIRING_SOON_THRESHOLD_MINUTES = 7 * 24 * 60;

const TEMPLATE_BUILTIN_IDS: Record<
  CustomerPackageEmailTemplateKeys,
  keyof typeof CustomerPackageEmailNotificationTemplates
> = {
  purchased: "customer-package-purchased-email",
  exhausted: "customer-package-exhausted-email",
  cancelled: "customer-package-cancelled-email",
  expired: "customer-package-expired-email",
  expiringSoon: "customer-package-expiring-soon-email",
};

export default class CustomerPackageEmailNotificationConnectedApp
  implements
    IConnectedApp,
    IEventSubscriber,
    ICommunicationTemplatesProvider,
    IDemoArgumentsProvider
{
  protected readonly loggerFactory: LoggerFactory;

  public constructor(protected readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "CustomerPackageEmailNotificationConnectedApp",
      props.organizationId,
    );
  }

  public async getDemoEmailArguments(): Promise<DemoArguments> {
    return demoPackageEmailArguments;
  }

  public async getCommunicationTemplates(): Promise<TemplateTemplatesList> {
    return CustomerPackageEmailNotificationTemplates;
  }

  public async install(appData: ConnectedAppData): Promise<void> {
    const logger = this.loggerFactory("install");
    logger.debug({ appId: appData._id }, "Installing customer package emails");

    const { configurationService, templatesService } = this.props.services;
    const { language } = await configurationService.getConfiguration("brand");

    const getUniqueName = async (baseName: string): Promise<string | null> => {
      for (let i = 0; i < 10; i++) {
        const candidate = i === 0 ? baseName : `${baseName} (${i + 1})`;
        if (await templatesService.checkUniqueName(candidate)) {
          return candidate;
        }
      }
      return null;
    };

    const templateIds: Partial<
      Record<CustomerPackageEmailTemplateKeys, string>
    > = {};

    for (const [key, builtinId] of Object.entries(TEMPLATE_BUILTIN_IDS) as [
      CustomerPackageEmailTemplateKeys,
      keyof typeof CustomerPackageEmailNotificationTemplates,
    ][]) {
      const templatesByLang =
        CustomerPackageEmailNotificationTemplates[builtinId];
      const source = templatesByLang[language] ?? templatesByLang.en;
      if (!source) continue;

      const uniqueName = await getUniqueName(source.name);
      if (!uniqueName) continue;

      const created = await templatesService.createTemplate(
        { ...source, name: uniqueName },
        systemEventSource,
      );
      templateIds[key] = created._id;
    }

    const current =
      (appData.data as CustomerPackageEmailNotificationConfiguration) ??
      undefined;

    await this.props.update({
      data: {
        templates: {
          purchased: {
            templateId:
              templateIds.purchased ??
              current?.templates?.purchased?.templateId,
          },
          exhausted: {
            templateId:
              templateIds.exhausted ??
              current?.templates?.exhausted?.templateId,
          },
          cancelled: {
            templateId:
              templateIds.cancelled ??
              current?.templates?.cancelled?.templateId,
          },
          expired: {
            templateId:
              templateIds.expired ?? current?.templates?.expired?.templateId,
          },
        },
        expiringSoon: {
          enabled: current?.expiringSoon?.enabled ?? false,
          thresholdMinutes:
            current?.expiringSoon?.thresholdMinutes ??
            DEFAULT_EXPIRING_SOON_THRESHOLD_MINUTES,
          templateId:
            templateIds.expiringSoon ?? current?.expiringSoon?.templateId,
        },
      } satisfies CustomerPackageEmailNotificationConfiguration,
      status: "connected",
      statusText:
        "app_customer-package-email-notification_admin.statusText.successfully_set_up",
    });
  }

  public async processRequest(
    appData: ConnectedAppData,
    request: CustomerPackageEmailNotificationConfiguration,
  ): Promise<
    ConnectedAppStatusWithText<
      CustomerPackageEmailNotificationAdminNamespace,
      CustomerPackageEmailNotificationAdminKeys
    >
  > {
    const logger = this.loggerFactory("processRequest");
    const { data, success, error } =
      customerPackageEmailNotificationConfigurationSchema.safeParse(request);
    if (!success) {
      throw new ConnectedAppRequestError(
        "invalid_request",
        { request, error },
        400,
        error.message,
      );
    }

    const previous = appData.data as
      | CustomerPackageEmailNotificationConfiguration
      | undefined;
    const expiringSoonChanged =
      previous?.expiringSoon?.enabled !== data.expiringSoon.enabled ||
      previous?.expiringSoon?.thresholdMinutes !==
        data.expiringSoon.thresholdMinutes ||
      previous?.expiringSoon?.templateId !== data.expiringSoon.templateId;

    const status: ConnectedAppStatusWithText<
      CustomerPackageEmailNotificationAdminNamespace,
      CustomerPackageEmailNotificationAdminKeys
    > = {
      status: "connected",
      statusText:
        "app_customer-package-email-notification_admin.statusText.successfully_set_up",
    };

    this.props.update({ data, ...status });
    logger.info({ appId: appData._id }, "Configured customer package emails");

    if (expiringSoonChanged) {
      await this.props.services.jobService.scheduleJob({
        type: "app",
        id: `customer-package-reschedule-expiring-soon-${appData._id}`,
        executeAt: new Date(),
        appId: appData._id,
        payload: {
          type: "reschedule-expiring-soon",
        } satisfies CustomerPackageEmailNotificationJobPayload,
      });
    }

    return status;
  }

  public async onEvent(
    appData: ConnectedAppData,
    envelope: EventEnvelope,
  ): Promise<void> {
    switch (envelope.type) {
      case CUSTOMER_PACKAGE_ISSUED_EVENT_TYPE: {
        const { customerPackage } =
          envelope.payload as CustomerPackageIssuedPayload;
        await this.schedulePackageJobs(appData, customerPackage);
        await this.sendPackageEmail(appData, customerPackage, "purchased");
        break;
      }
      case CUSTOMER_PACKAGE_EXHAUSTED_EVENT_TYPE: {
        const { customerPackage } =
          envelope.payload as CustomerPackageExhaustedPayload;
        if (resolveCustomerPackageStatus(customerPackage) !== "exhausted") {
          return;
        }
        await this.cancelPackageJobs(customerPackage._id);
        await this.sendPackageEmail(appData, customerPackage, "exhausted");
        break;
      }
      case CUSTOMER_PACKAGE_CANCELLED_EVENT_TYPE: {
        const { customerPackage } =
          envelope.payload as CustomerPackageCancelledPayload;
        if (resolveCustomerPackageStatus(customerPackage) !== "cancelled") {
          return;
        }
        await this.cancelPackageJobs(customerPackage._id);
        await this.sendPackageEmail(appData, customerPackage, "cancelled");
        break;
      }
      case CUSTOMER_PACKAGE_EXPIRED_EVENT_TYPE: {
        const { customerPackage } =
          envelope.payload as CustomerPackageExpiredPayload;
        if (resolveCustomerPackageStatus(customerPackage) !== "expired") {
          return;
        }
        await this.cancelExpiringSoonJob(customerPackage._id);
        await this.sendPackageEmail(appData, customerPackage, "expired");
        break;
      }
      case CUSTOMER_PACKAGE_ADJUSTED_EVENT_TYPE: {
        const { customerPackage, request } =
          envelope.payload as CustomerPackageAdjustedPayload;
        await this.onAdjusted(appData, customerPackage, request);
        break;
      }
      default:
        break;
    }
  }

  public async processJob(
    appData: ConnectedAppData,
    jobData: JobRequest,
  ): Promise<void> {
    const logger = this.loggerFactory("processJob");
    const payload = (
      jobData as AppJobRequest<CustomerPackageEmailNotificationJobPayload>
    ).payload;

    switch (payload?.type) {
      case "expire-customer-package":
        await this.props.services.packagesService.expireIfDue(
          payload.customerPackageId,
          systemEventSource,
        );
        return;
      case "expiring-soon-customer-package":
        await this.sendExpiringSoonIfDue(appData, payload.customerPackageId);
        return;
      case "reschedule-expiring-soon":
        await this.rescheduleAllExpiringSoonJobs(appData);
        return;
      default:
        logger.warn({ payload }, "Unsupported job payload");
    }
  }

  private async onAdjusted(
    appData: ConnectedAppData,
    customerPackage: CustomerPackage,
    request: PackageAdjustRequest,
  ): Promise<void> {
    if (request.cancel) {
      await this.cancelPackageJobs(customerPackage._id);
      return;
    }
    if (request.reactivate) {
      await this.schedulePackageJobs(appData, customerPackage);
      return;
    }
    if (request.expiresAt !== undefined) {
      await this.schedulePackageJobs(appData, customerPackage);
    }
    if (resolveCustomerPackageStatus(customerPackage) === "exhausted") {
      await this.cancelPackageJobs(customerPackage._id);
    } else if (request.delta !== undefined) {
      // Credits changed while still active — keep expire job, refresh reminder.
      await this.scheduleExpiringSoonJob(appData, customerPackage);
    }
  }

  private getExpireJobKey(customerPackageId: string) {
    return `customer-package-expire-${customerPackageId}`;
  }

  private getExpiringSoonJobKey(customerPackageId: string) {
    return `customer-package-expiring-soon-${customerPackageId}`;
  }

  private async cancelExpireJob(customerPackageId: string): Promise<void> {
    await this.props.services.jobService.cancelJob(
      this.getExpireJobKey(customerPackageId),
    );
  }

  private async cancelExpiringSoonJob(
    customerPackageId: string,
  ): Promise<void> {
    await this.props.services.jobService.cancelJob(
      this.getExpiringSoonJobKey(customerPackageId),
    );
  }

  private async cancelPackageJobs(customerPackageId: string): Promise<void> {
    await this.cancelExpireJob(customerPackageId);
    await this.cancelExpiringSoonJob(customerPackageId);
  }

  private async schedulePackageJobs(
    appData: ConnectedAppData,
    customerPackage: CustomerPackage,
  ): Promise<void> {
    await this.scheduleExpireJob(appData, customerPackage);
    await this.scheduleExpiringSoonJob(appData, customerPackage);
  }

  private async scheduleExpireJob(
    appData: ConnectedAppData,
    customerPackage: CustomerPackage,
  ): Promise<void> {
    const logger = this.loggerFactory("scheduleExpireJob");
    await this.cancelExpireJob(customerPackage._id);

    if (!customerPackage.expiresAt) return;
    if (resolveCustomerPackageStatus(customerPackage) !== "active") return;

    const executeAt = DateTime.fromJSDate(customerPackage.expiresAt);
    if (executeAt < DateTime.now()) {
      logger.debug(
        { customerPackageId: customerPackage._id },
        "Expire time already passed, skipping schedule",
      );
      return;
    }

    await this.props.services.jobService.scheduleJob({
      type: "app",
      id: this.getExpireJobKey(customerPackage._id),
      executeAt: executeAt.toJSDate(),
      appId: appData._id,
      payload: {
        type: "expire-customer-package",
        customerPackageId: customerPackage._id,
      } satisfies CustomerPackageEmailNotificationJobPayload,
    });
  }

  private getExpiringSoonConfig(
    appData: ConnectedAppData,
  ): CustomerPackageEmailNotificationConfiguration["expiringSoon"] | null {
    const data = appData.data as
      | CustomerPackageEmailNotificationConfiguration
      | undefined;
    return data?.expiringSoon ?? null;
  }

  private async scheduleExpiringSoonJob(
    appData: ConnectedAppData,
    customerPackage: CustomerPackage,
  ): Promise<void> {
    const logger = this.loggerFactory("scheduleExpiringSoonJob");
    await this.cancelExpiringSoonJob(customerPackage._id);

    const expiringSoon = this.getExpiringSoonConfig(appData);
    if (!expiringSoon?.enabled || !expiringSoon.thresholdMinutes) return;
    if (!customerPackage.expiresAt) return;
    if (resolveCustomerPackageStatus(customerPackage) !== "active") return;
    if (customerPackage.remainingCredits <= 0) return;

    const executeAt = DateTime.fromJSDate(customerPackage.expiresAt).minus({
      minutes: expiringSoon.thresholdMinutes,
    });
    if (executeAt < DateTime.now()) {
      logger.debug(
        { customerPackageId: customerPackage._id },
        "Expiring-soon time already passed, skipping schedule",
      );
      return;
    }

    await this.props.services.jobService.scheduleJob({
      type: "app",
      id: this.getExpiringSoonJobKey(customerPackage._id),
      executeAt: executeAt.toJSDate(),
      appId: appData._id,
      payload: {
        type: "expiring-soon-customer-package",
        customerPackageId: customerPackage._id,
      } satisfies CustomerPackageEmailNotificationJobPayload,
    });
  }

  private async rescheduleAllExpiringSoonJobs(
    appData: ConnectedAppData,
  ): Promise<void> {
    const logger = this.loggerFactory("rescheduleAllExpiringSoonJobs");
    const expiringSoon = this.getExpiringSoonConfig(appData);
    const pageSize = 100;
    let offset = 0;

    for (;;) {
      const { items, total } =
        await this.props.services.packagesService.getCustomerPackages({
          status: ["active"],
          limit: pageSize,
          offset,
        });

      for (const customerPackage of items) {
        if (!expiringSoon?.enabled) {
          await this.cancelExpiringSoonJob(customerPackage._id);
          continue;
        }
        await this.scheduleExpiringSoonJob(appData, customerPackage);
      }

      offset += pageSize;
      if (offset >= total || items.length === 0) break;
    }

    logger.info(
      { appId: appData._id, enabled: !!expiringSoon?.enabled },
      "Rescheduled expiring-soon jobs",
    );
  }

  private async sendExpiringSoonIfDue(
    appData: ConnectedAppData,
    customerPackageId: string,
  ): Promise<void> {
    const logger = this.loggerFactory("sendExpiringSoonIfDue");
    const expiringSoon = this.getExpiringSoonConfig(appData);
    if (!expiringSoon?.enabled) {
      logger.debug({ customerPackageId }, "Expiring soon emails disabled");
      return;
    }

    const customerPackage =
      await this.props.services.packagesService.getCustomerPackage(
        customerPackageId,
      );
    if (!customerPackage) {
      logger.warn({ customerPackageId }, "Customer package not found");
      return;
    }

    if (resolveCustomerPackageStatus(customerPackage) !== "active") {
      logger.debug(
        { customerPackageId, status: customerPackage.status },
        "Package is not active, skipping expiring soon email",
      );
      return;
    }
    if (customerPackage.remainingCredits <= 0) {
      logger.debug(
        { customerPackageId },
        "Package has no credits left, skipping expiring soon email",
      );
      return;
    }
    if (!customerPackage.expiresAt) {
      logger.debug(
        { customerPackageId },
        "Package has no expiry, skipping expiring soon email",
      );
      return;
    }

    await this.sendPackageEmail(appData, customerPackage, "expiringSoon");
  }

  private async sendPackageEmail(
    appData: ConnectedAppData,
    customerPackage: CustomerPackage,
    kind: CustomerPackageEmailTemplateKeys,
  ): Promise<void> {
    const logger = this.loggerFactory("sendPackageEmail");
    try {
      const config =
        await this.props.services.configurationService.getConfigurations(
          "booking",
          "general",
          "brand",
          "social",
        );
      const organization =
        await this.props.services.organizationService.getOrganization();
      if (!organization) return;

      const customer = await this.props.services.customersService.getCustomer(
        customerPackage.customerId,
      );
      if (!customer?.email) {
        logger.warn(
          { customerPackageId: customerPackage._id },
          "Customer has no email, skipping package email",
        );
        return;
      }

      const data =
        appData.data as CustomerPackageEmailNotificationConfiguration;
      const templateId =
        kind === "expiringSoon"
          ? data?.expiringSoon?.templateId
          : data?.templates?.[kind]?.templateId;
      if (!templateId) {
        logger.warn({ kind }, "No template configured for package email");
        return;
      }

      const template =
        await this.props.services.templatesService.getTemplate(templateId);
      if (!template || template.type !== "email") return;

      const args = getArguments({
        config,
        adminUrl: getAdminUrl(),
        websiteUrl: getWebsiteUrl(organization),
        customer,
        locale: config.brand.language,
        additionalProperties: {
          package: {
            ...customerPackage,
            isPurchased: kind === "purchased",
            isExhausted: kind === "exhausted",
            isCancelled: kind === "cancelled",
            isExpired: kind === "expired",
            isExpiringSoon: kind === "expiringSoon",
          },
          customer,
        },
      });

      const renderedTemplate = await renderToStaticMarkup({
        args,
        document: template.value,
      });

      await this.props.services.notificationService.sendEmail({
        email: {
          to: customer.email,
          subject: templateSafeWithError(template.subject, args),
          body: renderedTemplate,
        },
        handledBy:
          `app_customer-package-email-notification_admin.handlers.${kind}` satisfies CustomerPackageEmailNotificationAdminAllKeys,
        participantType: "customer",
      });
    } catch (error) {
      logger.error({ error, kind }, "Failed to send package email");
      this.props.update({
        status: "failed",
        statusText:
          "app_customer-package-email-notification_admin.statusText.error_sending_package_email",
      });
      throw error;
    }
  }
}
