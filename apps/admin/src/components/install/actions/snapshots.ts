"use server";

import { auth } from "@/app/auth";
import type {
  InstallPreferencesServerState,
  InstallWorkspaceServerState,
} from "@/components/install/types";
import {
  CALDAV_APP_NAME,
  GOOGLE_CALENDAR_APP_NAME,
  ICS_APP_NAME,
  OUTLOOK_APP_NAME,
  PAYPAL_APP_NAME,
  SQUARE_APP_NAME,
  STRIPE_APP_NAME,
} from "@hacado/app-store";
import { languages } from "@hacado/i18n";
import { getLoggerFactory } from "@hacado/logger";
import { ServicesContainer } from "@hacado/services";
import {
  fontName,
  zCountry,
  zCurrency,
  zTimeZone,
  type ConnectedApp,
} from "@hacado/types";
import { headers } from "next/headers";
import * as z from "zod";

const INSTALL_CALENDAR_APP_NAMES = new Set([
  GOOGLE_CALENDAR_APP_NAME,
  ICS_APP_NAME,
  OUTLOOK_APP_NAME,
  CALDAV_APP_NAME,
]);
const INSTALL_PAYMENT_APP_NAMES = new Set([
  PAYPAL_APP_NAME,
  SQUARE_APP_NAME,
  STRIPE_APP_NAME,
]);

const installGeneralWorkspaceSchema = z.object({
  timeZone: zTimeZone,
  language: z.enum(languages),
  country: zCountry,
  currency: zCurrency,
});

const installInviteModeSchema = z.enum(["none", "email", "calendar_writer"]);
const installPreferencesSchema = z.object({
  inviteMode: installInviteModeSchema,
  inviteCalendarWriterAppId: z.string().trim().optional().default(""),
  optCustomerEmailNotifications: z.boolean().default(false),
  optCustomerTextMessageNotifications: z.boolean().default(false),
  optAppointmentNotifications: z.boolean().default(false),
  optWaitlist: z.boolean().default(false),
  optWaitlistNotifications: z.boolean().default(false),
  optBlog: z.boolean().default(false),
  optForms: z.boolean().default(false),
  optGiftCardStudio: z.boolean().default(false),
  optMyCabinet: z.boolean().default(false),
  allowCancelReschedule: z.boolean().default(false),
  autoConfirmBookings: z.boolean().default(false),
  acceptPayments: z.boolean().default(false),
  depositEnabled: z.boolean().default(false),
  depositPercent: z.string().default("25"),
});

function normalizeInstallPreferencesFromOrg(
  value: unknown,
): InstallPreferencesServerState | null {
  const parsed = installPreferencesSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export async function getInstallWorkspaceSnapshot(): Promise<InstallWorkspaceServerState | null> {
  const logger = getLoggerFactory("InstallActions")(
    "getInstallWorkspaceSnapshot",
  );
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  const orgId = (session?.user as { organizationId?: string })?.organizationId;
  if (!session?.user || !orgId) {
    logger.error({ session, orgId }, "Unauthorized");
    return null;
  }

  const services = ServicesContainer(orgId, true);
  const org = await services.organizationService.getOrganization();
  if (!org) {
    logger.error({ orgId }, "Organization not found");
    return null;
  }

  const orgRecord = org as typeof org & { name?: string };
  const general =
    await services.configurationService.getConfiguration("general");
  const brand = await services.configurationService.getConfiguration("brand");
  const styling =
    (await services.configurationService.getConfiguration("styling")) ?? null;
  const businessName =
    (typeof orgRecord.name === "string" && orgRecord.name.trim()) ||
    (typeof general?.name === "string" && general.name.trim()) ||
    "";
  const slug = typeof org.slug === "string" ? org.slug : "";

  const legacyGeneral = general as Record<string, unknown> | null;
  const installLanguage =
    brand?.language ??
    (typeof legacyGeneral?.language === "string"
      ? legacyGeneral.language
      : undefined);
  const generalPick = installGeneralWorkspaceSchema.safeParse({
    timeZone: general?.timeZone,
    language: installLanguage,
    country: general?.country,
    currency: general?.currency,
  });

  const out: InstallWorkspaceServerState = {};
  if (businessName) out.businessName = businessName;
  if (typeof general?.address === "string") out.address = general.address;
  if (slug && !slug.startsWith("pending-")) out.slug = slug;
  if (generalPick.success) Object.assign(out, generalPick.data);

  const hexOk = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (styling?.colors?.length) {
    const pr = styling.colors.find((c) => c.type === "primary")?.value;
    const sec = styling.colors.find((c) => c.type === "secondary")?.value;
    if (typeof pr === "string" && hexOk.test(pr)) out.primaryColorHex = pr;
    if (typeof sec === "string" && hexOk.test(sec)) out.secondaryColorHex = sec;
  }
  if (styling?.fonts?.primary) {
    const fp = fontName.safeParse(styling.fonts.primary);
    if (fp.success) out.primaryFont = fp.data;
  }
  if (styling?.fonts?.secondary) {
    const fs = fontName.safeParse(styling.fonts.secondary);
    if (fs.success) out.secondaryFont = fs.data;
  }
  if (brand?.logo && typeof brand.logo === "string")
    out.installLogo = brand.logo;
  else if (
    typeof legacyGeneral?.logo === "string" &&
    legacyGeneral.logo.length > 0
  )
    out.installLogo = legacyGeneral.logo;
  logger.debug({ orgId }, "Resolved workspace snapshot");
  return out;
}

export async function getInstallCalendarAppsSnapshot(): Promise<
  ConnectedApp[]
> {
  const logger = getLoggerFactory("InstallActions")(
    "getInstallCalendarAppsSnapshot",
  );
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  const organizationId = (session?.user as { organizationId?: string })
    ?.organizationId;
  if (!session?.user || !organizationId) {
    logger.error({ session, organizationId }, "Unauthorized");
    return [];
  }

  const services = ServicesContainer(organizationId, true);
  const apps = await services.connectedAppsService.getApps();
  const filtered = apps.filter((a) => INSTALL_CALENDAR_APP_NAMES.has(a.name));
  logger.debug(
    { organizationId, count: filtered.length },
    "Resolved calendar apps snapshot",
  );
  return filtered;
}

export async function getInstallPaymentAppsSnapshot(): Promise<ConnectedApp[]> {
  const logger = getLoggerFactory("InstallActions")(
    "getInstallPaymentAppsSnapshot",
  );
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  const organizationId = (session?.user as { organizationId?: string })
    ?.organizationId;
  if (!session?.user || !organizationId) {
    logger.error({ session, organizationId }, "Unauthorized");
    return [];
  }

  const services = ServicesContainer(organizationId, true);
  const apps = await services.connectedAppsService.getApps();
  const filtered = apps.filter((a) => INSTALL_PAYMENT_APP_NAMES.has(a.name));
  logger.debug(
    { organizationId, count: filtered.length },
    "Resolved payment apps snapshot",
  );
  return filtered;
}

export async function getInstallPreferencesSnapshot(): Promise<InstallPreferencesServerState | null> {
  const logger = getLoggerFactory("InstallActions")(
    "getInstallPreferencesSnapshot",
  );
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  const organizationId = (session?.user as { organizationId?: string })
    ?.organizationId;
  if (!session?.user || !organizationId) {
    logger.error({ session, organizationId }, "Unauthorized");
    return null;
  }

  const services = ServicesContainer(organizationId, true);
  const org = await services.organizationService.getOrganization();
  if (!org) {
    logger.error({ organizationId }, "Organization not found");
    return null;
  }
  const normalized = normalizeInstallPreferencesFromOrg(
    (org as any).installPreferences,
  );

  const paymentApps = await getInstallPaymentAppsSnapshot();
  const hasPaymentApps = paymentApps.length > 0;
  if (hasPaymentApps && normalized) {
    normalized.acceptPayments = true;
  }

  logger.debug(
    { organizationId, hasPreferences: Boolean(normalized) },
    "Resolved install preferences snapshot",
  );
  return normalized;
}
