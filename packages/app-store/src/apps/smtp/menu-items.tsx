import { AppMenuItem } from "@timelish/types";
import { SmtpLogo } from "./logo";
import { SmtpAppSetup } from "./setup";
import { SmtpAdminKeys, SmtpAdminNamespace } from "./translations/types";

export const SmtpMenuItems: AppMenuItem<SmtpAdminNamespace, SmtpAdminKeys>[] = [
  {
    href: "settings/smtp",
    parent: "settings",
    id: "settings-smtp",
    label: "app_smtp_admin.navigation.title",
    icon: <SmtpLogo />,
    Page: (props) => <SmtpAppSetup appId={props.appId} />,
    requiredPermission: { resource: "settings", action: "update" },
  },
];
