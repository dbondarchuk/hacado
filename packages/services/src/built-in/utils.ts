import type { BaseAllKeys } from "@timelish/i18n";
import type { AppScope, ConnectedAppData } from "@timelish/types";
import { BuiltInApps } from "./apps";

export const getBuiltInAppData = (
  organizationId: string,
  memberId: string,
  name: keyof typeof BuiltInApps,
): ConnectedAppData => {
  return {
    status: "connected",
    statusText: "apps.common.statusText.connected" satisfies BaseAllKeys,
    name: name,
    _id: name,
    memberId,
    organizationId: organizationId,
  };
};

export const getBuiltInAppsForScope = (scope: AppScope) => {
  return Object.entries(BuiltInApps)
    .filter(([_, app]) => app.scopes?.includes(scope))
    .map(([name, app]) => {
      return {
        name: name as keyof typeof BuiltInApps,
        getService: app.getService,
      };
    });
};
