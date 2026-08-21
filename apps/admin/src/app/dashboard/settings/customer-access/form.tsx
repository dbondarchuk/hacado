"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import {
  CustomerAuthConfiguration,
  customerAuthConfigurationSchema,
  customerOtpAllowsEmail,
  customerOtpAllowsPhone,
  customerOtpChannels,
  type CustomerOtpChannels,
} from "@hacado/types";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toastPromise,
} from "@hacado/ui";
import { SaveButton, TemplateSelector } from "@hacado/ui-admin";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React from "react";
import { Resolver, useForm } from "react-hook-form";

type CustomerAuthFormValues = {
  otpChannels: CustomerOtpChannels;
  otpEmailTemplateId?: string;
  otpTextTemplateId?: string;
};

export const CustomerAccessSettingsForm: React.FC<{
  values: CustomerAuthConfiguration;
}> = ({ values }) => {
  const t = useI18n("admin");
  const form = useForm<CustomerAuthFormValues>({
    resolver: zodResolver(
      customerAuthConfigurationSchema,
    ) as Resolver<CustomerAuthFormValues>,
    mode: "all",
    values: {
      otpChannels: values.otpChannels,
      otpEmailTemplateId: values.otpEmailTemplateId,
      otpTextTemplateId: values.otpTextTemplateId,
    },
  });
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const otpChannels = form.watch("otpChannels");

  const onSubmit = async (data: CustomerAuthFormValues) => {
    try {
      setLoading(true);
      const channels = data.otpChannels;
      const payload: CustomerAuthConfiguration = {
        otpChannels: channels,
        otpEmailTemplateId: customerOtpAllowsEmail(channels)
          ? data.otpEmailTemplateId
          : undefined,
        otpTextTemplateId: customerOtpAllowsPhone(channels)
          ? data.otpTextTemplateId
          : undefined,
      };
      await toastPromise(
        adminApi.configuration.setConfiguration("customerAuth", payload),
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
          name="otpChannels"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("settings.customerAccess.form.otpChannels.label")}
              </FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value as CustomerOtpChannels);
                    field.onBlur();
                  }}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {customerOtpChannels.map((channel) => (
                      <SelectItem key={channel} value={channel}>
                        {t(
                          `settings.customerAccess.form.otpChannels.options.${channel}`,
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {customerOtpAllowsEmail(otpChannels) && (
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
        )}
        {customerOtpAllowsPhone(otpChannels) && (
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
