import { App, BillingPlanTier } from "@hacado/types";
import { IdCard } from "lucide-react";
import { CARDDAV_APP_NAME } from "./const";
import {
  CarddavAdminAllKeys,
  CarddavAdminKeys,
  CarddavAdminNamespace,
} from "./translations/types";

export const CarddavApp: App<CarddavAdminNamespace, CarddavAdminKeys> = {
  name: CARDDAV_APP_NAME,
  displayName:
    "app_carddav_admin.app.displayName" satisfies CarddavAdminAllKeys,
  category: ["apps.categories.customers"],
  scope: [],
  type: "basic",
  target: "member",
  Logo: ({ className }) => <IdCard className={className} />,
  isFeatured: false,
  dontAllowMultiple: true,
  description: {
    text: "app_carddav_admin.app.description" satisfies CarddavAdminAllKeys,
  },
  minimumPlanTier: BillingPlanTier.Solo,
};
