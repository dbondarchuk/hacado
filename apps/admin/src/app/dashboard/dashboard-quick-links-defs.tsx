import { sessionCanUseFeature } from "@/lib/billing/subscription-plan-access";
import type { AllKeys } from "@hacado/i18n";
import type { SessionUser } from "@hacado/types";
import {
  canManageTeam,
  canReadActivity,
  canViewFinancials,
  hasPermission,
} from "@hacado/utils";
import {
  Activity,
  BookUser,
  ChartArea,
  CircleDollarSign,
  Globe,
  HandPlatter,
  Plus,
  Store,
  Users,
} from "lucide-react";
import React from "react";
import type { AppSession } from "../utils";
import { QuickLinkAddPaymentButton } from "./quick-link-add-payment-button";

export type CoreQuickLinkContext = {
  session: AppSession | null | undefined;
  user: SessionUser | undefined;
};

export type CoreQuickLinkDefinition = {
  id: string;
  order: number;
  /** Full i18n key including `admin.` namespace. */
  labelKey: AllKeys<"admin">;
  icon: React.ReactNode;
  notificationsCountKey?: string;
  predicate: (ctx: CoreQuickLinkContext) => boolean;
} & (
  | { href: string; Action?: never }
  | {
      href?: never;
      Action: React.ComponentType<{
        appId?: string;
        label: string;
        icon: React.ReactNode;
        className?: string;
      }>;
    }
);

const iconProps = { className: "size-4", strokeWidth: 1.5 } as const;

export const CORE_QUICK_LINKS: CoreQuickLinkDefinition[] = [
  {
    id: "financials",
    order: 20,
    href: "/dashboard/financials/overview",
    labelKey: "admin.navigation.financials",
    icon: <ChartArea {...iconProps} />,
    predicate: ({ session, user }) =>
      !!session &&
      sessionCanUseFeature(session, "financials") &&
      canViewFinancials(user),
  },
  {
    id: "payments",
    order: 30,
    href: "/dashboard/financials/payments",
    labelKey: "admin.navigation.payments",
    icon: <CircleDollarSign {...iconProps} />,
    predicate: ({ session, user }) =>
      !!session &&
      sessionCanUseFeature(session, "financials") &&
      canViewFinancials(user),
  },
  {
    id: "add-payment",
    order: 40,
    labelKey: "admin.paymentsList.addPayment",
    icon: <Plus {...iconProps} />,
    Action: QuickLinkAddPaymentButton,
    predicate: ({ session, user }) =>
      !!session &&
      sessionCanUseFeature(session, "financials") &&
      canViewFinancials(user),
  },
  {
    id: "customers",
    order: 50,
    href: "/dashboard/customers",
    labelKey: "admin.navigation.customers",
    icon: <BookUser {...iconProps} />,
    predicate: ({ user }) => hasPermission(user, "customer", "read"),
  },
  {
    id: "services",
    order: 70,
    href: "/dashboard/services/options",
    labelKey: "admin.navigation.services",
    icon: <HandPlatter {...iconProps} />,
    predicate: ({ user }) => hasPermission(user, "service", "read"),
  },
  {
    id: "pages",
    order: 80,
    href: "/dashboard/pages",
    labelKey: "admin.navigation.pages",
    icon: <Globe {...iconProps} />,
    predicate: ({ user }) => hasPermission(user, "page", "read"),
  },
  {
    id: "activity",
    order: 190,
    href: "/dashboard/activity",
    labelKey: "admin.navigation.activity",
    icon: <Activity {...iconProps} />,
    predicate: ({ user }) => canReadActivity(user),
  },
  {
    id: "app-store",
    order: 270,
    href: "/dashboard/apps/store",
    labelKey: "admin.navigation.store",
    icon: <Store {...iconProps} />,
    predicate: () => true,
  },
  {
    id: "team",
    order: 280,
    href: "/dashboard/settings/team",
    labelKey: "admin.navigation.team",
    icon: <Users {...iconProps} />,
    predicate: ({ user }) => canManageTeam(user),
  },
];
