import { getLoggerFactory } from "@hacado/logger";
import {
  getPolarClient,
  invalidateOrganizationHostnameCacheForOrganization,
  ServicesContainer,
} from "@hacado/services";
import { resolvePlanTierFromProductId } from "@hacado/services/billing";
import { ORGANIZATIONS_COLLECTION_NAME } from "@hacado/services/collections";
import { getDbConnection } from "@hacado/services/database";
import {
  BillingPlanTier,
  parseOrganizationSubscriptionStatus,
  systemEventSource,
  type Organization,
} from "@hacado/types";
import type { Subscription } from "@polar-sh/sdk/models/components/subscription";

import { invalidateOrganizationSessions } from "@/lib/auth/invalidate-organization-sessions";
import { emitSubscriptionStatusChangedEvent } from "./emit-subscription-status-event";
import { notifyOwnerOfMemberReactivations } from "./notify-member-reactivations";

const USER_SLOTS_PRODUCT_TYPE = "users_amount";
const SUBSCRIPTION_PRODUCT_TYPE = "subscription";

export function organizationIdFromPolarSubscriptionMetadata(
  metadata: Subscription["metadata"],
): string | null {
  const raw = metadata.org ?? metadata.referenceId;
  if (raw === undefined || raw === null) return null;
  const s = String(raw).trim();
  return s || null;
}

function parseBoolMeta(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value.toLowerCase() === "true" || value === "1";
  }
  if (typeof value === "number") return value !== 0;
  return false;
}

async function syncUserSlotsFromSubscription(
  orgId: string,
  subscription: Subscription,
): Promise<void> {
  const logger = getLoggerFactory("PersistPolarSubscription")(
    "syncUserSlotsFromSubscription",
  );
  const polar = getPolarClient();
  const productId = subscription.productId?.trim();
  if (!productId || !polar.client) return;

  try {
    const product =
      subscription.product &&
      (subscription.product as { metadata?: Record<string, unknown> }).metadata
        ? subscription.product
        : await polar.client.products.get({ id: productId });

    const metadata = (product as { metadata?: Record<string, unknown> })
      .metadata;
    const type = String(metadata?.type ?? "");
    const status = subscription.status;
    const isActive =
      status === "active" || status === "trialing" || status === "past_due";
    const billing = ServicesContainer(orgId).billingService;

    if (type === USER_SLOTS_PRODUCT_TYPE) {
      const usersAmount = Number(metadata?.users_amount ?? 0);
      if (!isActive) {
        await billing.removeUserSlotGrant(subscription.id);
      } else if (Number.isFinite(usersAmount) && usersAmount > 0) {
        await billing.upsertUserSlotGrant({
          polarSubscriptionId: subscription.id,
          usersAmount,
          source: "addon",
        });
      }
    } else if (type === SUBSCRIPTION_PRODUCT_TYPE) {
      const usersAmount = Number(metadata?.users_amount ?? 1);
      const allowAdditionalUsers = parseBoolMeta(
        metadata?.allow_additional_users,
      );
      if (!isActive) {
        // Keep a minimum of 1 included seat for the owner when base sub ends.
        await billing.setIncludedUserSlots(1, {
          polarSubscriptionId: subscription.id,
          allowAdditionalUsers: false,
        });
      } else {
        await billing.setIncludedUserSlots(
          Number.isFinite(usersAmount) && usersAmount > 0 ? usersAmount : 1,
          {
            polarSubscriptionId: subscription.id,
            allowAdditionalUsers,
          },
        );
      }
    } else {
      logger.debug(
        { orgId, productId, type },
        "Skipping user-slot sync for non-subscription product",
      );
      return;
    }

    const result =
      await ServicesContainer(orgId).teamService.reconcileMembersToSlots(
        systemEventSource,
      );
    if (result.reactivatedMemberIds.length) {
      await notifyOwnerOfMemberReactivations(orgId, result);
    }

    logger.info(
      { orgId, productId, type, isActive, ...result },
      "Synced user slots from subscription",
    );
  } catch (error) {
    logger.error({ error, orgId, productId }, "Failed to sync user slots");
  }
}

export async function persistPolarSubscriptionToOrganization(
  subscription: Subscription,
): Promise<void> {
  const orgId = organizationIdFromPolarSubscriptionMetadata(
    subscription.metadata,
  );

  const logger = getLoggerFactory("PersistPolarSubscription")(
    "persistPolarSubscriptionToOrganization",
  );

  if (!orgId) {
    logger.debug(
      { subscription },
      "No org ID; skipping Polar subscription persist",
    );
    return;
  }

  const newStatus = parseOrganizationSubscriptionStatus(subscription.status);
  const db = await getDbConnection();
  const col = db.collection<Organization>(ORGANIZATIONS_COLLECTION_NAME);

  const before = await col.findOne({ _id: orgId });
  if (before?.feesExempt === true) {
    logger.debug({ orgId }, "Fees exempt; skipping Polar subscription persist");
    return;
  }

  const oldStatus = before?.polarSubscriptionStatus ?? null;
  const oldTier = resolvePlanTierFromProductId(
    before?.polarSubscriptionProductId,
    { feesExempt: before?.feesExempt },
  );

  const newTier = resolvePlanTierFromProductId(subscription.productId, {
    feesExempt: before?.feesExempt,
  });

  logger.debug({ orgId, oldTier, newTier }, "Resolved plan tiers");

  const productMetaType = await resolveProductMetaType(subscription);
  const isSubscriptionProduct = productMetaType === SUBSCRIPTION_PRODUCT_TYPE;

  const previousAvailableUsers = before?.availableUsers ?? null;
  const previousAllowAdditional = before?.allowAdditionalUsers ?? false;
  const previousProductId = before?.polarSubscriptionProductId ?? null;

  logger.debug(
    {
      orgId,
      previousAvailableUsers,
      previousAllowAdditional,
      previousProductId,
    },
    "Previous values",
  );

  await col.updateOne(
    { _id: orgId },
    {
      $set: {
        // Only overwrite base plan fields for products tagged as subscription.
        ...(isSubscriptionProduct
          ? {
              polarSubscriptionId: subscription.id,
              ...(newStatus ? { polarSubscriptionStatus: newStatus } : {}),
              polarSubscriptionProductId: subscription.productId,
            }
          : {}),
      },
    },
  );

  logger.debug({ orgId, isSubscriptionProduct }, "Updated organization fields");

  await syncUserSlotsFromSubscription(orgId, subscription);

  logger.debug({ orgId }, "Synced user slots from subscription");

  const after = await col.findOne({ _id: orgId });
  logger.debug({ orgId, after }, "After values");

  const entitlementsChanged =
    oldStatus !== (after?.polarSubscriptionStatus ?? null) ||
    previousProductId !== (after?.polarSubscriptionProductId ?? null) ||
    (isSubscriptionProduct && oldTier !== newTier) ||
    previousAvailableUsers !== (after?.availableUsers ?? null) ||
    previousAllowAdditional !== (after?.allowAdditionalUsers ?? false);

  logger.debug({ orgId, entitlementsChanged }, "Entitlements changed");

  if (before) {
    logger.debug({ orgId }, "Invalidating organization hostname cache");
    await invalidateOrganizationHostnameCacheForOrganization(before);
  }

  if (
    isSubscriptionProduct &&
    oldTier !== BillingPlanTier.Free &&
    newTier === BillingPlanTier.Free &&
    before?.domain?.trim()
  ) {
    logger.debug({ orgId }, "Setting domain to undefined");
    const services = ServicesContainer(orgId);
    await services.organizationService.setDomain(undefined, systemEventSource);
    const updatedOrg = await col.findOne({ _id: orgId });
    if (updatedOrg) {
      await invalidateOrganizationHostnameCacheForOrganization(updatedOrg);
    }
  }

  if (isSubscriptionProduct && newStatus && oldStatus !== newStatus) {
    logger.debug(
      { orgId, oldStatus, newStatus },
      "Emitting subscription status changed event",
    );
    await emitSubscriptionStatusChangedEvent(orgId, {
      oldStatus,
      newStatus,
      subscriptionId: subscription.id,
      productName: subscription.product?.name ?? null,
    });
  }

  if (entitlementsChanged) {
    logger.debug({ orgId }, "Invalidating organization sessions");
    await invalidateOrganizationSessions(orgId);
  }
}

async function resolveProductMetaType(
  subscription: Subscription,
): Promise<string> {
  const logger = getLoggerFactory("PersistPolarSubscription")(
    "resolveProductMetaType",
  );
  logger.debug({ subscription }, "Resolving product meta type");

  const embedded = String(
    (subscription.product as { metadata?: { type?: string } } | undefined)
      ?.metadata?.type ?? "",
  );
  if (embedded) {
    logger.debug({ embedded }, "Embedded product meta type");
    return embedded;
  }

  const productId = subscription.productId?.trim();
  logger.debug({ productId }, "Product ID");
  const polar = getPolarClient();
  if (!productId || !polar.client) return "";

  try {
    const product = await polar.client.products.get({ id: productId });
    const type = String(product.metadata?.type ?? "");
    logger.debug({ productId, type }, "Resolved product meta type");
    return type;
  } catch {
    logger.debug({ productId }, "Failed to resolve product meta type");
    return "";
  }
}
