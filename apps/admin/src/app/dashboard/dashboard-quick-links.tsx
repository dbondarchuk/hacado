import { getOwnerMemberIds } from "@/lib/auth/app-access";
import { DashboardQuickLinkInjectorApps } from "@hacado/app-store/injectors/dashboard-quick-link";
import { withCatalogTarget } from "@hacado/app-store/utils";
import { filterConnectedAppsForUser, hasPermission } from "@hacado/utils";
import { getOrganizationId, getServicesContainer, getSession } from "../utils";
import { CORE_QUICK_LINKS } from "./dashboard-quick-links-defs";
import { DashboardQuickLinksScroll } from "./dashboard-quick-links-scroll";
import type { QuickLinkRenderItem } from "./dashboard-quick-links-types";
import { getQuickLinkUsageScores } from "./quick-link-usage";

type OrderedQuickLink = QuickLinkRenderItem & { order: number };

export async function DashboardQuickLinks() {
  const [session, services, ownerMemberIds, organizationId] = await Promise.all(
    [
      getSession(),
      getServicesContainer(),
      getOwnerMemberIds(),
      getOrganizationId(),
    ],
  );

  const user = session?.user;
  const memberId = user?.memberId;
  const usageScoresPromise = memberId
    ? getQuickLinkUsageScores(organizationId, memberId)
    : Promise.resolve(new Map<string, number>());

  const links: OrderedQuickLink[] = [];

  for (const def of CORE_QUICK_LINKS) {
    if (!def.predicate({ session, user })) continue;

    if ("href" in def && def.href) {
      links.push({
        id: def.id,
        usageKey: def.id,
        order: def.order,
        labelKey: def.labelKey,
        icon: def.icon,
        href: def.href,
        notificationsCountKey: def.notificationsCountKey,
      });

      continue;
    }

    if (!("Action" in def) || !def.Action) continue;

    links.push({
      id: def.id,
      usageKey: def.id,
      order: def.order,
      labelKey: def.labelKey,
      icon: def.icon,
      Action: def.Action,
      notificationsCountKey: def.notificationsCountKey,
    });
  }

  const connectedApps = await services.connectedAppsService.getAppsByScope(
    "quick-link-provider",
  );

  const accessibleApps = filterConnectedAppsForUser(
    user,
    connectedApps.map(withCatalogTarget),
    ownerMemberIds,
  );

  for (const app of accessibleApps) {
    const injector = DashboardQuickLinkInjectorApps[app.name];
    if (!injector?.items?.length) continue;

    for (const item of injector.items) {
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

      const usageKey = `${app.name}:${item.id}`;

      if (item.href) {
        links.push({
          id: `${app._id}:${item.id}`,
          usageKey,
          order: item.order,
          labelKey: item.label,
          icon: item.icon,
          href: item.href,
          notificationsCountKey: item.notificationsCountKey,
        });

        continue;
      }

      if (!item.Action) continue;

      links.push({
        id: `${app._id}:${item.id}`,
        usageKey,
        order: item.order,
        labelKey: item.label,
        icon: item.icon,
        appId: app._id,
        Action: item.Action as QuickLinkRenderItem["Action"],
        notificationsCountKey: item.notificationsCountKey,
      });
    }
  }

  const usageScores = await usageScoresPromise;
  const resolved = links
    .sort((a, b) => {
      const scoreA = usageScores.get(a.usageKey) ?? 0;
      const scoreB = usageScores.get(b.usageKey) ?? 0;

      if (scoreB !== scoreA) return scoreB - scoreA;
      return a.order - b.order;
    })
    .map(({ order: _order, ...link }) => link);

  if (!resolved.length) {
    return null;
  }

  return <DashboardQuickLinksScroll links={resolved} />;
}
