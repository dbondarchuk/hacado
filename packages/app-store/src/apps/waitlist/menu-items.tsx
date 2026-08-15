import { AppMenuItem } from "@hacado/types";
import { CalendarClock } from "lucide-react";
import { WaitlistDismissPage } from "./pages/dismiss";
import { WaitlistPage } from "./pages/main";
import { WaitlistNewAppointmentPage } from "./pages/new-appointment";
import {
  WaitlistAdminAllKeys,
  WaitlistAdminKeys,
  WaitlistAdminNamespace,
} from "./translations/types";

const waitlistBreadcrumb: {
  title: WaitlistAdminAllKeys;
  link: string;
} = {
  title: "app_waitlist_admin.app.pages.main.label",
  link: "/dashboard/waitlist",
};

export const WaitlistMenuItems: AppMenuItem<
  WaitlistAdminNamespace,
  WaitlistAdminKeys
>[] = [
  {
    href: "waitlist",
    parent: "appointments",
    id: "appointments-waitlist",
    order: 100,
    notScrollable: true,
    notificationsCountKey: "waitlist_entries",
    label: "app_waitlist_admin.app.pages.main.label",
    icon: <CalendarClock />,
    Page: (props) => <WaitlistPage appId={props.appId} />,
    pageBreadcrumbs: [waitlistBreadcrumb],
    pageTitle: "app_waitlist_admin.app.pages.main.title",
    pageDescription: "app_waitlist_admin.app.pages.main.description",
    requiredPermission: { resource: "appointment", action: "read" },
  },
  {
    href: "waitlist/dismiss",
    parent: "waitlist",
    id: "waitlist-dismiss",
    isHidden: true,
    label: "app_waitlist_admin.app.pages.main.label",
    icon: <CalendarClock />,
    Page: (props) => <WaitlistDismissPage appId={props.appId} />,
    pageBreadcrumbs: [waitlistBreadcrumb],
    pageTitle: "app_waitlist_admin.app.pages.main.title",
    pageDescription: "app_waitlist_admin.app.pages.main.description",
    requiredPermission: { resource: "appointment", action: "read" },
  },
  {
    href: "waitlist/appointment/new",
    parent: "waitlist",
    id: "waitlist-appointment-new",
    isHidden: true,
    label: "app_waitlist_admin.app.pages.main.label",
    icon: <CalendarClock />,
    Page: (props) => <WaitlistNewAppointmentPage appId={props.appId} />,
    pageBreadcrumbs: [waitlistBreadcrumb],
    pageTitle: "app_waitlist_admin.app.pages.main.title",
    pageDescription: "app_waitlist_admin.app.pages.main.description",
    requiredPermission: { resource: "appointment", action: "read" },
  },
];
