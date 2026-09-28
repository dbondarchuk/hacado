"use client";

import { authClient } from "@/app/auth-client";
import { isSubscriptionInactive } from "@/lib/billing/subscription-access";
import { useI18n } from "@hacado/i18n/client";
import { FC, useEffect } from "react";

export const SubscriptionStatusListener: FC = () => {
  const { data: session } = authClient.useSession();
  const t = useI18n();

  useEffect(() => {
    if (!session?.user?.id) return;
    if (typeof window === "undefined") return;

    const subscriptionStatus = (session.user as any).subscriptionStatus;
    const feesExempt = (session.user as any).feesExempt;

    if (!feesExempt && isSubscriptionInactive(subscriptionStatus)) {
      window.location.reload();
    }
  }, [session?.user?.id, t]);

  return null;
};
