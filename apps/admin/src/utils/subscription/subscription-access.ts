import { getSession } from "@/app/utils";
import {
  isSubscriptionInactive,
  isSubscriptionPastDue,
} from "@/lib/billing/subscription-access";
import { NextResponse } from "next/server";

export async function getSubscriptionBlockingResponseForAppointmentWriteActions() {
  const session = await getSession();
  const subscriptionStatus = session.user.subscriptionStatus;

  if (isSubscriptionPastDue(subscriptionStatus)) {
    return NextResponse.json(
      {
        success: false,
        code: "subscription_past_due",
        message:
          "Subscription payment is past due. Booking changes are temporarily disabled.",
        settingsUrl: "/dashboard/settings/brand?activeTab=general",
        portalUrl: "/dashboard/settings/brand?activeTab=general",
      },
      { status: 402 },
    );
  }

  if (isSubscriptionInactive(subscriptionStatus)) {
    return NextResponse.json(
      {
        success: false,
        code: "subscription_inactive",
        message: "Organization subscription is inactive.",
      },
      { status: 402 },
    );
  }

  return null;
}
