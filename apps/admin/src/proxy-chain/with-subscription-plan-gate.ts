import { auth } from "@/app/auth";
import {
  BRAND_SETTINGS_UPGRADE_URL,
  canUseFeature,
} from "@hacado/services/billing";
import { BillingPlanTier, type SubscriptionFeature } from "@hacado/types";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { MiddlewareProxy } from "./types";
import { containsAdminApi } from "./utils";

function getSessionPlanTier(
  session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>,
): BillingPlanTier | null {
  const user = session.user as {
    subscriptionPlanTier?: BillingPlanTier | null;
    feesExempt?: boolean;
  };
  if (user.feesExempt) return BillingPlanTier.Studio;
  return user.subscriptionPlanTier ?? null;
}

function blockedResponse() {
  return NextResponse.json(
    {
      success: false,
      code: "subscription_upgrade_required",
      message: "This feature requires a Solo subscription.",
      settingsUrl: BRAND_SETTINGS_UPGRADE_URL,
    },
    { status: 402 },
  );
}

const API_FEATURE_RULES: Array<{
  prefix: string;
  feature: SubscriptionFeature;
  methods?: string[];
}> = [
  { prefix: "/api/payments", feature: "financials" },
  { prefix: "/api/synced-payments", feature: "financials" },
  { prefix: "/api/discounts", feature: "discounts" },
  { prefix: "/api/gift-cards", feature: "giftCards" },
  { prefix: "/api/packages", feature: "packages" },
  { prefix: "/api/customer-packages", feature: "packages" },
  {
    prefix: "/api/organization/custom-domain",
    feature: "customDomain",
    methods: ["POST"],
  },
];

export const withSubscriptionPlanGate: MiddlewareProxy = (next) => {
  return async (request: NextRequest, event: NextFetchEvent) => {
    if (!containsAdminApi(request.nextUrl.pathname)) {
      return next(request, event);
    }

    const session = await auth.api.getSession({
      headers: request.headers,
      query: { disableCookieCache: true },
    });
    if (!session) {
      return next(request, event);
    }

    const planTier = getSessionPlanTier(session);
    const path = request.nextUrl.pathname;
    const method = request.method.toUpperCase();

    for (const rule of API_FEATURE_RULES) {
      if (!path.startsWith(rule.prefix)) continue;
      if (rule.methods && !rule.methods.includes(method)) continue;
      if (!canUseFeature(planTier, rule.feature)) {
        return blockedResponse();
      }
    }

    return next(request, event);
  };
};
