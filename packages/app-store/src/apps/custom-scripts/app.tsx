import { App } from "@hacado/types/apps";
import { BillingPlanTier } from "@hacado/types/billing";
import { CUSTOM_SCRIPTS_APP_NAME } from "./const";
import { CustomScriptsLogo } from "./logo";
import {
  CustomScriptsAdminAllKeys,
  CustomScriptsAdminKeys,
  CustomScriptsAdminNamespace,
} from "./translations/types";

export const CustomScriptsApp: App<
  CustomScriptsAdminNamespace,
  CustomScriptsAdminKeys
> = {
  name: CUSTOM_SCRIPTS_APP_NAME,
  displayName:
    "app_custom-scripts_admin.app.displayName" satisfies CustomScriptsAdminAllKeys,
  category: ["apps.categories.content"],
  scope: ["script-provider"],
  type: "complex",
  target: "company",
  Logo: ({ className }) => <CustomScriptsLogo className={className} />,
  isFeatured: false,
  isHidden: false,
  dontAllowMultiple: true,
  minimumPlanTier: BillingPlanTier.Solo,
  description: {
    text: "app_custom-scripts_admin.app.description" satisfies CustomScriptsAdminAllKeys,
  },
  settingsHref: "settings/custom-scripts",
};
