"use server";

import { auth } from "@/app/auth";
import { languages } from "@hacado/i18n";
import { getLoggerFactory } from "@hacado/logger";
import { ServicesContainer } from "@hacado/services";
import { ORGANIZATIONS_COLLECTION_NAME } from "@hacado/services/collections";
import { getDbConnection } from "@hacado/services/database";
import { type Organization } from "@hacado/types";
import { headers } from "next/headers";
import * as z from "zod";
import { runCompleteInstallSetupSteps } from "./complete-setup";

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

export type InstallPreferences = z.infer<typeof installPreferencesSchema>;

async function setInstallPreferencesInOrg(
  organizationId: string,
  prefs: InstallPreferences,
): Promise<void> {
  const logger = getLoggerFactory("InstallActions")(
    "setInstallPreferencesInOrg",
  );
  logger.debug(
    { organizationId },
    "Persisting install preferences in organization",
  );
  const db = await getDbConnection();
  await db
    .collection<Organization>(ORGANIZATIONS_COLLECTION_NAME)
    .updateOne(
      { _id: organizationId },
      { $set: { installPreferences: prefs } },
    );
  logger.debug(
    { organizationId },
    "Persisted install preferences in organization",
  );
}

export async function saveInstallPreferences(
  input: InstallPreferences,
): Promise<{ ok: true } | { ok: false; code: string }> {
  const logger = getLoggerFactory("InstallActions")("saveInstallPreferences");
  logger.debug({ input }, "Saving install preferences");

  const parsed = installPreferencesSchema.safeParse(input);
  if (!parsed.success) {
    logger.error(
      { input, error: parsed.error },
      "Invalid install preferences input",
    );
    return { ok: false, code: "invalid_input" };
  }

  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  const organizationId = (session?.user as { organizationId?: string })
    ?.organizationId;
  if (!session?.user || !organizationId) {
    logger.error({ session, organizationId }, "Unauthorized");
    return { ok: false, code: "unauthorized" };
  }

  await setInstallPreferencesInOrg(organizationId, parsed.data);
  logger.debug({ organizationId }, "Installed preferences in organization");
  return { ok: true };
}

export async function completeInstallSetup(
  input: InstallPreferences,
): Promise<{ ok: true } | { ok: false; code: string }> {
  const logger = getLoggerFactory("InstallActions")("completeInstallSetup");
  logger.debug({ input }, "Completing install setup");
  const parsed = installPreferencesSchema.safeParse(input);
  if (!parsed.success) {
    logger.error(
      { input, error: parsed.error },
      "Invalid install preferences input",
    );
    return { ok: false, code: "invalid_input" };
  }

  const prefs = parsed.data;
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  const organizationId = (session?.user as { organizationId?: string })
    ?.organizationId;

  if (!session?.user || !organizationId) {
    logger.error({ session, organizationId }, "Unauthorized");
    return { ok: false, code: "unauthorized" };
  }

  const services = ServicesContainer(organizationId, true);
  const general =
    (await services.configurationService.getConfiguration("general")) ?? null;
  const brand =
    (await services.configurationService.getConfiguration("brand")) ?? null;
  if (!general || Object.keys(general).length === 0) {
    logger.error({ organizationId }, "General configuration not found");
    return { ok: false, code: "no_general" };
  }

  const legacyGeneral = general as Record<string, unknown>;
  const installLanguage =
    brand?.language ??
    (typeof legacyGeneral.language === "string"
      ? legacyGeneral.language
      : undefined);
  if (!installLanguage || !languages.includes(installLanguage)) {
    logger.error(
      { organizationId, language: installLanguage },
      "Invalid website language for install defaults",
    );
    return { ok: false, code: "invalid_language" };
  }

  const businessName =
    (typeof general.name === "string" && general.name.trim()) ||
    (typeof brand?.title === "string" && brand.title.trim()) ||
    (typeof legacyGeneral.title === "string" && legacyGeneral.title.trim()) ||
    "Hacado";

  const hasAddress =
    typeof general.address === "string" && general.address.trim().length > 0;

  const setupResult = await runCompleteInstallSetupSteps({
    services,
    user: session.user,
    prefs,
    language: installLanguage,
    businessName,
    hasAddress,
  });

  if (!setupResult.ok) {
    logger.error({ setupResult }, "Install setup steps failed");
    return setupResult;
  }

  const db = await getDbConnection();
  await db
    .collection<Organization>(ORGANIZATIONS_COLLECTION_NAME)
    .updateOne({ _id: organizationId }, [
      { $set: { isInstalled: true } },
      { $unset: ["installPreferences"] },
    ]);

  logger.debug({ organizationId }, "Completed install setup");
  return { ok: true };
}
