import { useI18n } from "@hacado/i18n/client";
import { Button } from "@hacado/ui";
import { durationToTime } from "@hacado/utils";
import React from "react";
import { useScheduleContext } from "./context";

export const DurationCard: React.FC = () => {
  const i18n = useI18n("translation");
  const { setDuration, duration, appointmentOption } = useScheduleContext();

  if (appointmentOption.durationType !== "flexible") return null;

  const durations = React.useMemo(() => {
    const durations = [];
    for (
      let i = appointmentOption.durationMin;
      i <= appointmentOption.durationMax;
      i += appointmentOption.durationStep
    ) {
      durations.push(i);
    }

    return durations;
  }, [
    appointmentOption.durationMin,
    appointmentOption.durationMax,
    appointmentOption.durationStep,
  ]);

  return (
    <div className="relative text-center">
      <div className="mb-3">
        <h2>{i18n("common.labels.durationSelectTitle")}</h2>
      </div>
      <div className="flex flex-row gap-2 justify-around flex-wrap">
        {durations.map((dur) => (
          <div className="" key={dur}>
            <Button
              className="w-36"
              variant={duration === dur ? "default" : "outline"}
              onClick={() => setDuration(duration === dur ? undefined : dur)}
            >
              {i18n("common.formats.durationHourMinutes", durationToTime(dur))}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
