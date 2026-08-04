"use client";

import React from "react";

import { adminApi } from "@timelish/api-sdk";
import { useI18n, useLocale } from "@timelish/i18n/client";
import { Appointment } from "@timelish/types";
import { Skeleton, useDebounceCacheFn, useTimeZone } from "@timelish/ui";
import { DateTime } from "luxon";
import { CustomerName } from "./customer-name";
import {
  AsyncFilterBoxOption,
  AsyncFilterBoxProps,
  DataTableAsyncFilterBox,
} from "./data-table-async-filter-box";

const AppointmentShortLabel: React.FC<{
  appointment: Appointment;
  locale: string;
  timeZone: string;
}> = ({ appointment, locale, timeZone }) => {
  const formatTime = (value: Date | string) =>
    DateTime.fromJSDate(new Date(value), { zone: timeZone }).toLocaleString(
      DateTime.DATETIME_MED,
      { locale },
    );

  return (
    <div className="flex min-w-0 flex-col gap-0.5 overflow-hidden text-nowrap">
      <span className="truncate font-medium">{appointment.option.name}</span>
      <span className="truncate text-xs text-muted-foreground">
        {appointment.customer?.name ? (
          <CustomerName customer={appointment.customer} />
        ) : (
          "—"
        )}
        {" · "}
        {formatTime(appointment.dateTime)}
      </span>
    </div>
  );
};

const AppointmentLoader: React.FC = () => (
  <div className="flex flex-col gap-1 pl-6 w-full">
    <Skeleton className="h-5 w-full max-w-96" />
    <Skeleton className="h-4 w-full max-w-72" />
  </div>
);

export const AppointmentsDataTableAsyncFilterBox: React.FC<
  Omit<AsyncFilterBoxProps, "fetchItems" | "title" | "filterKey" | "loader"> & {
    title?: AsyncFilterBoxProps["title"];
    filterKey?: AsyncFilterBoxProps["filterKey"];
  }
> = ({ title: propsTitle, filterKey = "appointmentId", ...rest }) => {
  const t = useI18n("admin");
  const locale = useLocale();
  const timeZone = useTimeZone();
  const title = propsTitle ?? t("paymentsList.columns.appointment");

  const getAppointments = useDebounceCacheFn(
    async (page: number, search?: string) => {
      const limit = 10;
      const result = await adminApi.appointments.getAppointments({
        page,
        limit,
        search,
        sort: [{ id: "dateTime", desc: true }],
      });

      return {
        items: result.items.map((appointment) => ({
          label: (
            <AppointmentShortLabel
              appointment={appointment}
              locale={locale}
              timeZone={timeZone}
            />
          ),
          shortLabel: appointment.option.name,
          value: appointment._id,
        })) satisfies AsyncFilterBoxOption[],
        hasMore: page * limit < result.total,
      };
    },
    100,
  );

  return (
    <DataTableAsyncFilterBox
      title={title}
      filterKey={filterKey}
      fetchItems={getAppointments}
      maxAmount={1}
      {...rest}
      loader={<AppointmentLoader />}
    />
  );
};
