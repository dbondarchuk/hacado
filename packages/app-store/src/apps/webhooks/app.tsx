import { App, BillingPlanTier } from "@hacado/types";
import { WebhooksLogo } from "./logo";
import {
  WebhooksAdminKeys,
  WebhooksAdminNamespace,
} from "./translations/types";

export const webhooksApp: App<WebhooksAdminNamespace, WebhooksAdminKeys> = {
  name: "webhooks",
  displayName: "app_webhooks_admin.app.displayName",
  category: ["apps.categories.notifications"],
  subscribeTo: ["*"],
  scope: ["event-subscriber"],
  description: {
    text: "app_webhooks_admin.app.description",
  },
  Logo: WebhooksLogo,
  isFeatured: false,
  type: "basic",
  target: "company",
  dontAllowMultiple: false,
  minimumPlanTier: BillingPlanTier.Solo,
  requiredPermission: {
    resource: "app",
    action: "useCompany",
  },
};
