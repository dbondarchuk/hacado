"use server";

import { auth } from "@/app/auth";
import { getServicesContainer } from "@/app/utils";
import { resolveAppOrigin } from "@/lib/resolve-app-origin";
import { getLoggerFactory } from "@hacado/logger";
import { getPolarClient } from "@hacado/services";
import { headers } from "next/headers";
import * as z from "zod";

const createCheckoutInputSchema = z.object({
  productId: z.string().min(1),
  organizationId: z.string().min(1),
  /** All billable product ids (selected product should be first in the Polar session). */
  productIds: z.array(z.string().min(1)).min(1),
});

/**
 * Polar checkout session (SDK), same pattern as
 * https://dev.to/phumudzosly/polarsh-betterauth-for-organizations-1j1b - metadata.org for webhooks.
 */
export async function createPolarCheckoutSession(
  input: z.infer<typeof createCheckoutInputSchema>,
): Promise<{ ok: true; url: string } | { ok: false; code: string }> {
  const logger = getLoggerFactory("Checkout")("createPolarCheckoutSession");

  logger.debug({ input }, "Creating Polar checkout session");

  const parsed = createCheckoutInputSchema.safeParse(input);
  if (!parsed.success) {
    logger.error({ input, errors: parsed.error.message }, "Invalid input");
    return { ok: false, code: "invalid_input" };
  }

  const { productId, organizationId, productIds } = parsed.data;
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user?.id) {
    logger.error({ userId: session?.user?.id }, "Unauthorized");
    return { ok: false, code: "unauthorized" };
  }
  if (!(session.user as { emailVerified?: boolean }).emailVerified) {
    logger.error({ userId: session.user.id }, "Email not verified");
    return { ok: false, code: "email_not_verified" };
  }

  const sessionOrg = (
    session.user as { organizationId?: string }
  ).organizationId?.trim();
  if (!sessionOrg || sessionOrg !== organizationId) {
    return { ok: false, code: "organization_mismatch" };
  }

  const products = [productId, ...productIds.filter((id) => id !== productId)];

  const origin = await resolveAppOrigin();
  const successUrl = `${origin}/install?checkout_id={CHECKOUT_ID}`;

  const services = await getServicesContainer();
  const org = await services.organizationService.getOrganization();

  const polarBilling = getPolarClient();
  logger.debug({ organizationId }, "Ensuring Polar team customer");
  await polarBilling.ensureTeamCustomerForOrganization({
    organizationId,
    ownerUserId: session.user.id,
    ownerEmail: session.user.email,
    ownerName: session.user.name,
    teamName: org?.name,
  });

  try {
    logger.debug(
      { products, organizationId },
      "Creating Polar checkout session",
    );
    const checkoutSession = await polarBilling.createCheckoutSession({
      products,
      metadata: {
        org: organizationId,
      },
      customerEmail: session.user.email,
      externalCustomerId: organizationId,
      successUrl,
      returnUrl: `${origin}/checkout`,
    });

    logger.debug(
      { url: checkoutSession.url, organizationId },
      "Created Polar checkout session",
    );
    return { ok: true, url: checkoutSession.url };
  } catch (error) {
    logger.error(
      { error, organizationId },
      "Error creating Polar checkout session",
    );
    return { ok: false, code: "polar_checkout_failed" };
  }
}
