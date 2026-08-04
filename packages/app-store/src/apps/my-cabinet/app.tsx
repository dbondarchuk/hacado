import { App, BillingPlanTier } from "@timelish/types";
import { UserRound } from "lucide-react";
import { MY_CABINET_APP_NAME } from "./const";
import {
  MyCabinetAdminAllKeys,
  MyCabinetAdminKeys,
  MyCabinetAdminNamespace,
} from "./translations/types";

export const MyCabinetApp: App<MyCabinetAdminNamespace, MyCabinetAdminKeys> = {
  name: MY_CABINET_APP_NAME,
  displayName:
    "app_my-cabinet_admin.app.displayName" satisfies MyCabinetAdminAllKeys,
  category: ["apps.categories.appointments"],
  scope: ["ui-components"],
  type: "basic",
  target: "company",
  Logo: ({ className }) => <UserRound className={className} />,
  isFeatured: false,
  isHidden: false,
  dontAllowMultiple: true,
  description: {
    text: "app_my-cabinet_admin.app.description" satisfies MyCabinetAdminAllKeys,
  },
  minimumPlanTier: BillingPlanTier.Solo,
};
