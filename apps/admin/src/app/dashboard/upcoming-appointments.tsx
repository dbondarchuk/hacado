import { getI18nAsync, getLocale } from "@hacado/i18n/server";
import type { AppointmentStatus } from "@hacado/types";
import { Link } from "@hacado/ui";
import { durationToTime } from "@hacado/utils";
import { DateTime } from "luxon";
import React from "react";
import { getServicesContainer } from "../utils";

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  confirmed: "bg-primary/15 text-primary",
  pending: "bg-brand/15 text-brand",
  declined: "bg-red-50 text-red-500",
  canceled: "bg-orange-50 text-orange-600",
  noShow: "bg-muted text-muted-foreground",
};

function calendarHref(date: string, member?: string) {
  const params = new URLSearchParams({
    activeTab: "calendar",
    date,
  });
  if (member) {
    params.set("member", member);
  }
  return `/dashboard?${params.toString()}`;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0]?.toUpperCase())
    .filter(Boolean)
    .slice(0, 2)
    .join("");
}

export const UpcomingAppointments: React.FC<{
  memberId?: string;
  member?: string;
}> = async ({ memberId, member }) => {
  const t = await getI18nAsync("admin");
  const locale = await getLocale();
  const servicesContainer = await getServicesContainer();
  const { timeZone } =
    await servicesContainer.configurationService.getConfiguration("general");
  const nextAppointments =
    await servicesContainer.bookingService.getNextAppointments(
      DateTime.now().toJSDate(),
      6,
      memberId,
    );

  const todayStart = DateTime.now().setZone(timeZone).startOf("day");
  const todayIso = todayStart.toISODate()!;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-medium tracking-tight text-foreground">
          {t("dashboard.appointments.nextAppointments")}
        </h2>
        <Link
          href={calendarHref(todayIso, member)}
          variant="underline"
          className="text-sm shrink-0"
        >
          {t("dashboard.overview.openCalendar")}
        </Link>
      </div>
      {!nextAppointments.length ? (
        <p className="text-sm text-muted-foreground">
          {t("dashboard.appointments.noAppointments")}
        </p>
      ) : (
        <ul className="divide-y divide-border/70 rounded-2xl border border-border/70 bg-card flex-1 flex flex-col justify-between">
          {nextAppointments.map((appointment) => {
            const start = DateTime.fromJSDate(appointment.dateTime, {
              zone: timeZone,
            });
            const end = start.plus({ minutes: appointment.totalDuration });
            const isToday = start.startOf("day").equals(todayStart);
            const customerName =
              appointment.customer?.name ?? appointment.fields.name;
            const customerAvatar = appointment.customer?.avatar;
            const timeLabel = isToday
              ? `${start.toFormat("HH:mm")}–${end.toFormat("HH:mm")}`
              : `${start.toFormat("ccc HH:mm", { locale })}–${end.toFormat("HH:mm")}`;
            const meta = [
              customerName,
              !memberId && appointment.member?.name
                ? appointment.member.name
                : null,
              t(
                "common.timeDuration",
                durationToTime(appointment.totalDuration),
              ),
              appointment.addons?.length
                ? appointment.addons.map((addon) => addon.name).join(", ")
                : null,
            ].filter(Boolean);

            return (
              <li key={appointment._id}>
                <Link
                  href={`/dashboard/appointments/${appointment._id}`}
                  variant="standalone"
                  className="flex items-start gap-3 px-4 py-3 text-sm hover:bg-muted/40"
                >
                  {customerAvatar ? (
                    <img
                      src={customerAvatar}
                      alt=""
                      className="size-9 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      {initials(customerName)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="tabular-nums text-muted-foreground">
                        {timeLabel}
                      </span>
                      <span
                        className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[appointment.status] ?? "bg-muted text-muted-foreground"}`}
                      >
                        {t(`appointments.status.${appointment.status}`)}
                      </span>
                    </div>
                    <p className="truncate font-medium text-foreground">
                      {appointment.option.name}
                    </p>
                    <p className="truncate text-muted-foreground">
                      {meta.join(" · ")}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
