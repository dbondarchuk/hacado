import { renderToStaticMarkup } from "@hacado/email-builder/static";
import { AllKeys } from "@hacado/i18n";
import { LoggerFactory, getLoggerFactory } from "@hacado/logger";
import {
  APPOINTMENT_RESCHEDULED_EVENT_TYPE,
  APPOINTMENT_SLOT_RESCHEDULED_EVENT_TYPE,
  APPOINTMENT_STATUS_CHANGED_EVENT_TYPE,
  AppJobRequest,
  BookingConfiguration,
  BrandConfiguration,
  ConnectedAppData,
  ConnectedAppRequestError,
  ConnectedAppStatusWithText,
  ConnectedAppUninstallResult,
  DemoArguments,
  EventEnvelope,
  GeneralConfiguration,
  ICommunicationTemplatesProvider,
  IConnectedApp,
  IConnectedAppProps,
  IDemoArgumentsProvider,
  IEventSubscriber,
  IScheduled,
  ITextMessageResponder,
  MEMBER_PROFILE_UPDATED_EVENT_TYPE,
  RespondResult,
  SCHEDULE_CHANGED_EVENT_TYPE,
  SocialConfiguration,
  TemplateTemplatesList,
  TextMessageReply,
  systemEventSource,
  type AppointmentRescheduledPayload,
  type AppointmentSlotRescheduledPayload,
  type AppointmentStatusChangedPayload,
  type MemberProfileUpdatedPayload,
  type ScheduleChangedPayload,
} from "@hacado/types";
import {
  getAdminUrl,
  getArguments,
  getWebsiteUrl,
  templateSafeWithError,
} from "@hacado/utils";
import { DateTime } from "luxon";
import { ObjectId } from "mongodb";
import { demoWaitlistEntry } from "../waitlist/demo-arguments";
import {
  WAITLIST_ENTRY_CREATED_EVENT_TYPE,
  WaitlistEntryCreatedEvent,
} from "../waitlist/models/events";
import { WaitlistEntry } from "../waitlist/models/waitlist";
import { verifyWaitlistOfferToken } from "../waitlist/waitlist-offer-token";
import { CustomerWaitlistNotificationsJobProcessor } from "./job-processor";
import {
  CustomerWaitlistNotificationsConfiguration,
  CustomerWaitlistNotificationsJobPayload,
  customerWaitlistNotificationsConfigurationSchema,
} from "./models";
import { matchesSmsRemoveKeyword } from "./slot-match";
import { CustomerWaitlistNotificationsTemplates } from "./templates";
import {
  CustomerWaitlistNotificationsAdminKeys,
  CustomerWaitlistNotificationsAdminNamespace,
} from "./translations/types";
import { getWaitlistEntryArgs, loadSlotTimeOfDayArgs } from "./waitlist-args";

const DEFAULT_COOLDOWN_MINUTES = 180;
const DEFAULT_EXCLUSIVE_ACCESS_MINUTES = 15;
const DEFAULT_SMS_REMOVE_KEYWORD = "REMOVE";

const INSTALL_ASSIGN_TEMPLATE_FIELDS = {
  customerNewEntryTemplateId: "waitlist-entry-created-email",
  slotOpenedEmailTemplateId: "waitlist-slot-opened-email",
} as const;

const INSTALL_CREATE_ONLY_TEMPLATES = [
  "waitlist-slot-opened-text-message",
  "waitlist-leave-confirm-text-message",
] as const;

export class CustomerWaitlistNotificationsConnectedApp
  implements
    IConnectedApp,
    IEventSubscriber,
    IScheduled,
    ICommunicationTemplatesProvider,
    IDemoArgumentsProvider,
    ITextMessageResponder
{
  protected readonly loggerFactory: LoggerFactory;
  protected readonly jobProcessor: CustomerWaitlistNotificationsJobProcessor;

  public constructor(protected readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "CustomerWaitlistNotificationsConnectedApp",
      props.organizationId,
    );

    this.jobProcessor = new CustomerWaitlistNotificationsJobProcessor(props);
  }

  public async onEvent(
    appData: ConnectedAppData,
    envelope: EventEnvelope,
  ): Promise<void> {
    const logger = this.loggerFactory("onEvent");
    logger.debug({ appId: appData._id, envelope }, "Processing event");

    await this.ensureSlotOpenedDefaults(appData);
    switch (envelope.type) {
      case WAITLIST_ENTRY_CREATED_EVENT_TYPE: {
        logger.debug(
          { appId: appData._id, envelope },
          "Waitlist entry created, handling waitlist entry created event",
        );

        const { entry } =
          envelope.payload as WaitlistEntryCreatedEvent["payload"];

        await this.handleWaitlistEntryCreated(appData, entry);
        logger.debug(
          { appId: appData._id, envelope },
          "Handled waitlist entry created event",
        );

        return;
      }

      case APPOINTMENT_STATUS_CHANGED_EVENT_TYPE: {
        logger.debug(
          { appId: appData._id, envelope },
          "Appointment status changed, handling appointment status changed event",
        );

        await this.jobProcessor.onAppointmentStatusChanged(
          appData,
          envelope.payload as AppointmentStatusChangedPayload,
        );

        logger.debug(
          { appId: appData._id, envelope },
          "Handled appointment status changed event",
        );

        return;
      }

      case APPOINTMENT_SLOT_RESCHEDULED_EVENT_TYPE: {
        logger.debug(
          { appId: appData._id, envelope },
          "Appointment slot rescheduled, handling appointment slot rescheduled event",
        );

        await this.jobProcessor.onAppointmentSlotRescheduled(
          appData,
          envelope.payload as AppointmentSlotRescheduledPayload,
        );

        logger.debug(
          { appId: appData._id, envelope },
          "Handled appointment slot rescheduled event",
        );

        return;
      }

      case APPOINTMENT_RESCHEDULED_EVENT_TYPE: {
        logger.debug(
          { appId: appData._id, envelope },
          "Appointment rescheduled, handling appointment rescheduled event",
        );

        await this.jobProcessor.onAppointmentRescheduled(
          appData,
          envelope.payload as AppointmentRescheduledPayload,
        );

        logger.debug(
          { appId: appData._id, envelope },
          "Handled appointment rescheduled event",
        );

        return;
      }

      case SCHEDULE_CHANGED_EVENT_TYPE: {
        logger.debug(
          { appId: appData._id, envelope },
          "Schedule changed, handling schedule changed event",
        );

        await this.jobProcessor.onScheduleChanged(
          appData,
          envelope.payload as ScheduleChangedPayload,
        );

        logger.debug(
          { appId: appData._id, envelope },
          "Handled schedule changed event",
        );

        return;
      }

      case MEMBER_PROFILE_UPDATED_EVENT_TYPE: {
        logger.debug(
          { appId: appData._id, envelope },
          "Member profile updated, handling member profile updated event",
        );

        await this.jobProcessor.onMemberProfileUpdated(
          appData,
          envelope.payload as MemberProfileUpdatedPayload,
        );

        logger.debug(
          { appId: appData._id, envelope },
          "Handled member profile updated event",
        );

        return;
      }

      default: {
        logger.debug(
          { appId: appData._id, envelope },
          "Unknown event type, skipping",
        );

        return;
      }
    }
  }

  public async processJob(
    appData: ConnectedAppData,
    jobData: AppJobRequest<CustomerWaitlistNotificationsJobPayload>,
  ): Promise<void> {
    const logger = this.loggerFactory("processJob");
    logger.debug(
      { appId: appData._id, jobData },
      "Processing customer waitlist notifications job",
    );

    await this.jobProcessor.processJob(appData, jobData);

    logger.debug(
      { appId: appData._id, jobData },
      "Processed customer waitlist notifications job",
    );
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
      await this.props.update({
        data,
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

  public async processAppCall(
    appData: ConnectedAppData,
    slug: string[],
    request: Request,
  ): Promise<Response> {
    const logger = this.loggerFactory("processAppCall");
    logger.debug(
      { appId: appData._id, slug, request },
      "Processing customer waitlist notifications app call",
    );

    const action = slug.join("/");
    if (request.method === "GET" && action === "leave-waitlist") {
      logger.debug(
        { appId: appData._id, slug, request },
        "Handling leave waitlist request",
      );
      return this.handleLeaveWaitlist(appData, request);
    }

    logger.debug(
      { appId: appData._id, slug, request },
      "Unknown request, returning 404",
    );

    return Response.json(
      { success: false, error: "Unknown request" },
      { status: 404 },
    );
  }

  public async respond(
    appData: ConnectedAppData,
    reply: TextMessageReply,
  ): Promise<RespondResult | null> {
    const logger = this.loggerFactory("respond");
    logger.debug(
      { appId: appData._id, reply },
      "Processing text message reply",
    );

    const config = appData.data as CustomerWaitlistNotificationsConfiguration;
    const keyword = config?.smsRemoveKeyword;
    if (!keyword || !matchesSmsRemoveKeyword(reply.message, keyword)) {
      logger.debug(
        { appId: appData._id, reply, keyword },
        "Keyword does not match, returning null",
      );

      return null;
    }

    const entryId = reply.data?.data;
    if (!entryId) {
      logger.debug(
        { appId: appData._id, reply, entryId },
        "No entry ID found, returning null",
      );

      return null;
    }

    const repo = await this.jobProcessor.getWaitlistRepository();
    if (!repo) {
      logger.debug(
        { appId: appData._id, reply, entryId },
        "No repository found, returning null",
      );

      return null;
    }

    const entry = await repo.getWaitlistEntry(entryId);
    if (!entry || entry.status !== "active") {
      logger.debug(
        { appId: appData._id, reply, entryId, entry },
        "Entry not found or not active, returning null",
      );

      return null;
    }

    logger.debug(
      { appId: appData._id, reply, entryId, entry },
      "Dismissing waitlist entry",
    );

    await repo.dismissWaitlistEntry(entry._id, { actor: "customer" });
    await this.jobProcessor.sendLeaveConfirmSms(appData, config, entry);

    logger.debug(
      { appId: appData._id, reply, entryId, entry },
      "Sent leave confirm SMS, returning result",
    );

    return {
      handledBy:
        "app_customer-waitlist-notifications_admin.handlers.leaveWaitlist" satisfies AllKeys<
          CustomerWaitlistNotificationsAdminNamespace,
          CustomerWaitlistNotificationsAdminKeys
        >,
      participantType: "customer",
    };
  }

  public async getCommunicationTemplates(): Promise<TemplateTemplatesList> {
    return CustomerWaitlistNotificationsTemplates;
  }

  public async getDemoEmailArguments(
    appData: ConnectedAppData,
  ): Promise<DemoArguments> {
    const organization =
      await this.props.services.organizationService.getOrganization();
    const websiteUrl = organization
      ? getWebsiteUrl(organization)
      : "https://example.com";
    const config = appData.data as CustomerWaitlistNotificationsConfiguration;
    const { language, timeZone } =
      await this.props.services.configurationService
        .getConfigurations("brand", "general")
        .then((c) => ({
          language: c.brand.language,
          timeZone: c.general.timeZone,
        }));
    const slotDateTime = DateTime.now()
      .plus({ days: 7 })
      .set({ hour: 14, minute: 0, second: 0, millisecond: 0 })
      .toJSDate();
    const { bookingUrl, leaveWaitlistUrl } =
      await this.jobProcessor.buildCustomerUrls(
        appData,
        config,
        websiteUrl,
        new ObjectId().toString(),
        slotDateTime,
      );

    return {
      waitlistEntry: demoWaitlistEntry,
      bookingUrl,
      leaveWaitlistUrl,
      slotDateTime,
      dateTime: slotDateTime,
      smsRemoveKeyword: config.smsRemoveKeyword || DEFAULT_SMS_REMOVE_KEYWORD,
      hasOtherTimes: true,
      ...(await loadSlotTimeOfDayArgs(slotDateTime, timeZone, language)),
    };
  }

  public async install(appData: ConnectedAppData): Promise<void> {
    const logger = this.loggerFactory("install");
    logger.debug(
      { appId: appData._id },
      "Installing customer waitlist notifications app",
    );

    await this.ensureSlotOpenedDefaults(appData, { forceEnable: true });
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

  private async handleLeaveWaitlist(
    appData: ConnectedAppData,
    request: Request,
  ): Promise<Response> {
    const logger = this.loggerFactory("handleLeaveWaitlist");
    logger.debug(
      { appId: appData._id, request },
      "Handling leave waitlist request",
    );

    const config = appData.data as CustomerWaitlistNotificationsConfiguration;
    const token = new URL(request.url).searchParams.get("w");
    const decoded = token ? verifyWaitlistOfferToken(token) : null;
    let slug = "";
    if (config.bookingPageId) {
      const page = await this.props.services.pagesService.getPage(
        config.bookingPageId,
      );

      slug = page?.slug ?? "";

      logger.debug(
        { appId: appData._id, request, slug },
        "Booking page slug found",
      );
    } else {
      logger.debug(
        { appId: appData._id, request },
        "No booking page slug found",
      );
    }

    const organization =
      await this.props.services.organizationService.getOrganization();
    const websiteUrl = organization ? getWebsiteUrl(organization) : "";
    const redirectBase = slug ? `/${slug}` : "/";
    const redirectUrl = `${websiteUrl}${redirectBase}?toast=${encodeURIComponent(
      "app_customer-waitlist-notifications_public.toast.removed",
    )}`;

    logger.debug(
      { appId: appData._id, request, redirectUrl },
      "Redirect URL found",
    );

    if (!decoded) {
      logger.debug(
        { appId: appData._id, request, redirectUrl },
        "No decoded token found, redirecting to redirect URL",
      );

      return Response.redirect(redirectUrl, 302);
    }

    const repo = await this.jobProcessor.getWaitlistRepository();
    const entry = repo ? await repo.getWaitlistEntry(decoded.entryId) : null;
    if (entry?.status === "active") {
      logger.debug(
        {
          appId: appData._id,
          request,
          redirectUrl,
          entryId: decoded.entryId,
          entry,
        },
        "Entry found and active, dismissing entry",
      );

      await repo!.dismissWaitlistEntry(entry._id, { actor: "customer" });

      logger.debug(
        {
          appId: appData._id,
          request,
          redirectUrl,
          entryId: decoded.entryId,
          entry,
        },
        "Dismissed entry, redirecting to redirect URL",
      );
    }

    logger.debug(
      { appId: appData._id, request, redirectUrl },
      "Redirecting to redirect URL",
    );

    return Response.redirect(redirectUrl, 302);
  }

  private async ensureSlotOpenedDefaults(
    appData: ConnectedAppData,
    options?: { forceEnable?: boolean },
  ): Promise<void> {
    const logger = this.loggerFactory("ensureSlotOpenedDefaults");
    logger.debug(
      { appId: appData._id, options },
      "Ensuring slot opened defaults",
    );

    const current =
      (appData.data as CustomerWaitlistNotificationsConfiguration) ?? {};
    if (
      !options?.forceEnable &&
      current.cooldownMinutes != null &&
      current.exclusiveAccessMinutes != null
    ) {
      logger.debug(
        { appId: appData._id, options },
        "Slot opened defaults already set, skipping",
      );

      return;
    }

    const { configurationService, pagesService } = this.props.services;
    const { language } = await configurationService.getConfiguration("brand");

    const createdTemplateIds: Partial<
      Record<keyof typeof INSTALL_ASSIGN_TEMPLATE_FIELDS, string>
    > = {};
    for (const [field, builtinId] of Object.entries(
      INSTALL_ASSIGN_TEMPLATE_FIELDS,
    ) as [
      keyof typeof INSTALL_ASSIGN_TEMPLATE_FIELDS,
      (typeof INSTALL_ASSIGN_TEMPLATE_FIELDS)[keyof typeof INSTALL_ASSIGN_TEMPLATE_FIELDS],
    ][]) {
      logger.debug(
        { appId: appData._id, options, field, builtinId },
        "Creating template from builtin",
      );

      if (current[field]) {
        logger.debug(
          { appId: appData._id, options, field, builtinId },
          "Template already exists, skipping",
        );

        continue;
      }

      const createdId = await this.createTemplateFromBuiltin(
        builtinId,
        language,
      );

      logger.debug(
        { appId: appData._id, options, field, builtinId, createdId },
        "Template created",
      );

      if (createdId) {
        createdTemplateIds[field] = createdId;
      }
    }

    for (const builtinId of INSTALL_CREATE_ONLY_TEMPLATES) {
      logger.debug(
        { appId: appData._id, options, builtinId },
        "Creating template from builtin",
      );

      await this.createTemplateFromBuiltin(builtinId, language, {
        skipIfNameExists: true,
      });

      logger.debug(
        { appId: appData._id, options, builtinId },
        "Template created",
      );
    }

    let bookingPageId = current.bookingPageId;
    if (!bookingPageId) {
      logger.debug(
        { appId: appData._id, options },
        "No booking page ID found, getting book page",
      );

      const bookPage = await pagesService.getPageBySlug("book");
      bookingPageId = bookPage?._id;

      logger.debug(
        { appId: appData._id, options, bookingPageId },
        bookPage ? "Book page found" : "No book page found, skipping",
      );
    }

    const next: CustomerWaitlistNotificationsConfiguration = {
      ...current,
      ...createdTemplateIds,
      notifyOnSlotOpened: current.notifyOnSlotOpened ?? true,
      bookingPageId,
      cooldownMinutes: current.cooldownMinutes ?? DEFAULT_COOLDOWN_MINUTES,
      exclusiveAccessMinutes:
        current.exclusiveAccessMinutes ?? DEFAULT_EXCLUSIVE_ACCESS_MINUTES,
      smsRemoveKeyword: current.smsRemoveKeyword ?? DEFAULT_SMS_REMOVE_KEYWORD,
    };

    logger.debug({ appId: appData._id, options, next }, "Updating app data");

    appData.data = next;
    await this.props.update({
      data: next,
      ...(options?.forceEnable
        ? {
            status: "connected" as const,
            statusText:
              "app_customer-waitlist-notifications_admin.statusText.successfully_set_up" as const,
          }
        : {}),
    });

    logger.debug({ appId: appData._id, options, next }, "Updated app data");
  }

  private async createTemplateFromBuiltin(
    builtinId: keyof typeof CustomerWaitlistNotificationsTemplates,
    language: string,
    options?: { skipIfNameExists?: boolean },
  ): Promise<string | undefined> {
    const logger = this.loggerFactory("createTemplateFromBuiltin");
    logger.debug(
      { builtinId, language, options },
      "Creating template from builtin",
    );

    const templatesByLang = CustomerWaitlistNotificationsTemplates[builtinId];
    const source = templatesByLang[language] ?? templatesByLang.en;
    if (!source) {
      logger.debug(
        { builtinId, language, options },
        "No source template found, returning undefined",
      );

      return undefined;
    }

    const { templatesService } = this.props.services;
    if (
      options?.skipIfNameExists &&
      !(await templatesService.checkUniqueName(source.name))
    ) {
      logger.debug(
        { builtinId, language, options },
        "Template name already exists, skipping",
      );

      return undefined;
    }

    let uniqueName: string | null = null;
    for (let i = 0; i < 10; i++) {
      const candidate = i === 0 ? source.name : `${source.name} (${i + 1})`;
      if (await templatesService.checkUniqueName(candidate)) {
        uniqueName = candidate;
        break;
      }
    }

    if (!uniqueName) {
      logger.debug(
        { builtinId, language, options },
        "No unique name found, returning undefined",
      );

      return undefined;
    }

    const created = await templatesService.createTemplate(
      { ...source, name: uniqueName },
      systemEventSource,
    );

    logger.debug(
      { builtinId, language, options, uniqueName, createdId: created._id },
      "Template created",
    );

    return created._id;
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
