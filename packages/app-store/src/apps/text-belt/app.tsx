import { App, BillingPlanTier } from "@timelish/types";
import { TEXTBELT_APP_NAME } from "./const";
import { TextBeltLogo } from "./logo";
import {
  TextBeltAdminKeys,
  TextBeltAdminNamespace,
} from "./translations/types";

export const TextBeltApp: App<TextBeltAdminNamespace, TextBeltAdminKeys> = {
  name: TEXTBELT_APP_NAME,
  displayName: "app_text-belt_admin.app.displayName",
  scope: ["text-message-send"],
  category: ["apps.categories.communications"],
  type: "basic",
  target: "company",
  Logo: ({ className }) => <TextBeltLogo className={className} />,
  minimumPlanTier: BillingPlanTier.Solo,
  description: {
    text: "app_text-belt_admin.app.description",
  },
};
