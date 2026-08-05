"use client";
import { useI18n, useLocale } from "@hacado/i18n/client";
import type { Time } from "@hacado/types";
import {
  Button,
  Calendar,
  Combobox,
  IComboboxItem,
  TooltipResponsive,
  TooltipResponsiveContent,
  TooltipResponsiveTrigger,
  useTimeZone,
  useUseClientTimezone,
} from "@hacado/ui";
import { areTimesEqual, formatTimeLocale } from "@hacado/utils";
import { getTimeZones } from "@vvo/tzdb";
import * as Locales from "date-fns/locale";
import { Globe2Icon } from "lucide-react";
import { DateTime, HourNumbers, DateTime as Luxon, MinuteNumbers } from "luxon";
import React from "react";
import { DayButtonProps } from "react-day-picker";
import {
  WaitlistPublicKeys,
  waitlistPublicNamespace,
  WaitlistPublicNamespace,
} from "../../../../translations/types";
import { useScheduleContext } from "./context";

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
  const i18n = useI18n("translation");
  const locale = useLocale();
  const {
    dateTime,
    setDateTime,
    setDiscount: setPromoCode,
    availability,
    setStep,
    waitlistAppId,
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

    setPromoCode(undefined);
  }, [date, time, timeZone, setDateTime, setPromoCode]);

  const minDate = React.useMemo(() => dates[0], [dates]);
  const maxDate = React.useMemo(() => dates[dates.length - 1], [dates]);

  const changeTimeZone = (timeZone: string) => {
    setTimeZone(timeZone);
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

  return (
    <div className="relative text-center">
      <div className="mb-3">
        <h2 className="text-xl">{i18n("common.labels.selectDateTime")}</h2>
      </div>
      <div className="mb-3 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 md:gap-10 not-prose">
          <div className="flex flex-col">
            <div className="mb-3">
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
                endMonth={Luxon.fromJSDate(maxDate).endOf("month").toJSDate()}
                onSelect={changeDate}
                className="rounded-md border"
                disabled={(day: Date) => isDisabledDay(day)}
                components={{
                  DayButton,
                }}
              />
            </div>
          </div>
          <div className="flex flex-col gap-4 flex-1">
            {!date ? (
              <h4>{i18n("common.labels.selectDateFirst")}</h4>
            ) : (
              <>
                <h4 className="">
                  {DateTime.fromJSDate(date, { zone: timeZone })
                    .setLocale(locale)
                    .toLocaleString(DateTime.DATE_HUGE)}
                </h4>
                <div className="flex flex-row gap-2 justify-start flex-wrap">
                  {(times[formatDate(date)] || []).map((t) => (
                    <div className="" key={formatTimeLocale(t, locale)}>
                      <Button
                        className="w-24"
                        variant={isTimeSelected(t) ? "default" : "outline"}
                        onClick={() =>
                          setTime(isTimeSelected(t) ? undefined : t)
                        }
                      >
                        {formatTimeLocale(t, locale)}
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        {!!waitlistAppId && (
          <div data-identifier="waitlist-link">
            {t.rich("block.calendar.waitlist.link", {
              link: (chunks: any) => (
                <Button
                  variant="link-underline"
                  className="px-0 text-base font-semibold inline-block"
                  onClick={() => setStep("waitlist-form")}
                  data-identifier="waitlist-link-button"
                >
                  {chunks}
                </Button>
              ),
            })}
          </div>
        )}
        <div className="text-sm text-muted-foreground leading-10">
          <Globe2Icon className="inline-block mr-1" />
          {timeZoneLabel}
        </div>
      </div>
    </div>
  );
};
