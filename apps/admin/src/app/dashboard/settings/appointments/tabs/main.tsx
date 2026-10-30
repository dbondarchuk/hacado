import { useI18n, useLocale } from "@hacado/i18n/client";
import { I18nRichText } from "@hacado/i18n/components";
import { Time } from "@hacado/types/booking";
import {
  allowPromoCodeType,
  BookingConfiguration,
  customTimeSlotSchema,
} from "@hacado/types/configuration/booking";
import { AppSelector } from "@hacado/ui-admin/app-selector";
import { SwitchCardFormItem } from "@hacado/ui-admin/switch-card-form-item";
import { Button } from "@hacado/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormLabelWithRequiredIndicator,
  FormMessage,
} from "@hacado/ui/form";
import { use12HourFormat } from "@hacado/ui/hooks";
import { Input } from "@hacado/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupAddonClasses,
  InputGroupInput,
  InputGroupInputClasses,
} from "@hacado/ui/input-group";
import {
  RadioButtonGroup,
  RadioButtonGroupItem,
} from "@hacado/ui/radio-button-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@hacado/ui/select";
import { TagInput } from "@hacado/ui/tag-input";
import { SimpleTimePicker } from "@hacado/ui/time-picker";
import { formatTime, formatTimeLocale, parseTime } from "@hacado/utils/time";
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
    <div className="flex flex-col gap-2 md:gap-4 w-full">
      <div className="flex flex-col gap-4 rounded-lg border p-4">
        <p className="text-sm font-medium">
          {t("settings.appointments.form.main.scheduleProviderLabel")}
        </p>
        <div className="flex flex-col gap-4 md:grid md:grid-cols-2 pt-4 border-t">
          <FormField
            control={form.control}
            name="scheduleAppId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("settings.appointments.form.main.scheduleProviderApp")}
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
                <FormDescription>
                  <I18nRichText
                    namespace="admin"
                    text="settings.appointments.form.main.scheduleProviderAppTooltip"
                  />
                </FormDescription>
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
                <FormDescription>
                  <I18nRichText
                    namespace="admin"
                    text="settings.appointments.form.main.availabilityProviderAppTooltip"
                  />
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
      <div className="flex flex-col gap-4 rounded-lg border p-4">
        <p className="text-sm font-medium">
          {t("settings.appointments.form.main.scheduleSettingsLabel")}
        </p>

        <div className="flex flex-col gap-4 md:grid md:grid-cols-2 pt-4 border-t">
          <FormField
            control={form.control}
            name="maxWeeksInFuture"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("settings.appointments.form.main.maxWeeksInFuture")}
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
                <FormDescription>
                  <I18nRichText
                    namespace="admin"
                    text="settings.appointments.form.main.maxWeeksInFutureTooltip"
                  />
                </FormDescription>
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
                <FormDescription>
                  <I18nRichText
                    namespace="admin"
                    text="settings.appointments.form.main.minHoursBeforeBookingTooltip"
                  />
                </FormDescription>
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
                <FormDescription>
                  <I18nRichText
                    namespace="admin"
                    text="settings.appointments.form.main.minBreakTimeTooltip"
                  />
                </FormDescription>
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
                <FormDescription>
                  <I18nRichText
                    namespace="admin"
                    text="settings.appointments.form.main.allowedSlotStartTimesTooltip"
                  />
                </FormDescription>
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
                  <FormLabelWithRequiredIndicator
                    required={slotStart === "custom"}
                  >
                    {t("settings.appointments.form.main.customTimeSlots")}
                  </FormLabelWithRequiredIndicator>
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
                  <FormDescription>
                    {t(
                      "settings.appointments.form.main.customTimeSlotsTooltip",
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      </div>

      <FormField
        control={form.control}
        name="autoConfirm"
        render={({ field }) => (
          <SwitchCardFormItem
            label={t("settings.appointments.form.main.autoConfirmAppointments")}
            description={
              <I18nRichText
                namespace="admin"
                text="settings.appointments.form.main.autoConfirmTooltip"
              />
            }
            checked={field.value}
            onCheckedChange={field.onChange}
            className="w-full"
          />
        )}
      />
      <FormField
        control={form.control}
        name="requireCustomerOtp"
        render={({ field }) => (
          <SwitchCardFormItem
            label={t("settings.appointments.form.main.requireCustomerOtp")}
            description={t(
              "settings.appointments.form.main.requireCustomerOtpTooltip",
            )}
            checked={field.value}
            onCheckedChange={field.onChange}
            className="w-full"
          />
        )}
      />
      {showTeamSettings ? (
        <FormField
          control={form.control}
          name="allowStaffCalendarSources"
          render={({ field }) => (
            <SwitchCardFormItem
              label={t(
                "settings.appointments.form.main.allowStaffCalendarSources",
              )}
              description={t(
                "settings.appointments.form.main.allowStaffCalendarSourcesTooltip",
              )}
              checked={field.value}
              onCheckedChange={field.onChange}
              className="w-full"
            />
          )}
        />
      ) : null}
      <FormField
        control={form.control}
        name="allowPromoCode"
        render={({ field }) => (
          <FormItem className="flex flex-col gap-2 border p-4 rounded-lg w-full">
            <FormLabelWithRequiredIndicator required>
              {t("settings.appointments.form.main.showPromoCodeField")}
            </FormLabelWithRequiredIndicator>
            <FormControl>
              <RadioButtonGroup
                value={field.value}
                onValueChange={field.onChange}
                className="md:w-full"
                joined="md"
              >
                {allowPromoCodeType.map((type) => (
                  <RadioButtonGroupItem
                    key={type}
                    value={type}
                    className="w-full"
                  >
                    {t(`common.labels.allowPromoCodeType.${type}`)}
                  </RadioButtonGroupItem>
                ))}
              </RadioButtonGroup>
            </FormControl>
            <FormDescription>
              {t("settings.appointments.form.main.showPromoCodeTooltip")}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
