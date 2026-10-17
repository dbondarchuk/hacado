"use client";

import { useI18n } from "@hacado/i18n/client";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Skeleton,
  Switch,
} from "@hacado/ui";
import { SaveButton } from "@hacado/ui-admin";
import { UseFormReturn } from "react-hook-form";
import {
  renderBuiltInSms,
  SmsExample,
  smsPreviewLanguage,
  useSmsPreviewArgs,
} from "../../components/sms-example";
import { useConnectedAppSetup } from "../../hooks/use-connected-app-setup";
import { CustomerTextMessageNotificationApp } from "./app";
import { getCustomerTextMessageBodies } from "./messages";
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
  example?: string;
}> = ({ form, disabled, type, isDataLoading, example }) => {
  const t = useI18n<
    CustomerTextMessageNotificationAdminNamespace,
    CustomerTextMessageNotificationAdminKeys
  >(customerTextMessageNotificationAdminNamespace);
  const tAdmin = useI18n("admin");

  return (
    <FormField
      control={form.control}
      name={`templates.${type}.enabled`}
      render={({ field }) => {
        const templateId = form.watch(`templates.${type}.templateId`);
        const checked = field.value ?? Boolean(templateId);
        return (
          <FormItem className="flex flex-row items-start justify-between gap-4 rounded-lg border p-4 w-full">
            <div className="space-y-2">
              <FormLabel>{tAdmin(`appointments.status.${type}`)}</FormLabel>
              <FormDescription>
                {t(`form.message.description.${type}`)}
              </FormDescription>
              <SmsExample text={example} />
              <FormMessage />
            </div>
            <FormControl>
              {isDataLoading ? (
                <Skeleton className="w-10 h-6" />
              ) : (
                <Switch
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={(value) => field.onChange(value)}
                />
              )}
            </FormControl>
          </FormItem>
        );
      }}
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

  const previewArgs = useSmsPreviewArgs();
  const bodies = getCustomerTextMessageBodies(smsPreviewLanguage(previewArgs));

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 items-stretch gap-4">
            <TextMessagesTemplateForm
              form={form}
              disabled={isLoading}
              isDataLoading={isDataLoading}
              type="pending"
              example={renderBuiltInSms(bodies.pending, previewArgs)}
            />
            <TextMessagesTemplateForm
              form={form}
              disabled={isLoading}
              isDataLoading={isDataLoading}
              type="confirmed"
              example={renderBuiltInSms(bodies.confirmed, previewArgs)}
            />
            <TextMessagesTemplateForm
              form={form}
              disabled={isLoading}
              isDataLoading={isDataLoading}
              type="declined"
              example={renderBuiltInSms(bodies.declined, previewArgs)}
            />
            <TextMessagesTemplateForm
              form={form}
              disabled={isLoading}
              isDataLoading={isDataLoading}
              type="canceled"
              example={renderBuiltInSms(bodies.canceled, previewArgs)}
            />
            <TextMessagesTemplateForm
              form={form}
              disabled={isLoading}
              isDataLoading={isDataLoading}
              type="noShow"
              example={renderBuiltInSms(bodies.noShow, previewArgs)}
            />
            <TextMessagesTemplateForm
              form={form}
              disabled={isLoading}
              isDataLoading={isDataLoading}
              type="rescheduled"
              example={renderBuiltInSms(bodies.rescheduled, previewArgs)}
            />
          </div>
          <SaveButton form={form} disabled={isLoading} isLoading={isLoading} />
        </form>
      </Form>
    </>
  );
};
