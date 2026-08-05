import { useI18n } from "@hacado/i18n/client";
import { AppointmentAddon } from "@hacado/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Markdown,
  useCurrencyFormat,
} from "@hacado/ui";
import { durationToTime } from "@hacado/utils";
import { DollarSign, Timer } from "lucide-react";
import React from "react";
import { useScheduleContext } from "./context";

export const AddonsCard: React.FC = () => {
  const i18n = useI18n("translation");
  const {
    appointmentOption,
    setSelectedAddons,
    selectedAddons,
    setDiscount,
    className,
  } = useScheduleContext();

  const currencyFormat = useCurrencyFormat();

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
    <div className="flex flex-col gap-2">
      <div className="text-center">
        <h2 className="text-xl">{i18n("booking.addons.selectLabel")}</h2>
      </div>
      <div className={className}>
        {(appointmentOption.addons || []).map((addon) => {
          return (
            <Card
              key={addon._id}
              onClick={() => onClick(addon)}
              className="cursor-pointer flex flex-col justify-between"
            >
              <CardHeader
                className="flex flex-row w-full"
                id={`addon-${addon._id}`}
              >
                <div className="flex flex-col grow gap-2">
                  <CardTitle className="mt-0">{addon.name}</CardTitle>
                  <CardDescription className="flex flex-col gap-2">
                    {addon.duration && (
                      <div
                        className="flex flex-row items-center"
                        aria-label={i18n(
                          "common.formats.formDurationHourMinutesLabel",
                          durationToTime(addon.duration),
                        )}
                      >
                        <Timer className="mr-1" />
                        {i18n(
                          "common.formats.durationHourMin",
                          durationToTime(addon.duration),
                        )}
                      </div>
                    )}
                    {addon.price && (
                      <div
                        className="flex flex-row items-center"
                        aria-label={i18n("common.formats.formPriceLabel", {
                          price: currencyFormat(addon.price),
                        })}
                      >
                        <DollarSign className="mr-1" />
                        {currencyFormat(addon.price)}
                      </div>
                    )}
                  </CardDescription>
                </div>
                <div className="flex place-content-start">
                  <Checkbox
                    aria-describedby={`addon-${addon._id}`}
                    checked={selectedAddons?.some((a) => a._id === addon._id)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Markdown markdown={addon.description} prose="simple" />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
