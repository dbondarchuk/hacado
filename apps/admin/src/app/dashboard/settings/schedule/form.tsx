"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import {
  ScheduleConfiguration,
  scheduleConfigurationSchema,
} from "@hacado/types";
import { Form, FormField, toastPromise } from "@hacado/ui";
import { SaveButton, Scheduler } from "@hacado/ui-admin";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";

export type ScheduleSettingsFormProps = {
  values: ScheduleConfiguration;
};

export const ScheduleSettingsForm: React.FC<ScheduleSettingsFormProps> = ({
  values,
}) => {
  const t = useI18n("admin");
  const form = useForm<ScheduleConfiguration>({
    resolver: zodResolver(scheduleConfigurationSchema),
    mode: "all",
    reValidateMode: "onChange",
    values,
  });

  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  const onSubmit = async (data: ScheduleConfiguration) => {
    try {
      setLoading(true);
      await toastPromise(
        adminApi.configuration.setConfiguration("schedule", data),
        {
          success: t("settings.schedule.form.toasts.changesSaved"),
          error: t("settings.schedule.form.toasts.requestError"),
        },
      );
      router.refresh();
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full space-y-8 relative flex flex-col gap-2"
      >
        <FormField
          control={form.control}
          name="schedule"
          render={({ field }) => (
            <Scheduler value={field.value} onChange={field.onChange} />
          )}
        />
        <SaveButton form={form} disabled={loading} />
      </form>
    </Form>
  );
};
