import { useI18n } from "@timelish/i18n/client";
import { Checkbox, Label, Markdown } from "@timelish/ui";
import { template } from "@timelish/utils";
import { DateTime } from "luxon";
import { useScheduleContext } from "./context";

export const DuplicateAppointmentConfirmationCard: React.FC = () => {
  const i18n = useI18n("translation");
  const {
    closestDuplicateAppointment,
    fields,
    appointmentOption,
    confirmDuplicateAppointment,
    setConfirmDuplicateAppointment,
    duplicateAppointmentDoNotAllowScheduling,
  } = useScheduleContext();

  if (
    !appointmentOption.duplicateAppointmentCheck?.enabled ||
    !closestDuplicateAppointment
  ) {
    return null;
  }

  return (
    <div className="relative">
      <div className="mb-3 text-center">
        <h2>{i18n("booking.review.duplicate.confirmationTitle")}</h2>
      </div>
      <div className="flex flex-col gap-4 flex-wrap">
        <Markdown
          markdown={template(
            appointmentOption.duplicateAppointmentCheck.message,
            {
              date: closestDuplicateAppointment.toLocaleString(
                DateTime.DATETIME_FULL,
              ),
              name: fields.name,
              service: appointmentOption.name,
              days: appointmentOption.duplicateAppointmentCheck.days,
            },
          )}
          prose="simple"
        />
        {!duplicateAppointmentDoNotAllowScheduling && (
          <Label className="flex flex-row gap-2 items-center text-base">
            <Checkbox
              checked={confirmDuplicateAppointment}
              onCheckedChange={(e) => setConfirmDuplicateAppointment(!!e)}
            />
            <div className="cursor-pointer">
              {i18n("booking.review.duplicate.confirmationCheckboxLabel")}
            </div>
          </Label>
        )}
      </div>
    </div>
  );
};
