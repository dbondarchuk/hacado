import {
  App,
  BillingPlanTier,
  PAYMENT_INTENT_PAID_EVENT_TYPE,
} from "@hacado/types";
import { Link2 } from "lucide-react";
import { PAYMENT_LINKS_APP_NAME } from "./const";
import {
  PaymentLinksAdminAllKeys,
  PaymentLinksAdminKeys,
  PaymentLinksAdminNamespace,
} from "./translations/types";

export const PaymentLinksApp: App<
  PaymentLinksAdminNamespace,
  PaymentLinksAdminKeys
> = {
  name: PAYMENT_LINKS_APP_NAME,
  displayName:
    "app_payment-links_admin.app.displayName" satisfies PaymentLinksAdminAllKeys,
  type: "basic",
  target: "company",
  dontAllowMultiple: true,
  minimumPlanTier: BillingPlanTier.Solo,
  category: ["apps.categories.payment"],
  scope: [
    "payment-link",
    "public-page-provider",
    "communication-templates-provider",
    "event-subscriber",
  ],
  subscribeTo: [PAYMENT_INTENT_PAID_EVENT_TYPE],
  Logo: ({ className }) => <Link2 className={className} />,
  isFeatured: false,
  isHidden: false,
  description: {
    text: "app_payment-links_admin.app.description" satisfies PaymentLinksAdminAllKeys,
  },
};
