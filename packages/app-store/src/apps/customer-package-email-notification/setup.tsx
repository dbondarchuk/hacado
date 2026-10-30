"use client";

import { useI18n } from "@hacado/i18n/client";
import { ConnectedAppStatusMessage } from "@hacado/ui-admin/connected-app-properties";
import { SaveButton } from "@hacado/ui-admin/save-button";
import { SwitchCardFormItem } from "@hacado/ui-admin/switch-card-form-item";
import { TemplateSelector } from "@hacado/ui-admin/template-selector";
import { DurationInput } from "@hacado/ui/duration-input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabelWithRequiredIndicator,
  FormMessage,
} from "@hacado/ui/form";
import { Skeleton } from "@hacado/ui/skeleton";
import React from "react";
import { useConnectedAppSetup } from "../../hooks/use-connected-app-setup";
import { CustomerPackageEmailNotificationApp } from "./app";
import {
  CustomerPackageEmailNotificationConfiguration,
  customerPackageEmailChannelKeys,
  customerPackageEmailNotificationConfigurationSchema,
} from "./models";
import {
  CustomerPackageEmailNotificationAdminKeys,
  CustomerPackageEmailNotificationAdminNamespace,
  customerPackageEmailNotificationAdminNamespace,
} from "./translations/types";

const DEFAULT_EXPIRING_SOON = {
  enabled: false,
  thresholdMinutes: 7 * 24 * 60,
} as const;

export const CustomerPackageEmailNotificationAppSetup: React.FC<{
  appId: string;
}> = ({ appId }) => {
  const { appStatus, form, isLoading, isDataLoading, onSubmit } =
    useConnectedAppSetup<CustomerPackageEmailNotificationConfiguration>({
      appId,
      appName: CustomerPackageEmailNotificationApp.name,
      schema: customerPackageEmailNotificationConfigurationSchema,
      initialData: {
        templates: {
          purchased: { enabled: true, templateId: "" },
          exhausted: { enabled: true, templateId: "" },
          cancelled: { enabled: true, templateId: "" },
          expired: { enabled: true, templateId: "" },
        },
        expiringSoon: { ...DEFAULT_EXPIRING_SOON },
      },
    });

  const t = useI18n<
    CustomerPackageEmailNotificationAdminNamespace,
    CustomerPackageEmailNotificationAdminKeys
  >(customerPackageEmailNotificationAdminNamespace);

  React.useEffect(() => {
    if (isDataLoading) {
      return;
    }

    const values = form.getValues();
    if (!values.expiringSoon) {
      form.setValue(
        "expiringSoon",
        { ...DEFAULT_EXPIRING_SOON },
        {
          shouldDirty: false,
          shouldValidate: false,
        },
      );
    }

    for (const key of customerPackageEmailChannelKeys) {
      const channel = values.templates?.[key];
      if (channel && typeof channel.enabled !== "boolean") {
        form.setValue(`templates.${key}.enabled`, Boolean(channel.templateId), {
          shouldDirty: false,
          shouldValidate: false,
        });
      }
    }
  }, [form, isDataLoading]);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 items-stretch gap-4">
            {customerPackageEmailChannelKeys.map((key) => (
              <FormField
                key={key}
                control={form.control}
                name={`templates.${key}.enabled`}
                render={({ field }) => (
                  <SwitchCardFormItem
                    alwaysItemsStart
                    label={t(`form.${key}.enabled.label`)}
                    description={t(`form.${key}.enabled.description`)}
                    checked={field.value === true}
                    disabled={isLoading}
                    loading={isDataLoading}
                    onCheckedChange={field.onChange}
                  >
                    {field.value === true ? (
                      <FormField
                        control={form.control}
                        name={`templates.${key}.templateId`}
                        render={({ field: templateField }) => (
                          <FormItem>
                            <FormLabelWithRequiredIndicator required>
                              {t(`form.${key}.templateId.label`)}
                            </FormLabelWithRequiredIndicator>
                            <FormControl>
                              {isDataLoading ? (
                                <Skeleton className="w-full h-10" />
                              ) : (
                                <TemplateSelector
                                  type="email"
                                  disabled={isLoading}
                                  value={templateField.value}
                                  onItemSelect={(value) =>
                                    templateField.onChange(value)
                                  }
                                />
                              )}
                            </FormControl>
                            <FormDescription>
                              {t(`form.${key}.templateId.description`)}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : null}
                  </SwitchCardFormItem>
                )}
              />
            ))}

            <FormField
              control={form.control}
              name="expiringSoon.enabled"
              render={({ field }) => (
                <SwitchCardFormItem
                  alwaysItemsStart
                  className="md:col-span-2"
                  label={t("form.expiringSoon.enabled.label")}
                  description={t("form.expiringSoon.enabled.description")}
                  checked={field.value === true}
                  disabled={isLoading}
                  loading={isDataLoading}
                  onCheckedChange={field.onChange}
                >
                  {field.value === true ? (
                    <>
                      <FormField
                        control={form.control}
                        name="expiringSoon.thresholdMinutes"
                        render={({ field: thresholdField }) => (
                          <FormItem>
                            <FormLabelWithRequiredIndicator required>
                              {t("form.expiringSoon.thresholdMinutes.label")}
                            </FormLabelWithRequiredIndicator>
                            <FormControl>
                              {isDataLoading ? (
                                <Skeleton className="w-full h-10" />
                              ) : (
                                <DurationInput
                                  type="weeks-days-hours-minutes"
                                  disabled={isLoading}
                                  value={thresholdField.value}
                                  onChange={(value) =>
                                    thresholdField.onChange(value ?? undefined)
                                  }
                                />
                              )}
                            </FormControl>
                            <FormDescription>
                              {t(
                                "form.expiringSoon.thresholdMinutes.description",
                              )}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="expiringSoon.templateId"
                        render={({ field: templateField }) => (
                          <FormItem>
                            <FormLabelWithRequiredIndicator required>
                              {t("form.expiringSoon.templateId.label")}
                            </FormLabelWithRequiredIndicator>
                            <FormControl>
                              {isDataLoading ? (
                                <Skeleton className="w-full h-10" />
                              ) : (
                                <TemplateSelector
                                  type="email"
                                  disabled={isLoading}
                                  value={templateField.value}
                                  onItemSelect={(value) =>
                                    templateField.onChange(value)
                                  }
                                />
                              )}
                            </FormControl>
                            <FormDescription>
                              {t("form.expiringSoon.templateId.description")}
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
              disabled={isLoading}
              isLoading={isLoading}
            />
          </div>
        </form>
      </Form>
      {appStatus && (
        <ConnectedAppStatusMessage
          status={appStatus.status}
          statusText={appStatus.statusText}
        />
      )}
    </>
  );
};
