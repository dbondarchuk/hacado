"use server";

import { getActor, getOrganizationId, getServicesContainer } from "@/app/utils";
import { getLoggerFactory } from "@timelish/logger";
import { getPolarClient } from "@timelish/services";
import { ORGANIZATIONS_COLLECTION_NAME } from "@timelish/services/collections";
import { getDbConnection } from "@timelish/services/database";
import type { Organization } from "@timelish/types";
import { siteSettingsFormSchema } from "./site-settings-schema";

export type SaveSiteSettingsResult =
  | { ok: true }
  | { ok: false; code: "invalid_input" | "persist_failed" };

export async function saveSiteSettingsAction(
  input: unknown,
): Promise<SaveSiteSettingsResult> {
  const logger = getLoggerFactory("SiteSettingsActions")("saveSiteSettings");
  const parsed = siteSettingsFormSchema.safeParse(input);
  if (!parsed.success) {
    logger.warn(
      { issues: parsed.error.flatten() },
      "Invalid site settings payload",
    );
    return { ok: false, code: "invalid_input" };
  }

  const services = await getServicesContainer();
  const source = await getActor();
  const d = parsed.data;

  try {
    await services.configurationService.setConfiguration(
      "general",
      d.general,
      source,
    );
    await services.configurationService.setConfiguration(
      "brand",
      d.brand,
      source,
    );
    await services.configurationService.setConfiguration(
      "social",
      d.social,
      source,
    );
    await services.configurationService.setConfiguration(
      "styling",
      d.styling,
      source,
    );
    logger.debug("Persisted site settings (general, brand, social, styling)");

    const organizationId = await getOrganizationId();
    const db = await getDbConnection();
    const org = await db
      .collection<Organization>(ORGANIZATIONS_COLLECTION_NAME)
      .findOne({ _id: organizationId }, { projection: { feesExempt: 1 } });

    if (org?.feesExempt !== true) {
      await getPolarClient().syncTeamCustomerFromGeneralSettings({
        organizationId,
        name: d.general.name,
        email: d.general.email,
      });
    }
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : String(error) },
      "Failed to persist site settings",
    );
    return { ok: false, code: "persist_failed" };
  }

  return { ok: true };
}
