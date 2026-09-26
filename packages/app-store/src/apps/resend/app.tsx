import { App, BillingPlanTier } from "@hacado/types";
import { RESEND_APP_NAME } from "./const";
import { ResendLogo } from "./logo";
import { ResendAdminKeys, ResendAdminNamespace } from "./translations/types";

export const ResendApp: App<ResendAdminNamespace, ResendAdminKeys> = {
  name: RESEND_APP_NAME,
  displayName: "app_resend_admin.app.displayName",
  scope: ["mail-send", "needs-attention-provider"],
  type: "oauth",
  target: "company",
  category: ["apps.categories.communications"],
  Logo: ({ className }) => <ResendLogo className={className} />,
  minimumPlanTier: BillingPlanTier.Solo,
  description: {
    text: "app_resend_admin.app.description",
  },
};
