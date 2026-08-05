import { App, BillingPlanTier } from "@hacado/types";
import { WAITLIST_ENTRY_CREATED_EVENT_TYPE } from "../waitlist/models/events";
import { Bell } from "lucide-react";
import { WAITLIST_NOTIFICATIONS_APP_NAME } from "./const";
import {
  WaitlistNotificationsAdminKeys,
  WaitlistNotificationsAdminNamespace,
} from "./translations/types";

export const WaitlistNotificationsApp: App<
  WaitlistNotificationsAdminNamespace,
  WaitlistNotificationsAdminKeys
> = {
  name: WAITLIST_NOTIFICATIONS_APP_NAME,
  displayName: "app_waitlist-notifications_admin.app.displayName",
  category: ["apps.categories.notifications"],
  subscribeTo: [WAITLIST_ENTRY_CREATED_EVENT_TYPE],
  scope: ["event-subscriber"],
  type: "basic",
  target: "company",
  Logo: ({ className }) => <Bell className={className} />,
  isFeatured: false,
  isHidden: false,
  dontAllowMultiple: true,
  minimumPlanTier: BillingPlanTier.Solo,
  description: {
    text: "app_waitlist-notifications_admin.app.description",
  },
};
