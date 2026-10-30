"use client";

import { useI18n } from "@hacado/i18n/client";
import { SaveButton } from "@hacado/ui-admin/save-button";
import {
  CustomTextTemplateSelect,
  renderBuiltInSms,
  SmsMessagePreview,
  smsPreviewLanguage,
  useSmsPreviewArgs,
} from "@hacado/ui-admin/sms-example";
import { SwitchCardFormItem } from "@hacado/ui-admin/switch-card-form-item";
import { Form, FormField, FormMessage } from "@hacado/ui/form";
import { UseFormReturn } from "react-hook-form";
import { useConnectedAppSetup } from "../../hooks/use-connected-app-setup";
import { useSmsMessagingAccess } from "../../hooks/use-sms-messaging-access";
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
  allowCustom?: boolean;
  previewArgs?: Record<string, unknown>;
}> = ({
  form,
  disabled,
  type,
  isDataLoading,
  example,
  allowCustom,
  previewArgs,
}) => {
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
        return (
          <SwitchCardFormItem
            alwaysItemsStart
            label={tAdmin(`appointments.status.${type}`)}
            description={t(`form.message.description.${type}`)}
            checked={field.value === true}
            disabled={disabled}
            loading={isDataLoading}
            onCheckedChange={field.onChange}
          >
            {field.value === true ? (
              <div className="flex flex-col gap-2">
                {allowCustom ? (
                  <FormField
                    control={form.control}
                    name={`templates.${type}.templateId`}
                    render={({ field: templateField }) => (
                      <CustomTextTemplateSelect
                        loading={isDataLoading}
                        disabled={disabled}
                        value={templateField.value}
                        onChange={templateField.onChange}
                      />
                    )}
                  />
                ) : null}
                <SmsMessagePreview
                  templateId={templateId}
                  allowCustom={!!allowCustom}
                  args={previewArgs}
                  fallback={example}
                />
              </div>
            ) : null}
            <FormMessage />
          </SwitchCardFormItem>
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
  const { allowCustom, sharedPool } = useSmsMessagingAccess();
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
              allowCustom={allowCustom}
              previewArgs={previewArgs}
              example={renderBuiltInSms(
                bodies.pending,
                previewArgs,
                sharedPool,
              )}
            />
            <TextMessagesTemplateForm
              form={form}
              disabled={isLoading}
              isDataLoading={isDataLoading}
              type="confirmed"
              allowCustom={allowCustom}
              previewArgs={previewArgs}
              example={renderBuiltInSms(
                bodies.confirmed,
                previewArgs,
                sharedPool,
              )}
            />
            <TextMessagesTemplateForm
              form={form}
              disabled={isLoading}
              isDataLoading={isDataLoading}
              type="declined"
              allowCustom={allowCustom}
              previewArgs={previewArgs}
              example={renderBuiltInSms(
                bodies.declined,
                previewArgs,
                sharedPool,
              )}
            />
            <TextMessagesTemplateForm
              form={form}
              disabled={isLoading}
              isDataLoading={isDataLoading}
              type="canceled"
              allowCustom={allowCustom}
              previewArgs={previewArgs}
              example={renderBuiltInSms(
                bodies.canceled,
                previewArgs,
                sharedPool,
              )}
            />
            <TextMessagesTemplateForm
              form={form}
              disabled={isLoading}
              isDataLoading={isDataLoading}
              type="noShow"
              allowCustom={allowCustom}
              previewArgs={previewArgs}
              example={renderBuiltInSms(bodies.noShow, previewArgs, sharedPool)}
            />
            <TextMessagesTemplateForm
              form={form}
              disabled={isLoading}
              isDataLoading={isDataLoading}
              type="rescheduled"
              allowCustom={allowCustom}
              previewArgs={previewArgs}
              example={renderBuiltInSms(
                bodies.rescheduled,
                previewArgs,
                sharedPool,
              )}
            />
          </div>
          <SaveButton form={form} disabled={isLoading} isLoading={isLoading} />
        </form>
      </Form>
    </>
  );
};
