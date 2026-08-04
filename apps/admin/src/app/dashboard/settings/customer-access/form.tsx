"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { adminApi } from "@timelish/api-sdk";
import { useI18n } from "@timelish/i18n/client";
import {
  CustomerAuthConfiguration,
  customerAuthConfigurationSchema,
} from "@timelish/types";
import {
  BooleanSelect,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  toastPromise,
} from "@timelish/ui";
import { SaveButton, TemplateSelector } from "@timelish/ui-admin";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";

export const CustomerAccessSettingsForm: React.FC<{
  values: CustomerAuthConfiguration;
}> = ({ values }) => {
  const t = useI18n("admin");
  const form = useForm<CustomerAuthConfiguration>({
    resolver: zodResolver(customerAuthConfigurationSchema),
    mode: "all",
    values,
  });
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const allowPhoneOtp = form.watch("allowPhoneOtp");

  const onSubmit = async (data: CustomerAuthConfiguration) => {
    try {
      setLoading(true);
      await toastPromise(
        adminApi.configuration.setConfiguration("customerAuth", data),
        {
          success: t("settings.customerAccess.form.toasts.changesSaved"),
          error: t("settings.customerAccess.form.toasts.requestError"),
        },
      );
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="otpEmailTemplateId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("settings.customerAccess.form.otpEmailTemplateId.label")}
              </FormLabel>
              <FormControl>
                <TemplateSelector
                  type="email"
                  disabled={loading}
                  value={field.value}
                  onItemSelect={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="allowPhoneOtp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("settings.customerAccess.form.allowPhoneOtp.label")}
              </FormLabel>
              <FormControl>
                <BooleanSelect
                  value={!!field.value}
                  onValueChange={field.onChange}
                  disabled={loading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {allowPhoneOtp && (
          <FormField
            control={form.control}
            name="otpTextTemplateId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("settings.customerAccess.form.otpTextTemplateId.label")}
                </FormLabel>
                <FormControl>
                  <TemplateSelector
                    type="text-message"
                    disabled={loading}
                    value={field.value}
                    onItemSelect={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <SaveButton form={form} disabled={loading} isLoading={loading} />
      </form>
    </Form>
  );
};
