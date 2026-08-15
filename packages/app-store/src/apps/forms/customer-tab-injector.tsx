import { CustomerTabInjectorApp } from "@hacado/types";
import { FormsCustomerTab } from "./customer-tab-view";
import {
  FormsAdminAllKeys,
  FormsAdminKeys,
  FormsAdminNamespace,
} from "./translations/types";

export const FormsCustomerTabInjector: CustomerTabInjectorApp<
  FormsAdminNamespace,
  FormsAdminKeys
> = {
  items: [
    {
      order: 100,
      href: "forms",
      label:
        "app_forms_admin.app.customerTab.forms" satisfies FormsAdminAllKeys,
      view: (props) => <FormsCustomerTab {...props} />,
    },
  ],
};
