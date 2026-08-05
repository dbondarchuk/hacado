import { CustomerTabInjectorApp } from "@hacado/types";
import { WaitlistCustomerTab } from "./customer-tab-view";
import {
  WaitlistAdminAllKeys,
  WaitlistAdminKeys,
  WaitlistAdminNamespace,
} from "./translations/types";

export const WaitlistCustomerTabInjector: CustomerTabInjectorApp<
  WaitlistAdminNamespace,
  WaitlistAdminKeys
> = {
  items: [
    {
      order: 100,
      href: "waitlist",
      label:
        "app_waitlist_admin.app.customerTab.waitlist" satisfies WaitlistAdminAllKeys,
      view: (props) => <WaitlistCustomerTab {...props} />,
    },
  ],
};
