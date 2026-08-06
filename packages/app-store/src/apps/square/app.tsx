import {
  App,
  BillingPlanTier,
  ORGANIZATION_DOMAIN_CHANGED_EVENT_TYPE,
} from "@hacado/types";
import { SQUARE_APP_NAME } from "./const";
import { SquareLogo } from "./logo";
import { SquareAdminKeys, SquareAdminNamespace } from "./translations/types";

export const SquareApp: App<SquareAdminNamespace, SquareAdminKeys> = {
  name: SQUARE_APP_NAME,
  displayName: "app_square_admin.app.displayName",
  scope: ["payment"],
  type: "oauth",
  target: "company",
  category: ["apps.categories.payment"],
  subscribeTo: [ORGANIZATION_DOMAIN_CHANGED_EVENT_TYPE],
  Logo: ({ className }) => <SquareLogo className={className} />,
  isFeatured: true,
  minimumPlanTier: BillingPlanTier.Solo,
  description: {
    text: "app_square_admin.app.description",
  },
};
