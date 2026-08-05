import { getSession } from "@/app/utils";
import {
  BRAND_SETTINGS_UPGRADE_URL,
  sessionCanUseFeature,
} from "@/lib/billing/subscription-plan-access";
import type { SubscriptionFeature } from "@hacado/types";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";

export async function getSubscriptionFeatureBlockedResponse(
  feature: SubscriptionFeature,
) {
  const session = await getSession();
  if (!session || sessionCanUseFeature(session, feature)) {
    return null;
  }

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

export async function redirectIfFeatureUnavailable(feature: SubscriptionFeature) {
  const session = await getSession();
  if (!session) {
    redirect("/auth/signin");
  }
  if (!sessionCanUseFeature(session, feature)) {
    redirect(BRAND_SETTINGS_UPGRADE_URL);
  }
}
