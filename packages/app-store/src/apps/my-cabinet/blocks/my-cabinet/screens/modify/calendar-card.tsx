"use client";
import { useI18n, useLocale } from "@timelish/i18n/client";
import type { Time } from "@timelish/types";
import {
  Button,
  Calendar,
  Combobox,
  IComboboxItem,
  TooltipResponsive,
  TooltipResponsiveContent,
  TooltipResponsiveTrigger,
} from "@timelish/ui";
import { areTimesEqual, formatTimeLocale } from "@timelish/utils";
import { getTimeZones } from "@vvo/tzdb";
import * as Locales from "date-fns/locale";
import { Globe2Icon } from "lucide-react";
import { DateTime, HourNumbers, DateTime as Luxon, MinuteNumbers } from "luxon";
import React from "react";
import { DayButtonProps } from "react-day-picker";
import { useCabinetModifyContext } from "./context";

const asJsDate = (dateTime: Luxon) =>
  new Date(dateTime.year, dateTime.month - 1, dateTime.day);

const timeZones: IComboboxItem[] = getTimeZones().map((zone) => ({
  label: `GMT${zone.currentTimeFormat}`,
  shortLabel: `${zone.alternativeName}`,
  value: zone.name,
}));

const formatDate = (date: Date): string =>
  `${date.getDate()}-${date.getMonth()}-${date.getFullYear()}`;

const DayButton = (props: DayButtonProps) => {
  const { day, modifiers, ...buttonProps } = props;
  const isDisabled = modifiers.disabled;
  const t = useI18n("translation");

  return isDisabled ? (
    <TooltipResponsive>
      <TooltipResponsiveTrigger>
        <div className="w-full h-full flex items-center justify-center">
          {buttonProps.children}
        </div>
      </TooltipResponsiveTrigger>
      <TooltipResponsiveContent>
        {t("common.labels.noAvailableTimeSlots")}
      </TooltipResponsiveContent>
    </TooltipResponsive>
  ) : (
    <button {...buttonProps} />
  );
};

export const CalendarCard: React.FC = () => {
  const t = useI18n("translation");
  const locale = useLocale();
  const {
    dateTime,
    setDateTime,
    appointment,
    availability,
    isLoading,
    timeZone,
    setTimeZone,
  } = useCabinetModifyContext();

  const [date, setDate] = React.useState<Date | undefined>(dateTime?.date);
  const [time, setTime] = React.useState<Time | undefined>(dateTime?.time);

  const changeDate = (date: Date | undefined) => {
    setDate(date);
    setTime(undefined);
  };

  const adjustedAvailability = React.useMemo(
    () =>
      availability.map((time) =>
        Luxon.fromJSDate(time, { zone: "utc" }).setZone(timeZone),
      ),
    [availability, timeZone],
  );

  const dates = React.useMemo(
    () =>
      adjustedAvailability
        .map((dateTime) => asJsDate(dateTime))
        .sort((a, b) => a.getTime() - b.getTime()),
    [adjustedAvailability],
  );

  const isDisabledDay = React.useCallback(
    (day: Date) =>
      dates.map((date) => formatDate(date)).indexOf(formatDate(day)) < 0,
    [dates],
  );

  const times = React.useMemo(
    () =>
      Object.entries(
        adjustedAvailability.reduce(
          (prev, dateTime) => {
            const key = formatDate(asJsDate(dateTime));
            prev[key] = prev[key] || [];
            prev[key].push({
              hour: dateTime.hour as HourNumbers,
              minute: dateTime.minute as MinuteNumbers,
            });
            return prev;
          },
          {} as { [x: string]: Time[] },
        ),
      ).reduce(
        (prev, curr) => {
          prev[curr[0]] = curr[1].sort(
            (a, b) => a.hour - b.hour || a.minute - b.minute,
          );
          return prev;
        },
        {} as { [x: string]: Time[] },
      ),
    [adjustedAvailability],
  );

  React.useEffect(() => {
    setDateTime(
      !date || !time
        ? undefined
        : {
            date,
            time,
            timeZone,
          },
    );
  }, [date, time, timeZone, setDateTime]);

  const minDate = React.useMemo(() => dates[0], [dates]);
  const maxDate = React.useMemo(() => dates[dates.length - 1], [dates]);

  const changeTimeZone = (tz: string) => {
    setTimeZone(tz);
    setDate(undefined);
    setTime(undefined);
  };

  React.useEffect(() => {
    if (
      date &&
      (isDisabledDay(date) ||
        Luxon.fromJSDate(date) < Luxon.fromJSDate(minDate))
    )
      setDate(minDate);
  }, [minDate, dateTime, date, isDisabledDay]);

  const isTimeSelected = React.useCallback(
    (t: Time) => areTimesEqual(t, time),
    [time],
  );

  const timeZoneLabel = t.rich("common.formats.selectTimezoneLabel", {
    timeZoneCombobox: () => (
      <Combobox
        values={timeZones}
        className="mx-2"
        searchLabel={t("common.labels.searchTimezone")}
        customSearch={(search) =>
          timeZones.filter(
            (zone) =>
              (zone.label as string)
                .toLocaleLowerCase()
                .indexOf(search.toLocaleLowerCase()) >= 0,
          )
        }
        value={timeZone}
        onItemSelect={(value) => changeTimeZone(value)}
      />
    ),
  });

  const language = locale === "en" ? "enUS" : locale;
  // @ts-ignore not correct english locale
  const calendarLocale = Locales[language];

  if (!appointment) return null;

  return (
    <div className="space-y-6 calendar-card card-container">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground calendar-card-title card-title">
          {t("modification.calendar.title")}
        </h2>
        <p className="text-xs text-muted-foreground calendar-card-description card-description">
          {t("modification.calendar.description", {
            serviceName: appointment.optionName,
          })}
        </p>
      </div>

      <Calendar
        locale={calendarLocale}
        mode="single"
        selected={date}
        showOutsideDays={false}
        timeZone={timeZone}
        startMonth={new Date()}
        endMonth={DateTime.fromJSDate(maxDate || new Date())
          .endOf("month")
          .toJSDate()}
        onSelect={changeDate}
        className="rounded-md border calendar-card"
        disabled={(day: Date) => isDisabledDay(day)}
        components={{
          DayButton,
        }}
        classNames={{
          month: "w-full space-y-4",
          day_button: "w-full h-full",
          day: "aspect-square",
        }}
      />

      <div className="available-times-container">
        <h4 className="text-sm font-medium text-foreground mb-3">
          {t("common.labels.availableTimes")}
        </h4>
        {isLoading ? (
          <div className="text-center py-4 text-xs text-muted-foreground">
            {t("common.labels.loadingAvailableTimes")}
          </div>
        ) : adjustedAvailability.length > 0 && date ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 calendar-times-list">
            {(times[formatDate(date)] || []).map((t) => (
              <div key={formatTimeLocale(t, locale)}>
                <Button
                  className="w-24 calendar-time-button"
                  variant={isTimeSelected(t) ? "default" : "outline"}
                  onClick={() => setTime(isTimeSelected(t) ? undefined : t)}
                >
                  {formatTimeLocale(t, locale)}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-xs text-muted-foreground">
            {t("common.labels.selectDateFirst")}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center w-full">
        <div className="text-sm text-muted-foreground leading-10">
          <Globe2Icon className="inline-block mr-1" />
          {timeZoneLabel}
        </div>
      </div>
    </div>
  );
};
