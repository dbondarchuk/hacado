import { App } from "@timelish/types";
import { ICS_APP_NAME } from "./const";
import { IcsLogo } from "./logo";
import { IcsAdminKeys, IcsAdminNamespace } from "./translations/types";

export const IcsApp: App<IcsAdminNamespace, IcsAdminKeys> = {
  name: ICS_APP_NAME,
  displayName: "app_ics_admin.app.displayName",
  scope: ["calendar-read"],
  category: ["apps.categories.calendar"],
  type: "basic",
  target: "member",
  Logo: ({ className }) => <IcsLogo className={className} />,
  isFeatured: true,
  description: {
    text: "app_ics_admin.app.description",
  },
};
