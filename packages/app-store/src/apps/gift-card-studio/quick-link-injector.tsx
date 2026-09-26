import { DashboardQuickLinkInjectorApp } from "@hacado/types";
import { Receipt, ShoppingCart } from "lucide-react";
import { GIFT_CARD_STUDIO_UNREAD_PURCHASES_BADGE_KEY } from "./const";
import { GiftCardStudioManualPurchaseQuickLink } from "./quick-link-manual-purchase";
import {
  GiftCardStudioAdminKeys,
  GiftCardStudioAdminNamespace,
} from "./translations/types";

export const GiftCardStudioQuickLinkInjector: DashboardQuickLinkInjectorApp<
  GiftCardStudioAdminNamespace,
  GiftCardStudioAdminKeys
> = {
  items: [
    {
      id: "gift-card-studio-purchases",
      order: 140,
      href: "/dashboard/gift-card-studio/purchases",
      label: "app_gift-card-studio_admin.app.pages.purchases.title",
      icon: <Receipt className="size-4" strokeWidth={1.5} />,
      notificationsCountKey: GIFT_CARD_STUDIO_UNREAD_PURCHASES_BADGE_KEY,
      requiredPermission: { resource: "giftCard", action: "read" },
    },
    {
      id: "gift-card-studio-manual-purchase",
      order: 145,
      label: "app_gift-card-studio_admin.purchases.table.actions.create",
      icon: <ShoppingCart className="size-4" strokeWidth={1.5} />,
      Action: GiftCardStudioManualPurchaseQuickLink,
      requiredPermission: { resource: "giftCard", action: "read" },
    },
  ],
};
