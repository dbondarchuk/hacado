import { useI18n, useLocale } from "@hacado/i18n/client";
import { timeZones } from "@hacado/types";
import { CheckCircle2 } from "lucide-react";
import { DateTime } from "luxon";
import { useModifyAppointmentFormContext } from "./context";

export const ConfirmationCard: React.FC = () => {
  const t = useI18n("translation");
  const {
    appointment,
    type,
    newDateTime,
    timeZone: selectedTimeZone,
  } = useModifyAppointmentFormContext();
  const locale = useLocale();

  if (!appointment) return null;

  const timeZoneInfo = timeZones.find(
    (tz) => selectedTimeZone === tz.name || tz.group.includes(selectedTimeZone),
  );

  return (
    <div className="text-center py-8">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-6 h-6 text-primary" />
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-2">
        {t(`modification.confirmation.${type}.title`)}
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        {t(`modification.confirmation.${type}.description`)}
      </p>
      <div className="bg-muted/50 flex flex-col gap-2 rounded-lg p-4 text-left">
        <p className="text-sm text-muted-foreground">
          {t("modification.confirmation.appointmentDetails")}
        </p>
        <p className="text-sm font-semibold text-foreground">
          {appointment.optionName}
        </p>
        <p className="text-xs text-foreground line-through">
          {DateTime.fromJSDate(appointment.dateTime)
            .setZone(selectedTimeZone)
            .toLocaleString(DateTime.DATETIME_HUGE, { locale })}
        </p>
        {type === "reschedule" && newDateTime && (
          <>
            <p className="text-xs text-foreground">
              {newDateTime.toLocaleString(DateTime.DATETIME_HUGE, { locale })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("common.formats.timezone", {
                timezone: timeZoneInfo?.currentTimeFormat || "",
              })}
            </p>
          </>
        )}
      </div>
    </div>
  );
};
