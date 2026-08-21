"use client";

import { useI18n } from "@hacado/i18n/client";
import { Appointment, isAppointmentCoveredByPackage } from "@hacado/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
} from "@hacado/ui";
import { durationToTime } from "@hacado/utils";
import { DollarSign, Timer } from "lucide-react";
import { forwardRef } from "react";

export const ConfirmationCard = forwardRef<
  HTMLDivElement,
  {
    appointment: Appointment;
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
    className?: string;
    id?: string;
  }
>(({ appointment, onClick, className, id }, ref) => {
  const i18n = useI18n("translation");

  return (
    <Card
      className={cn("sm:min-w-min md:w-full", className)}
      id={id}
      onClick={onClick}
      ref={ref}
    >
      {appointment?.option && appointment.fields ? (
        <>
          <CardHeader className="text-center">
            <CardTitle>{appointment.option.name}</CardTitle>
            <CardDescription className="flex flex-row gap-2 justify-center place-items-center">
              {appointment.totalDuration && (
                <div className="flex flex-row items-center">
                  <Timer className="mr-1" />
                  {i18n(
                    "common.formats.durationHourMin",
                    durationToTime(appointment.totalDuration),
                  )}
                </div>
              )}
              {isAppointmentCoveredByPackage(appointment) ? (
                <div className="flex flex-row items-center">
                  {i18n("booking.confirmation.package", {
                    name: appointment.packageUsage!.name,
                  })}
                </div>
              ) : appointment.totalPrice ? (
                <div className="flex flex-row items-center">
                  <DollarSign className="mr-1" />
                  {appointment.totalPrice.toFixed(2).replace(/\.00$/, "")}
                </div>
              ) : null}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative text-center">
              <div className="mb-3">
                <h2 className="text-lg font-bold">
                  {i18n("booking.confirmation.successTitle")}
                </h2>
              </div>
              <div className="flex flex-row gap-2 justify-around flex-wrap">
                {i18n("booking.confirmation.successMessage", {
                  name: appointment.fields.name,
                  service: appointment.option.name,
                })}
              </div>
            </div>
          </CardContent>
        </>
      ) : (
        <CardContent>
          <div className="relative text-center">
            <h2>{i18n("modification.appointmentFetchFailed.title")}</h2>
          </div>
        </CardContent>
      )}
    </Card>
  );
});
