import { AppMenuItem } from "@timelish/types";
import { Gift, Receipt, Settings } from "lucide-react";
import { GIFT_CARD_STUDIO_UNREAD_PURCHASES_BADGE_KEY } from "./const";
import { DesignEditPage } from "./designs/pages/edit";
import { DesignsMainPage } from "./designs/pages/main";
import { DesignNewPage } from "./designs/pages/new";
import { PurchasesMainPage } from "./purchases/pages/main";
import { PurchaseNewPage } from "./purchases/pages/new";
import { GiftCardStudioSettingsPage } from "./settings/page";
import {
  GiftCardStudioAdminAllKeys,
  GiftCardStudioAdminKeys,
  GiftCardStudioAdminNamespace,
} from "./translations/types";

type BreadcrumbItem = {
  title: GiftCardStudioAdminAllKeys;
  link: string;
};

const mainBreadcrumb: BreadcrumbItem = {
  title: "app_gift-card-studio_admin.app.displayName",
  link: "/dashboard/gift-card-studio",
};

const designsBreadcrumbs: BreadcrumbItem[] = [
  mainBreadcrumb,
  {
    title: "app_gift-card-studio_admin.app.pages.main.title",
    link: "/dashboard/gift-card-studio",
  },
];

export const GiftCardStudioMenuItems: AppMenuItem<
  GiftCardStudioAdminNamespace,
  GiftCardStudioAdminKeys
>[] = [
  {
    href: "gift-card-studio",
    id: "gift-card-studio",
    group: "website",
    order: 115,
    notScrollable: true,
    label:
      "app_gift-card-studio_admin.app.displayName" satisfies GiftCardStudioAdminAllKeys,
    icon: <Gift />,
    Page: (props) => <DesignsMainPage appId={props.appId} />,
    pageBreadcrumbs: designsBreadcrumbs,
    pageTitle:
      "app_gift-card-studio_admin.app.pages.main.title" satisfies GiftCardStudioAdminAllKeys,
    pageDescription:
      "app_gift-card-studio_admin.app.pages.main.description" satisfies GiftCardStudioAdminAllKeys,
    requiredPermission: { resource: "giftCard", action: "update" },
  },
  {
    href: "gift-card-studio/new",
    parent: "gift-card-studio",
    id: "gift-card-studio-new",
    isHidden: true,
    hideHeading: true,
    label:
      "app_gift-card-studio_admin.app.pages.new.title" satisfies GiftCardStudioAdminAllKeys,
    icon: <Gift />,
    Page: (props) => <DesignNewPage appId={props.appId} />,
    pageBreadcrumbs: [
      ...designsBreadcrumbs,
      {
        title: "app_gift-card-studio_admin.app.pages.new.title",
        link: "/dashboard/gift-card-studio/new",
      } as BreadcrumbItem,
    ],
    pageTitle:
      "app_gift-card-studio_admin.app.pages.new.title" satisfies GiftCardStudioAdminAllKeys,
    pageDescription:
      "app_gift-card-studio_admin.app.pages.new.description" satisfies GiftCardStudioAdminAllKeys,
    requiredPermission: { resource: "giftCard", action: "update" },
  },
  {
    href: "gift-card-studio/edit",
    parent: "gift-card-studio",
    id: "gift-card-studio-edit",
    isHidden: true,
    hideHeading: true,
    label:
      "app_gift-card-studio_admin.app.pages.edit.title" satisfies GiftCardStudioAdminAllKeys,
    icon: <Gift />,
    Page: (props) => <DesignEditPage appId={props.appId} />,
    pageBreadcrumbs: [
      ...designsBreadcrumbs,
      {
        title: "app_gift-card-studio_admin.app.pages.edit.title",
        link: "/dashboard/gift-card-studio/edit",
      } as BreadcrumbItem,
    ],
    pageTitle:
      "app_gift-card-studio_admin.app.pages.edit.title" satisfies GiftCardStudioAdminAllKeys,
    pageDescription:
      "app_gift-card-studio_admin.app.pages.edit.description" satisfies GiftCardStudioAdminAllKeys,
    requiredPermission: { resource: "giftCard", action: "update" },
  },
  {
    href: "gift-card-studio/purchases",
    parent: "gift-card-studio",
    id: "gift-card-studio-purchases",
    isHidden: false,
    hideHeading: false,
    notificationsCountKey: GIFT_CARD_STUDIO_UNREAD_PURCHASES_BADGE_KEY,
    label:
      "app_gift-card-studio_admin.app.pages.purchases.title" satisfies GiftCardStudioAdminAllKeys,
    icon: <Receipt />,
    Page: (props) => <PurchasesMainPage appId={props.appId} />,
    pageBreadcrumbs: [
      mainBreadcrumb,
      {
        title: "app_gift-card-studio_admin.app.pages.purchases.title",
        link: "/dashboard/gift-card-studio/purchases",
      } as BreadcrumbItem,
    ],
    pageTitle:
      "app_gift-card-studio_admin.app.pages.purchases.title" satisfies GiftCardStudioAdminAllKeys,
    pageDescription:
      "app_gift-card-studio_admin.app.pages.purchases.description" satisfies GiftCardStudioAdminAllKeys,
    requiredPermission: { resource: "giftCard", action: "read" },
  },
  {
    href: "gift-card-studio/purchases/new",
    parent: "gift-card-studio",
    id: "gift-card-studio-purchases-new",
    isHidden: true,
    hideHeading: true,
    label:
      "app_gift-card-studio_admin.app.pages.purchasesNew.title" satisfies GiftCardStudioAdminAllKeys,
    icon: <Receipt />,
    Page: (props) => <PurchaseNewPage />,
    pageBreadcrumbs: [
      mainBreadcrumb,
      {
        title: "app_gift-card-studio_admin.app.pages.purchases.title",
        link: "/dashboard/gift-card-studio/purchases",
      } as BreadcrumbItem,
      {
        title: "app_gift-card-studio_admin.app.pages.purchasesNew.title",
        link: "/dashboard/gift-card-studio/purchases/new",
      } as BreadcrumbItem,
    ],
    pageTitle:
      "app_gift-card-studio_admin.app.pages.purchasesNew.title" satisfies GiftCardStudioAdminAllKeys,
    pageDescription:
      "app_gift-card-studio_admin.app.pages.purchasesNew.description" satisfies GiftCardStudioAdminAllKeys,
    requiredPermission: { resource: "giftCard", action: "read" },
  },
  {
    href: "gift-card-studio/settings",
    parent: "gift-card-studio",
    id: "gift-card-studio-settings",
    isHidden: false,
    hideHeading: false,
    label:
      "app_gift-card-studio_admin.app.pages.settings.title" satisfies GiftCardStudioAdminAllKeys,
    icon: <Settings />,
    Page: (props) => <GiftCardStudioSettingsPage appId={props.appId} />,
    pageBreadcrumbs: [
      mainBreadcrumb,
      {
        title: "app_gift-card-studio_admin.app.pages.settings.title",
        link: "/dashboard/gift-card-studio/settings",
      } as BreadcrumbItem,
    ],
    pageTitle:
      "app_gift-card-studio_admin.app.pages.settings.title" satisfies GiftCardStudioAdminAllKeys,
    pageDescription:
      "app_gift-card-studio_admin.app.pages.settings.description" satisfies GiftCardStudioAdminAllKeys,
    requiredPermission: { resource: "settings", action: "update" },
  },
];
