import type { ComplexAppPageProps } from "@hacado/types";
import React from "react";
import { BusyEventsForm } from "./components/form";

export const BusyEventsAppSetup: React.FC<
  Pick<ComplexAppPageProps, "appId" | "services">
> = async ({ appId }) => {
  return <BusyEventsForm appId={appId} />;
};
