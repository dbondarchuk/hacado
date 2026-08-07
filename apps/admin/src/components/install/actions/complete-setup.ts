"use server";

import {
  APPOINTMENT_NOTIFICATIONS_APP_NAME,
  AvailableApps,
  BLOG_APP_NAME,
  CALENDAR_WRITER_APP_NAME,
  canInstallApp,
  CUSTOMER_EMAIL_NOTIFICATION_APP_NAME,
  CUSTOMER_TEXT_MESSAGE_NOTIFICATION_APP_NAME,
  EMAIL_NOTIFICATION_APP_NAME,
  FORMS_APP_NAME,
  GIFT_CARD_STUDIO_APP_NAME,
  MY_CABINET_APP_NAME,
  WAITLIST_APP_NAME,
  WAITLIST_NOTIFICATIONS_APP_NAME,
} from "@hacado/app-store";
import { AppointmentNotificationsTemplates } from "@hacado/app-store/exports";
import { languages } from "@hacado/i18n";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { ServicesContainer } from "@hacado/services";
import { resolvePlanTierFromOrganization } from "@hacado/services/billing";
import type { ApiRequest, SessionUser } from "@hacado/types";
import {
  BillingPlanTier,
  bookingConfigurationSchema,
  systemEventSource,
  type PaymentsConfiguration,
  type TemplateUpdateModel,
} from "@hacado/types";
import { BuiltInTemplateTemplates } from "../../admin/templates/templates";
import {
  getDefaultBookingConfiguration,
  getInstallEnabledCancellationsAndReschedules,
} from "../default-booking";
import { getDefaultScheduleConfiguration } from "../default-schedule";
import {
  createInstallDefaultPages,
  upsertInstallMyCabinetDefaultPage,
} from "./create-default-pages";

type InstallPreferences = {
  allowCancelReschedule: boolean;
  autoConfirmBookings: boolean;
  acceptPayments: boolean;
  depositEnabled: boolean;
  depositPercent: string;
  inviteMode: "none" | "email" | "calendar_writer";
  inviteCalendarWriterAppId?: string;
  optCustomerEmailNotifications: boolean;
  optCustomerTextMessageNotifications: boolean;
  optAppointmentNotifications: boolean;
  optWaitlist: boolean;
  optWaitlistNotifications: boolean;
  optBlog: boolean;
  optForms: boolean;
  optGiftCardStudio: boolean;
  optMyCabinet: boolean;
};

function sanitizeInstallPreferencesForPlanTier(
  prefs: InstallPreferences,
  planTier: BillingPlanTier | null,
): InstallPreferences {
  if (planTier !== BillingPlanTier.Free) return prefs;
  return {
    ...prefs,
    acceptPayments: false,
    depositEnabled: false,
    optCustomerTextMessageNotifications: false,
    optWaitlist: false,
    optWaitlistNotifications: false,
    optBlog: false,
    optForms: false,
    optGiftCardStudio: false,
  };
}

function buildInstallPaymentsConfiguration(
  prefs: InstallPreferences,
): PaymentsConfiguration {
  if (!prefs.acceptPayments) {
    return { enabled: false };
  }
  if (prefs.depositEnabled) {
    let depositPercentage = Math.round(Number.parseFloat(prefs.depositPercent));
    if (!Number.isFinite(depositPercentage)) {
      depositPercentage = 25;
    }
    depositPercentage = Math.min(100, Math.max(10, depositPercentage));
    return {
      enabled: true,
      requireDeposit: true,
      depositPercentage,
    };
  }
  return {
    enabled: true,
    requireDeposit: false,
  };
}

async function ensureInstallBookingPaymentsDefaultAppsAndCancellations(
  services: ReturnType<typeof ServicesContainer>,
  prefs: InstallPreferences,
): Promise<{ ok: true } | { ok: false; code: string }> {
  const logger = getLoggerFactory("InstallActions")(
    "ensureInstallBookingPaymentsDefaultAppsAndCancellations",
  );

  const booking =
    (await services.configurationService.getConfiguration("booking")) ?? null;
  if (!booking || Object.keys(booking).length === 0) {
    logger.error({}, "Booking configuration missing for install payment prefs");
    return { ok: false, code: "no_booking" };
  }

  const payments = buildInstallPaymentsConfiguration(prefs);

  let paymentAppId: string | null = null;
  if (prefs.acceptPayments) {
    const paymentApp = (
      await services.connectedAppsService.getAppsByScope("payment")
    ).find((a) => a.status === "connected");
    if (!paymentApp) {
      logger.error(
        {},
        "Accept payments enabled but payment app is not connected",
      );
      return { ok: false, code: "payment_app_required" };
    }
    paymentAppId = paymentApp._id;
  }

  const cancellationsAndReschedules = prefs.allowCancelReschedule
    ? getInstallEnabledCancellationsAndReschedules()
    : getDefaultBookingConfiguration().cancellationsAndReschedules;

  const nextBooking = {
    ...booking,
    payments,
    autoConfirm: prefs.autoConfirmBookings,
    cancellationsAndReschedules,
  };

  const parsed = bookingConfigurationSchema.safeParse(nextBooking);
  if (!parsed.success) {
    logger.error(
      { error: parsed.error },
      "Booking configuration invalid after applying install payment prefs",
    );
    return { ok: false, code: "booking_config_invalid" };
  }

  await services.configurationService.setConfiguration(
    "booking",
    parsed.data,
    systemEventSource,
  );

  if (prefs.acceptPayments && paymentAppId) {
    const existing =
      (await services.configurationService.getConfiguration("defaultApps")) ??
      {};
    await services.configurationService.setConfiguration(
      "defaultApps",
      {
        ...existing,
        paymentAppId,
      },
      systemEventSource,
    );
    logger.debug({ paymentAppId }, "Set default payment app from install");
  }

  return { ok: true };
}

async function ensureInstalledApp(
  services: ReturnType<typeof ServicesContainer>,
  memberId: string,
  appName: string,
) {
  const logger = getLoggerFactory("InstallActions")("ensureInstalledApp");
  logger.debug({ appName }, "Ensuring app is installed");
  const existing = await services.connectedAppsService.getAppsByApp(appName);
  if (existing[0]) return existing[0];

  const appId = await services.connectedAppsService.createNewApp(
    appName,
    memberId,
  );
  await services.connectedAppsService.updateApp(appId, {
    status: "connected",
    statusText: "apps.common.statusText.installed",
  });
  logger.debug({ appName, appId }, "Installed app");
  return services.connectedAppsService.getApp(appId);
}

async function ensureTemplateByName(
  services: ReturnType<typeof ServicesContainer>,
  template: TemplateUpdateModel,
): Promise<string> {
  const logger = getLoggerFactory("InstallActions")("ensureTemplateByName");
  logger.debug(
    { name: template.name, type: template.type },
    "Ensuring template by name",
  );
  const existing = await services.templatesService.getTemplates({
    search: template.name,
    type: [template.type],
    limit: 50,
    offset: 0,
  });
  const exact = existing.items.find(
    (item) => item.name === template.name && item.type === template.type,
  );
  if (exact) {
    logger.debug(
      { templateId: exact._id, name: template.name },
      "Template already exists",
    );
    return exact._id;
  }
  const created = await services.templatesService.createTemplate(
    template,
    systemEventSource,
  );
  logger.debug(
    { templateId: created._id, name: template.name },
    "Template created",
  );
  return created._id;
}

async function ensureInstallCustomerOtpTemplates(
  services: ReturnType<typeof ServicesContainer>,
  language: (typeof languages)[number],
): Promise<void> {
  const logger = getLoggerFactory("InstallActions")(
    "ensureInstallCustomerOtpTemplates",
  );
  const templateSourceLang =
    language in (BuiltInTemplateTemplates["customer-otp-email"] ?? {})
      ? language
      : "en";

  const emailSource =
    BuiltInTemplateTemplates["customer-otp-email"]?.[templateSourceLang] ??
    BuiltInTemplateTemplates["customer-otp-email"]?.en;
  const textSource =
    BuiltInTemplateTemplates["customer-otp-text"]?.[templateSourceLang] ??
    BuiltInTemplateTemplates["customer-otp-text"]?.en;

  if (!emailSource || !textSource) {
    logger.warn("Customer OTP built-in templates not found");
    return;
  }

  const otpEmailTemplateId = await ensureTemplateByName(services, emailSource);
  const otpTextTemplateId = await ensureTemplateByName(services, textSource);

  await services.configurationService.setConfiguration(
    "customerAuth",
    {
      otpEmailTemplateId,
      otpTextTemplateId,
      allowPhoneOtp: false,
    },
    systemEventSource,
  );

  logger.info(
    { otpEmailTemplateId, otpTextTemplateId },
    "Configured customer auth OTP templates",
  );
}

async function ensureInstallCustomerNotificationTemplates(
  services: ReturnType<typeof ServicesContainer>,
  language: (typeof languages)[number],
  prefs: InstallPreferences,
  user: SessionUser,
): Promise<void> {
  const logger = getLoggerFactory("InstallActions")(
    "ensureInstallCustomerNotificationTemplates",
  );
  logger.debug(
    {
      language,
      optCustomerEmailNotifications: prefs.optCustomerEmailNotifications,
      optCustomerTextMessageNotifications:
        prefs.optCustomerTextMessageNotifications,
    },
    "Ensuring customer notification templates",
  );
  const templateSourceLang =
    language in (BuiltInTemplateTemplates["appointment-created-email"] ?? {})
      ? language
      : "en";

  if (prefs.optCustomerEmailNotifications) {
    const emailApp = (
      await services.connectedAppsService.getAppsByApp(
        CUSTOMER_EMAIL_NOTIFICATION_APP_NAME,
      )
    )[0];
    if (emailApp) {
      const map: Record<string, string> = {};
      const emailTemplateIds = [
        "appointment-created-email",
        "appointment-confirmed-email",
        "appointment-declined-email",
        "appointment-rescheduled-email",
      ] as const;

      for (const templateId of emailTemplateIds) {
        const source =
          BuiltInTemplateTemplates[templateId]?.[templateSourceLang] ??
          BuiltInTemplateTemplates[templateId]?.en;
        if (!source) continue;
        map[templateId] = await ensureTemplateByName(services, source);
      }

      if (
        map["appointment-created-email"] &&
        map["appointment-confirmed-email"] &&
        map["appointment-declined-email"] &&
        map["appointment-rescheduled-email"]
      ) {
        logger.debug(
          { appId: emailApp._id },
          "Configuring customer email notifications",
        );
        await services.connectedAppsService.processRequest(
          emailApp._id,
          {
            event: { templateId: map["appointment-confirmed-email"] },
            templates: {
              pending: { templateId: map["appointment-created-email"] },
              confirmed: { templateId: map["appointment-confirmed-email"] },
              declined: { templateId: map["appointment-declined-email"] },
              rescheduled: { templateId: map["appointment-rescheduled-email"] },
            },
          },
          null as unknown as ApiRequest,
          user,
        );
        logger.debug(
          { appId: emailApp._id },
          "Configured customer email notifications",
        );
      }
    }
  }

  if (prefs.optCustomerTextMessageNotifications) {
    const smsApp = (
      await services.connectedAppsService.getAppsByApp(
        CUSTOMER_TEXT_MESSAGE_NOTIFICATION_APP_NAME,
      )
    )[0];
    if (smsApp) {
      const map: Record<string, string> = {};
      const smsTemplateIds = [
        "appointment-created-text-message",
        "appointment-confirmed-text-message",
        "appointment-declined-text-message",
        "appointment-rescheduled-text-message",
      ] as const;

      for (const templateId of smsTemplateIds) {
        const source =
          BuiltInTemplateTemplates[templateId]?.[templateSourceLang] ??
          BuiltInTemplateTemplates[templateId]?.en;
        if (!source) continue;
        map[templateId] = await ensureTemplateByName(services, source);
      }

      if (
        map["appointment-created-text-message"] &&
        map["appointment-confirmed-text-message"] &&
        map["appointment-declined-text-message"] &&
        map["appointment-rescheduled-text-message"]
      ) {
        logger.debug(
          { appId: smsApp._id },
          "Configuring customer text notifications",
        );
        await services.connectedAppsService.processRequest(
          smsApp._id,
          {
            sendNewRequestNotifications: true,
            templates: {
              pending: { templateId: map["appointment-created-text-message"] },
              confirmed: {
                templateId: map["appointment-confirmed-text-message"],
              },
              declined: {
                templateId: map["appointment-declined-text-message"],
              },
              rescheduled: {
                templateId: map["appointment-rescheduled-text-message"],
              },
            },
          },
          null as unknown as ApiRequest,
          user,
        );
        logger.debug(
          { appId: smsApp._id },
          "Configured customer text notifications",
        );
      }
    }
  }
}

async function ensureInstallAppointmentNotificationDefaults(
  services: ReturnType<typeof ServicesContainer>,
  language: (typeof languages)[number],
  prefs: InstallPreferences,
  user: SessionUser,
): Promise<void> {
  const logger = getLoggerFactory("InstallActions")(
    "ensureInstallAppointmentNotificationDefaults",
  );
  logger.debug(
    {
      language,
      optAppointmentNotifications: prefs.optAppointmentNotifications,
    },
    "Ensuring appointment notification defaults",
  );

  if (!prefs.optAppointmentNotifications) {
    logger.debug("No appointment notifications enabled; skipping");
    return;
  }

  const app = (
    await services.connectedAppsService.getAppsByApp(
      APPOINTMENT_NOTIFICATIONS_APP_NAME,
    )
  )[0];

  if (!app) {
    logger.debug("No appointment notifications app found; skipping");
    return;
  }

  const templateSource =
    AppointmentNotificationsTemplates["appointment-reminder-email"]?.[
      language
    ] ?? AppointmentNotificationsTemplates["appointment-reminder-email"]?.en;
  if (!templateSource) return;

  const templateId = await ensureTemplateByName(services, templateSource);
  const t = await getI18nAsync({ locale: language, namespace: "install" });
  const defaultName = (t as unknown as (key: string) => string)(
    "wizard.finish.pageDefaults.appointmentNotifications.defaultReminderName",
  );

  const isUnique = (await services.connectedAppsService.processRequest(
    app._id,
    {
      type: "check-unique-name",
      name: defaultName,
    },
    null as unknown as ApiRequest,
    user,
  )) as boolean;
  if (!isUnique) return;

  logger.debug({ appId: app._id }, "Creating appointment notification default");
  await services.connectedAppsService.processRequest(
    app._id,
    {
      type: "create-appointment-notification",
      appointmentNotification: {
        name: defaultName,
        type: "timeBefore",
        weeks: 0,
        days: 1,
        hours: 0,
        minutes: 0,
        appointmentCount: { type: "none" },
        channel: "email",
        templateId,
      },
    },
    null as unknown as ApiRequest,
    user,
  );
  logger.debug(
    { appId: app._id, templateId, defaultName },
    "Created appointment notification default",
  );
}

async function ensureInstallUserCalendarSources(
  services: ReturnType<typeof ServicesContainer>,
  memberId: string,
): Promise<void> {
  const logger = getLoggerFactory("InstallActions")(
    "ensureInstallUserCalendarSources",
  );
  const apps =
    await services.connectedAppsService.getAppsByScope("calendar-read");
  const connectedCalendarApps = apps.filter((a) => a.status === "connected");
  if (!connectedCalendarApps.length) {
    logger.debug("No connected calendar apps; leaving member calendarSources");
    return;
  }

  const member = await services.teamService.getMemberById(memberId);
  if (!member) {
    logger.error({ memberId }, "Member missing; cannot set calendarSources");
    return;
  }

  const existingSources = member.calendarSources ?? [];
  const existingIds = new Set(existingSources.map((s) => s.appId));
  const toAdd = connectedCalendarApps
    .filter((a) => !existingIds.has(a._id))
    .map((a) => ({ appId: a._id }));

  if (!toAdd.length) {
    logger.debug("Connected calendar apps already listed in calendarSources");
    return;
  }

  await services.teamService.updateMemberProfile(
    memberId,
    {
      calendarSources: [...existingSources, ...toAdd],
    },
    systemEventSource,
  );
  logger.debug(
    { addedAppIds: toAdd.map((x) => x.appId) },
    "Merged connected calendar apps into member calendarSources",
  );
}

async function ensureDefaultInstallSchedule(
  services: ReturnType<typeof ServicesContainer>,
): Promise<void> {
  const logger = getLoggerFactory("InstallActions")(
    "ensureDefaultInstallSchedule",
  );
  const existing =
    (await services.configurationService.getConfiguration("schedule")) ?? null;
  const hasWorkingHours = existing?.schedule?.some(
    (day) => day.shifts?.length > 0,
  );

  if (hasWorkingHours) {
    logger.debug("Schedule already has working hours; skipping default");
    return;
  }

  await services.configurationService.setConfiguration(
    "schedule",
    getDefaultScheduleConfiguration(),
    systemEventSource,
  );
  logger.debug("Applied default schedule configuration");
}

async function ensureInstallDefaultScripts(
  services: ReturnType<typeof ServicesContainer>,
): Promise<void> {
  const logger = getLoggerFactory("InstallActions")(
    "ensureInstallDefaultScripts",
  );

  const existing =
    Object.keys(
      (await services.configurationService.getConfiguration("scripts")) ?? {},
    ).length > 0;

  if (existing) {
    logger.debug("Scripts already installed; skipping default");
    return;
  }

  await services.configurationService.setConfiguration(
    "scripts",
    {
      header: [],
      footer: [],
    },
    systemEventSource,
  );

  logger.debug("Applied default scripts configuration");
}

async function ensureInstallDefaultSocial(
  services: ReturnType<typeof ServicesContainer>,
): Promise<void> {
  const logger = getLoggerFactory("InstallActions")(
    "ensureInstallDefaultSocial",
  );

  const existing =
    Object.keys(
      (await services.configurationService.getConfiguration("social")) ?? {},
    ).length > 0;

  if (existing) {
    logger.debug("Social already installed; skipping default");
    return;
  }

  await services.configurationService.setConfiguration(
    "social",
    {
      links: [],
    },
    systemEventSource,
  );

  logger.debug("Applied default social configuration");
}

async function ensureInstallDefaultStyling(
  services: ReturnType<typeof ServicesContainer>,
): Promise<void> {
  const logger = getLoggerFactory("InstallActions")(
    "ensureInstallDefaultStyling",
  );

  const existing =
    Object.keys(
      (await services.configurationService.getConfiguration("styling")) ?? {},
    ).length > 0;

  if (existing) {
    logger.debug("Styling already installed; skipping default");
    return;
  }

  await services.configurationService.setConfiguration(
    "styling",
    {
      colors: [],
      fonts: {
        primary: "Montserrat",
        secondary: "Playfair Display",
        tertiary: "Roboto",
      },
      css: [],
    },
    systemEventSource,
  );

  logger.debug("Applied default styling configuration");
}

async function ensureInstallDefaultApps(
  services: ReturnType<typeof ServicesContainer>,
): Promise<void> {
  const logger = getLoggerFactory("InstallActions")("ensureInstallDefaultApps");
  const existing =
    Object.keys(
      (await services.configurationService.getConfiguration("defaultApps")) ??
        {},
    ).length > 0;

  if (existing) {
    logger.debug("Default apps already installed; skipping default");
    return;
  }

  await services.configurationService.setConfiguration(
    "defaultApps",
    {
      paymentAppId: undefined,
      emailSenderAppId: undefined,
      textMessageSenderAppId: undefined,
      textMessageResponderAppId: undefined,
    },
    systemEventSource,
  );

  logger.debug("Applied default apps configuration");
}

async function ensureInstallDefaultConfigurations(
  services: ReturnType<typeof ServicesContainer>,
): Promise<void> {
  const logger = getLoggerFactory("InstallActions")(
    "ensureInstallDefaultConfigurations",
  );
  await ensureInstallDefaultScripts(services);
  await ensureInstallDefaultSocial(services);
  await ensureInstallDefaultStyling(services);
  await ensureInstallDefaultApps(services);
  logger.debug("Applied default configurations");
}

export async function runCompleteInstallSetupSteps(args: {
  services: ReturnType<typeof ServicesContainer>;
  user: SessionUser;
  prefs: InstallPreferences;
  language: (typeof languages)[number];
  businessName: string;
  hasAddress: boolean;
}): Promise<{ ok: true } | { ok: false; code: string }> {
  const logger = getLoggerFactory("InstallActions")(
    "runCompleteInstallSetupSteps",
  );
  const {
    services,
    user,
    prefs: rawPrefs,
    language,
    businessName,
    hasAddress,
  } = args;
  const memberId = user.memberId;

  const org = await services.organizationService.getOrganization();
  const planTier = resolvePlanTierFromOrganization(org);
  const prefs = sanitizeInstallPreferencesForPlanTier(rawPrefs, planTier);

  logger.debug(
    { language, businessName, planTier },
    "Running complete install setup steps",
  );

  logger.debug({ language, businessName }, "Creating install default pages");
  const layout = await createInstallDefaultPages({
    services,
    language,
    businessName,
    hasAddress,
    isCancelRescheduleEnabled: prefs.allowCancelReschedule,
    isBlogEnabled: prefs.optBlog,
    isMyCabinetEnabled: prefs.optMyCabinet,
  });

  const installSet = new Set<string>();
  if (prefs.optCustomerEmailNotifications) {
    logger.debug(
      { appName: CUSTOMER_EMAIL_NOTIFICATION_APP_NAME },
      "Adding customer email notification app",
    );
    installSet.add(CUSTOMER_EMAIL_NOTIFICATION_APP_NAME);
  }
  if (prefs.optCustomerTextMessageNotifications) {
    logger.debug(
      { appName: CUSTOMER_TEXT_MESSAGE_NOTIFICATION_APP_NAME },
      "Adding customer text message notification app",
    );
    installSet.add(CUSTOMER_TEXT_MESSAGE_NOTIFICATION_APP_NAME);
  }
  if (prefs.optAppointmentNotifications) {
    logger.debug(
      { appName: APPOINTMENT_NOTIFICATIONS_APP_NAME },
      "Adding appointment notifications app",
    );
    installSet.add(APPOINTMENT_NOTIFICATIONS_APP_NAME);
  }
  if (prefs.optWaitlist) {
    logger.debug({ appName: WAITLIST_APP_NAME }, "Adding waitlist app");
    installSet.add(WAITLIST_APP_NAME);
    if (prefs.optWaitlistNotifications) {
      logger.debug(
        { appName: WAITLIST_NOTIFICATIONS_APP_NAME },
        "Adding waitlist notifications app",
      );
      installSet.add(WAITLIST_NOTIFICATIONS_APP_NAME);
    }
  }
  if (prefs.optBlog) {
    logger.debug({ appName: BLOG_APP_NAME }, "Adding blog app");
    installSet.add(BLOG_APP_NAME);
  }
  if (prefs.optForms) {
    logger.debug({ appName: FORMS_APP_NAME }, "Adding forms app");
    installSet.add(FORMS_APP_NAME);
  }
  if (prefs.optGiftCardStudio) {
    logger.debug(
      { appName: GIFT_CARD_STUDIO_APP_NAME },
      "Adding gift card studio app",
    );
    installSet.add(GIFT_CARD_STUDIO_APP_NAME);
  }
  if (prefs.optMyCabinet) {
    logger.debug({ appName: MY_CABINET_APP_NAME }, "Adding My Cabinet app");
    installSet.add(MY_CABINET_APP_NAME);
  }
  if (prefs.inviteMode === "email") {
    logger.debug(
      { appName: EMAIL_NOTIFICATION_APP_NAME },
      "Adding email notification app",
    );
    installSet.add(EMAIL_NOTIFICATION_APP_NAME);
  }

  for (const name of installSet) {
    if (!AvailableApps[name]) continue;
    if (!canInstallApp(planTier, name)) {
      logger.debug({ appName: name, planTier }, "Skipping app install on plan");
      continue;
    }
    logger.debug({ appName: name }, "Ensuring app is installed");
    await ensureInstalledApp(services, memberId, name);
  }

  if (prefs.inviteMode === "calendar_writer") {
    logger.debug(
      { inviteCalendarWriterAppId: prefs.inviteCalendarWriterAppId },
      "Ensuring calendar writer app is installed",
    );
    const targetId = prefs.inviteCalendarWriterAppId?.trim();
    if (!targetId) {
      return { ok: false, code: "calendar_writer_target_required" };
    }

    logger.debug({ targetId }, "Ensuring calendar writer app is installed");
    const targetApp = await services.connectedAppsService.getApp(targetId);
    if (!targetApp || targetApp.status !== "connected") {
      return { ok: false, code: "calendar_writer_target_invalid" };
    }

    logger.debug(
      { targetAppName: targetApp.name },
      "Ensuring calendar writer app is installed",
    );
    const appMeta = AvailableApps[targetApp.name];
    if (!appMeta?.scope.includes("calendar-write")) {
      return { ok: false, code: "calendar_writer_target_invalid" };
    }

    logger.debug(
      { appName: CALENDAR_WRITER_APP_NAME },
      "Ensuring calendar writer app is installed",
    );
    const writer = await ensureInstalledApp(
      services,
      memberId,
      CALENDAR_WRITER_APP_NAME,
    );

    logger.debug({ writerId: writer._id }, "Configuring calendar writer app");
    await services.connectedAppsService.processRequest(
      writer._id,
      {
        appId: targetId,
      },
      null as unknown as ApiRequest,
      user,
    );

    logger.debug({ writerId: writer._id }, "Configured calendar writer app");
  }

  logger.debug({ language, businessName }, "Created install default pages");

  await ensureDefaultInstallSchedule(services);

  await ensureInstallUserCalendarSources(services, memberId);

  const bookingPaymentResult =
    await ensureInstallBookingPaymentsDefaultAppsAndCancellations(
      services,
      prefs,
    );
  if (!bookingPaymentResult.ok) {
    return bookingPaymentResult;
  }

  await ensureInstallCustomerOtpTemplates(services, language);

  await ensureInstallCustomerNotificationTemplates(
    services,
    language,
    prefs,
    user,
  );

  logger.debug(
    { language, businessName },
    "Ensuring install customer notification templates",
  );
  await ensureInstallAppointmentNotificationDefaults(
    services,
    language,
    prefs,
    user,
  );

  if (prefs.optMyCabinet) {
    await upsertInstallMyCabinetDefaultPage(services, {
      businessName,
      language,
      headerId: layout.headerId,
      footerId: layout.footerId,
      myCabinetLabels: layout.labels.myCabinetLabels,
    });
  }

  await ensureInstallDefaultConfigurations(services);

  logger.debug({ language, businessName }, "Install setup steps completed");
  return { ok: true };
}
