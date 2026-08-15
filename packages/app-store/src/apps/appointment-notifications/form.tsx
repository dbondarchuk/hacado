"use client";

import { useI18n } from "@hacado/i18n/client";
import { communicationChannels, DatabaseId } from "@hacado/types";
import {
  Combobox,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  InfoTooltip,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SimpleTimePicker,
  toastPromise,
  use12HourFormat,
} from "@hacado/ui";
import { SaveButton, TemplateSelector } from "@hacado/ui-admin";
import { zodResolver } from "@hookform/resolvers/zod";
import { DateTime } from "luxon";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { checkUniqueName, create, update } from "./actions";
import {
  appointmentNotificationAppointmentCountType,
  appointmentNotificationTypes,
  AppointmentNotificationUpdateModel,
  getAppointmentNotificationSchemaWithUniqueCheck,
} from "./models";
import {
  AppointmentNotificationsAdminKeys,
  appointmentNotificationsAdminNamespace,
  AppointmentNotificationsAdminNamespace,
} from "./translations/types";

export const AppointmentNotificationForm: React.FC<{
  initialData?: AppointmentNotificationUpdateModel & Partial<DatabaseId>;
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
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "all",
    reValidateMode: "onChange",
    defaultValues: initialData || {
      name: "",
      type: "timeBefore",
      weeks: 0,
      days: 1,
      hours: 0,
      minutes: 0,
      appointmentCount: {
        type: "none",
      },
      channel: "email",
    },
  });

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
  const itemChannel = form.watch("channel");
  const appointmentCountType = form.watch("appointmentCount.type");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-8">
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.name.label")}</FormLabel>

                <FormControl>
                  <Input
                    disabled={loading}
                    placeholder={t("form.name.placeholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.type.label")}</FormLabel>
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
                      // changeType(value as any);
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="appointmentCount.type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <span>{t("form.appointmentCount.type.label")}</span>{" "}
                  <InfoTooltip>
                    {t("form.appointmentCount.type.tooltip")}
                  </InfoTooltip>
                </FormLabel>
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
                      {appointmentNotificationAppointmentCountType.map(
                        (type) => (
                          <SelectItem key={type} value={type}>
                            {t(`form.appointmentCount.type.types.${type}`)}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />
          {appointmentCountType && appointmentCountType !== "none" && (
            <FormField
              control={form.control}
              name="appointmentCount.count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <span>{t("form.appointmentCount.count.label")}</span>{" "}
                    <InfoTooltip>
                      {t("form.appointmentCount.count.tooltip")}
                    </InfoTooltip>
                  </FormLabel>

                  <FormControl>
                    <Input
                      type="number"
                      disabled={loading}
                      placeholder={t("form.appointmentCount.count.placeholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          {(itemType === "timeBefore" || itemType === "timeAfter") && (
            <>
              <FormField
                control={form.control}
                name="weeks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <span>
                        {t(
                          `form.${itemType === "timeBefore" ? "weeksBefore" : "weeksAfter"}.label`,
                        )}
                      </span>{" "}
                      <InfoTooltip>
                        {t(
                          `form.${itemType === "timeBefore" ? "weeksBefore" : "weeksAfter"}.tooltip`,
                        )}
                      </InfoTooltip>
                    </FormLabel>

                    <FormControl>
                      <Input
                        type="number"
                        disabled={loading}
                        placeholder="0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <span>
                        {t(
                          `form.${itemType === "timeBefore" ? "daysBefore" : "daysAfter"}.label`,
                        )}{" "}
                      </span>
                      <InfoTooltip>
                        {t(
                          `form.${itemType === "timeBefore" ? "daysBefore" : "daysAfter"}.tooltip`,
                        )}
                      </InfoTooltip>
                    </FormLabel>

                    <FormControl>
                      <Input
                        type="number"
                        disabled={loading}
                        placeholder="0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <span>
                        {t(
                          `form.${itemType === "timeBefore" ? "hoursBefore" : "hoursAfter"}.label`,
                        )}{" "}
                      </span>
                      <InfoTooltip>
                        {t(
                          `form.${itemType === "timeBefore" ? "hoursBefore" : "hoursAfter"}.tooltip`,
                        )}
                      </InfoTooltip>
                    </FormLabel>

                    <FormControl>
                      <Input
                        type="number"
                        disabled={loading}
                        placeholder="0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <span>
                        {t(
                          `form.${itemType === "timeBefore" ? "minutesBefore" : "minutesAfter"}.label`,
                        )}
                      </span>{" "}
                      <InfoTooltip>
                        {t(
                          `form.${itemType === "timeBefore" ? "minutesBefore" : "minutesAfter"}.tooltip`,
                        )}
                      </InfoTooltip>
                    </FormLabel>

                    <FormControl>
                      <Input
                        type="number"
                        disabled={loading}
                        placeholder="0"
                        {...field}
                      />
                    </FormControl>
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
                    <FormLabel>
                      <span>
                        {t(
                          `form.${itemType === "atTimeBefore" ? "weeksBefore" : "weeksAfter"}.label`,
                        )}
                      </span>{" "}
                      <InfoTooltip>
                        {t(
                          `form.${itemType === "atTimeBefore" ? "weeksBefore" : "weeksAfter"}.tooltip`,
                        )}
                      </InfoTooltip>
                    </FormLabel>

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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <span>
                        {t(
                          `form.${itemType === "atTimeBefore" ? "daysBefore" : "daysAfter"}.label`,
                        )}
                      </span>{" "}
                      <InfoTooltip>
                        {t(
                          `form.${itemType === "atTimeBefore" ? "daysBefore" : "daysAfter"}.tooltip`,
                        )}
                      </InfoTooltip>
                    </FormLabel>

                    <FormControl>
                      <Input
                        type="number"
                        disabled={loading}
                        placeholder="0"
                        {...field}
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
                    <FormLabel>
                      <span>{t("form.time.label")}</span>{" "}
                      <InfoTooltip>{t("form.time.tooltip")}</InfoTooltip>
                    </FormLabel>

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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="channel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <span>{t("form.channel.label")}</span>{" "}
                  <InfoTooltip>{t("form.channel.tooltip")}</InfoTooltip>
                </FormLabel>
                <FormControl>
                  <Combobox
                    disabled={loading}
                    className="flex w-full font-normal text-base"
                    values={communicationChannels.map((channel) => ({
                      value: channel,
                      label: t(`channels.${channel}`),
                    }))}
                    searchLabel={t("form.channel.searchLabel")}
                    value={field.value}
                    onItemSelect={(value) => {
                      field.onChange(value);
                      field.onBlur();
                      // changeChannel(value as any);
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="templateId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <span>{t("form.template.label")}</span>
                  <InfoTooltip>{t("form.template.tooltip")}</InfoTooltip>
                </FormLabel>
                <FormControl>
                  <TemplateSelector
                    type={itemChannel}
                    disabled={loading}
                    value={field.value}
                    onItemSelect={(value) => field.onChange(value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <SaveButton form={form} />
      </form>
    </Form>
  );
};
