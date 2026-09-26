import { DashboardQuickLinkInjectorApp } from "@hacado/types";
import { RectangleEllipsis } from "lucide-react";
import { FORMS_UNREAD_RESPONSES_BADGE_KEY } from "./const";
import { FormsAdminKeys, FormsAdminNamespace } from "./translations/types";

export const FormsQuickLinkInjector: DashboardQuickLinkInjectorApp<
  FormsAdminNamespace,
  FormsAdminKeys
> = {
  items: [
    {
      id: "forms-responses",
      order: 130,
      href: "/dashboard/forms/responses",
      label: "app_forms_admin.app.pages.responses.title",
      icon: <RectangleEllipsis className="size-4" strokeWidth={1.5} />,
      notificationsCountKey: FORMS_UNREAD_RESPONSES_BADGE_KEY,
      requiredPermission: { resource: "page", action: "update" },
    },
  ],
};
