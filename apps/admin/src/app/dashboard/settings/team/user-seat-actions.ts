"use server";

import {
  getOrganizationId,
  getServicesContainer,
  getSession,
} from "@/app/utils";
import { resolveAppOrigin } from "@/lib/resolve-app-origin";
import { getLoggerFactory } from "@hacado/logger";
import { getPolarClient, getPolarConfig } from "@hacado/services";
import { canManageTeam } from "@hacado/utils";
import * as z from "zod";

const USER_SLOTS_LABEL = "users_amount";

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

export type UserSeatProductOffer = {
  productId: string;
  name: string;
  description: string | null;
  usersAmount: number;
  priceAmount: number;
  priceCurrency: string;
};

export async function listUserSeatProductOffers(): Promise<
  { ok: true; products: UserSeatProductOffer[] } | { ok: false; code: string }
> {
  const logger = getLoggerFactory("UserSeats")("listUserSeatProductOffers");
  if (!getPolarConfig().accessToken) {
    return { ok: false, code: "polar_unconfigured" };
  }

  const polar = getPolarClient();
  try {
    const page = await polar.listProducts({
      metadata: { type: USER_SLOTS_LABEL },
      isArchived: false,
      isRecurring: true,
      limit: 100,
    });

    const items = page.result?.items ?? [];
    const products: UserSeatProductOffer[] = [];

    for (const product of items) {
      if (String(product.metadata.type ?? "") !== USER_SLOTS_LABEL) continue;
      const price = pickPrimaryFixedPrice(product);
      if (!price) continue;
      const usersAmount = Number(product.metadata?.users_amount ?? 0);
      if (!Number.isFinite(usersAmount) || usersAmount <= 0) continue;

      const desc =
        "description" in product &&
        typeof (product as { description?: unknown }).description === "string"
          ? (product as { description: string }).description.trim() || null
          : null;

      products.push({
        productId: product.id,
        name: product.name,
        description: desc,
        usersAmount,
        priceAmount: price.priceAmount,
        priceCurrency: price.priceCurrency,
      });
    }

    products.sort(
      (a, b) => a.usersAmount - b.usersAmount || a.name.localeCompare(b.name),
    );
    return { ok: true, products };
  } catch (error) {
    logger.error({ error }, "listUserSeatProductOffers failed");
    return { ok: false, code: "polar_list_failed" };
  }
}

const createSeatInput = z.object({
  productId: z.string().min(1),
  returnTo: z
    .enum(["/dashboard/settings/team", "/dashboard/settings/brand"])
    .optional(),
});

export async function createUserSeatCheckoutSession(
  input: z.infer<typeof createSeatInput>,
): Promise<{ ok: true; url: string } | { ok: false; code: string }> {
  const organizationId = await getOrganizationId();
  const logger = getLoggerFactory(
    "UserSeats",
    organizationId,
  )("createUserSeatCheckoutSession");

  const parsed = createSeatInput.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const session = await getSession();
  if (!session?.user?.id) return { ok: false, code: "unauthorized" };

  if (!canManageTeam(session.user)) {
    return { ok: false, code: "forbidden" };
  }

  const services = await getServicesContainer();
  const org = await services.organizationService.getOrganization();
  if (!org?.allowAdditionalUsers) {
    return { ok: false, code: "additional_users_not_allowed" };
  }

  const listResult = await listUserSeatProductOffers();
  if (!listResult.ok) return { ok: false, code: listResult.code };
  if (!listResult.products.some((p) => p.productId === parsed.data.productId)) {
    return { ok: false, code: "invalid_product" };
  }

  const polarBilling = getPolarClient();
  const origin = await resolveAppOrigin();
  const returnPath = parsed.data.returnTo ?? "/dashboard/settings/team";
  const returnUrl = `${origin}${returnPath}`;
  const successUrl = `${returnUrl}?seats_purchased=true`;

  await polarBilling.ensureTeamCustomerForOrganization({
    organizationId,
    ownerUserId: session.user.id,
    ownerEmail: session.user.email,
    ownerName: session.user.name,
    teamName: org?.name,
  });

  try {
    const checkoutSession = await polarBilling.createCheckoutSession({
      products: [parsed.data.productId],
      metadata: {
        org: organizationId,
        kind: "user_seats",
      },
      customerEmail: session.user.email,
      externalCustomerId: organizationId,
      successUrl,
      returnUrl,
    });
    return { ok: true, url: checkoutSession.url };
  } catch (error) {
    logger.error({ error }, "User seat checkout failed");
    return { ok: false, code: "polar_checkout_failed" };
  }
}
