import type { Order } from "@polar-sh/sdk/models/components/order";
import { getLoggerFactory } from "@hacado/logger";
import { getPolarClient, ServicesContainer } from "@hacado/services";

const SMS_TOPUP_PRODUCT_TYPE = "sms_credits";

function productIdForSmsProcessing(order: Order): string | null {
  return (
    order.productId?.trim() ||
    order.product?.id?.trim() ||
    order.subscription?.productId?.trim() ||
    null
  );
}

/**
 * Polar `order.paid` webhook: updates org SMS pools via {@link IBillingService.applyPolarOrderPaid}.
 */
export async function applyPolarOrderPaidToSmsBalances(
  order: Order,
): Promise<void> {
  const logger = getLoggerFactory("PolarOrderPaidSms")(
    "applyPolarOrderPaidToSmsBalances",
  );

  logger.debug({ order }, "Applying Polar order paid to SMS balances");

  const metadata = order.metadata;
  const metadataOrganizationId = metadata.org ?? metadata.referenceId;
  let organizationId: string | null = null;
  if (!!metadataOrganizationId) {
    const s = String(metadataOrganizationId).trim();
    if (s) organizationId = s;

    logger.debug({ organizationId }, "Organization id found in metadata");
  }

  if (!organizationId) {
    const ext = order.customer?.externalId;
    if (typeof ext === "string" && ext.trim()) organizationId = ext.trim();

    logger.debug(
      { organizationId },
      "Organization id found in customer external id",
    );
  }

  if (!organizationId) {
    logger.debug("No organization id on order; skipping SMS balance update");
    return;
  }

  logger.debug({ organizationId }, "Organization id found");

  const polarClient = getPolarClient();
  const billingService = ServicesContainer(organizationId).billingService;

  const meterId = polarClient.config.smsCreditsMeterId?.trim() ?? "";
  const productId = productIdForSmsProcessing(order);
  if (!productId) {
    logger.debug(
      { orderId: order.id, billingReason: order.billingReason },
      "No product id on order (tried productId, product, subscription); skipping",
    );

    return;
  }

  logger.debug({ productId }, "Product id found");
  try {
    const product = await polarClient.client.products.get({ id: productId });
    if (!product.isRecurring) {
      logger.debug(
        { product },
        "Product is not recurring; adding top-up credits",
      );

      if (String(product.metadata?.type ?? "") !== SMS_TOPUP_PRODUCT_TYPE) {
        logger.debug(
          { productId },
          "Product is not a SMS top-up product; skipping",
        );
        return;
      }

      for (const benefit of product.benefits) {
        if (benefit.type !== "meter_credit") continue;
        if (benefit.properties.meterId !== meterId) continue;
        const units = Math.max(0, benefit.properties.units);
        logger.debug(
          { units },
          "Adding SMS top-up credits from one-time order.paid",
        );

        if (units === 0) {
          logger.warn({ units }, "No SMS top-up credits to add; skipping");

          return;
        }

        await billingService.addTopupSmsCredits(units);
        logger.info(
          {
            organizationId,
            units,
            billingReason: order.billingReason,
          },
          "Added SMS top-up credits from one-time order.paid",
        );
        return;
      }

      logger.debug({ product }, "No meter credit benefit found; skipping");
      return;
    }

    logger.debug(
      { product },
      "Product is recurring; checking if it is a subscription cycle or create",
    );

    const cycleOrCreate =
      order.billingReason === "subscription_cycle" ||
      order.billingReason === "subscription_create" ||
      order.billingReason === "subscription_update";

    if (!cycleOrCreate) {
      logger.debug(
        { order },
        "Product is not a subscription cycle create or update; skipping",
      );
      return;
    }

    if (!meterId) {
      logger.warn("POLAR_SMS_CREDITS_METER_ID not set; cannot set included");
      return;
    }

    for (const benefit of product.benefits) {
      if (benefit.type !== "meter_credit") continue;
      if (benefit.properties.meterId !== meterId) continue;
      const units = Math.max(0, benefit.properties.units);
      logger.debug(
        { units },
        "Setting included SMS credits from subscription order.paid (renewal or create)",
      );
      await billingService.setIncludedSmsCredits(units);
      logger.info(
        {
          organizationId,
          units,
          billingReason: order.billingReason,
        },
        "Set included SMS credits from subscription order.paid (renewal or create)",
      );
      return;
    }
  } catch (error) {
    logger.error(
      { error, organizationId, orderId: order.id },
      "applyPolarOrderPaid failed",
    );
  }
}
