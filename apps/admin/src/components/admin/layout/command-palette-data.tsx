import type { CommandSearchScope } from "@/lib/command-search/scope";
import { AvailableApps } from "@hacado/app-store";
import { DashboardQuickLinkInjectorApps } from "@hacado/app-store/injectors/dashboard-quick-link";
import { AppMenuItems } from "@hacado/app-store/menu-items";
import { ConnectedApp, ConnectedAppAccount } from "@hacado/types/apps";
import { BillingPlanTier, meetsMinimumPlanTier } from "@hacado/types/billing";
import { SessionUser } from "@hacado/types/users";
import { hasPermission } from "@hacado/utils";
import {
  BadgePercent,
  CalendarPlus,
  FilePlus,
  Gift,
  Globe,
  HandPlatter,
  LayoutTemplate,
  Package,
  PanelBottom,
  PanelTop,
  Paperclip,
  Puzzle,
  TextCursorInput,
  UserPlus,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";

const iconProps = { className: "size-4", strokeWidth: 1.5 } as const;

export type CommandPaletteAction = {
  id: string;
  href?: string;
  labelKey: string;
  keywords?: string;
  scopes?: CommandSearchScope[];
  external?: boolean;
  icon: ReactNode;
  appId?: string;
  Action?: ComponentType<{
    appId?: string;
    label: string;
    icon: ReactNode;
    className?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }>;
};

export type CommandPaletteInstalledApp = {
  id: string;
  name: string;
  displayNameKey: string;
  descriptionKey: string;
  account?: string;
  logo: ReactNode;
  href?: string;
  connectedApp?: ConnectedApp;
};

export type CommandPaletteApp = {
  name: string;
  displayNameKey: string;
  descriptionKey: string;
  href: string;
  installed: boolean;
  logo: ReactNode;
};

export function buildCommandPaletteActions({
  user,
  planTier,
  websiteUrl,
  apps,
}: {
  user: SessionUser;
  planTier: BillingPlanTier | null;
  websiteUrl: string;
  apps: { _id: string; name: string }[];
}): CommandPaletteAction[] {
  const solo = meetsMinimumPlanTier(planTier, BillingPlanTier.Solo);
  const actions: CommandPaletteAction[] = [];

  const add = (action: CommandPaletteAction, visible: boolean) => {
    if (visible) actions.push(action);
  };

  add(
    {
      id: "new-appointment",
      href: "/dashboard/appointments/new",
      labelKey: "admin.commandPalette.actions.newAppointment",
      icon: <CalendarPlus {...iconProps} />,
    },
    hasPermission(user, "appointment", "create"),
  );
  add(
    {
      id: "new-customer",
      href: "/dashboard/customers/new",
      labelKey: "admin.commandPalette.actions.newCustomer",
      icon: <UserPlus {...iconProps} />,
    },
    hasPermission(user, "customer", "create"),
  );
  add(
    {
      id: "new-page",
      href: "/dashboard/pages/new",
      labelKey: "admin.commandPalette.actions.newPage",
      icon: <FilePlus {...iconProps} />,
    },
    hasPermission(user, "page", "update"),
  );
  add(
    {
      id: "new-header",
      href: "/dashboard/pages/headers/new",
      labelKey: "admin.commandPalette.actions.newHeader",
      icon: <PanelTop {...iconProps} />,
    },
    hasPermission(user, "page", "update"),
  );
  add(
    {
      id: "new-footer",
      href: "/dashboard/pages/footers/new",
      labelKey: "admin.commandPalette.actions.newFooter",
      icon: <PanelBottom {...iconProps} />,
    },
    hasPermission(user, "page", "update"),
  );
  add(
    {
      id: "new-template",
      href: "/dashboard/templates/new/email",
      labelKey: "admin.commandPalette.actions.newTemplate",
      icon: <LayoutTemplate {...iconProps} />,
    },
    hasPermission(user, "communication", "readAll"),
  );
  add(
    {
      id: "new-option",
      href: "/dashboard/catalog/services/new",
      labelKey: "admin.commandPalette.actions.newOption",
      icon: <HandPlatter {...iconProps} />,
    },
    hasPermission(user, "service", "create"),
  );
  add(
    {
      id: "new-addon",
      href: "/dashboard/catalog/addons/new",
      labelKey: "admin.commandPalette.actions.newAddon",
      icon: <Puzzle {...iconProps} />,
    },
    hasPermission(user, "service", "create"),
  );
  add(
    {
      id: "new-field",
      href: "/dashboard/catalog/fields/new",
      labelKey: "admin.commandPalette.actions.newField",
      icon: <TextCursorInput {...iconProps} />,
    },
    hasPermission(user, "service", "create"),
  );
  add(
    {
      id: "new-discount",
      href: "/dashboard/catalog/discounts/new",
      labelKey: "admin.commandPalette.actions.newDiscount",
      icon: <BadgePercent {...iconProps} />,
    },
    solo && hasPermission(user, "discount", "create"),
  );
  add(
    {
      id: "new-gift-card",
      href: "/dashboard/catalog/gift-cards/new",
      labelKey: "admin.commandPalette.actions.newGiftCard",
      icon: <Gift {...iconProps} />,
    },
    solo && hasPermission(user, "giftCard", "create"),
  );
  add(
    {
      id: "new-package",
      href: "/dashboard/catalog/packages/new",
      labelKey: "admin.commandPalette.actions.newPackage",
      icon: <Package {...iconProps} />,
    },
    solo && hasPermission(user, "package", "create"),
  );
  add(
    {
      id: "new-asset",
      href: "/dashboard/assets/new",
      labelKey: "admin.commandPalette.actions.newAsset",
      icon: <Paperclip {...iconProps} />,
    },
    hasPermission(user, "page", "update"),
  );

  for (const app of apps) {
    const injector = DashboardQuickLinkInjectorApps[app.name];
    if (!injector?.items.length) continue;

    for (const item of injector.items) {
      if (!item.href && !item.Action) continue;
      if (
        item.requiredPermission &&
        !hasPermission(
          user,
          item.requiredPermission.resource,
          item.requiredPermission.action,
        )
      ) {
        continue;
      }

      actions.push({
        id: `${app._id}:${item.id}`,
        href: item.href,
        labelKey: item.label,
        keywords: keywordsForQuickLink(item.id),
        scopes: scopesForQuickLink(item.id),
        icon: item.icon,
        appId: app._id,
        Action: item.Action,
      });
    }
  }

  if (websiteUrl) {
    actions.push({
      id: "view-website",
      href: websiteUrl,
      labelKey: "admin.navigation.viewWebsite",
      external: true,
      icon: <Globe {...iconProps} />,
    });
  }

  return actions;
}

export function buildCommandPaletteApps(
  installedNames: Set<string>,
): CommandPaletteApp[] {
  return Object.values(AvailableApps).flatMap((app) => {
    if ("isHidden" in app && app.isHidden) return [];

    const installed = installedNames.has(app.name);

    return [
      {
        name: app.name,
        displayNameKey: app.displayName,
        descriptionKey: app.description.text,
        href: installed
          ? (installedAppHref(app.name) ?? `/dashboard/apps/store/${app.name}`)
          : `/dashboard/apps/store/${app.name}`,
        installed,
        logo: <app.Logo className="size-4" />,
      },
    ];
  });
}

export function buildCommandPaletteInstalledApps(
  apps: ConnectedApp[],
): CommandPaletteInstalledApp[] {
  return apps.flatMap((app) => {
    const descriptor = AvailableApps[app.name];
    if (!descriptor || ("isHidden" in descriptor && descriptor.isHidden)) {
      return [];
    }

    const update = installedAppUpdate(descriptor);
    if (!update) return [];

    return [
      {
        id: app._id,
        name: app.name,
        displayNameKey: descriptor.displayName,
        descriptionKey: descriptor.description.text,
        account: accountLabel(app.account),
        logo: <descriptor.Logo className="size-4" />,
        href: update.kind === "link" ? update.href : undefined,
        connectedApp: update.kind === "dialog" ? app : undefined,
      },
    ];
  });
}

function installedAppUpdate(app: (typeof AvailableApps)[string]) {
  if (app.type === "complex" || app.type === "system") {
    if ("settingsHref" in app && app.settingsHref) {
      return { kind: "link" as const, href: `/dashboard/${app.settingsHref}` };
    }

    return null;
  }

  return { kind: "dialog" as const };
}

function accountLabel(account?: ConnectedAppAccount) {
  if (!account || "targetAppName" in account) return undefined;

  const parts = [
    "username" in account ? account.username : undefined,
    "serverUrl" in account ? account.serverUrl : undefined,
    account.additional,
  ]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(" · ") : undefined;
}

function scopesForQuickLink(id: string): CommandSearchScope[] | undefined {
  if (id === "gift-card-studio-manual-purchase") {
    return ["gift-card-studio", "gift-card-purchases"];
  }
  if (id === "gift-card-studio-new-design") {
    return ["gift-card-studio", "gift-card-designs"];
  }

  return undefined;
}

function keywordsForQuickLink(id: string) {
  if (id === "gift-card-studio-new-design")
    return "new design create gift card";
  if (id === "gift-card-studio-manual-purchase") {
    return "manual purchase new gift card";
  }
  if (id === "blog-write-post") return "new blog post";

  return undefined;
}

function installedAppHref(name: string) {
  const menu = (AppMenuItems[name] ?? []).find((item) => !item.isHidden);
  if (menu?.href) return `/dashboard/${menu.href}`;

  const app = AvailableApps[name];
  if (app && "settingsHref" in app && app.settingsHref) {
    return `/dashboard/${app.settingsHref}`;
  }

  return undefined;
}
