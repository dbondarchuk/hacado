import { useI18n, useLocale } from "@hacado/i18n/client";
import { timeZones } from "@hacado/types";
import { Button, useTimeZone } from "@hacado/ui";
import { TimeZone } from "@vvo/tzdb";
import { CheckCircle2 } from "lucide-react";
import { DateTime } from "luxon";
import {
  MyCabinetPublicKeys,
  MyCabinetPublicNamespace,
  myCabinetPublicNamespace,
} from "../../../../translations/types";
import { useCabinetModifyContext } from "./context";

export const ConfirmationCard: React.FC = () => {
  const t = useI18n("translation");
  const tc = useI18n<MyCabinetPublicNamespace, MyCabinetPublicKeys>(
    myCabinetPublicNamespace,
  );
  const { appointment, type, newDateTime, dateTime } =
    useCabinetModifyContext();
  const defaultTimeZone = useTimeZone();
  const locale = useLocale();

  if (!appointment) return null;

  let timeZone: TimeZone | undefined = timeZones.find((tz) => {
    const timeZoneName =
      dateTime?.timeZone || appointment.timeZone || defaultTimeZone;
    return timeZoneName === tz.name || tz.group.includes(timeZoneName);
  });

  if (!timeZone) {
    const defaultZone = DateTime.now().zoneName;
    timeZone = timeZones.find((tz) => {
      return defaultZone === tz.name || tz.group.includes(defaultZone || "");
    });
  }

  return (
    <div className="text-center py-8 modify-confirmation-container">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 modify-confirmation-icon">
        <CheckCircle2 className="w-6 h-6 text-primary" />
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-2 modify-confirmation-title">
        {t(`modification.confirmation.${type}.title`)}
      </h2>
      <p className="text-sm text-muted-foreground mb-6 modify-confirmation-description">
        {t(`modification.confirmation.${type}.description`)}
      </p>
      <div className="bg-muted/50 flex flex-col gap-2 rounded-lg p-4 text-left modify-confirmation-details">
        <p className="text-sm text-muted-foreground">
          {t("modification.confirmation.appointmentDetails")}
        </p>
        <p className="text-sm font-semibold text-foreground modify-confirmation-service">
          {appointment.optionName}
        </p>
        <p className="text-xs text-foreground line-through modify-confirmation-original-date">
          {DateTime.fromJSDate(appointment.dateTime)
            .setZone(appointment.timeZone)
            .toLocaleString(DateTime.DATETIME_HUGE, { locale })}
        </p>
        {type === "reschedule" && newDateTime && (
          <>
            <p className="text-xs text-foreground modify-confirmation-new-date">
              {newDateTime.toLocaleString(DateTime.DATETIME_HUGE, { locale })}
            </p>
            <p className="text-xs text-muted-foreground mt-1 modify-confirmation-timezone">
              {t("common.formats.timezone", {
                timezone: timeZone?.currentTimeFormat || "",
              })}
            </p>
          </>
        )}
      </div>
      <Button
        variant="outline"
        className="mt-6 modify-confirmation-back-button"
        onClick={() => {
          window.location.hash = "";
        }}
      >
        {tc("block.modify.backToAppointments")}
      </Button>
    </div>
  );
};
