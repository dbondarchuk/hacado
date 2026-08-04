"use client";

import { ResourcesCard } from "@/components/admin/resource/resources-card";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminApi } from "@timelish/api-sdk";
import { useI18n } from "@timelish/i18n/client";
import {
  ScriptsConfiguration,
  scriptsConfigurationSchema,
} from "@timelish/types";
import { Form, toastPromise } from "@timelish/ui";
import { SaveButton } from "@timelish/ui-admin";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";

export const ScriptsSettingsForm: React.FC<{
  values: ScriptsConfiguration;
}> = ({ values }) => {
  const t = useI18n("admin");
  const form = useForm<ScriptsConfiguration>({
    resolver: zodResolver(scriptsConfigurationSchema),
    mode: "all",
    values,
  });

  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  const onSubmit = async (data: ScriptsConfiguration) => {
    try {
      setLoading(true);
      await toastPromise(
        adminApi.configuration.setConfiguration("scripts", data),
        {
          success: t("settings.scripts.form.toasts.changesSaved"),
          error: t("settings.scripts.form.toasts.requestError"),
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
        className="w-full space-y-8 relative"
      >
        <div className="flex gap-8 flex-col">
          <ResourcesCard
            type="script"
            form={form}
            name="header"
            title={t("settings.scripts.form.headerScripts")}
            loading={loading}
          />
          <ResourcesCard
            type="script"
            form={form}
            name="footer"
            title={t("settings.scripts.form.footerScripts")}
            loading={loading}
          />
        </div>
        <SaveButton form={form} disabled={loading} />
      </form>
    </Form>
  );
};
