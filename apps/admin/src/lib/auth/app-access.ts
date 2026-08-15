import { getServicesContainer, getUser } from "@/app/utils";
import { withCatalogTarget } from "@hacado/app-store/utils";
import type { ConnectedApp, SessionUser } from "@hacado/types";
import {
  canAccessConnectedApp,
  filterConnectedAppsForUser,
} from "@hacado/utils";

export async function getOwnerMemberIds(
  organizationId?: string,
): Promise<Set<string>> {
  const services = await getServicesContainer();
  const members = await services.teamService.getActiveMembers();
  return new Set(
    members.filter((member) => member.role === "owner").map((m) => m._id),
  );
}

export async function getAccessibleConnectedApps(
  user?: SessionUser,
): Promise<ConnectedApp[]> {
  const [services, sessionUser, ownerMemberIds] = await Promise.all([
    getServicesContainer(),
    user ? Promise.resolve(user) : getUser(),
    getOwnerMemberIds(),
  ]);
  const apps = await services.connectedAppsService.getApps();
  return filterConnectedAppsForUser(
    sessionUser,
    apps.map(withCatalogTarget),
    ownerMemberIds,
  );
}

export async function assertCanAccessConnectedApp(
  appId: string,
  user?: SessionUser,
): Promise<ConnectedApp> {
  const [services, sessionUser, ownerMemberIds] = await Promise.all([
    getServicesContainer(),
    user ? Promise.resolve(user) : getUser(),
    getOwnerMemberIds(),
  ]);
  const app = await services.connectedAppsService.getAppStatus(appId);
  if (
    !canAccessConnectedApp(sessionUser, withCatalogTarget(app), ownerMemberIds)
  ) {
    const error = new Error("Forbidden");
    (error as Error & { status: number }).status = 403;
    throw error;
  }
  return app;
}
