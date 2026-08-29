import {
  App,
  BillingPlanTier,
  MEMBER_PROFILE_UPDATED_EVENT_TYPE,
  SCHEDULE_CHANGED_EVENT_TYPE,
} from "@hacado/types";
import { Bell } from "lucide-react";
import { WAITLIST_ENTRY_CREATED_EVENT_TYPE } from "../waitlist/models/events";
import { CUSTOMER_WAITLIST_NOTIFICATIONS_APP_NAME } from "./const";
import {
  CustomerWaitlistNotificationsAdminKeys,
  CustomerWaitlistNotificationsAdminNamespace,
} from "./translations/types";

export const CustomerWaitlistNotificationsApp: App<
  CustomerWaitlistNotificationsAdminNamespace,
  CustomerWaitlistNotificationsAdminKeys
> = {
  name: CUSTOMER_WAITLIST_NOTIFICATIONS_APP_NAME,
  displayName: "app_customer-waitlist-notifications_admin.app.displayName",
  category: ["apps.categories.notifications"],
  subscribeTo: [
    WAITLIST_ENTRY_CREATED_EVENT_TYPE,
    "appointment.*",
    SCHEDULE_CHANGED_EVENT_TYPE,
    MEMBER_PROFILE_UPDATED_EVENT_TYPE,
  ],
  scope: [
    "event-subscriber",
    "scheduled",
    "communication-templates-provider",
    "demo-arguments-provider",
  ],
  type: "complex",
  target: "company",
  Logo: ({ className }) => <Bell className={className} />,
  isFeatured: false,
  isHidden: false,
  dontAllowMultiple: true,
  minimumPlanTier: BillingPlanTier.Solo,
  description: {
    text: "app_customer-waitlist-notifications_admin.app.description",
  },
  settingsHref: "communications/customer-waitlist",
};
