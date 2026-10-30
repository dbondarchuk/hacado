import { BillingPlanTier, meetsMinimumPlanTier } from "@hacado/types/billing";
import type { Organization } from "@hacado/types/organizations";
import type { SmsMessagingAccess } from "@hacado/types/text-message/registration";
import { resolvePlanTierFromOrganization } from "../billing/subscription-entitlements";
import {
  CONFIGURATION_COLLECTION_NAME,
  ORGANIZATIONS_COLLECTION_NAME,
} from "../collections";
import { getDbConnection } from "../database";
import { SmsRegistrationStore } from "./registration-store";
import { requiresSmsVerification } from "./verification";

export async function readSmsMessagingAccess(
  organizationId: string,
  store: SmsRegistrationStore = new SmsRegistrationStore(),
): Promise<SmsMessagingAccess> {
  const db = await getDbConnection();
  const [organization, general] = await Promise.all([
    db
      .collection<Organization>(ORGANIZATIONS_COLLECTION_NAME)
      .findOne({ _id: organizationId }),
    db
      .collection<{
        value?: { country?: string };
      }>(CONFIGURATION_COLLECTION_NAME)
      .findOne({
        key: "general",
        organizationId,
      }),
  ]);

  const tier = resolvePlanTierFromOrganization(organization);
  const canCustomize =
    tier !== BillingPlanTier.Free &&
    (!tier || meetsMinimumPlanTier(tier, BillingPlanTier.Solo));
  const platformBusiness = requiresSmsVerification(general?.value?.country);
  const registration = await store.get(organizationId);
  const dedicated = canCustomize
    ? await store.getAssignedProfileNumber(organizationId)
    : null;
  const detailsVerified = registration?.status === "verified";

  return {
    canCustomize,
    platformBusiness,
    customVerified:
      canCustomize &&
      registration?.enabled === true &&
      detailsVerified &&
      Boolean(dedicated?.phoneNumber),
    allowCustomTemplates: !platformBusiness || detailsVerified,
  };
}
