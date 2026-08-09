import type { AllKeys, I18nNamespaces } from "@hacado/i18n";
import type { ReactElement, ReactNode } from "react";
import type { BillingPlanTier } from "../billing/subscription-plan";
import { IServicesContainer } from "../services/container";
import type { RequiredPermission } from "../users/permissions";
import type { Extandable } from "../utils/helpers";
import type { AppTarget } from "./app-target";

export type AppScope = Extandable<
  | "calendar-read"
  | "calendar-write"
  | "mail-send"
  | "text-message-send"
  | "text-message-respond"
  | "event-subscriber"
  | "scheduled"
  | "schedule"
  | "dashboard-tab"
  | "customer-tab"
  | "payment"
  | "ui-components"
  | "availability-provider"
  | "meeting-url-provider"
  | "dashboard-notifier"
  | "demo-arguments-provider"
  | "sitemap-items-provider"
  | "page-seo-arguments-provider"
>;

export type AppSetupProps = {
  onSuccess: (appId: string, doNotCloseDialog?: boolean) => void;
  onError: (
    error: string | { key: string; args?: Record<string, any> },
  ) => void;
  appId?: string;
};

export type ComplexAppPageProps = {
  appId: string;
  searchParams?: { [key: string]: string | string[] | undefined };
  services: IServicesContainer;
};

export type AppLogoProps = {
  className?: string;
};

type BaseApp<
  T extends I18nNamespaces = I18nNamespaces,
  CustomKeys extends string | undefined = undefined,
> = {
  name: string;
  displayName: AllKeys<T, CustomKeys>;
  category: (AllKeys<T, CustomKeys> | AllKeys<"apps">)[];
  scope: AppScope[];
  /**
   * Event bus patterns this app receives (see `eventPatternMatches`), e.g.
   * `appointment.*`, `customer.*`, `payment.*`, `giftCard.*`.
   */
  subscribeTo?: string[];
  description: {
    text: AllKeys<T, CustomKeys>;
  };
  Logo: (props: AppLogoProps) => ReactNode;
  isFeatured?: boolean;
  /** Lowest subscription tier required to install and run this app. Defaults to Free. */
  minimumPlanTier?: BillingPlanTier;
  /**
   * Installation ownership (required). Independent of scope usage:
   * `company` = org-wide install uniqueness; `member` = once per member.
   * Mixed apps (e.g. Outlook) use `member` target with company-usage scopes.
   */
  target: AppTarget;
  /**
   * Optional extra permission required to install this app (in addition to
   * target install gates). Typical for privileged member apps, e.g.
   * `{ resource: "app", action: "installPrivileged" }` for coordinator+.
   */
  requiredPermission?: RequiredPermission;
};

export type AppMenuItem<
  T extends I18nNamespaces = I18nNamespaces,
  CustomKeys extends string | undefined = undefined,
> = {
  order?: number;
  id: string;
  label: AllKeys<T, CustomKeys>;
  href: string;
  icon: ReactElement;
  Page: (props: ComplexAppPageProps) => ReactNode;
  pageBreadcrumbs?: {
    link: string;
    title: AllKeys<T, CustomKeys>;
  }[];
  noAppsBreadcrumb?: boolean;
  notScrollable?: boolean;
  isHidden?: boolean;
  hideHeading?: boolean;
  pageTitle?: AllKeys<T, CustomKeys>;
  pageDescription?: AllKeys<T, CustomKeys>;
  /** Key matching `DashboardNotificationBadge.key` from the notifications SSE stream. */
  notificationsCountKey?: string;
  /** Lowest subscription tier required to show this app. Defaults to Free. */
  minimumPlanTier?: BillingPlanTier;
  /**
   * If set, the signed-in user must have this permission to see/open the item.
   * Omit to allow every role.
   */
  requiredPermission?: RequiredPermission;
} & (
  | {
      group:
        | "overview"
        | "appointments"
        | "financials"
        | "website"
        | "customers"
        | "settings";
      parent?: undefined;
    }
  | {
      group?: undefined;
      parent: string;
    }
);

export type OAuthApp<
  T extends I18nNamespaces = I18nNamespaces,
  CustomKeys extends string | undefined = undefined,
> = BaseApp<T, CustomKeys> & {
  type: "oauth";
  dontAllowMultiple?: false;
  isHidden?: false;
};

export type BasicApp<
  T extends I18nNamespaces = I18nNamespaces,
  CustomKeys extends string | undefined = undefined,
> = BaseApp<T, CustomKeys> & {
  type: "basic";
  dontAllowMultiple?: boolean;
  isHidden?: boolean;
};

export type BasicAppSetup = (props: AppSetupProps) => ReactNode;
export type ComplexAppSetup = (props: ComplexAppPageProps) => ReactNode;

export type ComplexApp<
  T extends I18nNamespaces = I18nNamespaces,
  CustomKeys extends string | undefined = undefined,
> = BaseApp<T, CustomKeys> & {
  type: "complex";
  dontAllowMultiple: true;
  settingsHref?: string;
  isHidden?: boolean;
};

export type SystemApp<
  T extends I18nNamespaces = I18nNamespaces,
  CustomKeys extends string | undefined = undefined,
> = BaseApp<T, CustomKeys> & {
  type: "system";
  dontAllowMultiple: true;
  isHidden?: true;
};

export type App<
  T extends I18nNamespaces = I18nNamespaces,
  CustomKeys extends string | undefined = undefined,
> =
  | OAuthApp<T, CustomKeys>
  | BasicApp<T, CustomKeys>
  | ComplexApp<T, CustomKeys>
  | SystemApp<T, CustomKeys>;
