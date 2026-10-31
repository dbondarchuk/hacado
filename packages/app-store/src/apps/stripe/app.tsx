import type { App } from "@hacado/types/apps";
import { BillingPlanTier } from "@hacado/types/billing";
import { ORGANIZATION_DOMAIN_CHANGED_EVENT_TYPE } from "@hacado/types/events";
import { STRIPE_APP_NAME } from "./const";
import { StripeLogo } from "./logo";
import { StripeAdminKeys, StripeAdminNamespace } from "./translations/types";

export const StripeApp: App<StripeAdminNamespace, StripeAdminKeys> = {
  name: STRIPE_APP_NAME,
  displayName: "app_stripe_admin.app.displayName",
  scope: ["payment"],
  type: "oauth",
  target: "company",
  category: ["apps.categories.payment"],
  subscribeTo: [ORGANIZATION_DOMAIN_CHANGED_EVENT_TYPE],
  Logo: ({ className }) => <StripeLogo className={className} />,
  isFeatured: true,
  minimumPlanTier: BillingPlanTier.Solo,
  description: {
    text: "app_stripe_admin.app.description",
  },
};
