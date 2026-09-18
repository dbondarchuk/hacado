import { App } from "@hacado/types";
import { AUTOMATIC_AI_DISCOVERY_APP_NAME } from "./const";
import { AutomaticAiDiscoveryLogo } from "./logo";
import {
  AutomaticAiDiscoveryAdminAllKeys,
  AutomaticAiDiscoveryAdminKeys,
  AutomaticAiDiscoveryAdminNamespace,
} from "./translations/types";

export const AutomaticAiDiscoveryApp: App<
  AutomaticAiDiscoveryAdminNamespace,
  AutomaticAiDiscoveryAdminKeys
> = {
  name: AUTOMATIC_AI_DISCOVERY_APP_NAME,
  displayName:
    "app_automatic-ai-discovery_admin.app.displayName" satisfies AutomaticAiDiscoveryAdminAllKeys,
  category: ["apps.categories.content"],
  scope: ["page-metadata-provider", "llms-full-txt-provider"],
  type: "basic",
  target: "company",
  Logo: ({ className }) => <AutomaticAiDiscoveryLogo className={className} />,
  isFeatured: false,
  isHidden: false,
  dontAllowMultiple: true,
  description: {
    text: "app_automatic-ai-discovery_admin.app.description" satisfies AutomaticAiDiscoveryAdminAllKeys,
  },
};
