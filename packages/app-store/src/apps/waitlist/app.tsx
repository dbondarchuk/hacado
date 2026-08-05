import { App, APPOINTMENT_CREATED_EVENT_TYPE, BillingPlanTier } from "@hacado/types";
import { CalendarClock } from "lucide-react";
import { WAITLIST_APP_NAME } from "./const";
import { WaitlistAdminKeys } from "./translations/types";

export const WaitlistApp: App<"app_waitlist_admin", WaitlistAdminKeys> = {
  name: WAITLIST_APP_NAME,
  displayName: "app_waitlist_admin.app.displayName",
  category: ["apps.categories.appointments"],
  subscribeTo: ["waitlist.*", APPOINTMENT_CREATED_EVENT_TYPE],
  scope: [
    "dashboard-tab",
    "ui-components",
    "waitlist",
    "event-subscriber",
    "dashboard-notifier",
    "customer-tab",
    "demo-arguments-provider",
    "communication-templates-provider",
  ],
  type: "complex",
  target: "company",
  Logo: ({ className }) => <CalendarClock className={className} />,
  isFeatured: true,
  isHidden: false,
  dontAllowMultiple: true,
  minimumPlanTier: BillingPlanTier.Solo,
  description: {
    text: "app_waitlist_admin.app.description",
  },
  settingsHref: "waitlist",
};
