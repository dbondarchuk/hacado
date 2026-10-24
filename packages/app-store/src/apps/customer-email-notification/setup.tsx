"use client";

import { useI18n } from "@hacado/i18n/client";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabelWithRequiredIndicator,
  FormMessage,
  Skeleton,
} from "@hacado/ui";
import {
  ConnectedAppStatusMessage,
  SaveButton,
  SwitchCardFormItem,
  TemplateSelector,
} from "@hacado/ui-admin";
import React from "react";
import { useConnectedAppSetup } from "../../hooks/use-connected-app-setup";
import { CustomerEmailNotificationApp } from "./app";
import {
  CustomerEmailNotificationChannelKey,
  CustomerEmailNotificationConfiguration,
  customerEmailNotificationChannelKeys,
  customerEmailNotificationConfigurationSchema,
} from "./models";
import {
  CustomerEmailNotificationAdminKeys,
  CustomerEmailNotificationAdminNamespace,
  customerEmailNotificationAdminNamespace,
} from "./translations/types";

const channelCards: {
  key: CustomerEmailNotificationChannelKey | "event";
  enabledName:
    | `templates.${CustomerEmailNotificationChannelKey}.enabled`
    | "event.enabled";
  templateName:
    | `templates.${CustomerEmailNotificationChannelKey}.templateId`
    | "event.templateId";
}[] = [
  ...customerEmailNotificationChannelKeys.map((key) => ({
    key,
    enabledName: `templates.${key}.enabled` as const,
    templateName: `templates.${key}.templateId` as const,
  })),
  {
    key: "event",
    enabledName: "event.enabled",
    templateName: "event.templateId",
  },
];

export const CustomerEmailNotificationAppSetup: React.FC<{ appId: string }> = ({
  appId,
}) => {
  const { appStatus, form, isLoading, isDataLoading, onSubmit } =
    useConnectedAppSetup<CustomerEmailNotificationConfiguration>({
      appId,
      appName: CustomerEmailNotificationApp.name,
      schema: customerEmailNotificationConfigurationSchema,
    });

  const t = useI18n<
    CustomerEmailNotificationAdminNamespace,
    CustomerEmailNotificationAdminKeys
  >(customerEmailNotificationAdminNamespace);

  React.useEffect(() => {
    if (isDataLoading) {
      return;
    }

    const values = form.getValues();
    for (const key of customerEmailNotificationChannelKeys) {
      const channel = values.templates?.[key];
      if (!channel || typeof channel.enabled !== "boolean") {
        form.setValue(
          `templates.${key}.enabled`,
          Boolean(channel?.templateId),
          { shouldDirty: false, shouldValidate: false },
        );
      }
    }

    if (typeof values.event?.enabled !== "boolean") {
      form.setValue("event.enabled", Boolean(values.event?.templateId), {
        shouldDirty: false,
        shouldValidate: false,
      });
    }
  }, [form, isDataLoading]);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 items-stretch gap-4">
            {channelCards.map((card) => (
              <FormField
                key={card.key}
                control={form.control}
                name={card.enabledName}
                render={({ field }) => (
                  <SwitchCardFormItem
                    alwaysItemsStart
                    label={t(
                      card.key === "event"
                        ? "form.calendarEventTemplate.enabled.label"
                        : `form.${card.key}.enabled.label`,
                    )}
                    description={t(
                      card.key === "event"
                        ? "form.calendarEventTemplate.enabled.description"
                        : `form.${card.key}.enabled.description`,
                    )}
                    checked={field.value === true}
                    disabled={isLoading}
                    loading={isDataLoading}
                    onCheckedChange={field.onChange}
                  >
                    {field.value === true ? (
                      <FormField
                        control={form.control}
                        name={card.templateName}
                        render={({ field: templateField }) => (
                          <FormItem>
                            <FormLabelWithRequiredIndicator required>
                              {t(
                                card.key === "event"
                                  ? "form.calendarEventTemplate.templateId.label"
                                  : `form.${card.key}.templateId.label`,
                              )}
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
                              {t(
                                card.key === "event"
                                  ? "form.calendarEventTemplate.templateId.description"
                                  : `form.${card.key}.templateId.description`,
                              )}
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
