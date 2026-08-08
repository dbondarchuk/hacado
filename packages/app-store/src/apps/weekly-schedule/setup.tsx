import type { ComplexAppPageProps } from "@hacado/types";
import React from "react";
import { WeeklyScheduleForm } from "./components/form";

export const WeeklyScheduleAppSetup: React.FC<
  Pick<ComplexAppPageProps, "appId" | "services">
> = async ({ appId, services }) => {
  const members = await services.teamService.getActiveMembers();

  return (
    <WeeklyScheduleForm
      appId={appId}
      showMemberSelector={members.length >= 1}
    />
  );
};
