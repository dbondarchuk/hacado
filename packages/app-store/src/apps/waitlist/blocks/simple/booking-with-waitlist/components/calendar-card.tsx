import { useI18n, useLocale } from "@hacado/i18n/client";
import {
  getStaffBookingTotals,
  HourNumbers,
  MinuteNumbers,
  Time,
} from "@hacado/types";
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
} from "../../../../translations/types";
import { useScheduleContext } from "./context";
import { SpecialistList } from "./specialist-card";

const asJsDate = (dateTime: DateTime) =>
  new Date(dateTime.year, dateTime.month - 1, dateTime.day);

const timeZones: IComboboxItem[] = getTimeZones().map((zone) => ({
  label: `GMT${zone.currentTimeFormat}`,
  shortLabel: `${zone.alternativeName}`,
  value: zone.name,
}));

const formatDate = (date: Date): string =>
  `${date.getDate()}-${date.getMonth()}-${date.getFullYear()}`;

const timeKey = (t: Time) => `${t.hour}:${t.minute}`;

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
      {/* We need to force tooltip on mobile (long tap) */}
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

const slotsByDay = (
  adjustedAvailability: DateTime[],
): { [key: string]: Time[] } =>
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
  );

export const CalendarCard: React.FC = () => {
  const t = useI18n("translation");
  const tWaitlist = useI18n<WaitlistPublicNamespace, WaitlistPublicKeys>(
    waitlistPublicNamespace,
  );
  const locale = useLocale();
  const {
    dateTime,
    setDateTime,
    setDiscount: setPromoCode,
    availabilityByMember,
    isLoading,
    purchasePackageId,
    isCustomerPackageLocked,
    setStep,
    waitlistAppId,
    setIsAnySpecialist,
    isAnySpecialist,
    selectedMemberId,
    setSelectedMemberId,
    activeStaff,
    appointmentOption,
    selectedAddons,
    baseDuration,
    packages,
    customerPackageId,
  } = useScheduleContext();

  const purchasePackagePrice = purchasePackageId
    ? packages?.find((pkg) => pkg._id === purchasePackageId)?.price
    : undefined;

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

  const memberIds = React.useMemo(
    () => Object.keys(availabilityByMember),
    [availabilityByMember],
  );

  const isAnyMulti = isAnySpecialist && memberIds.length > 1;

  const changeDate = (nextDate: Date | undefined) => {
    setDate(nextDate);
    setTime(undefined);
    if (isAnyMulti) {
      setSelectedMemberId(null);
    }
  };

  const allSlots = React.useMemo(
    () => Object.values(availabilityByMember).flat(),
    [availabilityByMember],
  );

  const adjustedAllAvailability = React.useMemo(
    () =>
      allSlots.map((slot) =>
        DateTime.fromJSDate(slot, { zone: "utc" }).setZone(timeZone),
      ),
    [allSlots, timeZone],
  );

  const adjustedByMember = React.useMemo(() => {
    const result: Record<string, DateTime[]> = {};
    for (const [memberId, slots] of Object.entries(availabilityByMember)) {
      result[memberId] = slots.map((slot) =>
        DateTime.fromJSDate(slot, { zone: "utc" }).setZone(timeZone),
      );
    }
    return result;
  }, [availabilityByMember, timeZone]);

  const dates = React.useMemo(
    () =>
      adjustedAllAvailability
        .map((dt) => asJsDate(dt))
        .sort((a, b) => a.getTime() - b.getTime()),
    [adjustedAllAvailability],
  );

  const isDisabledDay = React.useCallback(
    (day: Date) => dates.map((d) => formatDate(d)).indexOf(formatDate(day)) < 0,
    [dates],
  );

  const timesByMember = React.useMemo(() => {
    const result: Record<string, { [key: string]: Time[] }> = {};
    for (const [memberId, slots] of Object.entries(adjustedByMember)) {
      result[memberId] = slotsByDay(slots);
    }
    return result;
  }, [adjustedByMember]);

  const aggregatedTimes = React.useMemo(() => {
    if (!date) return [];
    const key = formatDate(date);
    const seen = new Map<string, Time>();
    for (const memberId of memberIds) {
      for (const slot of timesByMember[memberId]?.[key] || []) {
        const id = timeKey(slot);
        if (!seen.has(id)) seen.set(id, slot);
      }
    }
    return [...seen.values()].sort(
      (a, b) => a.hour - b.hour || a.minute - b.minute,
    );
  }, [date, memberIds, timesByMember]);

  const singleMemberId = isAnyMulti
    ? null
    : (selectedMemberId ?? memberIds[0] ?? null);

  const singleTimes = React.useMemo(() => {
    if (!singleMemberId) return {};
    return timesByMember[singleMemberId] ?? {};
  }, [singleMemberId, timesByMember]);

  const selectTime = (tSlot: Time) => {
    if (areTimesEqual(tSlot, time)) {
      setTime(undefined);
      if (isAnyMulti) {
        setSelectedMemberId(null);
      }
      return;
    }
    setTime(tSlot);
    if (isAnyMulti) {
      setSelectedMemberId(null);
    } else if (singleMemberId) {
      setSelectedMemberId(singleMemberId);
    }
  };

  const staffForSelectedTime = React.useMemo(() => {
    if (!date || !time || !isAnyMulti) return [];
    const key = formatDate(date);
    const availableIds = new Set(
      memberIds.filter((memberId) =>
        (timesByMember[memberId]?.[key] || []).some((slot) =>
          areTimesEqual(slot, time),
        ),
      ),
    );
    return activeStaff
      .filter((staff) => availableIds.has(staff.member.id))
      .map((staff) => {
        const totals = getStaffBookingTotals({
          memberId: staff.member.id,
          staff,
          durationType: appointmentOption.durationType,
          optionPrice:
            appointmentOption.durationType === "fixed"
              ? appointmentOption.price
              : undefined,
          optionPricePerHour:
            appointmentOption.durationType === "flexible"
              ? appointmentOption.pricePerHour
              : undefined,
          serviceDuration: baseDuration,
          selectedAddons,
          purchasePackagePrice,
          isCustomerPackage: !!customerPackageId,
        });
        return {
          ...staff,
          effectivePrice: totals.price,
          effectiveDuration: totals.duration,
        };
      });
  }, [
    date,
    time,
    isAnyMulti,
    memberIds,
    timesByMember,
    activeStaff,
    appointmentOption,
    baseDuration,
    selectedAddons,
    purchasePackagePrice,
    customerPackageId,
  ]);

  React.useEffect(() => {
    const needsMember = isAnyMulti;
    setDateTime(
      !date || !time || (needsMember && !selectedMemberId)
        ? undefined
        : {
            date,
            time,
            timeZone,
          },
    );

    setPromoCode(undefined);
  }, [
    date,
    time,
    timeZone,
    selectedMemberId,
    isAnyMulti,
    setDateTime,
    setPromoCode,
  ]);

  const minDate = React.useMemo(() => dates[0], [dates]);
  const maxDate = React.useMemo(() => dates[dates.length - 1], [dates]);
  const [displayedMonth, setDisplayedMonth] = useCalendarDisplayedMonth(
    date,
    minDate,
  );

  const changeTimeZone = (tz: string) => {
    setTimeZone(tz);
    setDate(undefined);
    setTime(undefined);
    if (isAnyMulti) {
      setSelectedMemberId(null);
    }
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
    (tSlot: Time) => areTimesEqual(tSlot, time),
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

  const switchToWaitlist = () => {
    setIsAnySpecialist(false);
    if (!selectedMemberId) {
      setStep("specialist");
      return;
    }
    setStep("waitlist-form");
  };

  return (
    <div className="space-y-6 calendar-card card-container">
      <div className="mb-6">
        <h2
          className={cn(
            "text-lg font-semibold text-foreground calendar-card-title card-title",
            purchasePackageId && "calendar-first-appointment-title",
            isCustomerPackageLocked && "calendar-package-appointment-title",
          )}
        >
          {purchasePackageId
            ? t("booking.calendar.firstAppointmentTitle")
            : isCustomerPackageLocked
              ? t("booking.calendar.nextPackageAppointmentTitle")
              : t("booking.calendar.title")}
        </h2>
        <p
          className={cn(
            "text-xs text-muted-foreground calendar-card-description card-description",
            purchasePackageId && "calendar-first-appointment-description",
          )}
        >
          {purchasePackageId
            ? t("booking.calendar.firstAppointmentDescription")
            : isCustomerPackageLocked
              ? t("booking.calendar.nextPackageAppointmentDescription")
              : t("booking.calendar.description")}
        </p>
      </div>

      <Calendar
        locale={calendarLocale}
        mode="single"
        selected={date}
        showOutsideDays={false}
        timeZone={timeZone}
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

      <div className="available-times-container">
        <h4 className="text-sm font-medium text-foreground mb-3 available-times-title">
          {t("common.labels.availableTimes")}
        </h4>
        {isLoading ? (
          <div className="text-center py-4 text-xs text-muted-foreground loading-available-times-message">
            {t("common.labels.loadingAvailableTimes")}
          </div>
        ) : date &&
          (isAnyMulti
            ? aggregatedTimes.length > 0
            : adjustedAllAvailability.length > 0 && singleMemberId) ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 calendar-times-list">
            {(isAnyMulti
              ? aggregatedTimes
              : singleTimes[formatDate(date)] || []
            ).map((tSlot) => (
              <div className="" key={formatTimeLocale(tSlot, locale)}>
                <Button
                  className="w-24 calendar-time-button"
                  variant={isTimeSelected(tSlot) ? "default" : "outline"}
                  onClick={() => selectTime(tSlot)}
                >
                  {formatTimeLocale(tSlot, locale)}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-xs text-muted-foreground no-available-times-message">
            {t("common.labels.selectDateFirst")}
          </div>
        )}
      </div>

      {isAnyMulti && (
        <div className="available-specialists-container">
          <h4 className="text-sm font-medium text-foreground mb-3 available-specialists-title">
            {t("booking.specialist.title")}
          </h4>
          {!time ? (
            <div className="text-center py-4 text-xs text-muted-foreground select-time-first-message">
              {t("common.labels.selectTimeFirst")}
            </div>
          ) : staffForSelectedTime.length === 0 ? (
            <div className="text-center py-4 text-xs text-muted-foreground">
              {t("booking.calendar.no_available_times")}
            </div>
          ) : (
            <SpecialistList
              staff={staffForSelectedTime}
              selectedMemberId={selectedMemberId}
              onSelect={setSelectedMemberId}
              durationType="fixed"
              className="specialist-list"
            />
          )}
        </div>
      )}

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
                {tWaitlist("block.calendar.waitlist.title")}
              </h4>
              <p className="text-xs text-muted-foreground mb-3 waitlist-description">
                {tWaitlist("block.calendar.waitlist.description")}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={switchToWaitlist}
                className="waitlist-button"
              >
                {tWaitlist("block.calendar.waitlist.button")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
