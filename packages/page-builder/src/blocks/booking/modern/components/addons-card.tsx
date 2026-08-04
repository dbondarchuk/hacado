import { useI18n } from "@timelish/i18n/client";
import { AppointmentAddon } from "@timelish/types";
import { cn, Markdown, useCurrencyFormat } from "@timelish/ui";
import { durationToTime } from "@timelish/utils";
import { Check, Clock } from "lucide-react";
import { useScheduleContext } from "./context";

export const AddonsCard: React.FC = () => {
  const {
    selectedAppointmentOption,
    setSelectedAddons,
    selectedAddons,
    setDiscount,
  } = useScheduleContext();

  const t = useI18n("translation");
  const currencyFormat = useCurrencyFormat();

  if (!selectedAppointmentOption) return null;

  const onClick = (option: AppointmentAddon): void => {
    const index = (selectedAddons || []).findIndex(
      (addon) => addon._id === option._id,
    );

    if (index < 0) {
      setSelectedAddons([...(selectedAddons || []), option]);
    } else {
      setSelectedAddons([
        ...(selectedAddons || []).slice(0, index),
        ...(selectedAddons || []).slice(index + 1),
      ]);
    }

    setDiscount(undefined);
  };

  return (
    <div className="space-y-4 addons-card card-container">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground addons-card-title card-title">
          {t("booking.addons.title")}
        </h2>
        <p className="text-xs text-muted-foreground addons-card-description card-description">
          {t("booking.addons.description")}
        </p>
      </div>
      <div className="grid gap-3 addons-list">
        {selectedAppointmentOption.addons?.map((addon) => {
          const isSelected = selectedAddons?.some((a) => a._id === addon._id);
          return (
            <button
              key={addon._id}
              onClick={() => onClick(addon)}
              className={cn(
                "w-full cursor-pointer p-4 rounded-lg border-2 text-left transition-all duration-200",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-accent/50",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors",
                      isSelected
                        ? "bg-primary border-primary"
                        : "border-muted-foreground",
                    )}
                  >
                    {isSelected && (
                      <Check className="w-3 h-3 text-primary-foreground" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-foreground">
                      {addon.name}
                    </h3>
                    <Markdown
                      markdown={addon.description}
                      prose="simple"
                      className="text-xs text-muted-foreground [&_p]:my-0.5 [&_p]:leading-6"
                    />
                  </div>
                </div>
                {(!!addon.price || !!addon.duration) && (
                  <div className="text-right flex-shrink-0">
                    {!!addon.price && (
                      <p className="text-sm font-semibold text-foreground">
                        +{currencyFormat(addon.price)}
                      </p>
                    )}
                    {!!addon.duration && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" /> +
                        {t(
                          "common.formats.durationHourMin",
                          durationToTime(addon.duration),
                        )}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </button>
          );
        }) || (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t("booking.addons.no_addons_available")}
          </p>
        )}
      </div>
    </div>
  );
};
