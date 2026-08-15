import { auth } from "@/app/auth";
import { getServicesContainer } from "@/app/utils";
import { resolveAppOrigin } from "@/lib/resolve-app-origin";
import { getLoggerFactory } from "@hacado/logger";
import { getPolarClient } from "@hacado/services";
import { headers } from "next/headers";

export async function createPolarBillingPortalSession(): Promise<
  { ok: true; url: string } | { ok: false; code: string }
> {
  const logger = getLoggerFactory("API/billing/portal")(
    "createPolarBillingPortalSession",
  );

  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session?.user?.id) {
    logger.error("Unauthorized");
    return { ok: false, code: "unauthorized" };
  }

  const organizationId = (
    session.user as { organizationId?: string }
  ).organizationId?.trim();
  if (!organizationId) {
    logger.error({ userId: session.user.id }, "No organization id");
    return { ok: false, code: "no_org" };
  }

  const services = await getServicesContainer();
  const org = await services.organizationService.getOrganization();

  if (org?.feesExempt === true) {
    logger.error({ organizationId }, "Organization is fees exempt");
    return { ok: false, code: "fees_exempt" };
  }

  const polarBilling = getPolarClient();
  await polarBilling.ensureTeamCustomerForOrganization({
    organizationId,
    ownerUserId: session.user.id,
    ownerEmail: session.user.email,
    ownerName: session.user.name,
    teamName: org?.name,
  });

  const origin = await resolveAppOrigin();
  const returnUrl = `${origin}/dashboard/settings/brand`;

  logger.debug({ returnUrl }, "Creating Polar billing portal session");
  try {
    const portalSession = await polarBilling.createCustomerBillingPortalSession(
      {
        externalCustomerId: organizationId,
        externalMemberId: session.user.id,
        returnUrl,
      },
    );

    logger.debug(
      { url: portalSession.customerPortalUrl, organizationId },
      "Created Polar billing portal session",
    );
    return { ok: true, url: portalSession.customerPortalUrl };
  } catch (error) {
    logger.error(
      { error, organizationId },
      "Error creating Polar billing portal session",
    );
    return { ok: false, code: "polar_error" };
  }
}
