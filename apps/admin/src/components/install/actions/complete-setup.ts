"use server";

import {
  APPOINTMENT_REMINDERS_APP_NAME,
  AUTOMATIC_AI_DISCOVERY_APP_NAME,
  AUTOMATIC_STRUCTURED_DATA_APP_NAME,
  AvailableApps,
  BLOG_APP_NAME,
  CALENDAR_WRITER_APP_NAME,
  canInstallApp,
  CUSTOMER_APPOINTMENT_UPDATES_APP_NAME,
  CUSTOMER_PACKAGE_EMAIL_NOTIFICATION_APP_NAME,
  CUSTOMER_WAITLIST_NOTIFICATIONS_APP_NAME,
  FORMS_APP_NAME,
  GIFT_CARD_STUDIO_APP_NAME,
  MY_APPOINTMENT_NOTIFICATIONS_APP_NAME,
  MY_CABINET_APP_NAME,
  WAITLIST_APP_NAME,
} from "@hacado/app-store";
import { AppointmentRemindersTemplates } from "@hacado/app-store/exports";
import { languages } from "@hacado/i18n";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { resolvePlanTierFromOrganization } from "@hacado/services/billing";
import { ServicesContainer } from "@hacado/services/container";
import type { ApiRequest } from "@hacado/types/apps";
import { BillingPlanTier } from "@hacado/types/billing";
import type { PaymentsConfiguration } from "@hacado/types/configuration/booking";
import { bookingConfigurationSchema } from "@hacado/types/configuration/booking";
import { systemEventSource } from "@hacado/types/events";
import type { TemplateUpdateModel } from "@hacado/types/templates";
import type { SessionUser } from "@hacado/types/users";
import { BuiltInTemplateTemplates } from "../../admin/templates/templates";
import {
  getDefaultBookingConfiguration,
  getInstallEnabledCancellationsAndReschedules,
} from "../default-booking";
import { getDefaultScheduleConfiguration } from "../default-schedule";
import { createInstallDefaultPages } from "./create-default-pages";

type InstallPreferences = {
  allowCancelReschedule: boolean;
  autoConfirmBookings: boolean;
  acceptPayments: boolean;
  depositEnabled: boolean;
  depositPercent: string;
  inviteMode: "none" | "email" | "calendar_writer";
  inviteCalendarWriterAppId?: string;
  optCustomerEmailNotifications: boolean;
  optCustomerPackageEmailNotifications: boolean;
  optCustomerTextMessageNotifications: boolean;
  optAppointmentNotifications: boolean;
  optWaitlist: boolean;
  optWaitlistNotifications: boolean;
  optBlog: boolean;
  optForms: boolean;
  optGiftCardStudio: boolean;
  optMyCabinet: boolean;
  websitePackId?: string;
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
    optCustomerPackageEmailNotifications: false,
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
    return { requireDeposit: false };
  }

  if (prefs.depositEnabled) {
    let depositPercentage = Math.round(Number.parseFloat(prefs.depositPercent));
    if (!Number.isFinite(depositPercentage)) {
      depositPercentage = 25;
    }

    depositPercentage = Math.min(100, Math.max(10, depositPercentage));
    return {
      requireDeposit: true,
      depositPercentage,
    };
  }

  return {
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
      emailEnabled: true,
      phoneEnabled: false,
      otpEmailTemplateId,
      otpTextTemplateId,
    },
    systemEventSource,
  );

  logger.info(
    { otpEmailTemplateId, otpTextTemplateId },
    "Configured customer auth OTP templates",
  );
}

const installAppointmentUpdateEventKeys = [
  "pending",
  "confirmed",
  "declined",
  "canceled",
  "noShow",
  "rescheduled",
] as const;

const installEmailTemplateByEventKey = {
  pending: "appointment-created-email",
  confirmed: "appointment-confirmed-email",
  declined: "appointment-declined-email",
  canceled: "appointment-canceled-email",
  noShow: "appointment-no-show-email",
  rescheduled: "appointment-rescheduled-email",
} as const;

const installSmsTemplateByEventKey = {
  pending: "appointment-created-text-message",
  confirmed: "appointment-confirmed-text-message",
  declined: "appointment-declined-text-message",
  canceled: "appointment-canceled-text-message",
  noShow: "appointment-no-show-text-message",
  rescheduled: "appointment-rescheduled-text-message",
} as const;

async function ensureInstallCustomerNotificationTemplates(
  services: ReturnType<typeof ServicesContainer>,
  language: (typeof languages)[number],
  prefs: InstallPreferences,
  user: SessionUser,
): Promise<void> {
  const logger = getLoggerFactory("InstallActions")(
    "ensureInstallCustomerNotificationTemplates",
  );

  const emailOpt = prefs.optCustomerEmailNotifications;
  const smsOpt = prefs.optCustomerTextMessageNotifications;

  logger.debug(
    {
      language,
      optCustomerEmailNotifications: emailOpt,
      optCustomerTextMessageNotifications: smsOpt,
    },
    "Ensuring customer notification templates",
  );

  if (!emailOpt && !smsOpt) return;

  const app = (
    await services.connectedAppsService.getAppsByApp(
      CUSTOMER_APPOINTMENT_UPDATES_APP_NAME,
    )
  )[0];

  if (!app) {
    logger.debug("Customer appointment updates app missing; skipping");
    return;
  }

  const templateSourceLang =
    language in (BuiltInTemplateTemplates["appointment-created-email"] ?? {})
      ? language
      : "en";

  const emailMap: Record<string, string> = {};
  const smsMap: Record<string, string> = {};

  if (emailOpt) {
    for (const templateId of Object.values(installEmailTemplateByEventKey)) {
      const source =
        BuiltInTemplateTemplates[templateId]?.[templateSourceLang] ??
        BuiltInTemplateTemplates[templateId]?.en;

      if (!source) continue;

      emailMap[templateId] = await ensureTemplateByName(services, source);
    }
  }

  const emailReady =
    emailOpt &&
    Boolean(
      emailMap["appointment-created-email"] &&
        emailMap["appointment-confirmed-email"] &&
        emailMap["appointment-declined-email"] &&
        emailMap["appointment-canceled-email"] &&
        emailMap["appointment-rescheduled-email"],
    );

  if (emailOpt && !emailReady) {
    logger.warn(
      { appId: app._id },
      "Missing required email templates for customer appointment updates",
    );
  }

  if (smsOpt) {
    for (const templateId of Object.values(installSmsTemplateByEventKey)) {
      const source =
        BuiltInTemplateTemplates[templateId]?.[templateSourceLang] ??
        BuiltInTemplateTemplates[templateId]?.en;

      if (!source) continue;

      smsMap[templateId] = await ensureTemplateByName(services, source);
    }
  }

  if (!emailReady && !smsOpt) return;

  const events: Record<
    (typeof installAppointmentUpdateEventKeys)[number],
    {
      enabled: true;
      emailEnabled: boolean;
      textEnabled: boolean;
      emailTemplateId?: string;
      textTemplateId?: string;
    }
  > = {} as Record<
    (typeof installAppointmentUpdateEventKeys)[number],
    {
      enabled: true;
      emailEnabled: boolean;
      textEnabled: boolean;
      emailTemplateId?: string;
      textTemplateId?: string;
    }
  >;

  for (const eventKey of installAppointmentUpdateEventKeys) {
    const emailTemplateId = emailReady
      ? emailMap[installEmailTemplateByEventKey[eventKey]]
      : undefined;

    const textTemplateId = smsOpt
      ? smsMap[installSmsTemplateByEventKey[eventKey]]
      : undefined;

    events[eventKey] = {
      enabled: true,
      emailEnabled: emailReady,
      textEnabled: !!smsOpt,
      ...(emailReady && emailTemplateId ? { emailTemplateId } : {}),
      ...(smsOpt && textTemplateId ? { textTemplateId } : {}),
    };
  }

  const request: {
    events: typeof events;
    event?: { enabled: true; templateId: string };
  } = { events };

  if (emailReady && emailMap["appointment-confirmed-email"]) {
    request.event = {
      enabled: true,
      templateId: emailMap["appointment-confirmed-email"],
    };
  }

  logger.debug({ appId: app._id }, "Configuring customer appointment updates");

  await services.connectedAppsService.processRequest(
    app._id,
    request,
    null as unknown as ApiRequest,
    user,
  );

  logger.debug({ appId: app._id }, "Configured customer appointment updates");
}

async function ensureInstallAppointmentReminderDefaults(
  services: ReturnType<typeof ServicesContainer>,
  language: (typeof languages)[number],
  prefs: InstallPreferences,
  user: SessionUser,
): Promise<void> {
  const logger = getLoggerFactory("InstallActions")(
    "ensureInstallAppointmentReminderDefaults",
  );

  logger.debug(
    {
      language,
      optAppointmentNotifications: prefs.optAppointmentNotifications,
    },
    "Ensuring appointment reminder defaults",
  );

  if (!prefs.optAppointmentNotifications) {
    logger.debug("Appointment reminders not enabled; skipping");
    return;
  }

  const app = (
    await services.connectedAppsService.getAppsByApp(
      APPOINTMENT_REMINDERS_APP_NAME,
    )
  )[0];

  if (!app) {
    logger.debug("Appointment reminders app not found; skipping");
    return;
  }

  const templateSource =
    AppointmentRemindersTemplates["appointment-reminder-email"]?.[language] ??
    AppointmentRemindersTemplates["appointment-reminder-email"]?.en;

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

  logger.debug({ appId: app._id }, "Creating appointment reminder default");
  await services.connectedAppsService.processRequest(
    app._id,
    {
      type: "create-appointment-reminder",
      appointmentReminder: {
        name: defaultName,
        type: "timeBefore",
        weeks: 0,
        days: 1,
        hours: 0,
        minutes: 0,
        appointmentCount: { type: "none" },
        emailEnabled: true,
        textEnabled: false,
        emailTemplateId: templateId,
      },
    },
    null as unknown as ApiRequest,
    user,
  );

  logger.debug(
    { appId: app._id, templateId, defaultName },
    "Created appointment reminder default",
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
  await createInstallDefaultPages({
    services,
    language,
    businessName,
    hasAddress,
    isCancelRescheduleEnabled: prefs.allowCancelReschedule,
    isBlogEnabled: prefs.optBlog,
    isMyCabinetEnabled: prefs.optMyCabinet,
    websitePackId: prefs.websitePackId,
  });

  const installSet = new Set<string>();
  installSet.add(AUTOMATIC_STRUCTURED_DATA_APP_NAME);
  installSet.add(AUTOMATIC_AI_DISCOVERY_APP_NAME);

  if (
    prefs.optCustomerEmailNotifications ||
    prefs.optCustomerTextMessageNotifications
  ) {
    logger.debug(
      { appName: CUSTOMER_APPOINTMENT_UPDATES_APP_NAME },
      "Adding customer appointment updates app",
    );

    installSet.add(CUSTOMER_APPOINTMENT_UPDATES_APP_NAME);
  }

  if (prefs.optCustomerPackageEmailNotifications) {
    logger.debug(
      { appName: CUSTOMER_PACKAGE_EMAIL_NOTIFICATION_APP_NAME },
      "Adding customer package email notification app",
    );

    installSet.add(CUSTOMER_PACKAGE_EMAIL_NOTIFICATION_APP_NAME);
  }

  if (prefs.optAppointmentNotifications) {
    logger.debug(
      { appName: APPOINTMENT_REMINDERS_APP_NAME },
      "Adding appointment notifications app",
    );

    installSet.add(APPOINTMENT_REMINDERS_APP_NAME);
  }

  if (prefs.optWaitlist) {
    logger.debug({ appName: WAITLIST_APP_NAME }, "Adding waitlist app");
    installSet.add(WAITLIST_APP_NAME);
    if (prefs.optWaitlistNotifications) {
      logger.debug(
        { appName: CUSTOMER_WAITLIST_NOTIFICATIONS_APP_NAME },
        "Adding customer waitlist notifications app",
      );

      installSet.add(CUSTOMER_WAITLIST_NOTIFICATIONS_APP_NAME);
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
      { appName: MY_APPOINTMENT_NOTIFICATIONS_APP_NAME },
      "Adding my appointment notifications app",
    );

    installSet.add(MY_APPOINTMENT_NOTIFICATIONS_APP_NAME);
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

  await ensureInstallAppointmentReminderDefaults(
    services,
    language,
    prefs,
    user,
  );

  await ensureInstallDefaultConfigurations(services);

  logger.debug({ language, businessName }, "Install setup steps completed");
  return { ok: true };
}
