import { isSubscriptionInactive } from "@/utils/subscription-access";
import { getBaseLoggerFactory } from "@hacado/logger";
import {
  resolveOrganizationByHostname,
  resolvePlanTierFromOrganization,
  StaticOrganizationService,
} from "@hacado/services";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { ChainableProxy, MiddlewareProxy } from "./types";

const ORG_NOT_FOUND_PATH = "/organization-not-found";

function rewriteToOrganizationNotFoundPage(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = ORG_NOT_FOUND_PATH;
  return NextResponse.rewrite(url);
}

function responseWhenOrganizationNotFound(
  request: NextRequest,
  next: ChainableProxy,
  event: NextFetchEvent,
) {
  if (request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.json(
      {
        success: false,
        code: "organization_not_found",
        message: "Organization not found",
      },
      { status: 404 },
    );
  }
  if (request.nextUrl.pathname === ORG_NOT_FOUND_PATH) {
    return next(request, event);
  }
  return rewriteToOrganizationNotFoundPage(request);
}

function responseWhenSubscriptionInactive(
  request: NextRequest,
  next: ChainableProxy,
  event: NextFetchEvent,
) {
  if (request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.json(
      {
        success: false,
        code: "subscription_inactive",
        message: "Organization subscription is inactive",
      },
      { status: 402 },
    );
  }
  if (request.nextUrl.pathname === ORG_NOT_FOUND_PATH) {
    return next(request, event);
  }
  return rewriteToOrganizationNotFoundPage(request);
}

export const withOrganizationId: MiddlewareProxy = (next) => {
  return async (request: NextRequest, event: NextFetchEvent) => {
    if (request.nextUrl.pathname.startsWith("/_next")) {
      return next(request, event);
    }

    const { headers } = request;
    const hostname =
      headers.get("x-forwarded-host") || headers.get("host") || "";

    const logger = getBaseLoggerFactory({
      correlationId: request.headers.get("x-correlation-id"),
      sessionId: request.headers.get("x-session-id"),
      hostname,
      url: request.url,
      method: request.method,
    });

    logger.debug("Looking up organization");

    let slug: string;
    let organizationId: string;
    let subscriptionStatus = "active";
    let subscriptionPlanTier: string | null = null;

    const publicDomain = process.env.PUBLIC_DOMAIN;
    const isPublicDomainHostname =
      publicDomain && hostname.endsWith(`.${publicDomain}`);

    if (process.env.ORGANIZATION_SLUG && !isPublicDomainHostname) {
      slug = process.env.ORGANIZATION_SLUG;
      const organization =
        await new StaticOrganizationService().getOrganizationBySlug(slug);
      if (!organization) {
        logger.debug({ slug }, "Organization not found by slug: hardcoded");
        return responseWhenOrganizationNotFound(request, next, event);
      }

      organizationId = organization._id;
      slug = organization.slug;
      subscriptionStatus = organization.polarSubscriptionStatus || "active";
      subscriptionPlanTier =
        resolvePlanTierFromOrganization(organization) ?? null;

      logger.debug(
        { organizationId, slug, subscriptionStatus },
        "Organization found by slug: hardcoded",
      );
    } else {
      const resolution = await resolveOrganizationByHostname(hostname);
      if (!resolution) {
        logger.debug(
          { hostname, isPublicDomainHostname },
          "Organization not found by hostname",
        );
        return responseWhenOrganizationNotFound(request, next, event);
      }

      organizationId = resolution.organizationId;
      slug = resolution.slug;
      subscriptionStatus = resolution.subscriptionStatus;
      subscriptionPlanTier = resolution.subscriptionPlanTier;

      if (!isPublicDomainHostname) {
        request.headers.set("x-organization-domain", hostname);
      }

      logger.debug(
        {
          organizationId,
          slug,
          subscriptionStatus,
          isPublicDomainHostname,
        },
        isPublicDomainHostname
          ? "Organization found by slug subdomain"
          : "Organization found by custom domain",
      );
    }

    if (isSubscriptionInactive(subscriptionStatus)) {
      logger.debug(
        { organizationId, slug, subscriptionStatus },
        "Subscription inactive",
      );
      return responseWhenSubscriptionInactive(request, next, event);
    }

    request.headers.set("x-organization-id", organizationId);
    request.headers.set("x-organization-slug", slug);
    request.headers.set("x-subscription-status", subscriptionStatus);
    if (subscriptionPlanTier) {
      request.headers.set("x-subscription-plan-tier", subscriptionPlanTier);
    }

    return next(request, event);
  };
};
