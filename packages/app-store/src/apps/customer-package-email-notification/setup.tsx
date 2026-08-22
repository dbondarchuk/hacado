"use client";

import { useI18n } from "@hacado/i18n/client";
import {
  DurationInput,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  InfoTooltip,
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
  customerPackageEmailNotificationConfigurationSchema,
} from "./models";
import {
  CustomerPackageEmailNotificationAdminKeys,
  CustomerPackageEmailNotificationAdminNamespace,
  customerPackageEmailNotificationAdminNamespace,
} from "./translations/types";

const templateFields = [
  "purchased",
  "exhausted",
  "cancelled",
  "expired",
] as const;

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
          purchased: { templateId: "" },
          exhausted: { templateId: "" },
          cancelled: { templateId: "" },
          expired: { templateId: "" },
        },
        expiringSoon: { ...DEFAULT_EXPIRING_SOON },
      },
    });

  const t = useI18n<
    CustomerPackageEmailNotificationAdminNamespace,
    CustomerPackageEmailNotificationAdminKeys
  >(customerPackageEmailNotificationAdminNamespace);

  React.useEffect(() => {
    if (isDataLoading) return;
    if (!form.getValues("expiringSoon")) {
      form.setValue("expiringSoon", { ...DEFAULT_EXPIRING_SOON });
    }
  }, [form, isDataLoading]);

  const expiringSoonEnabled = !!form.watch("expiringSoon.enabled");

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-4">
            {templateFields.map((key) => (
              <FormField
                key={key}
                control={form.control}
                name={`templates.${key}.templateId`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t(`form.${key}.templateId.label`)}
                      <InfoTooltip>
                        {t(`form.${key}.templateId.description`)}
                      </InfoTooltip>
                    </FormLabel>
                    <FormControl>
                      {isDataLoading ? (
                        <Skeleton className="w-full h-10" />
                      ) : (
                        <TemplateSelector
                          type="email"
                          disabled={isLoading}
                          value={field.value}
                          onItemSelect={(value) => field.onChange(value)}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            <FormField
              control={form.control}
              name="expiringSoon.enabled"
              render={({ field }) => (
                <FormItem className="md:col-span-2 flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>
                      {t("form.expiringSoon.enabled.label")}
                      <InfoTooltip>
                        {t("form.expiringSoon.enabled.description")}
                      </InfoTooltip>
                    </FormLabel>
                  </div>
                  <FormControl>
                    {isDataLoading ? (
                      <Skeleton className="h-6 w-10" />
                    ) : (
                      <Switch
                        checked={!!field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    )}
                  </FormControl>
                </FormItem>
              )}
            />

            {expiringSoonEnabled ? (
              <>
                <FormField
                  control={form.control}
                  name="expiringSoon.thresholdMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("form.expiringSoon.thresholdMinutes.label")}
                        <InfoTooltip>
                          {t("form.expiringSoon.thresholdMinutes.description")}
                        </InfoTooltip>
                      </FormLabel>
                      <FormControl>
                        {isDataLoading ? (
                          <Skeleton className="w-full h-10" />
                        ) : (
                          <DurationInput
                            type="weeks-days-hours-minutes"
                            disabled={isLoading}
                            value={field.value}
                            onChange={(value) =>
                              field.onChange(value ?? undefined)
                            }
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expiringSoon.templateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("form.expiringSoon.templateId.label")}
                        <InfoTooltip>
                          {t("form.expiringSoon.templateId.description")}
                        </InfoTooltip>
                      </FormLabel>
                      <FormControl>
                        {isDataLoading ? (
                          <Skeleton className="w-full h-10" />
                        ) : (
                          <TemplateSelector
                            type="email"
                            disabled={isLoading}
                            value={field.value}
                            onItemSelect={(value) => field.onChange(value)}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            ) : null}

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
