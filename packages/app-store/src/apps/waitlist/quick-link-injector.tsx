import { DashboardQuickLinkInjectorApp } from "@hacado/types";
import { CalendarClock } from "lucide-react";
import {
  WaitlistAdminKeys,
  WaitlistAdminNamespace,
} from "./translations/types";

export const WaitlistQuickLinkInjector: DashboardQuickLinkInjectorApp<
  WaitlistAdminNamespace,
  WaitlistAdminKeys
> = {
  items: [
    {
      id: "waitlist",
      order: 100,
      href: "/dashboard/waitlist",
      label: "app_waitlist_admin.app.pages.main.label",
      icon: <CalendarClock className="size-4" strokeWidth={1.5} />,
      notificationsCountKey: "waitlist_entries",
      requiredPermission: { resource: "appointment", action: "read" },
    },
  ],
};
