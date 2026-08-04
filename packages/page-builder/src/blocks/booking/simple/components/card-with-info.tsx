import { TranslationKeys, useI18n, useLocale } from "@timelish/i18n/client";
import { Time, timeZones } from "@timelish/types";
import { useCurrencyFormat } from "@timelish/ui";
import { durationToTime, formatTimeLocale } from "@timelish/utils";
import { TimeZone } from "@vvo/tzdb";
import { Calendar, Clock, DollarSign, Globe2, Timer } from "lucide-react";
import { HourNumbers, DateTime as Luxon, MinuteNumbers } from "luxon";
import React from "react";
import { useScheduleContext } from "./context";

export const CardWithAppointmentInformation: React.FC<
  React.PropsWithChildren & { title: TranslationKeys }
> = ({ children, title }) => {
  const i18n = useI18n("translation");
  const { dateTime, duration, price } = useScheduleContext();
  const locale = useLocale();
  const currencyFormat = useCurrencyFormat();

  if (!dateTime) return children;

  const date = Luxon.fromJSDate(dateTime.date);
  const timeEndLuxon = date
    .set({
      hour: dateTime.time.hour,
      minute: dateTime.time.minute,
    })
    .plus({ minutes: duration });

  const timeEnd: Time = {
    hour: timeEndLuxon.hour as HourNumbers,
    minute: timeEndLuxon.minute as MinuteNumbers,
  };

  let timeZone: TimeZone | undefined = timeZones.find((tz) => {
    return (
      dateTime.timeZone === tz.name || tz.group.includes(dateTime.timeZone)
    );
  });
  if (!timeZone) {
    const defaultZone = Luxon.now().zoneName;
    timeZone = timeZones.find((tz) => {
      return defaultZone === tz.name || tz.group.includes(defaultZone || "");
    });
  }

  return (
    <div className="py-4 not-prose">
      <div className="mb-3 grid md:grid-cols-3 gap-4 md:gap-2 ">
        <div className="grid md:col-span-1 md:pr-5 md:flex gap-3 md:flex-col">
          <div className="flex items-center">
            <Calendar className="mr-1" />
            {i18n("common.formats.formDateLabel", {
              date: date.toLocaleString(Luxon.DATE_FULL, {
                locale,
              }),
            })}
          </div>
          <div className="flex items-center">
            <Clock className="mr-1" />
            {i18n("common.formats.formTimeLabel", {
              start: formatTimeLocale(dateTime.time, locale),
              end: formatTimeLocale(timeEnd, locale),
            })}
          </div>
          {!!duration && (
            <div className="flex items-center">
              <Timer className="mr-1" />
              {i18n(
                "common.formats.durationHourMinutes",
                durationToTime(duration),
              )}
            </div>
          )}
          {!!price && (
            <div className="flex items-center">
              <DollarSign className="mr-1" />
              {i18n("common.formats.formPriceLabel", {
                price: currencyFormat(price),
              })}
            </div>
          )}
          <div className="flex items-center">
            <Globe2 className="mr-1 flex-none" />
            {i18n("common.formats.timezone", {
              timezone: timeZone?.currentTimeFormat || "",
            })}
          </div>
        </div>
        <div className="md:col-span-2 md:pr-2 sm:mb-3">
          <div className="mb-3">
            <h2 className="mt-0 text-xl">{i18n(title)}</h2>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
};
