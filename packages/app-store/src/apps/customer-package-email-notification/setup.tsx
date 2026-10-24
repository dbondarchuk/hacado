"use client";

import { useI18n } from "@hacado/i18n/client";
import {
  DurationInput,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormLabelWithRequiredIndicator,
  FormMessage,
  Skeleton,
  Switch,
} from "@hacado/ui";
import {
  ConnectedAppStatusMessage,
  SaveButton,
  TemplateSelector,
} from "@hacado/ui-admin";
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
          <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-4">
            {customerPackageEmailChannelKeys.map((key) => (
              <FormField
                key={key}
                control={form.control}
                name={`templates.${key}.enabled`}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start justify-between gap-4 rounded-lg border p-4 w-full">
                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex flex-col gap-0.5">
                        <FormLabel>{t(`form.${key}.enabled.label`)}</FormLabel>
                        <FormDescription>
                          {t(`form.${key}.enabled.description`)}
                        </FormDescription>
                      </div>
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
                    </div>
                    <FormControl>
                      {isDataLoading ? (
                        <Skeleton className="h-6 w-10" />
                      ) : (
                        <Switch
                          checked={field.value === true}
                          disabled={isLoading}
                          onCheckedChange={(value) => field.onChange(value)}
                        />
                      )}
                    </FormControl>
                  </FormItem>
                )}
              />
            ))}

            <FormField
              control={form.control}
              name="expiringSoon.enabled"
              render={({ field }) => (
                <FormItem className="md:col-span-2 flex flex-row items-start justify-between gap-4 rounded-lg border p-4 w-full">
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex flex-col gap-0.5">
                      <FormLabel>
                        {t("form.expiringSoon.enabled.label")}
                      </FormLabel>
                      <FormDescription>
                        {t("form.expiringSoon.enabled.description")}
                      </FormDescription>
                    </div>
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
                                      thresholdField.onChange(
                                        value ?? undefined,
                                      )
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
                  </div>
                  <FormControl>
                    {isDataLoading ? (
                      <Skeleton className="h-6 w-10" />
                    ) : (
                      <Switch
                        checked={field.value === true}
                        disabled={isLoading}
                        onCheckedChange={(value) => field.onChange(value)}
                      />
                    )}
                  </FormControl>
                </FormItem>
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
