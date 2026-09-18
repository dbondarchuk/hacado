import { App } from "@hacado/types";
import { AUTOMATIC_STRUCTURED_DATA_APP_NAME } from "./const";
import { AutomaticStructuredDataLogo } from "./logo";
import {
  AutomaticStructuredDataAdminAllKeys,
  AutomaticStructuredDataAdminKeys,
  AutomaticStructuredDataAdminNamespace,
} from "./translations/types";

export const AutomaticStructuredDataApp: App<
  AutomaticStructuredDataAdminNamespace,
  AutomaticStructuredDataAdminKeys
> = {
  name: AUTOMATIC_STRUCTURED_DATA_APP_NAME,
  displayName:
    "app_automatic-structured-data_admin.app.displayName" satisfies AutomaticStructuredDataAdminAllKeys,
  category: ["apps.categories.content"],
  scope: ["script-provider"],
  type: "basic",
  target: "company",
  Logo: ({ className }) => (
    <AutomaticStructuredDataLogo className={className} />
  ),
  isFeatured: false,
  isHidden: false,
  dontAllowMultiple: true,
  description: {
    text: "app_automatic-structured-data_admin.app.description" satisfies AutomaticStructuredDataAdminAllKeys,
  },
};
