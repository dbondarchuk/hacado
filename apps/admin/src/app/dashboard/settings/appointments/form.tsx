"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import {
  BookingConfiguration,
  bookingConfigurationSchema,
} from "@hacado/types";
import {
  cn,
  Form,
  ResponsiveTabsList,
  Tabs,
  TabsContent,
  TabsTrigger,
  toastPromise,
} from "@hacado/ui";
import { SaveButton } from "@hacado/ui-admin";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React, { useCallback } from "react";
import { useForm } from "react-hook-form";
import { CancellationsTab } from "./tabs/cancellations";
import { MainTab } from "./tabs/main";
import { OptionsTab } from "./tabs/options";
import { PaymentsTab } from "./tabs/payments";
import { ReschedulesTab } from "./tabs/reschedules";

export const AppointmentsSettingsForm: React.FC<{
  values: BookingConfiguration;
  canUsePayments: boolean;
  showTeamSettings?: boolean;
}> = ({ values, canUsePayments, showTeamSettings }) => {
  const t = useI18n("admin");
  const form = useForm<BookingConfiguration>({
    resolver: zodResolver(bookingConfigurationSchema),
    mode: "all",
    reValidateMode: "onChange",
    values,
  });

  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  const onSubmit = async (data: BookingConfiguration) => {
    try {
      setLoading(true);
      const payload: BookingConfiguration = canUsePayments
        ? data
        : {
            ...data,
            payments: { enabled: false },
          };
      await toastPromise(
        adminApi.configuration.setConfiguration("booking", payload),
        {
          success: t("settings.appointments.form.toasts.changesSaved"),
          error: t("settings.appointments.form.toasts.requestError"),
        },
      );
      router.refresh();
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const mainTabInvalid =
    form.getFieldState("maxWeeksInFuture").invalid ||
    form.getFieldState("slotStart").invalid ||
    form.getFieldState("breakDuration").invalid;

  const triggerValidation = useCallback(() => {
    form.trigger();
    form.trigger("options");
    form.trigger("payments");
    form.trigger("cancellationsAndReschedules");
  }, [form]);

  React.useEffect(() => triggerValidation(), [triggerValidation]);

  React.useEffect(() => {
    if (!canUsePayments && form.getValues("payments.enabled")) {
      form.setValue("payments", { enabled: false }, { shouldValidate: true });
    }
  }, [canUsePayments, form]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full space-y-8 relative flex flex-col gap-2 pb-4"
      >
        <Tabs
          onValueChange={triggerValidation}
          defaultValue={"main"}
          className="space-y-4"
          orientation="vertical"
        >
          <ResponsiveTabsList className="w-full flex flex-row gap-2">
            <TabsTrigger
              value="main"
              className={cn(mainTabInvalid ? "text-destructive" : "")}
            >
              {t("settings.appointments.form.tabs.main")}
            </TabsTrigger>
            <TabsTrigger
              value="options"
              className={cn(
                form.getFieldState("options").invalid ? "text-destructive" : "",
              )}
            >
              {t("settings.appointments.form.tabs.options")}
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className={cn(
                form.getFieldState("payments").invalid
                  ? "text-destructive"
                  : "",
              )}
            >
              {t("settings.appointments.form.tabs.payments")}
            </TabsTrigger>
            <TabsTrigger
              value="cancellations"
              className={cn(
                form.getFieldState("cancellationsAndReschedules.cancellations")
                  .invalid
                  ? "text-destructive"
                  : "",
              )}
            >
              {t("settings.appointments.form.tabs.cancellations")}
            </TabsTrigger>
            <TabsTrigger
              value="reschedules"
              className={cn(
                form.getFieldState("cancellationsAndReschedules.reschedules")
                  .invalid
                  ? "text-destructive"
                  : "",
              )}
            >
              {t("settings.appointments.form.tabs.reschedules")}
            </TabsTrigger>
          </ResponsiveTabsList>
          <TabsContent value="main">
            <MainTab form={form} showTeamSettings={showTeamSettings} />
          </TabsContent>
          <TabsContent value="options">
            <OptionsTab form={form} />
          </TabsContent>
          <TabsContent value="payments">
            <PaymentsTab form={form} canUsePayments={canUsePayments} />
          </TabsContent>
          <TabsContent value="cancellations">
            <CancellationsTab form={form} />
          </TabsContent>
          <TabsContent value="reschedules">
            <ReschedulesTab form={form} />
          </TabsContent>
        </Tabs>
        <SaveButton form={form} disabled={loading} />
      </form>
    </Form>
  );
};
