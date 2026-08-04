import { AppMenuItem } from "@timelish/types";
import { Form, RectangleEllipsis } from "lucide-react";
import { FORMS_UNREAD_RESPONSES_BADGE_KEY } from "./const";
import { FormsEditPage } from "./forms/pages/edit";
import { FormsMainPage } from "./forms/pages/main";
import { FormsNewPage } from "./forms/pages/new";
import { ResponseEditPage } from "./responses/pages/edit";
import { FormsResponsesPage } from "./responses/pages/main";
import { ResponseNewPage } from "./responses/pages/new";
import {
  FormsAdminAllKeys,
  FormsAdminKeys,
  FormsAdminNamespace,
} from "./translations/types";

const formsBreadcrumb: {
  title: FormsAdminAllKeys;
  link: string;
} = {
  title: "app_forms_admin.app.pages.main.title" satisfies FormsAdminAllKeys,
  link: "/dashboard/forms",
};

export const FormsMenuItems: AppMenuItem<
  FormsAdminNamespace,
  FormsAdminKeys
>[] = [
  {
    href: "forms",
    id: "forms",
    group: "website",
    order: 110,
    notScrollable: true,
    label: "app_forms_admin.app.pages.main.title" satisfies FormsAdminAllKeys,
    icon: <Form />,
    Page: (props) => <FormsMainPage appId={props.appId} />,
    pageBreadcrumbs: [formsBreadcrumb],
    pageTitle:
      "app_forms_admin.app.pages.main.title" satisfies FormsAdminAllKeys,
    pageDescription:
      "app_forms_admin.app.pages.main.description" satisfies FormsAdminAllKeys,
    requiredPermission: { resource: "page", action: "update" },
  },
  {
    href: "forms/new",
    parent: "forms",
    id: "forms-new",
    isHidden: true,
    hideHeading: true,
    label: "app_forms_admin.app.pages.new.title" satisfies FormsAdminAllKeys,
    icon: <Form />,
    Page: (props) => <FormsNewPage appId={props.appId} />,
    pageBreadcrumbs: [
      formsBreadcrumb,
      {
        title:
          "app_forms_admin.app.pages.new.title" satisfies FormsAdminAllKeys,
        link: "/dashboard/forms/new",
      },
    ],
    pageTitle:
      "app_forms_admin.app.pages.new.title" satisfies FormsAdminAllKeys,
    pageDescription:
      "app_forms_admin.app.pages.new.description" satisfies FormsAdminAllKeys,
    requiredPermission: { resource: "page", action: "update" },
  },
  {
    href: "forms/edit",
    parent: "forms",
    id: "forms-edit",
    isHidden: true,
    hideHeading: true,
    label: "app_forms_admin.app.pages.edit.title" satisfies FormsAdminAllKeys,
    icon: <Form />,
    Page: (props) => <FormsEditPage appId={props.appId} />,
    pageBreadcrumbs: [
      formsBreadcrumb,
      {
        title:
          "app_forms_admin.app.pages.edit.title" satisfies FormsAdminAllKeys,
        link: "/dashboard/forms/edit",
      },
    ],
    pageTitle:
      "app_forms_admin.app.pages.edit.title" satisfies FormsAdminAllKeys,
    pageDescription:
      "app_forms_admin.app.pages.edit.description" satisfies FormsAdminAllKeys,
    requiredPermission: { resource: "page", action: "update" },
  },
  {
    href: "forms/responses",
    parent: "forms",
    id: "forms-responses",
    isHidden: false,
    hideHeading: false,
    notificationsCountKey: FORMS_UNREAD_RESPONSES_BADGE_KEY,
    label:
      "app_forms_admin.app.pages.responses.title" satisfies FormsAdminAllKeys,
    icon: <RectangleEllipsis />,
    Page: (props) => <FormsResponsesPage appId={props.appId} />,
    pageBreadcrumbs: [
      formsBreadcrumb,
      {
        title:
          "app_forms_admin.app.pages.responses.title" satisfies FormsAdminAllKeys,
        link: "/dashboard/forms/responses",
      },
    ],
    pageTitle:
      "app_forms_admin.app.pages.responses.title" satisfies FormsAdminAllKeys,
    pageDescription:
      "app_forms_admin.app.pages.responses.description" satisfies FormsAdminAllKeys,
    requiredPermission: { resource: "page", action: "update" },
  },
  {
    href: "forms/responses/edit",
    parent: "forms",
    id: "forms-responses-edit",
    isHidden: true,
    hideHeading: true,
    label:
      "app_forms_admin.app.pages.responses.edit.title" satisfies FormsAdminAllKeys,
    icon: <RectangleEllipsis />,
    Page: (props) => <ResponseEditPage appId={props.appId} />,
    pageBreadcrumbs: [
      formsBreadcrumb,
      {
        title:
          "app_forms_admin.app.pages.responses.title" satisfies FormsAdminAllKeys,
        link: "/dashboard/forms/responses",
      },
      {
        title:
          "app_forms_admin.app.pages.responses.edit.title" satisfies FormsAdminAllKeys,
        link: "/dashboard/forms/responses/edit",
      },
    ],
    pageTitle:
      "app_forms_admin.app.pages.responses.edit.title" satisfies FormsAdminAllKeys,
    pageDescription:
      "app_forms_admin.app.pages.responses.edit.description" satisfies FormsAdminAllKeys,
    requiredPermission: { resource: "page", action: "update" },
  },
  {
    href: "forms/responses/new",
    parent: "forms",
    id: "forms-responses-new",
    isHidden: true,
    hideHeading: true,
    label:
      "app_forms_admin.app.pages.responses.new.title" satisfies FormsAdminAllKeys,
    icon: <RectangleEllipsis />,
    Page: (props) => <ResponseNewPage appId={props.appId} />,
    pageBreadcrumbs: [
      formsBreadcrumb,
      {
        title:
          "app_forms_admin.app.pages.responses.title" satisfies FormsAdminAllKeys,
        link: "/dashboard/forms/responses",
      },
      {
        title:
          "app_forms_admin.app.pages.responses.new.title" satisfies FormsAdminAllKeys,
        link: "/dashboard/forms/responses/new",
      },
    ],
    pageTitle:
      "app_forms_admin.app.pages.responses.new.title" satisfies FormsAdminAllKeys,
    pageDescription:
      "app_forms_admin.app.pages.responses.new.description" satisfies FormsAdminAllKeys,
    requiredPermission: { resource: "page", action: "update" },
  },
];
