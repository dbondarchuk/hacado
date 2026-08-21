import { useI18n, useLocale } from "@hacado/i18n/client";
import { I18nRichText } from "@hacado/i18n/components";
import {
  allowPromoCodeType,
  BookingConfiguration,
  customTimeSlotSchema,
  Time,
} from "@hacado/types";
import {
  BooleanSelect,
  Button,
  Combobox,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  InfoTooltip,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupAddonClasses,
  InputGroupInput,
  InputGroupInputClasses,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SimpleTimePicker,
  TagInput,
  use12HourFormat,
} from "@hacado/ui";
import { AppSelector } from "@hacado/ui-admin";
import { formatTime, formatTimeLocale, parseTime } from "@hacado/utils";
import React from "react";
import { TabProps } from "./types";

const TimePickerTag = ({ onAdd }: { onAdd: (value: string) => void }) => {
  const t = useI18n("admin");
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const uses12HourFormat = use12HourFormat();

  return (
    <div className="flex flex-col gap-2 p-3">
      <SimpleTimePicker
        use12HourFormat={uses12HourFormat}
        onChange={(d) => {
          setDate(d);
        }}
        value={date || new Date()}
      />
      <Button
        type="button"
        variant="default"
        className="w-full"
        onClick={() => {
          if (!date) return;
          onAdd(
            formatTime({
              hour: date.getHours(),
              minute: date.getMinutes(),
            } as Time),
          );
        }}
      >
        {t("settings.appointments.form.main.add")}
      </Button>
    </div>
  );
};

export const MainTab: React.FC<TabProps> = ({
  form,
  disabled,
  showTeamSettings,
}) => {
  const t = useI18n("admin");
  const locale = useLocale();

  const stepLabels: Record<
    Exclude<BookingConfiguration["slotStart"], undefined>,
    string
  > = {
    "every-hour": t("settings.appointments.form.main.stepLabels.everyHour"),
    custom: t("settings.appointments.form.main.stepLabels.custom"),
    5: t("settings.appointments.form.main.stepLabels.five"),
    10: t("settings.appointments.form.main.stepLabels.ten"),
    15: t("settings.appointments.form.main.stepLabels.fifteen"),
    20: t("settings.appointments.form.main.stepLabels.twenty"),
    30: t("settings.appointments.form.main.stepLabels.thirty"),
  };

  const slotStart = form.watch("slotStart");

  return (
    <div className="gap-2 flex flex-col md:grid md:grid-cols-2 md:gap-4 w-full">
      <FormField
        control={form.control}
        name="scheduleAppId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t("settings.appointments.form.main.scheduleProviderApp")}
              <InfoTooltip>
                <I18nRichText
                  namespace="admin"
                  text="settings.appointments.form.main.scheduleProviderAppTooltip"
                />
              </InfoTooltip>
            </FormLabel>
            <FormControl>
              <AppSelector
                scope="schedule"
                allowClear
                disabled={disabled}
                value={field.value}
                onItemSelect={(value) => field.onChange(value)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="availabilityProviderAppId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t("settings.appointments.form.main.availabilityProviderApp")}
              <InfoTooltip>
                <I18nRichText
                  namespace="admin"
                  text="settings.appointments.form.main.availabilityProviderAppTooltip"
                />
              </InfoTooltip>
            </FormLabel>
            <FormControl>
              <AppSelector
                scope="availability-provider"
                allowClear
                disabled={disabled}
                value={field.value}
                onItemSelect={(value) => field.onChange(value)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="requireCustomerOtp"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t("settings.appointments.form.main.requireCustomerOtp")}{" "}
              <InfoTooltip>
                {t("settings.appointments.form.main.requireCustomerOtpTooltip")}
              </InfoTooltip>
            </FormLabel>
            <FormControl>
              <BooleanSelect
                value={!!field.value}
                onValueChange={field.onChange}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="autoConfirm"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t("settings.appointments.form.main.autoConfirmAppointments")}{" "}
              <InfoTooltip>
                <I18nRichText
                  namespace="admin"
                  text="settings.appointments.form.main.autoConfirmTooltip"
                />
              </InfoTooltip>
            </FormLabel>
            <FormControl>
              <BooleanSelect
                value={field.value}
                onValueChange={field.onChange}
                className="w-full"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {showTeamSettings ? (
        <FormField
          control={form.control}
          name="allowStaffCalendarSources"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("settings.appointments.form.main.allowStaffCalendarSources")}{" "}
                <InfoTooltip>
                  <I18nRichText
                    namespace="admin"
                    text="settings.appointments.form.main.allowStaffCalendarSourcesTooltip"
                  />
                </InfoTooltip>
              </FormLabel>
              <FormControl>
                <BooleanSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  className="w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}
      <FormField
        control={form.control}
        name="allowPromoCode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t("settings.appointments.form.main.showPromoCodeField")}{" "}
              <InfoTooltip>
                {t("settings.appointments.form.main.showPromoCodeTooltip")}
              </InfoTooltip>
            </FormLabel>
            <FormControl>
              <Combobox
                value={field.value}
                onItemSelect={field.onChange}
                className="w-full"
                values={allowPromoCodeType.map((type) => ({
                  value: type,
                  label: t(`common.labels.allowPromoCodeType.${type}`),
                }))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="maxWeeksInFuture"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t("settings.appointments.form.main.maxWeeksInFuture")}
              <InfoTooltip>
                <I18nRichText
                  namespace="admin"
                  text="settings.appointments.form.main.maxWeeksInFutureTooltip"
                />
              </InfoTooltip>
            </FormLabel>
            <FormControl>
              <InputGroup>
                <InputGroupInput>
                  <Input
                    disabled={disabled}
                    placeholder="4"
                    type="number"
                    className={InputGroupInputClasses()}
                    {...field}
                  />
                </InputGroupInput>
                <InputGroupAddon className={InputGroupAddonClasses()}>
                  {t("settings.appointments.form.main.weeks")}
                </InputGroupAddon>
              </InputGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="minHoursBeforeBooking"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t("settings.appointments.form.main.minHoursBeforeBooking")}
              <InfoTooltip>
                <I18nRichText
                  namespace="admin"
                  text="settings.appointments.form.main.minHoursBeforeBookingTooltip"
                />
              </InfoTooltip>
            </FormLabel>
            <FormControl>
              <InputGroup>
                <InputGroupInput>
                  <Input
                    disabled={disabled}
                    placeholder="24"
                    type="number"
                    className={InputGroupInputClasses()}
                    {...field}
                  />
                </InputGroupInput>
                <InputGroupAddon className={InputGroupAddonClasses()}>
                  {t("settings.appointments.form.main.hours")}
                </InputGroupAddon>
              </InputGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="breakDuration"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t("settings.appointments.form.main.minBreakTime")}
              <InfoTooltip>
                <I18nRichText
                  namespace="admin"
                  text="settings.appointments.form.main.minBreakTimeTooltip"
                />
              </InfoTooltip>
            </FormLabel>
            <FormControl>
              <InputGroup>
                <InputGroupInput>
                  <Input
                    disabled={disabled}
                    placeholder="0"
                    type="number"
                    className={InputGroupInputClasses()}
                    {...field}
                  />
                </InputGroupInput>
                <InputGroupAddon className={InputGroupAddonClasses()}>
                  {t("settings.appointments.form.main.minutes")}
                </InputGroupAddon>
              </InputGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="slotStart"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t("settings.appointments.form.main.allowedSlotStartTimes")}
              <InfoTooltip>
                <I18nRichText
                  namespace="admin"
                  text="settings.appointments.form.main.allowedSlotStartTimesTooltip"
                />
              </InfoTooltip>
            </FormLabel>
            <FormControl>
              <Select
                value={
                  typeof field.value === "number"
                    ? `${field.value}`
                    : field.value
                }
                onValueChange={(value) => {
                  const val = parseInt(value);
                  field.onChange(isNaN(val) ? value : val);
                  field.onBlur();
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={t(
                      "settings.appointments.form.main.selectStep",
                    )}
                  />
                </SelectTrigger>
                <SelectContent side="bottom">
                  {Object.entries(stepLabels).map(([step, label]) => (
                    <SelectItem key={step} value={step}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {slotStart === "custom" && (
        <FormField
          control={form.control}
          name="customSlotTimes"
          render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel>
                {t("settings.appointments.form.main.customTimeSlots")}
                <InfoTooltip>
                  {t("settings.appointments.form.main.customTimeSlotsTooltip")}
                </InfoTooltip>
              </FormLabel>
              <FormControl>
                <TagInput
                  {...field}
                  readOnly
                  placeholder={t(
                    "settings.appointments.form.main.customTimeSlotsPlaceholder",
                  )}
                  value={field.value}
                  onChange={(e) => {
                    field.onChange(e);
                    field.onBlur();
                  }}
                  tagValidator={customTimeSlotSchema}
                  tagDisplayTransform={(time) =>
                    formatTimeLocale(parseTime(time), locale)
                  }
                  addItemTemplate={TimePickerTag}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
};
