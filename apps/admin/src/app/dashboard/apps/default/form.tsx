"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useI18n } from "@hacado/i18n/client";
import {
  DefaultAppsConfiguration,
  defaultAppsConfigurationSchema,
} from "@hacado/types";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  InfoTooltip,
  toastPromise,
} from "@hacado/ui";
import { AppSelector, SaveButton } from "@hacado/ui-admin";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { updateDefaultAppsConfiguration } from "./actions";

export const DefaultAppsConfigurationForm: React.FC<{
  values: DefaultAppsConfiguration;
}> = ({ values }) => {
  const t = useI18n("admin");
  const form = useForm<DefaultAppsConfiguration>({
    resolver: zodResolver(defaultAppsConfigurationSchema),
    mode: "all",
    values,
  });

  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  const onSubmit = async (data: DefaultAppsConfiguration) => {
    try {
      setLoading(true);
      await toastPromise(updateDefaultAppsConfiguration(data), {
        success: t("apps.defaultAppsForm.toasts.changesSaved"),
        error: t("apps.defaultAppsForm.toasts.requestError"),
      });

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
        <div className="gap-2 flex flex-col md:grid md:grid-cols-2 md:gap-4">
          <FormField
            control={form.control}
            name="paymentAppId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("apps.defaultAppsForm.payment.label")}</FormLabel>
                <FormControl>
                  <AppSelector
                    onItemSelect={field.onChange}
                    scope="payment"
                    value={field.value}
                    disabled={loading}
                    className="w-full"
                    allowClear
                    placeholder={t("apps.defaultAppsForm.payment.placeholder")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="emailSenderAppId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("apps.defaultAppsForm.emailSender.label")}
                </FormLabel>
                <FormControl>
                  <AppSelector
                    onItemSelect={field.onChange}
                    scope="mail-send"
                    value={field.value}
                    disabled={loading}
                    className="w-full"
                    allowClear
                    placeholder={t(
                      "apps.defaultAppsForm.emailSender.placeholder",
                    )}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="textMessageSenderAppId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("apps.defaultAppsForm.textMessageSender.label")}
                </FormLabel>
                <FormControl>
                  <AppSelector
                    onItemSelect={field.onChange}
                    scope="text-message-send"
                    value={field.value}
                    disabled={loading}
                    className="w-full"
                    allowClear
                    placeholder={t(
                      "apps.defaultAppsForm.textMessageSender.placeholder",
                    )}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="textMessageResponderAppId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("apps.defaultAppsForm.textMessageResponder.label")}
                  <InfoTooltip>
                    {t("apps.defaultAppsForm.textMessageResponder.tooltip")}
                  </InfoTooltip>
                </FormLabel>
                <FormControl>
                  <AppSelector
                    onItemSelect={field.onChange}
                    scope="text-message-respond"
                    value={field.value}
                    disabled={loading}
                    className="w-full"
                    allowClear
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <SaveButton form={form} disabled={loading} />
      </form>
    </Form>
  );
};
