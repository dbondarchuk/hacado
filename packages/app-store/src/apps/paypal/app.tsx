import { App, BillingPlanTier } from "@hacado/types";
import { PAYPAL_APP_NAME } from "./const";
import { PaypalLogo } from "./logo";
import { PaypalAdminKeys, PaypalAdminNamespace } from "./translations/types";

export const PaypalApp: App<PaypalAdminNamespace, PaypalAdminKeys> = {
  name: PAYPAL_APP_NAME,
  displayName: "app_paypal_admin.app.displayName",
  scope: ["payment"],
  type: "basic",
  target: "company",
  category: ["apps.categories.payment"],
  Logo: ({ className }) => <PaypalLogo className={className} />,
  isFeatured: true,
  minimumPlanTier: BillingPlanTier.Solo,
  description: {
    text: "app_paypal_admin.app.description",
  },
};
