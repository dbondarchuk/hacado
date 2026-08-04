import {
  getAppScopeUsage,
  type App,
  type AppScope,
  type AppTarget,
  type ConnectedApp,
  type DefaultAppToInstallScope,
  type SessionUser,
} from "@timelish/types";
import { hasPermission, meetsRequiredPermission } from "./permissions";

type ConnectedAppAccess = Pick<ConnectedApp, "memberId"> & {
  target: AppTarget;
};

/** Company-wide apps management (owner/admin). */
export function canViewCompanyApps(
  user: SessionUser | null | undefined,
): boolean {
  return hasPermission(user, "app", "useCompany");
}

/** Browse / manage another member's personal apps (owner/admin). */
export function canViewOtherMembersApps(
  user: SessionUser | null | undefined,
): boolean {
  return hasPermission(user, "app", "useCompany");
}

/**
 * Whether the user may invoke installed apps (company features like waitlist,
 * or member apps). Distinct from install/manage gates.
 */
export function canUseApps(user: SessionUser | null | undefined): boolean {
  return (
    hasPermission(user, "app", "useCompany") ||
    hasPermission(user, "app", "useUser")
  );
}

export function canInstallCompanyApps(
  user: SessionUser | null | undefined,
): boolean {
  return (
    hasPermission(user, "app", "install") &&
    hasPermission(user, "app", "useCompany")
  );
}

export function canInstallMemberApps(
  user: SessionUser | null | undefined,
): boolean {
  return (
    hasPermission(user, "app", "install") &&
    hasPermission(user, "app", "useUser")
  );
}

export function canInstallAppTarget(
  user: SessionUser | null | undefined,
  target: AppTarget,
): boolean {
  return target === "company"
    ? canInstallCompanyApps(user)
    : canInstallMemberApps(user);
}

/**
 * Whether the user may install this catalog app (target gate + optional
 * `requiredPermission`, e.g. `app:installPrivileged` for coordinator+).
 */
export function canInstallApp(
  user: SessionUser | null | undefined,
  app: Pick<App, "target" | "requiredPermission">,
): boolean {
  if (!canInstallAppTarget(user, app.target)) return false;
  return meetsRequiredPermission(user, app.requiredPermission);
}

/**
 * Install-default scopes offered after connect. Company-usage scopes require
 * `canInstallCompanyApps` (staff installing Outlook skips mail-send, etc.).
 */
export function filterInstallDefaultScopesForUser<
  T extends AppScope | DefaultAppToInstallScope,
>(scopes: readonly T[], user: SessionUser | null | undefined): T[] {
  const allowCompany = canInstallCompanyApps(user);
  return scopes.filter((scope) => {
    if (getAppScopeUsage(scope) === "company") return allowCompany;
    return true;
  });
}

export function canUninstallApps(
  user: SessionUser | null | undefined,
): boolean {
  return hasPermission(user, "app", "uninstall");
}

/**
 * Whether `user` may see / invoke a connected app instance.
 * Company apps (e.g. waitlist) are usable by any role with app use permission.
 * Admins cannot access member-targeted apps owned by an organization owner.
 * Callers must resolve `target` from the catalog.
 */
export function canAccessConnectedApp(
  user: SessionUser | null | undefined,
  app: ConnectedAppAccess,
  ownerMemberIds: ReadonlySet<string>,
): boolean {
  if (!user) return false;

  if (app.target === "company") {
    return canUseApps(user);
  }

  if (!hasPermission(user, "app", "useUser")) return false;

  if (app.memberId === user.memberId) return true;

  if (!canViewOtherMembersApps(user)) return false;

  // Admins (and below) must not see/control the owner's personal apps.
  if (user.role !== "owner" && ownerMemberIds.has(app.memberId)) {
    return false;
  }

  return true;
}

/**
 * Uninstall is stricter than use: company apps require `useCompany`
 * so staff can use waitlist without being able to remove it.
 * Callers must resolve `target` from the catalog.
 */
export function canUninstallConnectedApp(
  user: SessionUser | null | undefined,
  app: ConnectedAppAccess,
  ownerMemberIds: ReadonlySet<string>,
): boolean {
  if (!canUninstallApps(user)) return false;
  if (!canAccessConnectedApp(user, app, ownerMemberIds)) return false;
  if (app.target === "company") {
    return canViewCompanyApps(user);
  }
  return true;
}

export function filterConnectedAppsForUser<T extends ConnectedAppAccess>(
  user: SessionUser | null | undefined,
  apps: T[],
  ownerMemberIds: ReadonlySet<string>,
): T[] {
  return apps.filter((app) =>
    canAccessConnectedApp(user, app, ownerMemberIds),
  );
}

/**
 * Installs that count toward "already installed" / `dontAllowMultiple` for the
 * current user. Member-targeted apps are scoped to that user's own memberId so
 * another member's install does not block them.
 * Callers must resolve `target` from the catalog.
 */
export function filterConnectedAppsForInstallQuota<
  T extends ConnectedAppAccess,
>(
  user: SessionUser | null | undefined,
  apps: T[],
  ownerMemberIds: ReadonlySet<string>,
): T[] {
  return filterConnectedAppsForUser(user, apps, ownerMemberIds).filter(
    (app) => {
      if (app.target !== "member") return true;
      return !!user?.memberId && app.memberId === user.memberId;
    },
  );
}
