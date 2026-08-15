"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n, useLocale } from "@hacado/i18n/client";
import { Appointment } from "@hacado/types";
import {
  cn,
  ComboboxAsync,
  IComboboxItem,
  Skeleton,
  useTimeZone,
} from "@hacado/ui";
import { DateTime } from "luxon";
import React from "react";
import { CustomerName } from "./data-table/customer-name";

const AppointmentLoader: React.FC = () => (
  <div className="flex flex-col gap-1 pl-6 w-full">
    <Skeleton className="h-5 w-full max-w-96" />
    <Skeleton className="h-4 w-full max-w-72" />
  </div>
);

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
    <div className="flex min-w-0 max-w-[var(--radix-popover-trigger-width)] flex-col gap-0.5 overflow-hidden text-nowrap">
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

type BaseAppointmentSelectorProps = {
  value?: string;
  disabled?: boolean;
  className?: string;
  onValueChange?: (appointment?: Appointment) => void;
};

type ClearableAppointmentSelectorProps = BaseAppointmentSelectorProps & {
  onItemSelect: (value: string | undefined) => void;
  allowClear: true;
};

type NonClearableAppointmentSelectorProps = BaseAppointmentSelectorProps & {
  onItemSelect: (value: string) => void;
  allowClear?: false;
};

export type AppointmentSelectorProps =
  | NonClearableAppointmentSelectorProps
  | ClearableAppointmentSelectorProps;

export const AppointmentSelector: React.FC<AppointmentSelectorProps> = ({
  disabled,
  className,
  value,
  onItemSelect,
  onValueChange,
  allowClear,
}) => {
  const t = useI18n("admin");
  const locale = useLocale();
  const timeZone = useTimeZone();

  const [itemsCache, setItemsCache] = React.useState<
    Record<string, Appointment>
  >({});

  React.useEffect(() => {
    if (!value || itemsCache[value]) {
      return;
    }
    adminApi.appointments
      .getAppointment(value)
      .then((appointment) => {
        setItemsCache((prev) => ({ ...prev, [appointment._id]: appointment }));
      })
      .catch(() => undefined);
  }, [value, itemsCache]);

  const getAppointments = React.useCallback(
    async (page: number, search?: string) => {
      const limit = 10;
      const result = await adminApi.appointments.getAppointments({
        page,
        limit,
        search,
        sort: [{ id: "dateTime", desc: true }],
      });

      setItemsCache((prev) => ({
        ...prev,
        ...result.items.reduce(
          (map, appointment) => ({
            ...map,
            [appointment._id]: appointment,
          }),
          {} as typeof itemsCache,
        ),
      }));

      return {
        items: result.items.map((appointment) => ({
          label: (
            <AppointmentShortLabel
              appointment={appointment}
              locale={locale}
              timeZone={timeZone}
            />
          ),
          shortLabel: (
            <span className="truncate">
              {appointment.option.name}
              {" · "}
              {DateTime.fromJSDate(new Date(appointment.dateTime), {
                zone: timeZone,
              }).toLocaleString(DateTime.DATETIME_MED, { locale })}
            </span>
          ),
          value: appointment._id,
        })) satisfies IComboboxItem[],
        hasMore: page * limit < result.total,
      };
    },
    [locale, timeZone],
  );

  React.useEffect(() => {
    onValueChange?.(value ? itemsCache[value] : undefined);
  }, [value, itemsCache, onValueChange]);

  return (
    <ComboboxAsync
      // @ts-ignore Allow clear passthrough
      onChange={onItemSelect}
      disabled={disabled}
      className={cn("flex min-w-0 max-w-full font-normal text-base", className)}
      placeholder={t("appointmentSelector.placeholder")}
      value={value}
      allowClear={allowClear}
      fetchItems={getAppointments}
      loader={<AppointmentLoader />}
    />
  );
};
