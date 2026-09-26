import { AllKeys, I18nNamespaces } from "@hacado/i18n";
import type { ComponentType, ReactElement, ReactNode } from "react";
import { Customer } from "../customers/customer";
import type { RequiredPermission } from "../users/permissions";
import { IConnectedAppProps } from "./connected-app.props";

export type DashboardTabInjectorApp<
  T extends I18nNamespaces = I18nNamespaces,
  CustomKeys extends string | undefined = undefined,
> = {
  items: [
    {
      order: number;
      href: string;
      label: AllKeys<T, CustomKeys>;
      /** Full i18n key path for the dashboard greeting subtitle on this tab. */
      subtitleKey: AllKeys<T, CustomKeys>;
      notificationsCountKey?: string;
      view: (props: {
        props: IConnectedAppProps;
        appId: string;
        searchParams: { [key: string]: string | string[] | undefined };
      }) => ReactNode;
    },
  ];
};

export type DashboardQuickLinkInjectorItem<
  T extends I18nNamespaces = I18nNamespaces,
  CustomKeys extends string | undefined = undefined,
> = {
  id: string;
  order: number;
  /** Full i18n key including app namespace (e.g. `app_weekly-schedule_admin.quickLinks.adjust`). */
  label: AllKeys<T, CustomKeys>;
  icon: ReactElement;
  /** Key matching `DashboardNotificationBadge.key` from the notifications SSE stream. */
  notificationsCountKey?: string;
  requiredPermission?: RequiredPermission;
} & (
  | {
      href: string;
      Action?: never;
    }
  | {
      href?: never;
      Action: ComponentType<{
        appId?: string;
        label: string;
        icon: ReactNode;
        className?: string;
      }>;
    }
);

export type DashboardQuickLinkInjectorApp<
  T extends I18nNamespaces = I18nNamespaces,
  CustomKeys extends string | undefined = undefined,
> = {
  items: DashboardQuickLinkInjectorItem<T, CustomKeys>[];
};

export type CustomerTabInjectorApp<
  T extends I18nNamespaces = I18nNamespaces,
  CustomKeys extends string | undefined = undefined,
> = {
  items: [
    {
      order: number;
      href: string;
      label: AllKeys<T, CustomKeys>;
      scrollable?: boolean;
      view: (props: {
        props: IConnectedAppProps;
        appId: string;
        customer: Customer;
        searchParams: { [key: string]: string | string[] | undefined };
      }) => ReactNode;
    },
  ];
};
