import {
  BillingPlanTier,
  meetsMinimumPlanTier,
  type Organization,
} from "@hacado/types";
import { resolvePlanTierFromOrganization } from "../billing/subscription-entitlements";
import { ORGANIZATIONS_COLLECTION_NAME } from "../collections";
import { getDbConnection } from "../database";
import { SmsRegistrationStore } from "./registration-store";

export async function readSmsMessagingAccess(
  organizationId: string,
  store: SmsRegistrationStore = new SmsRegistrationStore(),
): Promise<{ customVerified: boolean; canCustomize: boolean }> {
  const db = await getDbConnection();
  const organization = await db
    .collection<Organization>(ORGANIZATIONS_COLLECTION_NAME)
    .findOne({ _id: organizationId });

  const tier = resolvePlanTierFromOrganization(organization);
  const canCustomize =
    tier !== BillingPlanTier.Free &&
    (!tier || meetsMinimumPlanTier(tier, BillingPlanTier.Solo));

  if (!canCustomize) {
    return { customVerified: false, canCustomize: false };
  }

  const registration = await store.get(organizationId);
  const dedicated = await store.getAssignedProfileNumber(organizationId);

  return {
    canCustomize: true,
    customVerified:
      registration?.enabled === true &&
      registration.status === "verified" &&
      Boolean(dedicated?.phoneNumber),
  };
}
