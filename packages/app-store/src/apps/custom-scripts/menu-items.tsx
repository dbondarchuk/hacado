import { AppMenuItem } from "@hacado/types/apps";
import { Code2 } from "lucide-react";
import { CustomScriptsSettingsPage } from "./settings/pages/main";
import {
  CustomScriptsAdminAllKeys,
  CustomScriptsAdminKeys,
  CustomScriptsAdminNamespace,
} from "./translations/types";

export const CustomScriptsMenuItems: AppMenuItem<
  CustomScriptsAdminNamespace,
  CustomScriptsAdminKeys
>[] = [
  {
    href: "settings/custom-scripts",
    parent: "settings",
    id: "settings-custom-scripts",
    label:
      "app_custom-scripts_admin.navigation.main.label" satisfies CustomScriptsAdminAllKeys,
    pageTitle:
      "app_custom-scripts_admin.navigation.main.title" satisfies CustomScriptsAdminAllKeys,
    pageDescription:
      "app_custom-scripts_admin.navigation.main.description" satisfies CustomScriptsAdminAllKeys,
    pageBreadcrumbs: [
      {
        title:
          "app_custom-scripts_admin.navigation.main.label" satisfies CustomScriptsAdminAllKeys,
        link: "/dashboard/settings/custom-scripts",
      },
    ],
    icon: <Code2 />,
    Page: (props) => <CustomScriptsSettingsPage appId={props.appId} />,
    requiredPermission: { resource: "settings", action: "update" },
  },
];
