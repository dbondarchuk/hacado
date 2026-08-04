"use client";

import React, { useMemo } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { DateTime, DateTime as LuxonDateTime } from "luxon";
import { useForm } from "react-hook-form";
import * as z from "zod";

import {
  Combobox,
  DateTimePicker,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  IComboboxItem,
  SimpleTimePicker,
  use12HourFormat,
  usePrevious,
} from "@timelish/ui";

import { TranslationKeys, useI18n, useLocale } from "@timelish/i18n/client";
import { I18nRichText } from "@timelish/i18n/components";
import { HourNumbers, MinuteNumbers } from "@timelish/types";
import { deepEqual, formatTime, parseTime } from "@timelish/utils";
import { getTimeZones } from "@vvo/tzdb";
import { useModifyAppointmentFormContext } from "./context";

const timeZones: IComboboxItem[] = getTimeZones().map((zone) => ({
  label: `GMT${zone.currentTimeFormat}`,
  shortLabel: zone.alternativeName,
  value: zone.name,
}));

const initialDate = DateTime.now().startOf("day").toJSDate();

const formSchema = z.object({
  date: z.date(),
  time: z.iso.time({ precision: -1 }),
});

export const FormCard: React.FC = () => {
  const t = useI18n("translation");
  const {
    fields: propsFields,
    setFields,
    setIsFormValid,
    searchError,
    setSearchError,
    type: modifyType,
    appointment,
    timeZone,
    setTimeZone,
  } = useModifyAppointmentFormContext();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "all",
    reValidateMode: "onChange",
    defaultValues: {
      date: propsFields?.dateTime ?? initialDate,
      time: propsFields?.dateTime
        ? formatTime({
            hour: propsFields.dateTime.getHours() as HourNumbers,
            minute: propsFields.dateTime.getMinutes() as MinuteNumbers,
          })
        : "09:00",
    },
  });

  const uses12HourFormat = use12HourFormat();
  const locale = useLocale();

  const values = form.watch();
  const previousValues = usePrevious(values, values);
  const previousTimeZone = usePrevious(timeZone, timeZone);
  React.useEffect(() => {
    if (!deepEqual(values, previousValues) || timeZone !== previousTimeZone) {
      const { date, time } = values;
      const timeObj = parseTime(time);
      const dateTime = DateTime.fromJSDate(date)
        .set({ hour: timeObj.hour, minute: timeObj.minute })
        .setZone(timeZone, { keepLocalTime: true })
        .toJSDate();
      setFields({ dateTime });
      setSearchError(undefined);
    }
  }, [values, timeZone, setSearchError]);

  const isFormValid = form.formState.isValid;
  React.useEffect(() => {
    setIsFormValid(isFormValid);
  }, [isFormValid]);

  const time = useMemo(() => {
    const timeObj = parseTime(values.time ?? "09:00");
    return DateTime.fromObject({ hour: timeObj.hour, minute: timeObj.minute })
      .startOf("minute")
      .toJSDate();
  }, [values.time]);

  return (
    <div className="space-y-4 form-card card-container">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground form-card-title card-title">
          {t("modification.form.title")}
        </h2>
        <p className="text-xs text-muted-foreground form-card-description card-description">
          {t("modification.form.description")}
        </p>
      </div>
      <Form {...form}>
        <form
          onSubmit={() => {}}
          className="flex flex-col gap-4 w-full form-card-form"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("modification.form.date.label")}</FormLabel>
                  <FormControl>
                    <DateTimePicker
                      {...field}
                      hideTime
                      timeZone={timeZone}
                      commitOnChange
                      onChange={(date) => {
                        field.onChange(
                          date
                            ? LuxonDateTime.fromJSDate(date)
                                .set({ second: 0 })
                                .toJSDate()
                            : undefined,
                        );
                      }}
                      use12HourFormat={uses12HourFormat}
                      showSeconds={false}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("modification.form.time.label")}</FormLabel>
                  <FormControl>
                    <SimpleTimePicker
                      {...field}
                      value={time}
                      onChange={(date) => {
                        field.onChange(
                          formatTime({
                            hour: date.getHours() as HourNumbers,
                            minute: date.getMinutes() as MinuteNumbers,
                          }),
                        );
                      }}
                      use12HourFormat={uses12HourFormat}
                      showSeconds={false}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {t.rich("common.formats.selectTimezoneLabel", {
              timeZoneCombobox: () => (
                <Combobox
                  values={timeZones}
                  className="mx-1"
                  searchLabel={t("common.labels.searchTimezone")}
                  customSearch={(search) =>
                    timeZones.filter((zone) =>
                      (zone.label as string)
                        .toLocaleLowerCase()
                        .includes(search.toLocaleLowerCase()),
                    )
                  }
                  value={timeZone}
                  onItemSelect={(value) => setTimeZone(value)}
                />
              ),
            })}
          </p>
          {searchError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              <I18nRichText
                namespace="translation"
                text={
                  searchError === "notFound"
                    ? "modification.form.searchError.notFound"
                    : `modification.form.searchError.notAllowed.${modifyType}`
                }
                args={{
                  name: appointment?.name ?? "",
                  service: appointment?.optionName ?? "",
                  dateTime: DateTime.fromJSDate(
                    appointment?.dateTime ?? new Date(),
                  ).toLocaleString(DateTime.DATETIME_HUGE, { locale }),
                  reason:
                    appointment &&
                    "reason" in appointment &&
                    t.has(
                      `modification.form.searchError.notAllowed.reason.${appointment?.reason}` as TranslationKeys,
                    )
                      ? t(
                          `modification.form.searchError.notAllowed.reason.${appointment?.reason}` as TranslationKeys,
                        )
                      : appointment && "reason" in appointment
                        ? appointment.reason
                        : t(
                            "modification.form.searchError.notAllowed.reason.unknown",
                          ),
                }}
              />
            </div>
          )}
        </form>
      </Form>
    </div>
  );
};
