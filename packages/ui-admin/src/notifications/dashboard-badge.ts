import {
  DASHBOARD_BADGE_EVENT,
  type DashboardBadgeUpdate,
} from "@hacado/types";

export function applyDashboardBadgeUpdate(
  badges: Record<string, number>,
  update: DashboardBadgeUpdate,
): Record<string, number> {
  if (update.count !== undefined) {
    return { ...badges, [update.key]: update.count };
  }

  if (update.increment !== undefined) {
    return {
      ...badges,
      [update.key]: (badges[update.key] ?? 0) + update.increment,
    };
  }

  return badges;
}

export function dispatchDashboardBadge(update: DashboardBadgeUpdate): void {
  window.dispatchEvent(
    new CustomEvent(DASHBOARD_BADGE_EVENT, { detail: update }),
  );
}
