import { useIsMobile } from "@hacado/ui";
import React from "react";
import {
  DayScheduleSelector,
  DayScheduleSelectorProps,
} from "./day-schedule-selector";
import { SimpleScheduler, SimpleSchedulerProps } from "./simple-scheduler";

export const Scheduler: React.FC<
  DayScheduleSelectorProps &
    SimpleSchedulerProps & {
      view?: "simple" | "full";
    }
> = ({ view: forceView, ...props }) => {
  const isMobile = useIsMobile();
  const view = forceView ?? (isMobile ? "simple" : "full");

  return view === "full" ? (
    <DayScheduleSelector {...props} />
  ) : (
    <SimpleScheduler {...props} />
  );
};
