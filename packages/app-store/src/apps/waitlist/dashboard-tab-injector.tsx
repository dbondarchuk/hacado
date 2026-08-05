import { DashboardTabInjectorApp } from "@hacado/types";
import {
  WaitlistAdminKeys,
  WaitlistAdminNamespace,
} from "./translations/types";
import { WaitlistTab } from "./views/waitlist-tab";

export const WaitlistNotificationDashboardTabInjector: DashboardTabInjectorApp<
  WaitlistAdminNamespace,
  WaitlistAdminKeys
> = {
  items: [
    {
      order: 100,
      href: "waitlist",
      label: "app_waitlist_admin.tab.title",
      subtitleKey: "app_waitlist_admin.tab.subtitle",
      notificationsCountKey: "waitlist_entries",
      view: (props) => <WaitlistTab {...props} />,
    },
  ],
};
