import { TranslationKeys, useI18n, useLocale } from "@hacado/i18n/client";
import { I18nRichText } from "@hacado/i18n/components";
import { DateTime as Luxon } from "luxon";
import { useModifyAppointmentFormContext } from "./context";

export const NotAllowedCard: React.FC = () => {
  const i18n = useI18n("translation");
  const { appointment, type } = useModifyAppointmentFormContext();

  const locale = useLocale();

  return (
    <div className="relative text-center">
      <div className="mb-3">
        <h2 className="text-lg font-bold">
          {i18n(`modification.form.notAllowed.${type}.title`)}
        </h2>
      </div>
      <div className="flex flex-row gap-2 justify-around flex-wrap">
        <I18nRichText
          namespace="translation"
          text={`modification.form.notAllowed.${type}.message`}
          args={{
            name: (appointment as any).name,
            service: (appointment as any).optionName,
            dateTime: Luxon.fromJSDate(
              (appointment as any).dateTime,
            ).toLocaleString(Luxon.DATE_FULL, {
              locale,
            }),
            reason:
              appointment &&
              "reason" in appointment &&
              i18n.has(
                `modification.form.searchError.notAllowed.reason.${appointment?.reason}` as TranslationKeys,
              )
                ? i18n(
                    `modification.form.searchError.notAllowed.reason.${appointment?.reason}` as TranslationKeys,
                  )
                : appointment && "reason" in appointment
                  ? appointment.reason
                  : i18n(
                      "modification.form.searchError.notAllowed.reason.unknown",
                    ),
          }}
        />
      </div>
    </div>
  );
};
