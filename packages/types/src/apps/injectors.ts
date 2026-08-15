import { AllKeys, I18nNamespaces } from "@hacado/i18n";
import type { ReactNode } from "react";
import { Customer } from "../customers/customer";
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
