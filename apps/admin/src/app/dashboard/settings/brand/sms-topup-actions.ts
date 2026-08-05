"use server";

import {
  getOrganizationId,
  getServicesContainer,
  getSession,
} from "@/app/utils";
import { resolveAppOrigin } from "@/lib/resolve-app-origin";
import { Product } from "@polar-sh/sdk/models/components/product.js";
import { getLoggerFactory } from "@hacado/logger";
import { getPolarClient, getPolarConfig } from "@hacado/services";
import * as z from "zod";

const logger = getLoggerFactory("SmsTopup")("actions");

const SMS_TOPUP_LABEL = "sms_credits";

function parseCreditAmount(product: Product, meterId: string): number | null {
  for (const benefit of product.benefits) {
    if (benefit.type !== "meter_credit") continue;
    if (benefit.properties.meterId !== meterId) continue;
    return Math.max(0, benefit.properties.units);
  }

  return null;
}

function pickPrimaryFixedPrice(product: {
  prices: Array<{
    amountType?: string;
    isArchived: boolean;
    priceAmount?: number;
    priceCurrency: string;
  }>;
}): {
  priceAmount: number;
  priceCurrency: string;
} | null {
  for (const price of product.prices) {
    if (
      price &&
      "amountType" in price &&
      price.priceAmount !== undefined &&
      price.amountType === "fixed" &&
      !price.isArchived
    ) {
      return {
        priceAmount: price.priceAmount,
        priceCurrency: price.priceCurrency,
      };
    }
  }
  return null;
}

export type SmsTopupProductOffer = {
  productId: string;
  name: string;
  /** Short blurb (Polar product description) shown under the title when set. */
  description: string | null;
  credits: number | null;
  priceAmount: number;
  priceCurrency: string;
};

/**
 * One-time products tagged with `metadata.type = sms_credits` in Polar.
 */
export async function listSmsTopupProductOffers(): Promise<
  { ok: true; products: SmsTopupProductOffer[] } | { ok: false; code: string }
> {
  const logger = getLoggerFactory("SmsTopup")("listSmsTopupProductOffers");
  logger.debug("Listing SMS top-up product offers");
  if (!getPolarConfig().accessToken) {
    logger.error("Polar is not configured");
    return { ok: false, code: "polar_unconfigured" };
  }

  const polar = getPolarClient();

  try {
    const page = await polar.listProducts({
      metadata: { type: SMS_TOPUP_LABEL },
      isArchived: false,
      isRecurring: false,
      limit: 100,
    });

    const items = page.result?.items ?? [];
    const products: SmsTopupProductOffer[] = [];

    logger.debug({ count: items.length }, "Found items");

    for (const product of items) {
      if (String(product.metadata.type ?? "") !== SMS_TOPUP_LABEL) continue;
      const price = pickPrimaryFixedPrice(product);
      if (!price) continue;

      const desc =
        "description" in product &&
        typeof (product as { description?: unknown }).description === "string"
          ? (product as { description: string }).description.trim() || null
          : null;

      const credits = parseCreditAmount(
        product,
        polar.config.smsCreditsMeterId,
      );
      if (credits === null) continue;

      const offer: SmsTopupProductOffer = {
        productId: product.id,
        name: product.name,
        description: desc,
        credits,
        priceAmount: price.priceAmount,
        priceCurrency: price.priceCurrency,
      };

      logger.debug({ offer }, "Found product");
      products.push(offer);
    }

    logger.debug({ count: products.length }, "Found offers");

    products.sort(
      (a, b) =>
        (a.credits ?? 0) - (b.credits ?? 0) || a.name.localeCompare(b.name),
    );

    return { ok: true, products };
  } catch (error) {
    logger.error({ error }, "listSmsTopupProductOffers failed");
    return { ok: false, code: "polar_list_failed" };
  }
}

const createTopupInput = z.object({
  productId: z.string().min(1),
});

export async function createSmsTopupCheckoutSession(
  input: z.infer<typeof createTopupInput>,
): Promise<{ ok: true; url: string } | { ok: false; code: string }> {
  const organizationId = await getOrganizationId();
  const logger = getLoggerFactory(
    "SmsTopup",
    organizationId,
  )("createSmsTopupCheckoutSession");
  logger.debug({ input }, "Creating SMS top-up checkout session");

  const parsed = createTopupInput.safeParse(input);
  if (!parsed.success) {
    logger.error({ input, errors: parsed.error.message }, "Invalid input");
    return { ok: false, code: "invalid_input" };
  }

  const { productId } = parsed.data;

  const session = await getSession();
  if (!session?.user?.id) {
    logger.error("Unauthorized");
    return { ok: false, code: "unauthorized" };
  }

  if (!(session.user as { emailVerified?: boolean }).emailVerified) {
    logger.error({ userId: session.user.id }, "Email not verified");
    return { ok: false, code: "email_not_verified" };
  }

  if (session.user.role !== "owner") {
    logger.error({ userId: session.user.id }, "User is not an owner");
    return { ok: false, code: "not_owner" };
  }

  const sessionOrg = (
    session.user as { organizationId?: string }
  ).organizationId?.trim();
  if (!sessionOrg || sessionOrg !== organizationId) {
    return { ok: false, code: "organization_mismatch" };
  }

  const listResult = await listSmsTopupProductOffers();
  if (!listResult.ok) {
    logger.error({ listResult }, "Failed to list SMS top-up product offers");
    return { ok: false, code: listResult.code };
  }

  if (!listResult.products.some((p) => p.productId === productId)) {
    logger.error({ productId }, "Invalid product");
    return { ok: false, code: "invalid_product" };
  }

  const services = await getServicesContainer();
  const org = await services.organizationService.getOrganization();
  const polarBilling = getPolarClient();

  const origin = await resolveAppOrigin();
  const returnUrl = `${origin}/dashboard/settings/brand`;
  const successUrl = `${returnUrl}?sms_topup=true`;

  await polarBilling.ensureTeamCustomerForOrganization({
    organizationId,
    ownerUserId: session.user.id,
    ownerEmail: session.user.email,
    ownerName: session.user.name,
    teamName: org?.name,
  });

  try {
    const checkoutSession = await polarBilling.createCheckoutSession({
      products: [productId],
      metadata: {
        org: organizationId,
        kind: "sms_topup",
      },
      customerEmail: session.user.email,
      externalCustomerId: organizationId,
      successUrl,
      returnUrl,
    });
    return { ok: true, url: checkoutSession.url };
  } catch (error) {
    logger.error({ error, productId, organizationId }, "SMS top-up checkout");
    return { ok: false, code: "polar_checkout_failed" };
  }
}
