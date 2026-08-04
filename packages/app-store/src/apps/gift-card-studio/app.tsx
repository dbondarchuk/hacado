import { App, BillingPlanTier } from "@timelish/types";
import { Gift } from "lucide-react";
import { GIFT_CARD_STUDIO_APP_NAME } from "./const";
import {
  GiftCardStudioAdminAllKeys,
  GiftCardStudioAdminKeys,
  GiftCardStudioAdminNamespace,
} from "./translations/types";

export const GiftCardStudioApp: App<
  GiftCardStudioAdminNamespace,
  GiftCardStudioAdminKeys
> = {
  name: GIFT_CARD_STUDIO_APP_NAME,
  displayName:
    "app_gift-card-studio_admin.app.displayName" satisfies GiftCardStudioAdminAllKeys,
  category: ["apps.categories.content"],
  scope: [
    "ui-components",
    "demo-arguments-provider",
    "communication-templates-provider",
    "dashboard-notifier",
  ],
  type: "complex",
  target: "company",
  Logo: ({ className }) => <Gift className={className} />,
  isFeatured: true,
  isHidden: false,
  dontAllowMultiple: true,
  minimumPlanTier: BillingPlanTier.Solo,
  description: {
    text: "app_gift-card-studio_admin.app.description" satisfies GiftCardStudioAdminAllKeys,
  },
  settingsHref: "gift-card-studio/settings",
};
