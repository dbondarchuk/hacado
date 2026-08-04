import { App, BillingPlanTier } from "@timelish/types";
import { Form } from "lucide-react";
import { FORMS_APP_NAME } from "./const";
import {
  FormsAdminAllKeys,
  FormsAdminKeys,
  FormsAdminNamespace,
} from "./translations/types";

export const FormsApp: App<FormsAdminNamespace, FormsAdminKeys> = {
  name: FORMS_APP_NAME,
  displayName: "app_forms_admin.app.displayName",
  category: ["apps.categories.content"],
  scope: ["ui-components", "customer-tab", "dashboard-notifier"],
  type: "complex",
  target: "company",
  Logo: ({ className }) => <Form className={className} />,
  isFeatured: true,
  isHidden: false,
  dontAllowMultiple: true,
  minimumPlanTier: BillingPlanTier.Solo,
  description: {
    text: "app_forms_admin.app.description" satisfies FormsAdminAllKeys,
  },
  settingsHref: "forms",
};
