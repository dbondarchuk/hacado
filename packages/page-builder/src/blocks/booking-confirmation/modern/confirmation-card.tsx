"use client";

import { useI18n, useLocale } from "@hacado/i18n/client";
import { Appointment } from "@hacado/types";
import { Link, useCurrencyFormat, useTimeZone } from "@hacado/ui";
import { durationToTime } from "@hacado/utils";
import { CheckCircle2 } from "lucide-react";
import { DateTime } from "luxon";
import { forwardRef } from "react";

export const ConfirmationCard = forwardRef<
  HTMLDivElement,
  {
    appointment: Appointment;
    newBookingPage?: string;
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
    className?: string;
    id?: string;
  }
>(({ appointment, newBookingPage, onClick, className, id }, ref) => {
  const i18n = useI18n("translation");
  const locale = useLocale();
  const defaultTimeZone = useTimeZone();
  const currencyFormat = useCurrencyFormat();

  const dateTime =
    appointment?.dateTime && "timestamp" in appointment.dateTime
      ? DateTime.fromMillis(appointment.dateTime.timestamp as number).setZone(
          appointment.timeZone as string,
        )
      : undefined;

  return (
    <div className={className} ref={ref} onClick={onClick} id={id}>
      {appointment?.option && appointment.fields ? (
        <div className="max-w-3xl mx-auto booking-container">
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              {i18n("booking.confirmation.successTitle")}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {i18n("booking.confirmation.successMessage", {
                name: appointment.fields.name,
                service: appointment.option.name,
              })}
            </p>
            <div className="bg-muted/50 flex flex-col gap-2 rounded-lg p-4 text-left">
              <p className="text-sm text-muted-foreground">
                {i18n("booking.confirmation.appointmentDetails")}
              </p>
              <p className="text-sm font-semibold text-foreground">
                {appointment.option.name}
              </p>
              {!!dateTime && dateTime.isValid && (
                <>
                  <p className="text-xs text-foreground">
                    {dateTime.toLocaleString(DateTime.DATETIME_HUGE, {
                      locale: locale,
                    })}
                  </p>
                </>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {i18n("booking.confirmation.duration", {
                  duration: i18n(
                    "common.formats.durationHourMinutes",
                    durationToTime(appointment.totalDuration || 0),
                  ),
                })}
              </p>
              {!!appointment.discount && (
                <>
                  <p className="text-xs text-muted-foreground mt-1">
                    {i18n("booking.confirmation.price.original", {
                      original: currencyFormat(
                        (appointment.totalPrice || 0) +
                          (appointment.discount.discountAmount || 0),
                      ),
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {i18n("booking.confirmation.price.discount", {
                      discount: currencyFormat(
                        appointment.discount.discountAmount,
                      ),
                    })}
                  </p>
                </>
              )}
              {(!!appointment.totalPrice || !!appointment.discount) && (
                <p className="text-sm font-semibold text-foreground mt-1">
                  {i18n("booking.confirmation.price.total", {
                    total: currencyFormat(appointment.totalPrice || 0),
                  })}
                </p>
              )}
            </div>
            {newBookingPage && (
              <div className="mt-6 confirm-new-booking-button-container">
                <Link
                  href={newBookingPage}
                  button
                  variant="outline"
                  className="confirm-new-booking-button"
                >
                  {i18n("booking.confirmation.newBookingButton")}
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="relative text-center">
          <h2>{i18n("modification.appointmentFetchFailed.title")}</h2>
        </div>
      )}
    </div>
  );
});
