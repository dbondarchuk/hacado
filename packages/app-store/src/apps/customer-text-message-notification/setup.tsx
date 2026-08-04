"use client";

import { useI18n } from "@timelish/i18n/client";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  InfoTooltip,
  Skeleton,
} from "@timelish/ui";
import { SaveButton, TemplateSelector } from "@timelish/ui-admin";
import { UseFormReturn } from "react-hook-form";
import { useConnectedAppSetup } from "../../hooks/use-connected-app-setup";
import { CustomerTextMessageNotificationApp } from "./app";
import {
  CustomerTextMessageNotificationConfiguration,
  customerTextMessageNotificationConfigurationSchema,
  TextMessagesTemplateKeys,
} from "./models";
import {
  CustomerTextMessageNotificationAdminKeys,
  CustomerTextMessageNotificationAdminNamespace,
  customerTextMessageNotificationAdminNamespace,
} from "./translations/types";

const TextMessagesTemplateForm: React.FC<{
  form: UseFormReturn<CustomerTextMessageNotificationConfiguration>;
  disabled?: boolean;
  type: TextMessagesTemplateKeys;
  isDataLoading?: boolean;
  whenText: string;
}> = ({ form, disabled, type, whenText, isDataLoading }) => {
  const t = useI18n<
    CustomerTextMessageNotificationAdminNamespace,
    CustomerTextMessageNotificationAdminKeys
  >(customerTextMessageNotificationAdminNamespace);
  const tAdmin = useI18n("admin");

  return (
    <FormField
      control={form.control}
      name={`templates.${type}.templateId`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {t("form.template.label", {
              type: tAdmin(`appointments.status.${type}`),
            })}
            <InfoTooltip>
              <p>
                {t("form.template.tooltip", {
                  whenText,
                })}
              </p>
              <p>{t("form.template.tooltipEmpty", { whenText })}</p>
            </InfoTooltip>
          </FormLabel>
          <FormControl>
            {isDataLoading ? (
              <Skeleton className="w-full h-10" />
            ) : (
              <TemplateSelector
                type="text-message"
                disabled={disabled}
                value={field.value}
                onItemSelect={(value) => field.onChange(value)}
                allowClear
              />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export const CustomerTextMessageNotificationAppSetup: React.FC<{
  appId: string;
}> = ({ appId }) => {
  const { form, isLoading, isDataLoading, onSubmit } =
    useConnectedAppSetup<CustomerTextMessageNotificationConfiguration>({
      appId,
      appName: CustomerTextMessageNotificationApp.name,
      schema: customerTextMessageNotificationConfigurationSchema,
    });

  const t = useI18n<
    CustomerTextMessageNotificationAdminNamespace,
    CustomerTextMessageNotificationAdminKeys
  >(customerTextMessageNotificationAdminNamespace);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4">
            <TextMessagesTemplateForm
              form={form}
              disabled={isLoading}
              isDataLoading={isDataLoading}
              type={"pending"}
              whenText={t("whenText.pending")}
            />
            <TextMessagesTemplateForm
              form={form}
              disabled={isLoading}
              isDataLoading={isDataLoading}
              type={"confirmed"}
              whenText={t("whenText.confirmed")}
            />
            <TextMessagesTemplateForm
              form={form}
              disabled={isLoading}
              isDataLoading={isDataLoading}
              type={"declined"}
              whenText={t("whenText.declined")}
            />
            <TextMessagesTemplateForm
              form={form}
              disabled={isLoading}
              isDataLoading={isDataLoading}
              type={"rescheduled"}
              whenText={t("whenText.rescheduled")}
            />
            <SaveButton
              form={form}
              disabled={isLoading}
              isLoading={isLoading}
            />
          </div>
        </form>
      </Form>
    </>
  );
};
