"use client";

import { useI18n, useLocale } from "@timelish/i18n/client";
import type { Appointment } from "@timelish/types";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Link,
  use12HourFormat,
  useCurrencyFormat,
} from "@timelish/ui";
import { useAuth } from "@timelish/ui-admin";
import { canUpdateAppointment, durationToTime } from "@timelish/utils";
import { CalendarCheck2, CalendarX2 } from "lucide-react";
import { DateTime } from "luxon";
import React from "react";
import { AppointmentActionButton } from "./action-button";
import { AppointmentDeclineDialog } from "./appointment-decline-dialog";
import { APPOINTMENT_STATUS_STYLES } from "./const";

export type AppointmentCardProps = {
  appointment: Appointment;
  timeZone?: string;
};

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  timeZone = "local",
}) => {
  const t = useI18n("admin");
  const locale = useLocale();
  const uses12HourFormat = use12HourFormat();
  const currencyFormat = useCurrencyFormat();
  const { user } = useAuth();
  const canUpdate = canUpdateAppointment(user, appointment.memberId);

  return (
    <div className="w-full flex flex-col md:max-w-sm rounded-lg border border-border bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar>
            <AvatarImage
              src={appointment.customer?.avatar ?? undefined}
              alt={appointment.customer?.name ?? appointment.fields.name}
            />
            <AvatarFallback>
              {(appointment.customer?.name ?? appointment.fields.name)
                .split(" ")
                .map((name) => name[0]?.toUpperCase())
                .filter((name) => name)
                .slice(0, 2)
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground truncate">
              {t.rich("appointments.card.by", {
                name: appointment.customer?.name ?? appointment.fields.name,
                link: (chunks: any) => (
                  <Link
                    href={`/dashboard/customers/${appointment.customerId}`}
                    variant="underline"
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </p>
            <p className="text-base font-medium text-foreground truncate">
              <Link
                href={`/dashboard/appointments/${appointment._id}`}
                variant="underline"
              >
                {appointment.option.name}
              </Link>
            </p>
          </div>
        </div>
        <span
          className={`ml-3 shrink-0 text-sm font-medium px-2.5 py-1 rounded-full ${APPOINTMENT_STATUS_STYLES[appointment.status] ?? "bg-muted text-muted-foreground"}`}
        >
          {t(`appointments.status.${appointment.status}`)}
        </span>
      </div>

      {/* Date & Time */}
      <div className="px-5 py-4 border-b border-border grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
            {t("appointments.card.date")}
          </p>
          <p className="text-base font-medium text-foreground">
            {DateTime.fromJSDate(appointment.dateTime, {
              zone: timeZone,
            }).toFormat("EEE, MMM d", { locale })}
          </p>
          <p className="text-sm text-muted-foreground">
            {DateTime.fromJSDate(appointment.dateTime, {
              zone: timeZone,
            }).toFormat("yyyy", { locale })}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
            {t("appointments.card.time")}
          </p>
          <p className="text-base font-medium text-foreground">
            {DateTime.fromJSDate(appointment.dateTime, {
              zone: timeZone,
            }).toFormat(uses12HourFormat ? "h:mm" : "HH:mm", { locale })}
            –
            {DateTime.fromJSDate(appointment.dateTime, {
              zone: timeZone,
            })
              .plus({ minutes: appointment.totalDuration })
              .toLocaleString(DateTime.TIME_SIMPLE, { locale })}
          </p>
          <p className="text-sm text-muted-foreground">
            {t(
              "common.timeDuration",
              durationToTime(appointment.totalDuration),
            )}
          </p>
        </div>
      </div>

      {/* Add-ons */}
      {appointment.addons && appointment.addons.length > 0 && (
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2.5">
            {t("appointments.card.addons")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {appointment.addons.map((addon) => (
              <span
                key={addon._id}
                className="text-sm px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100"
              >
                {addon.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Note */}
      {appointment.note && (
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1.5">
            {t("appointments.card.note")}
          </p>
          <p className="text-sm text-foreground leading-relaxed">
            {appointment.note}
          </p>
        </div>
      )}

      <div className="flex-1" />

      {/* Price */}
      {!!appointment.totalPrice && (
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-muted">
          <p className="text-base text-muted-foreground">
            {t("appointments.card.price")}
          </p>
          <p className="text-lg font-medium text-foreground">
            {currencyFormat(appointment.totalPrice)}
          </p>
        </div>
      )}

      {/* Actions */}
      {canUpdate && appointment.status !== "declined" && (
        <div className="px-5 py-4 flex flex-col gap-2">
          <AppointmentDeclineDialog
            appointment={appointment}
            trigger={
              <Button
                variant="destructive"
                className="inline-flex flex-row gap-2 items-center"
              >
                <CalendarX2 size={20} /> {t("appointments.card.decline")}
              </Button>
            }
          />
          {appointment.status === "pending" && (
            <AppointmentActionButton
              variant="default"
              _id={appointment._id}
              status="confirmed"
              icon={CalendarCheck2}
            >
              {t("appointments.card.confirm")}
            </AppointmentActionButton>
          )}
        </div>
      )}
    </div>
  );
};
