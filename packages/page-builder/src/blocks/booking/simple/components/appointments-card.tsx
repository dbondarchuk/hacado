import { useI18n } from "@hacado/i18n/client";
import {
  AppointmentChoice,
  minEffectiveDuration,
  minEffectivePrice,
  PublicStaffMember,
} from "@hacado/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  Markdown,
  useCurrencyFormat,
} from "@hacado/ui";
import { durationToTime } from "@hacado/utils";
import { DollarSign, Timer } from "lucide-react";
import React from "react";

export type AppointmentsCardProps = {
  options: AppointmentChoice[];
  members?: PublicStaffMember[];
  className?: string;
  id?: string;
  isBookingRestricted?: boolean;
  onSelectOption: (slug: string) => void;
};

export const AppointmentsCard: React.FC<
  AppointmentsCardProps & React.HTMLAttributes<HTMLDivElement>
> = ({
  options: meetings,
  members = [],
  className,
  id,
  isBookingRestricted,
  onSelectOption,
  ...props
}) => {
  const i18n = useI18n("translation");
  const currencyFormat = useCurrencyFormat();
  const activeMemberIds = React.useMemo(
    () => new Set(members.map((m) => m.id)),
    [members],
  );

  const onKeyPress = React.useCallback(
    (id: string, event: React.KeyboardEvent<any>) => {
      if (event.key === "Enter" || event.key === " ") {
        onSelectOption(id);
        event.preventDefault();
      }
    },
    [onSelectOption],
  );

  return (
    <div className={className} id={id} {...props}>
      {meetings.map((option) => {
        const activeAssignments = (option.staff || []).filter((s) =>
          activeMemberIds.has(s.memberId),
        );
        const isFromPricing = activeAssignments.length > 1;
        const displayDuration =
          option.durationType === "fixed"
            ? minEffectiveDuration(option.duration, activeAssignments)
            : undefined;
        const displayPrice =
          option.durationType === "fixed"
            ? minEffectivePrice(option.price, activeAssignments)
            : minEffectivePrice(option.pricePerHour, activeAssignments);

        return (
          <Card
            key={option._id}
            onClick={() => {
              if (!isBookingRestricted) {
                onSelectOption(option._id);
              }
            }}
            onKeyDown={(e) => {
              if (!isBookingRestricted) {
                onKeyPress(option._id, e);
              }
            }}
            className={cn(
              "flex flex-col justify-between",
              isBookingRestricted
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer",
            )}
            tabIndex={isBookingRestricted ? -1 : 1}
            aria-describedby={`option-${option._id}`}
            role="button"
          >
            <CardHeader id={`option-${option._id}`}>
              <div className="flex flex-col grow gap-2">
                <CardTitle>{option.name}</CardTitle>
                <CardDescription className="flex flex-col gap-2">
                  <div
                    className="flex flex-row items-center"
                    aria-label={
                      option.durationType === "fixed"
                        ? i18n(
                            "common.formats.formDurationHourMinutesLabel",
                            durationToTime(displayDuration ?? option.duration),
                          )
                        : i18n("common.formats.customDurationLabel")
                    }
                  >
                    <Timer className="mr-1" />
                    {option.durationType === "fixed"
                      ? isFromPricing
                        ? i18n("booking.specialist.fromDuration", {
                            duration: i18n(
                              "common.formats.durationHourMin",
                              durationToTime(
                                displayDuration ?? option.duration,
                              ),
                            ),
                          })
                        : i18n(
                            "common.formats.durationHourMin",
                            durationToTime(displayDuration ?? option.duration),
                          )
                      : i18n("common.labels.durationCustom")}
                  </div>
                  {option.durationType === "fixed" && !!displayPrice && (
                    <div
                      className="flex flex-row items-center"
                      aria-label={i18n("common.formats.formPriceLabel", {
                        price: currencyFormat(displayPrice),
                      })}
                    >
                      <DollarSign className="mr-1" aria-label="" />
                      {isFromPricing
                        ? i18n("booking.specialist.fromPrice", {
                            price: currencyFormat(displayPrice),
                          })
                        : currencyFormat(displayPrice)}
                    </div>
                  )}
                  {option.durationType === "flexible" && !!displayPrice && (
                    <div
                      className="flex flex-row items-center"
                      aria-label={i18n("common.formats.formPriceLabel", {
                        price: currencyFormat(displayPrice),
                      })}
                    >
                      <DollarSign className="mr-1" aria-label="" />
                      {isFromPricing
                        ? i18n("booking.specialist.fromPrice", {
                            price: i18n("booking.option.price_per_hour", {
                              price: currencyFormat(displayPrice),
                            }),
                          })
                        : i18n("booking.option.price_per_hour", {
                            price: currencyFormat(displayPrice),
                          })}
                    </div>
                  )}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Markdown markdown={option.description} prose="simple" />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
