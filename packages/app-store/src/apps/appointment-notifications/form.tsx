"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n, useLocale } from "@hacado/i18n/client";
import { DatabaseId } from "@hacado/types/database";
import { SaveButton } from "@hacado/ui-admin/save-button";
import {
  CustomTextTemplateSelect,
  renderBuiltInSms,
  SmsMessagePreview,
  smsPreviewLanguage,
  useSmsPreviewArgs,
} from "@hacado/ui-admin/sms-example";
import { SwitchCardFormItem } from "@hacado/ui-admin/switch-card-form-item";
import { TemplateSelector } from "@hacado/ui-admin/template-selector";
import { Alert, AlertDescription } from "@hacado/ui/alert";
import { Combobox } from "@hacado/ui/combobox";
import { useTimeZone } from "@hacado/ui/context";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabelWithRequiredIndicator,
  FormMessage,
} from "@hacado/ui/form";
import { use12HourFormat } from "@hacado/ui/hooks";
import { Input } from "@hacado/ui/input";
import { Link } from "@hacado/ui/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@hacado/ui/select";
import { toastPromise } from "@hacado/ui/sonner";
import { SimpleTimePicker } from "@hacado/ui/time-picker";
import { zodResolver } from "@hookform/resolvers/zod";
import { DateTime } from "luxon";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useSmsMessagingAccess } from "../../hooks/use-sms-messaging-access";
import { checkUniqueName, create, update } from "./actions";
import { getAppointmentReminderSms } from "./messages";
import {
  appointmentNotificationAppointmentCountType,
  AppointmentNotificationChannelSelection,
  appointmentNotificationTypes,
  AppointmentNotificationUpdateModel,
  getAppointmentNotificationSchemaWithUniqueCheck,
  readAppointmentNotificationChannels,
} from "./models";
import {
  AppointmentNotificationsAdminKeys,
  appointmentNotificationsAdminNamespace,
  AppointmentNotificationsAdminNamespace,
} from "./translations/types";
import { shiftAppointmentNotificationTime } from "./utils";

const amount = (value: unknown) => {
  if (value === "" || value == null) return 0;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const AppointmentNotificationForm: React.FC<{
  initialData?: AppointmentNotificationUpdateModel &
    Partial<DatabaseId> &
    AppointmentNotificationChannelSelection;
  appId: string;
}> = ({ initialData, appId }) => {
  const t = useI18n<
    AppointmentNotificationsAdminNamespace,
    AppointmentNotificationsAdminKeys
  >(appointmentNotificationsAdminNamespace);
  const tAdmin = useI18n("admin");
  const uses12HourFormat = use12HourFormat();

  const formSchema = getAppointmentNotificationSchemaWithUniqueCheck(
    (name) => checkUniqueName(appId, name, initialData?._id),
    t("form.name.validation.unique"),
  );

  type FormValues = z.infer<typeof formSchema>;

  const [loading, setLoading] = React.useState(false);
  const [smsEnabled, setSmsEnabled] = React.useState<boolean | null>(null);
  const messageArgs = useSmsPreviewArgs();
  const router = useRouter();
  const channels = initialData
    ? readAppointmentNotificationChannels(initialData)
    : undefined;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "all",
    reValidateMode: "onChange",
    defaultValues: initialData
      ? {
          ...initialData,
          ...channels,
        }
      : {
          name: "",
          type: "timeBefore",
          weeks: 0,
          days: 1,
          hours: 0,
          minutes: 0,
          appointmentCount: {
            type: "none",
          },
          emailEnabled: true,
          textEnabled: false,
        },
  });

  React.useEffect(() => {
    let active = true;
    adminApi.configuration
      .getConfiguration("textMessaging")
      .then((value) => {
        if (active) setSmsEnabled(value?.enabled === true);
      })
      .catch(() => {
        if (active) setSmsEnabled(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);

      const fn = async () => {
        if (!initialData?._id) {
          const { _id } = await create(appId, data);
          router.push(
            `/dashboard/communications/appointment-notifications/edit?id=${_id}`,
          );
        } else {
          await update(appId, initialData._id, data);
          router.refresh();
        }
      };

      await toastPromise(fn(), {
        success: tAdmin("common.toasts.saved"),
        error: tAdmin("common.toasts.error"),
      });
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const itemType = form.watch("type");
  const isAtTime = itemType === "atTimeBefore" || itemType === "atTimeAfter";
  const appointmentCountType = form.watch("appointmentCount.type");
  const timing = form.watch();
  const locale = useLocale();
  const timeZone = useTimeZone();
  const emailEnabled = form.watch("emailEnabled") === true;
  const textEnabled = form.watch("textEnabled") === true;
  const { access, allowCustom, sharedPool } = useSmsMessagingAccess();
  const needsCustomVerification =
    smsEnabled === true &&
    access?.platformBusiness === true &&
    access.canCustomize === true &&
    !allowCustom;

  const appointmentNow = DateTime.now().setZone(timeZone).setLocale(locale);
  const scheduleWhen = shiftAppointmentNotificationTime(
    {
      type: itemType,
      weeks: amount("weeks" in timing ? timing.weeks : 0),
      days: amount("days" in timing ? timing.days : 0),
      hours: amount("hours" in timing ? timing.hours : 0),
      minutes: amount("minutes" in timing ? timing.minutes : 0),
      time: "time" in timing ? timing.time : undefined,
    },
    appointmentNow,
  ).toLocaleString(DateTime.DATETIME_MED);

  const scheduleExample = t(
    itemType === "timeAfter" || itemType === "atTimeAfter"
      ? "form.schedule.endsNow"
      : "form.schedule.startsNow",
    {
      now: appointmentNow.toLocaleString(DateTime.DATETIME_MED),
      when: scheduleWhen,
    },
  );

  const countOrdinal =
    appointmentCountType === "greaterThan"
      ? amount(form.watch("appointmentCount.count")) + 1
      : amount(form.watch("appointmentCount.count"));

  const countExample =
    appointmentCountType && appointmentCountType !== "none"
      ? t(`form.appointmentCount.examples.${appointmentCountType}`, {
          count: countOrdinal,
        })
      : null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabelWithRequiredIndicator required>
                {t("form.name.label")}
              </FormLabelWithRequiredIndicator>
              <FormControl>
                <Input
                  disabled={loading}
                  placeholder={t("form.name.placeholder")}
                  {...field}
                />
              </FormControl>
              <FormDescription>{t("form.name.description")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col gap-4 rounded-lg border p-4">
          <p className="text-sm font-medium">{t("form.schedule.label")}</p>
          <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className={isAtTime ? undefined : "md:col-span-2"}>
                  <FormLabelWithRequiredIndicator required>
                    {t("form.type.label")}
                  </FormLabelWithRequiredIndicator>
                  <FormControl>
                    <Combobox
                      disabled={loading}
                      className="flex w-full font-normal text-base"
                      values={appointmentNotificationTypes.map((type) => ({
                        value: type,
                        label: t(`triggers.${type}`),
                      }))}
                      searchLabel={t("form.type.searchLabel")}
                      value={field.value}
                      onItemSelect={(value) => {
                        field.onChange(value);
                        field.onBlur();
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("form.type.description")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isAtTime ? (
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithRequiredIndicator required>
                      {t("form.time.label")}
                    </FormLabelWithRequiredIndicator>
                    <FormControl>
                      <SimpleTimePicker
                        use12HourFormat={uses12HourFormat}
                        value={DateTime.fromObject({
                          hour: field.value?.hour,
                          minute: field.value?.minute,
                          second: 0,
                        }).toJSDate()}
                        onChange={(date) => {
                          const dateTime = date
                            ? DateTime.fromJSDate(date)
                            : undefined;
                          field.onChange({
                            hour: dateTime?.hour,
                            minute: dateTime?.minute,
                            second: dateTime?.second,
                          });
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("form.time.description")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
          </div>
          <div
            className={
              isAtTime
                ? "grid gap-4 md:grid-cols-2"
                : "grid gap-4 md:grid-cols-4"
            }
          >
            {(itemType === "timeBefore" || itemType === "timeAfter") && (
              <>
                <FormField
                  control={form.control}
                  name="weeks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabelWithRequiredIndicator>
                        {t(
                          `form.${itemType === "timeBefore" ? "weeksBefore" : "weeksAfter"}.label`,
                        )}
                      </FormLabelWithRequiredIndicator>
                      <FormControl>
                        <Input
                          type="number"
                          disabled={loading}
                          placeholder="0"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {t(
                          `form.${itemType === "timeBefore" ? "weeksBefore" : "weeksAfter"}.description`,
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabelWithRequiredIndicator>
                        {t(
                          `form.${itemType === "timeBefore" ? "daysBefore" : "daysAfter"}.label`,
                        )}
                      </FormLabelWithRequiredIndicator>
                      <FormControl>
                        <Input
                          type="number"
                          disabled={loading}
                          placeholder="0"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {t(
                          `form.${itemType === "timeBefore" ? "daysBefore" : "daysAfter"}.description`,
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabelWithRequiredIndicator>
                        {t(
                          `form.${itemType === "timeBefore" ? "hoursBefore" : "hoursAfter"}.label`,
                        )}
                      </FormLabelWithRequiredIndicator>
                      <FormControl>
                        <Input
                          type="number"
                          disabled={loading}
                          placeholder="0"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {t(
                          `form.${itemType === "timeBefore" ? "hoursBefore" : "hoursAfter"}.description`,
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabelWithRequiredIndicator>
                        {t(
                          `form.${itemType === "timeBefore" ? "minutesBefore" : "minutesAfter"}.label`,
                        )}
                      </FormLabelWithRequiredIndicator>
                      <FormControl>
                        <Input
                          type="number"
                          disabled={loading}
                          placeholder="0"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {t(
                          `form.${itemType === "timeBefore" ? "minutesBefore" : "minutesAfter"}.description`,
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            {(itemType === "atTimeBefore" || itemType === "atTimeAfter") && (
              <>
                <FormField
                  control={form.control}
                  name="weeks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabelWithRequiredIndicator>
                        {t(
                          `form.${itemType === "atTimeBefore" ? "weeksBefore" : "weeksAfter"}.label`,
                        )}
                      </FormLabelWithRequiredIndicator>
                      <FormControl>
                        <Input
                          type="number"
                          disabled={loading}
                          placeholder="0"
                          {...field}
                          onChange={(args) => {
                            field.onChange(args);
                            form.trigger("days");
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        {t(
                          `form.${itemType === "atTimeBefore" ? "weeksBefore" : "weeksAfter"}.description`,
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabelWithRequiredIndicator>
                        {t(
                          `form.${itemType === "atTimeBefore" ? "daysBefore" : "daysAfter"}.label`,
                        )}
                      </FormLabelWithRequiredIndicator>
                      <FormControl>
                        <Input
                          type="number"
                          disabled={loading}
                          placeholder="0"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {t(
                          `form.${itemType === "atTimeBefore" ? "daysBefore" : "daysAfter"}.description`,
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>
          <p className="text-muted-foreground text-sm">{scheduleExample}</p>
          <FormField
            control={form.control}
            name="appointmentCount.type"
            render={({ field }) => (
              <SwitchCardFormItem
                alwaysItemsStart
                noCard="borderTop"
                label={t("form.appointmentCount.label")}
                description={t("form.appointmentCount.description")}
                checked={field.value !== "none"}
                disabled={loading}
                onCheckedChange={(checked) => {
                  if (!checked) {
                    field.onChange("none");
                    return;
                  }

                  if (field.value === "none") field.onChange("equalTo");
                }}
              >
                {field.value !== "none" ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormItem>
                      <FormLabelWithRequiredIndicator required>
                        {t("form.appointmentCount.type.label")}
                      </FormLabelWithRequiredIndicator>
                      <FormControl>
                        <Select
                          disabled={loading}
                          value={field.value}
                          onValueChange={(value) => field.onChange(value)}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t(
                                "form.appointmentCount.type.placeholder",
                              )}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {appointmentNotificationAppointmentCountType
                              .filter((type) => type !== "none")
                              .map((type) => (
                                <SelectItem key={type} value={type}>
                                  {t(
                                    `form.appointmentCount.type.types.${type}`,
                                  )}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                    <FormField
                      control={form.control}
                      name="appointmentCount.count"
                      render={({ field: countField }) => (
                        <FormItem>
                          <FormLabelWithRequiredIndicator required>
                            {t("form.appointmentCount.count.label")}
                          </FormLabelWithRequiredIndicator>
                          <FormControl>
                            <Input
                              type="number"
                              disabled={loading}
                              placeholder="0"
                              {...countField}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ) : null}
                {countExample ? (
                  <p className="text-muted-foreground text-sm">
                    {countExample}
                  </p>
                ) : null}
              </SwitchCardFormItem>
            )}
          />
        </div>
        <div className="flex flex-col gap-4 rounded-lg border p-4">
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium">{t("form.delivery.label")}</p>
            {!emailEnabled && !textEnabled ? (
              <p className="text-destructive text-sm">
                {t("form.channel.required")}
              </p>
            ) : null}
          </div>
          <div className="grid grid-cols-1 items-stretch gap-4 pt-4 border-t">
            <FormField
              control={form.control}
              name="emailEnabled"
              render={({ field }) => (
                <SwitchCardFormItem
                  alwaysItemsStart
                  noCard
                  label={t("form.email.label")}
                  description={t("form.email.description")}
                  checked={field.value === true}
                  disabled={loading}
                  onCheckedChange={field.onChange}
                >
                  {field.value === true ? (
                    <FormField
                      control={form.control}
                      name="emailTemplateId"
                      render={({ field: templateField }) => (
                        <FormItem>
                          <FormLabelWithRequiredIndicator required>
                            {t("form.email.templateLabel")}
                          </FormLabelWithRequiredIndicator>
                          <FormControl>
                            <TemplateSelector
                              type="email"
                              disabled={loading}
                              value={templateField.value}
                              onItemSelect={templateField.onChange}
                            />
                          </FormControl>
                          <FormDescription>
                            {t("form.email.templateDescription")}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : null}
                </SwitchCardFormItem>
              )}
            />
            <FormField
              control={form.control}
              name="textEnabled"
              render={({ field }) => (
                <SwitchCardFormItem
                  alwaysItemsStart
                  noCard="borderTop"
                  label={t("form.textMessage.label")}
                  description={t("form.textMessage.description")}
                  checked={field.value === true}
                  disabled={
                    loading || (smsEnabled === false && field.value !== true)
                  }
                  onCheckedChange={(value) => {
                    if (value && smsEnabled === false) return;
                    field.onChange(value);
                  }}
                >
                  {smsEnabled === false ? (
                    <Alert variant="warning">
                      <AlertDescription className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <span>{t("form.textMessage.smsDisabled")}</span>
                        <Link
                          button
                          href="/dashboard/settings/text-messaging"
                          variant="default"
                          size="sm"
                        >
                          {t("form.textMessage.smsDisabledAction")}
                        </Link>
                      </AlertDescription>
                    </Alert>
                  ) : null}
                  {needsCustomVerification ? (
                    <Alert variant="warning">
                      <AlertDescription className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <span>{t("form.textMessage.verify")}</span>
                        <Link
                          button
                          href="/dashboard/settings/text-messaging/verification"
                          variant="default"
                          size="sm"
                        >
                          {t("form.textMessage.verifyAction")}
                        </Link>
                      </AlertDescription>
                    </Alert>
                  ) : null}
                  {field.value === true &&
                  smsEnabled !== false &&
                  allowCustom ? (
                    <FormField
                      control={form.control}
                      name="textTemplateId"
                      render={({ field: templateField }) => (
                        <CustomTextTemplateSelect
                          disabled={loading}
                          value={templateField.value}
                          onChange={templateField.onChange}
                        />
                      )}
                    />
                  ) : null}
                  {field.value === true && smsEnabled !== false ? (
                    <SmsMessagePreview
                      templateId={form.watch("textTemplateId")}
                      allowCustom={allowCustom}
                      args={messageArgs}
                      fallback={renderBuiltInSms(
                        getAppointmentReminderSms(
                          smsPreviewLanguage(messageArgs),
                        ),
                        messageArgs,
                        sharedPool,
                      )}
                    />
                  ) : null}
                </SwitchCardFormItem>
              )}
            />
          </div>
        </div>
        <SaveButton form={form} />
      </form>
    </Form>
  );
};
