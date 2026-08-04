import { getServicesContainer, getUser } from "@/app/utils";
import { getAccessibleConnectedApps } from "@/lib/auth/app-access";
import { AvailableApps } from "@timelish/app-store";
import {
  canViewCompanyApps,
  canViewOtherMembersApps,
} from "@timelish/utils";
import React from "react";
import { InstalledAppsClient } from "./installed-apps-client";

export const InstalledApps: React.FC = async () => {
  const [user, services, apps] = await Promise.all([
    getUser(),
    getServicesContainer(),
    getAccessibleConnectedApps(),
  ]);

  const visibleApps = apps.filter(
    (app) => AvailableApps[app.name] && !AvailableApps[app.name].isHidden,
  );

  const showCompanyScope = canViewCompanyApps(user);
  const showMemberPicker = canViewOtherMembersApps(user);

  const excludeMemberIds =
    showMemberPicker && user.role !== "owner"
      ? (await services.teamService.getActiveMembers())
          .filter((member) => member.role === "owner")
          .map((member) => member._id)
      : undefined;

  return (
    <InstalledAppsClient
      apps={visibleApps}
      currentMemberId={user.memberId}
      showCompanyScope={showCompanyScope}
      showMemberPicker={showMemberPicker}
      excludeMemberIds={excludeMemberIds}
    />
  );
};
