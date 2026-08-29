import { useI18n, useLocale } from "@hacado/i18n/client";
import { HourNumbers, MinuteNumbers, Time } from "@hacado/types";
import {
  Button,
  Calendar,
  cn,
  Combobox,
  IComboboxItem,
  Skeleton,
  TooltipResponsive,
  TooltipResponsiveContent,
  TooltipResponsiveTrigger,
  useCalendarDisplayedMonth,
  useTimeZone,
  useUseClientTimezone,
} from "@hacado/ui";
import { areTimesEqual, formatTimeLocale } from "@hacado/utils";
import { getTimeZones } from "@vvo/tzdb";
import * as Locales from "date-fns/locale";
import { Globe2Icon, ListPlus } from "lucide-react";
import { DateTime } from "luxon";
import React from "react";
import { DayButtonProps } from "react-day-picker";
import {
  WaitlistPublicKeys,
  waitlistPublicNamespace,
  WaitlistPublicNamespace,
} from "../../../../../waitlist/translations/types";
import { useScheduleContext } from "./context";

const asJsDate = (dateTime: DateTime) =>
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

  const { isLoading } = useScheduleContext();

  if (isLoading) {
    return <Skeleton className="w-full h-full mx-2" />;
  }

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
  const i18n = useI18n("translation");
  const locale = useLocale();
  const {
    dateTime,
    setDateTime,
    setDiscount: setPromoCode,
    availability,
    setCurrentStep,
    isLoading,
    setFlow,
    waitlistAppId,
    purchasePackageId,
    customerPackageId,
    selectedAppointmentOption,
  } = useScheduleContext();

  const t = useI18n<WaitlistPublicNamespace, WaitlistPublicKeys>(
    waitlistPublicNamespace,
  );

  const configTimeZone = useTimeZone();
  const useClientTimezone = useUseClientTimezone();
  const defaultTimeZone = useClientTimezone
    ? DateTime.now().zoneName
    : configTimeZone;

  const [date, setDate] = React.useState<Date | undefined>(dateTime?.date);
  const [time, setTime] = React.useState<Time | undefined>(dateTime?.time);

  const [timeZone, setTimeZone] = React.useState<string>(
    dateTime?.timeZone || defaultTimeZone,
  );

  const changeDate = (date: Date | undefined) => {
    setDate(date);
    setTime(undefined);
  };

  const adjustedAvailability = React.useMemo(
    () =>
      availability.map((time) =>
        DateTime.fromJSDate(time, { zone: "utc" }).setZone(timeZone),
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

    setPromoCode(undefined);
  }, [date, time, timeZone, setDateTime, setPromoCode]);

  const minDate = React.useMemo(() => dates[0], [dates]);
  const maxDate = React.useMemo(() => dates[dates.length - 1], [dates]);
  const [displayedMonth, setDisplayedMonth] = useCalendarDisplayedMonth(
    date,
    minDate,
  );

  const changeTimeZone = (timeZone: string) => {
    setTimeZone(timeZone);
    setDate(undefined);
    setTime(undefined);
  };

  React.useEffect(() => {
    if (
      date &&
      (isDisabledDay(date) ||
        DateTime.fromJSDate(date) < DateTime.fromJSDate(minDate))
    )
      setDate(minDate);
  }, [minDate, dateTime, date, isDisabledDay]);

  const isTimeSelected = React.useCallback(
    (t: Time) => areTimesEqual(t, time),
    [time],
  );

  const timeZoneLabel = i18n.rich("common.formats.selectTimezoneLabel", {
    timeZoneCombobox: () => (
      <Combobox
        values={timeZones}
        className="mx-2"
        searchLabel={i18n("common.labels.searchTimezone")}
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

  const switchToWaitlist = () => {
    setCurrentStep("waitlist-form");
    setFlow("waitlist");
  };

  return (
    <div className="space-y-6 calendar-card card-container">
      <div className="mb-6">
        <h2
          className={cn(
            "text-lg font-semibold text-foreground calendar-card-title card-title",
            purchasePackageId && "calendar-first-appointment-title",
            customerPackageId && "calendar-package-appointment-title",
          )}
        >
          {purchasePackageId
            ? i18n("booking.calendar.firstAppointmentTitle")
            : customerPackageId && selectedAppointmentOption?.name
              ? i18n("booking.calendar.packageAppointmentTitle", {
                  serviceName: selectedAppointmentOption.name,
                })
              : i18n("booking.calendar.title")}
        </h2>
        <p
          className={cn(
            "text-xs text-muted-foreground calendar-card-description card-description",
            purchasePackageId && "calendar-first-appointment-description",
          )}
        >
          {purchasePackageId
            ? i18n("booking.calendar.firstAppointmentDescription")
            : i18n("booking.calendar.description")}
        </p>
      </div>

      <Calendar
        locale={calendarLocale}
        mode="single"
        selected={date}
        showOutsideDays={false}
        timeZone={timeZone}
        // startMonth={Luxon.fromJSDate(minDate)
        //   .startOf("month")
        //   .toJSDate()}
        startMonth={new Date()}
        month={displayedMonth}
        onMonthChange={setDisplayedMonth}
        endMonth={DateTime.fromJSDate(maxDate || date || minDate || new Date())
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

      {/* Time Slots */}
      <div className="available-times-container">
        <h4 className="text-sm font-medium text-foreground mb-3 available-times-title">
          {i18n("common.labels.availableTimes")}
        </h4>
        {isLoading ? (
          <div className="text-center py-4 text-xs text-muted-foreground loading-available-times-message">
            {i18n("common.labels.loadingAvailableTimes")}
          </div>
        ) : adjustedAvailability.length > 0 && date ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 calendar-times-list">
            {(times[formatDate(date)] || []).map((t) => (
              <div className="" key={formatTimeLocale(t, locale)}>
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
          <div className="text-center py-4 text-xs text-muted-foreground no-available-times-message">
            {i18n("common.labels.selectDateFirst")}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center w-full time-zone-label">
        <div className="text-sm text-muted-foreground leading-10">
          <Globe2Icon className="inline-block mr-1" />
          {timeZoneLabel}
        </div>
      </div>

      {!!waitlistAppId && !purchasePackageId && (
        <div className="border-t pt-6">
          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg waitlist-card">
            <ListPlus className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-foreground waitlist-title">
                {t("block.calendar.waitlist.title")}
              </h4>
              <p className="text-xs text-muted-foreground mb-3 waitlist-description">
                {t("block.calendar.waitlist.description")}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={switchToWaitlist}
                className="waitlist-button"
              >
                {t("block.calendar.waitlist.button")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
