import { authClient } from "@/app/auth-client";
import { BillingPlanTier, SubscriptionFeature } from "@hacado/types";
import { sessionCanUseFeature } from "./subscription-plan-access";

export const useCanUseFeature = (feature: SubscriptionFeature) => {
  const { data: session } = authClient.useSession();
  const user = session?.user as {
    subscriptionPlanTier?: BillingPlanTier | null;
    feesExempt?: boolean;
  };
  return user ? sessionCanUseFeature({ user }, feature) : false;
};
