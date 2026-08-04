import { App, BillingPlanTier } from "@timelish/types";
import { SMTP_APP_NAME } from "./const";
import { SmtpLogo } from "./logo";
import { SmtpAdminKeys, SmtpAdminNamespace } from "./translations/types";

export const SmtpApp: App<SmtpAdminNamespace, SmtpAdminKeys> = {
  name: SMTP_APP_NAME,
  displayName: "app_smtp_admin.app.displayName",
  scope: ["mail-send"],
  type: "complex",
  target: "company",
  category: ["apps.categories.communications"],
  Logo: ({ className }) => <SmtpLogo className={className} />,
  isFeatured: true,
  dontAllowMultiple: true,
  minimumPlanTier: BillingPlanTier.Solo,
  description: {
    text: "app_smtp_admin.app.description",
  },
  settingsHref: "settings/smtp",
};
