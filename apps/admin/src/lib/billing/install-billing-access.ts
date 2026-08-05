import { persistPolarSubscriptionToOrganization } from "@/lib/billing/persist-polar-subscription";
import { getPolarClient } from "@hacado/services";
import { ORGANIZATIONS_COLLECTION_NAME } from "@hacado/services/collections";
import { getDbConnection } from "@hacado/services/database";
import {
  OrganizationSubscriptionStatus,
  parseOrganizationSubscriptionStatus,
  type Organization,
} from "@hacado/types";

const ALLOWED_STATUSES = new Set<OrganizationSubscriptionStatus>([
  OrganizationSubscriptionStatus.Active,
  OrganizationSubscriptionStatus.Trialing,
  OrganizationSubscriptionStatus.PastDue,
]);

export function isPolarSubscriptionStatusAllowed(
  status: OrganizationSubscriptionStatus | undefined,
): boolean {
  if (!status) return false;
  return ALLOWED_STATUSES.has(status);
}

export async function organizationHasInstallBillingAccess(
  organizationId: string | undefined,
  options?: { reconcileWithPolar?: boolean },
): Promise<boolean> {
  if (!organizationId?.trim()) return false;

  const db = await getDbConnection();
  const org = await db
    .collection<Organization>(ORGANIZATIONS_COLLECTION_NAME)
    .findOne(
      { _id: organizationId },
      {
        projection: {
          feesExempt: 1,
          polarSubscriptionStatus: 1,
        },
      },
    );

  if (!org) return false;
  if (org.feesExempt === true) return true;
  if (isPolarSubscriptionStatusAllowed(org.polarSubscriptionStatus))
    return true;

  if (!options?.reconcileWithPolar) return false;

  try {
    const page = await getPolarClient().listSubscriptions({
      metadata: { org: organizationId },
      active: true,
      limit: 1,
    });
    const sub = page.result.items[0];
    if (sub) {
      await persistPolarSubscriptionToOrganization(sub);
      return isPolarSubscriptionStatusAllowed(
        parseOrganizationSubscriptionStatus(sub.status) ?? undefined,
      );
    }
  } catch {
    /* ignore */
  }

  return false;
}
