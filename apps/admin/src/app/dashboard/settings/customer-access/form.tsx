"use client";

import { configurationApi } from "@hacado/api-sdk/admin/configuration";
import { useI18n } from "@hacado/i18n/client";
import { getCustomerOtpSms } from "@hacado/services/customer-auth-messages";
import {
  CustomerAuthConfiguration,
  customerAuthConfigurationSchema,
} from "@hacado/types/configuration/customer-auth";
import { SaveButton } from "@hacado/ui-admin/save-button";
import {
  renderBuiltInSms,
  SmsMessagePreview,
  smsPreviewLanguage,
  useSmsPreviewArgs,
} from "@hacado/ui-admin/sms-example";
import { SwitchCardFormItem } from "@hacado/ui-admin/switch-card-form-item";
import { TemplateSelector } from "@hacado/ui-admin/template-selector";
import { Alert, AlertDescription } from "@hacado/ui/alert";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@hacado/ui/form";
import { Link } from "@hacado/ui/link";
import { toastPromise } from "@hacado/ui/sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React from "react";
import { Resolver, useForm } from "react-hook-form";

export const CustomerAccessSettingsForm: React.FC<{
  values: CustomerAuthConfiguration;
  smsEnabled: boolean;
  allowTextTemplates: boolean;
  sharedPool: boolean;
}> = ({ values, smsEnabled, allowTextTemplates, sharedPool }) => {
  const t = useI18n("admin");
  const tValidation = useI18n("validation");
  const schema = React.useMemo(
    () =>
      customerAuthConfigurationSchema.superRefine((value, ctx) => {
        if (value.phoneEnabled && !smsEnabled) {
          ctx.addIssue({
            code: "custom",
            path: ["phoneEnabled"],
            message: "configuration.customerAuth.phoneRequiresTextMessaging",
          });
        }
      }),
    [smsEnabled],
  );

  const form = useForm<CustomerAuthConfiguration>({
    resolver: zodResolver(schema) as Resolver<CustomerAuthConfiguration>,
    mode: "all",
    reValidateMode: "onChange",
    values,
  });

  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const emailEnabled = form.watch("emailEnabled");
  const phoneEnabled = form.watch("phoneEnabled");
  const previewArgs = useSmsPreviewArgs();
  const otpArgs = React.useMemo(
    () => (previewArgs ? { ...previewArgs, otp: "482913" } : undefined),
    [previewArgs],
  );

  const onSubmit = async (data: CustomerAuthConfiguration) => {
    try {
      setLoading(true);
      await toastPromise(
        configurationApi.setConfiguration("customerAuth", data),
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
        {!emailEnabled && !phoneEnabled ? (
          <p className="text-destructive text-sm">
            {tValidation("configuration.customerAuth.channel.required")}
          </p>
        ) : null}
        <div className="grid grid-cols-1 items-start gap-4">
          <FormField
            control={form.control}
            name="emailEnabled"
            render={({ field }) => (
              <SwitchCardFormItem
                alwaysItemsStart
                label={t("settings.customerAccess.form.email.label")}
                description={t(
                  "settings.customerAccess.form.email.description",
                )}
                checked={field.value === true}
                disabled={loading}
                onCheckedChange={field.onChange}
              >
                {field.value === true ? (
                  <FormField
                    control={form.control}
                    name="otpEmailTemplateId"
                    render={({ field: templateField }) => (
                      <FormItem>
                        <FormLabel>
                          {t(
                            "settings.customerAccess.form.email.templateLabel",
                          )}
                        </FormLabel>
                        <FormDescription>
                          {t(
                            "settings.customerAccess.form.email.templateDescription",
                          )}
                        </FormDescription>
                        <FormControl>
                          <TemplateSelector
                            type="email"
                            disabled={loading}
                            value={templateField.value}
                            onItemSelect={templateField.onChange}
                          />
                        </FormControl>
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
            name="phoneEnabled"
            render={({ field }) => (
              <SwitchCardFormItem
                alwaysItemsStart
                label={t("settings.customerAccess.form.phone.label")}
                description={t(
                  "settings.customerAccess.form.phone.description",
                )}
                checked={field.value === true}
                disabled={loading || (!smsEnabled && field.value !== true)}
                onCheckedChange={(value) => {
                  if (value && !smsEnabled) return;

                  field.onChange(value);
                }}
              >
                {!smsEnabled ? (
                  <Alert variant="warning">
                    <AlertDescription className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <span>
                        {t("settings.customerAccess.form.smsDisabled")}
                      </span>
                      <Link
                        button
                        href="/dashboard/settings/text-messaging"
                        variant="default"
                        size="sm"
                      >
                        {t("settings.customerAccess.form.smsDisabledAction")}
                      </Link>
                    </AlertDescription>
                  </Alert>
                ) : null}
                {field.value === true && smsEnabled && allowTextTemplates ? (
                  <FormField
                    control={form.control}
                    name="otpTextTemplateId"
                    render={({ field: templateField }) => (
                      <FormItem>
                        <FormLabel>
                          {t("settings.textMessaging.customTemplate.label")}
                        </FormLabel>
                        <FormDescription>
                          {t("settings.textMessaging.customTemplate.tooltip")}
                        </FormDescription>
                        <FormControl>
                          <TemplateSelector
                            type="text-message"
                            allowClear
                            disabled={loading}
                            value={templateField.value}
                            onItemSelect={templateField.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}
                {field.value === true && smsEnabled ? (
                  <SmsMessagePreview
                    templateId={form.watch("otpTextTemplateId")}
                    allowCustom={allowTextTemplates}
                    args={otpArgs}
                    fallback={renderBuiltInSms(
                      getCustomerOtpSms(smsPreviewLanguage(otpArgs)),
                      otpArgs,
                      sharedPool,
                    )}
                  />
                ) : null}
                <FormMessage />
              </SwitchCardFormItem>
            )}
          />
        </div>
        <SaveButton form={form} disabled={loading} isLoading={loading} />
      </form>
    </Form>
  );
};
