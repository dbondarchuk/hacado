import { getServicesContainer } from "@/app/utils";
import {
  getAccessibleConnectedApps,
  getOwnerMemberIds,
} from "@/lib/auth/app-access";
import { serializeAppointmentsSearchParams } from "@hacado/api-sdk";
import { AvailableApps } from "@hacado/app-store";
import { withCatalogTarget } from "@hacado/app-store/utils";
import { getI18nAsync } from "@hacado/i18n/server";
import type {
  ConnectedApp,
  INeedsAttentionApp,
  NeedsAttentionItem,
  NeedsAttentionLevel,
  OrganizationMember,
  SessionUser,
} from "@hacado/types";
import {
  canAccessConnectedApp,
  canFilterByMember,
  canUpdateAppointments,
} from "@hacado/utils";
import {
  listNeedsAttentionDismissals,
  pruneNeedsAttentionDismissals,
} from "./needs-attention-dismissals";

export type NeedsAttentionRow = NeedsAttentionItem & {
  compositeKey: string;
  appId: string;
  app?: ConnectedApp;
};

const LEVEL_RANK: Record<NeedsAttentionLevel, number> = {
  error: 0,
  warning: 1,
  info: 2,
};

function compositeKey(appId: string, id: string, fingerprint: string) {
  return `${appId}:${id}:${fingerprint}`;
}

function appHasNeedsAttentionScope(appName: string) {
  return (
    AvailableApps[appName]?.scope.includes("needs-attention-provider") ?? false
  );
}

async function collectCoreItems(
  user: SessionUser,
): Promise<NeedsAttentionRow[]> {
  const services = await getServicesContainer();
  const items: NeedsAttentionRow[] = [];

  if (canUpdateAppointments(user)) {
    const { totalCount } =
      await services.bookingService.getPendingAppointmentsCount(new Date());

    if (totalCount > 0) {
      items.push({
        id: "pending-appointments",
        fingerprint: String(totalCount),
        level: "warning",
        title: {
          key: "admin.dashboard.needsAttention.pending.title",
        },
        description: {
          key: "admin.dashboard.needsAttention.pending.description",
          args: { count: totalCount },
        },
        action: {
          type: "link",
          href: "/dashboard?activeTab=appointments",
          label: {
            key: "admin.dashboard.needsAttention.pending.action",
          },
        },
        order: 10,
        compositeKey: compositeKey(
          "core",
          "pending-appointments",
          String(totalCount),
        ),
        appId: "core",
      });
    }
  }

  if (canFilterByMember(user)) {
    const warnings =
      await services.teamService.hasUpcomingAppointmentsOnInactiveMembers();

    const total = warnings.reduce((sum, warning) => sum + warning.count, 0);

    if (total > 0) {
      const memberIds = warnings.map((warning) => warning.memberId).sort();
      const fingerprint = `${total}:${memberIds.join(",")}`;
      const href = `/dashboard/appointments${serializeAppointmentsSearchParams({
        member: memberIds,
      })}`;

      items.push({
        id: "inactive-members",
        fingerprint,
        level: "warning",
        title: {
          key: "admin.dashboard.needsAttention.inactiveMembers.title",
        },
        description: {
          key: "admin.dashboard.needsAttention.inactiveMembers.description",
          args: { count: total },
        },
        action: {
          type: "link",
          href,
          label: {
            key: "admin.dashboard.needsAttention.inactiveMembers.action",
          },
        },
        order: 20,
        compositeKey: compositeKey("core", "inactive-members", fingerprint),
        appId: "core",
      });
    }
  }

  return items;
}

async function collectAppItems(
  user: SessionUser,
): Promise<NeedsAttentionRow[]> {
  const services = await getServicesContainer();
  const t = await getI18nAsync();
  const [ownerMemberIds, accessibleApps] = await Promise.all([
    getOwnerMemberIds(),
    getAccessibleConnectedApps(user),
  ]);

  const memberCache = new Map<string, OrganizationMember | null>();
  const resolveMember = async (memberId: string) => {
    if (!memberCache.has(memberId)) {
      memberCache.set(
        memberId,
        await services.teamService.getMemberById(memberId),
      );
    }

    return memberCache.get(memberId) ?? null;
  };

  const results = await services.connectedAppsService.invokeAppsByScope<
    INeedsAttentionApp,
    NeedsAttentionRow[]
  >(
    "needs-attention-provider",
    async (appData, service) => {
      if (
        !canAccessConnectedApp(user, withCatalogTarget(appData), ownerMemberIds)
      ) {
        return [];
      }

      const member = appData.memberId
        ? await resolveMember(appData.memberId)
        : null;
      const items = await service.getNeedAttentionItems(appData, member, user);

      return items.map((item) => ({
        ...item,
        compositeKey: compositeKey(appData._id, item.id, item.fingerprint),
        appId: appData._id,
        app: withCatalogTarget(appData),
      }));
    },
    {
      concurrencyLimit: 10,
      ignoreErrors: true,
    },
  );

  const items = results.filter(Boolean).flat() as NeedsAttentionRow[];

  for (const app of accessibleApps) {
    if (appHasNeedsAttentionScope(app.name)) {
      continue;
    }

    if (app.status !== "failed") {
      continue;
    }

    const catalog = AvailableApps[app.name];
    const displayName = catalog?.displayName
      ? t(catalog.displayName)
      : app.name;

    const fingerprint =
      typeof app.statusText === "string"
        ? app.statusText
        : app.statusText &&
            typeof app.statusText === "object" &&
            "key" in app.statusText
          ? String(app.statusText.key)
          : "failed";

    items.push({
      id: "app-failed",
      fingerprint,
      level: "error",
      title: {
        key: "admin.dashboard.needsAttention.failedApp.title",
        args: { appName: displayName },
      },
      description: {
        key: "admin.dashboard.needsAttention.failedApp.description",
        args: { appName: displayName },
      },
      action: {
        type: "update-app",
        label: {
          key: "admin.dashboard.needsAttention.failedApp.action",
        },
      },
      order: 30,
      compositeKey: compositeKey(app._id, "app-failed", fingerprint),
      appId: app._id,
      app: withCatalogTarget(app),
    });
  }

  return items;
}

export async function collectNeedsAttentionRows(
  user: SessionUser,
  organizationId: string,
): Promise<NeedsAttentionRow[]> {
  const [coreItems, appItems, dismissals] = await Promise.all([
    collectCoreItems(user),
    collectAppItems(user),
    listNeedsAttentionDismissals(organizationId, user.memberId),
  ]);

  const all = [...coreItems, ...appItems].sort((a, b) => {
    const levelDiff = LEVEL_RANK[a.level] - LEVEL_RANK[b.level];
    if (levelDiff !== 0) return levelDiff;
    return (a.order ?? 100) - (b.order ?? 100);
  });

  await pruneNeedsAttentionDismissals(
    organizationId,
    user.memberId,
    all.map((item) => item.compositeKey),
  );

  return all.filter((item) => !dismissals.has(item.compositeKey));
}
