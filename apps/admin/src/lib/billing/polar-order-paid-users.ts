import { invalidateOrganizationSessions } from "@/lib/auth/invalidate-organization-sessions";
import type { Order } from "@polar-sh/sdk/models/components/order";
import { getLoggerFactory } from "@hacado/logger";
import { getPolarClient, ServicesContainer } from "@hacado/services";

const USER_SLOTS_PRODUCT_TYPE = "users_amount";

function productIdFromOrder(order: Order): string | null {
  return (
    order.productId?.trim() ||
    order.product?.id?.trim() ||
    order.subscription?.productId?.trim() ||
    null
  );
}

function organizationIdFromOrder(order: Order): string | null {
  const metadata = order.metadata;
  const raw = metadata.org ?? metadata.referenceId;
  if (raw !== undefined && raw !== null) {
    const s = String(raw).trim();
    if (s) return s;
  }
  const ext = order.customer?.externalId;
  if (typeof ext === "string" && ext.trim()) return ext.trim();
  return null;
}

/**
 * Polar `order.paid` for recurring additional-user seat products
 * (`metadata.type === users_amount`).
 */
export async function applyPolarOrderPaidToUserSlots(
  order: Order,
): Promise<void> {
  const logger = getLoggerFactory("PolarOrderPaidUsers")(
    "applyPolarOrderPaidToUserSlots",
  );

  const organizationId = organizationIdFromOrder(order);
  if (!organizationId) {
    logger.debug("No organization id on order; skipping user slots update");
    return;
  }

  const productId = productIdFromOrder(order);
  if (!productId) {
    logger.debug({ orderId: order.id }, "No product id; skipping");
    return;
  }

  try {
    const polarClient = getPolarClient();
    const product = await polarClient.client.products.get({ id: productId });
    if (String(product.metadata?.type ?? "") !== USER_SLOTS_PRODUCT_TYPE) {
      logger.debug({ productId }, "Not a users_amount product; skipping");
      return;
    }

    const usersAmount = Number(product.metadata?.users_amount ?? 0);
    if (!Number.isFinite(usersAmount) || usersAmount <= 0) {
      logger.warn({ productId, usersAmount }, "Invalid users_amount metadata");
      return;
    }

    const subscriptionId =
      order.subscriptionId?.trim() ||
      order.subscription?.id?.trim() ||
      order.id;

    const billing = ServicesContainer(organizationId).billingService;
    await billing.upsertUserSlotGrant({
      polarSubscriptionId: subscriptionId,
      usersAmount,
      source: "addon",
    });

    const team = ServicesContainer(organizationId).teamService;
    await team.reconcileMembersToSlots();
    await invalidateOrganizationSessions(organizationId);

    logger.info(
      { organizationId, usersAmount, subscriptionId },
      "Applied user slot purchase",
    );
  } catch (error) {
    logger.error(
      { error, organizationId, orderId: order.id },
      "applyPolarOrderPaidToUserSlots failed",
    );
  }
}
