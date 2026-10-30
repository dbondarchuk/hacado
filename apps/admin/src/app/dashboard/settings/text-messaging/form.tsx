"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import type { TextMessagingSettingsInput } from "@hacado/types/text-message/registration";
import { textMessagingSettingsFormSchema } from "@hacado/types/text-message/registration";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabelWithRequiredIndicator,
  FormMessage,
  toastPromise,
} from "@hacado/ui";
import { PageSelector, SaveButton, SwitchCardFormItem } from "@hacado/ui-admin";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Resolver, useForm } from "react-hook-form";

export const TextMessagingSettingsForm = ({
  textMessaging,
}: {
  textMessaging: {
    enabled: boolean;
    privacyPageId?: string;
    termsPageId?: string;
  };
}) => {
  const t = useI18n("admin");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const form = useForm<TextMessagingSettingsInput>({
    resolver: zodResolver(
      textMessagingSettingsFormSchema,
    ) as Resolver<TextMessagingSettingsInput>,
    mode: "all",
    reValidateMode: "onChange",
    values: {
      enabled: textMessaging.enabled,
      privacyPageId: textMessaging.privacyPageId ?? "",
      termsPageId: textMessaging.termsPageId ?? "",
    },
  });
  const smsEnabled = form.watch("enabled");

  const onSubmit = async (data: TextMessagingSettingsInput) => {
    setLoading(true);
    try {
      await toastPromise(adminApi.textMessaging.saveTextMessaging(data), {
        success: t("settings.textMessaging.toasts.saved"),
        error: t("settings.textMessaging.toasts.error"),
      });
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="enabled"
          render={({ field }) => (
            <SwitchCardFormItem
              alwaysItemsStart
              checked={field.value}
              onCheckedChange={field.onChange}
              label={t("settings.textMessaging.form.smsEnabled")}
              description={t(
                "settings.textMessaging.form.smsEnabledDescription",
              )}
              disabled={loading}
            >
              {!!field.value ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.textMessaging.form.legalPages.note")}
                  </p>
                  <FormField
                    control={form.control}
                    name="privacyPageId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabelWithRequiredIndicator required>
                          {t("settings.textMessaging.form.privacyPage.label")}
                        </FormLabelWithRequiredIndicator>
                        <FormControl>
                          <PageSelector
                            value={field.value || undefined}
                            disabled={loading}
                            onItemSelect={(value) =>
                              field.onChange(value ?? "")
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          {t("settings.textMessaging.form.privacyPage.hint")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="termsPageId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabelWithRequiredIndicator required>
                          {t("settings.textMessaging.form.termsPage.label")}
                        </FormLabelWithRequiredIndicator>
                        <FormControl>
                          <PageSelector
                            value={field.value || undefined}
                            disabled={loading}
                            onItemSelect={(value) =>
                              field.onChange(value ?? "")
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          {t("settings.textMessaging.form.termsPage.hint")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              ) : null}
            </SwitchCardFormItem>
          )}
        />
        <SaveButton
          form={form}
          disabled={loading}
          isLoading={loading}
          text={t("settings.textMessaging.form.save")}
        />
      </form>
    </Form>
  );
};
