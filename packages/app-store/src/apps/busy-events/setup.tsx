import type { ComplexAppPageProps } from "@timelish/types";
import React from "react";
import { BusyEventsForm } from "./components/form";

export const BusyEventsAppSetup: React.FC<
  Pick<ComplexAppPageProps, "appId" | "services">
> = async ({ appId, services }) => {
  const members = await services.teamService.getActiveMembers();

  return (
    <BusyEventsForm
      appId={appId}
      members={members.map((member) => ({
        id: member._id,
        name: member.name || member.email || member.userId,
      }))}
    />
  );
};
