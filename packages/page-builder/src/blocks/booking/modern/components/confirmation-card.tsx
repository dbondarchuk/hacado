import { useI18n, useLocale } from "@timelish/i18n/client";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  useCurrencyFormat,
  useTimeZone,
} from "@timelish/ui";
import { durationToTime } from "@timelish/utils";
import { CheckCircle2 } from "lucide-react";
import { DateTime } from "luxon";
import { useScheduleContext } from "./context";

export const ConfirmationCard: React.FC = () => {
  const i18n = useI18n("translation");
  const currencyFormat = useCurrencyFormat();

  const {
    fields,
    selectedAppointmentOption,
    selectedMember,
    dateTime,
    handleNewBooking,
    price,
    discount,
    discountAmount,
    basePrice,
    duration,
  } = useScheduleContext();

  const locale = useLocale();
  const defaultTimeZone = useTimeZone();

  if (!selectedAppointmentOption) return null;

  return (
    <div className="text-center py-8">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-6 h-6 text-primary" />
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-2">
        {i18n("booking.confirmation.successTitle")}
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        {i18n("booking.confirmation.successMessage", {
          name: fields.name,
          service: selectedAppointmentOption.name,
        })}
      </p>
      <div className="bg-muted/50 flex flex-col gap-2 rounded-lg p-4 text-left">
        <p className="text-sm text-muted-foreground">
          {i18n("booking.confirmation.appointmentDetails")}
        </p>
        <p className="text-sm font-semibold text-foreground">
          {selectedAppointmentOption.name}
        </p>
        {selectedMember && (
          <div className="flex items-center gap-2 confirmation-specialist">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage
                src={selectedMember.member.image ?? undefined}
                alt={selectedMember.member.name}
              />
              <AvatarFallback>
                {selectedMember.member.name?.charAt(0)?.toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            <p className="text-xs text-foreground">
              {i18n("booking.confirmation.specialist", {
                name: selectedMember.member.name,
              })}
            </p>
          </div>
        )}
        {dateTime && (
          <>
            <p className="text-xs text-foreground">
              {DateTime.fromJSDate(dateTime.date)
                .set({ hour: dateTime.time.hour, minute: dateTime.time.minute })
                .setZone(dateTime.timeZone)
                .toLocaleString(DateTime.DATETIME_HUGE, { locale })}
            </p>
          </>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {i18n("booking.confirmation.duration", {
            duration: i18n(
              "common.formats.durationHourMinutes",
              durationToTime(duration || 0),
            ),
          })}
        </p>
        {!!discount && (
          <>
            <p className="text-xs text-muted-foreground mt-1">
              {i18n("booking.confirmation.price.original", {
                original: currencyFormat(basePrice),
              })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {i18n("booking.confirmation.price.discount", {
                discount: currencyFormat(discountAmount),
              })}
            </p>
          </>
        )}
        {!!basePrice && (
          <p className="text-sm font-semibold text-foreground mt-1">
            {i18n("booking.confirmation.price.total", {
              total: currencyFormat(price),
            })}
          </p>
        )}
      </div>
      <div className="mt-6 confirm-new-booking-button-container">
        <Button
          onClick={handleNewBooking}
          variant="outline"
          className="confirm-new-booking-button"
        >
          {i18n("booking.confirmation.newBookingButton")}
        </Button>
      </div>
    </div>
  );
};
