"use client";

import { useI18n } from "@hacado/i18n/client";
import { ConnectedAppStatusMessage } from "@hacado/ui-admin/connected-app-properties";
import { SaveButton } from "@hacado/ui-admin/save-button";
import {
  CustomTextTemplateSelect,
  renderBuiltInSms,
  SmsMessagePreview,
  smsPreviewLanguage,
  useSmsPreviewArgs,
} from "@hacado/ui-admin/sms-example";
import { SwitchCardFormItem } from "@hacado/ui-admin/switch-card-form-item";
import { TemplateSelector } from "@hacado/ui-admin/template-selector";
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
import { UseFormReturn } from "react-hook-form";
import { useConnectedAppSetup } from "../../hooks/use-connected-app-setup";
import { useSmsMessagingAccess } from "../../hooks/use-sms-messaging-access";
import { CustomerAppointmentUpdatesApp } from "./app";
import { getCustomerTextMessageBodies } from "./messages";
import {
  AppointmentUpdateEventKey,
  appointmentUpdateEventKeys,
  CustomerAppointmentUpdatesConfiguration,
  customerAppointmentUpdatesConfigurationSchema,
  PackageEmailKey,
  packageEmailKeys,
} from "./models";
import {
  CustomerAppointmentUpdatesAdminKeys,
  CustomerAppointmentUpdatesAdminNamespace,
  customerAppointmentUpdatesAdminNamespace,
} from "./translations/types";

type UpdatesForm = UseFormReturn<CustomerAppointmentUpdatesConfiguration>;

const EventCard: React.FC<{
  form: UpdatesForm;
  eventKey: AppointmentUpdateEventKey;
  disabled?: boolean;
  isDataLoading?: boolean;
  allowCustom?: boolean;
  previewArgs?: Record<string, unknown>;
  example?: string;
}> = ({
  form,
  eventKey,
  disabled,
  isDataLoading,
  allowCustom,
  previewArgs,
  example,
}) => {
  const t = useI18n<
    CustomerAppointmentUpdatesAdminNamespace,
    CustomerAppointmentUpdatesAdminKeys
  >(customerAppointmentUpdatesAdminNamespace);

  const textTemplateId = form.watch(`events.${eventKey}.textTemplateId`);

  return (
    <FormField
      control={form.control}
      name={`events.${eventKey}.enabled`}
      render={({ field }) => (
        <SwitchCardFormItem
          alwaysItemsStart
          label={t(`form.events.${eventKey}.label`)}
          description={t(`form.events.${eventKey}.description`)}
          checked={field.value === true}
          disabled={disabled}
          loading={isDataLoading}
          onCheckedChange={field.onChange}
        >
          {field.value === true ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">{t("form.howToSend.label")}</p>
              <FormField
                control={form.control}
                name={`events.${eventKey}.emailEnabled`}
                render={({ field: emailField }) => (
                  <SwitchCardFormItem
                    noCard="borderTop"
                    label={t("form.email.label")}
                    description={t("form.email.description")}
                    checked={emailField.value === true}
                    disabled={disabled}
                    loading={isDataLoading}
                    onCheckedChange={emailField.onChange}
                  >
                    {emailField.value === true ? (
                      <FormField
                        control={form.control}
                        name={`events.${eventKey}.emailTemplateId`}
                        render={({ field: templateField }) => (
                          <FormItem>
                            <FormLabelWithRequiredIndicator required>
                              {t("form.emailTemplate.label")}
                            </FormLabelWithRequiredIndicator>
                            <FormControl>
                              {isDataLoading ? (
                                <Skeleton className="w-full h-10" />
                              ) : (
                                <TemplateSelector
                                  type="email"
                                  disabled={disabled}
                                  value={templateField.value}
                                  onItemSelect={(value) =>
                                    templateField.onChange(value)
                                  }
                                />
                              )}
                            </FormControl>
                            <FormDescription>
                              {t("form.emailTemplate.description")}
                            </FormDescription>
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
                name={`events.${eventKey}.textEnabled`}
                render={({ field: textField }) => (
                  <SwitchCardFormItem
                    noCard="borderTop"
                    label={t("form.text.label")}
                    description={t("form.text.description")}
                    checked={textField.value === true}
                    disabled={disabled}
                    loading={isDataLoading}
                    onCheckedChange={textField.onChange}
                  >
                    {textField.value === true ? (
                      <div className="flex flex-col gap-2">
                        {allowCustom ? (
                          <FormField
                            control={form.control}
                            name={`events.${eventKey}.textTemplateId`}
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
                          templateId={textTemplateId}
                          allowCustom={!!allowCustom}
                          args={previewArgs}
                          fallback={example}
                        />
                      </div>
                    ) : null}
                  </SwitchCardFormItem>
                )}
              />
            </div>
          ) : null}
        </SwitchCardFormItem>
      )}
    />
  );
};

const TemplateToggleCard: React.FC<{
  form: UpdatesForm;
  enabledName: `packageEmails.${PackageEmailKey}.enabled` | "event.enabled";
  templateName:
    | `packageEmails.${PackageEmailKey}.templateId`
    | "event.templateId";
  keyPrefix:
    | `form.packageEmails.${PackageEmailKey}`
    | "form.calendarEventTemplate";
  disabled?: boolean;
  isDataLoading?: boolean;
}> = ({
  form,
  enabledName,
  templateName,
  keyPrefix,
  disabled,
  isDataLoading,
}) => {
  const t = useI18n<
    CustomerAppointmentUpdatesAdminNamespace,
    CustomerAppointmentUpdatesAdminKeys
  >(customerAppointmentUpdatesAdminNamespace);

  return (
    <FormField
      control={form.control}
      name={enabledName}
      render={({ field }) => (
        <SwitchCardFormItem
          alwaysItemsStart
          label={t(`${keyPrefix}.enabled.label`)}
          description={t(`${keyPrefix}.enabled.description`)}
          checked={field.value === true}
          disabled={disabled}
          loading={isDataLoading}
          onCheckedChange={field.onChange}
        >
          {field.value === true ? (
            <FormField
              control={form.control}
              name={templateName}
              render={({ field: templateField }) => (
                <FormItem>
                  <FormLabelWithRequiredIndicator required>
                    {t(`${keyPrefix}.templateId.label`)}
                  </FormLabelWithRequiredIndicator>
                  <FormControl>
                    {isDataLoading ? (
                      <Skeleton className="w-full h-10" />
                    ) : (
                      <TemplateSelector
                        type="email"
                        disabled={disabled}
                        value={templateField.value}
                        onItemSelect={(value) => templateField.onChange(value)}
                      />
                    )}
                  </FormControl>
                  <FormDescription>
                    {t(`${keyPrefix}.templateId.description`)}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
        </SwitchCardFormItem>
      )}
    />
  );
};

export const CustomerAppointmentUpdatesAppSetup: React.FC<{
  appId: string;
}> = ({ appId }) => {
  const { appStatus, form, isLoading, isDataLoading, onSubmit } =
    useConnectedAppSetup<CustomerAppointmentUpdatesConfiguration>({
      appId,
      appName: CustomerAppointmentUpdatesApp.name,
      schema: customerAppointmentUpdatesConfigurationSchema,
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
          <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-4">
            {appointmentUpdateEventKeys.options.map((eventKey) => (
              <EventCard
                key={eventKey}
                form={form}
                eventKey={eventKey}
                disabled={isLoading}
                isDataLoading={isDataLoading}
                allowCustom={allowCustom}
                previewArgs={previewArgs}
                example={renderBuiltInSms(
                  bodies[eventKey],
                  previewArgs,
                  sharedPool,
                )}
              />
            ))}
            {packageEmailKeys.map((key) => (
              <TemplateToggleCard
                key={key}
                form={form}
                enabledName={`packageEmails.${key}.enabled`}
                templateName={`packageEmails.${key}.templateId`}
                keyPrefix={`form.packageEmails.${key}`}
                disabled={isLoading}
                isDataLoading={isDataLoading}
              />
            ))}
            <TemplateToggleCard
              form={form}
              enabledName="event.enabled"
              templateName="event.templateId"
              keyPrefix="form.calendarEventTemplate"
              disabled={isLoading}
              isDataLoading={isDataLoading}
            />
          </div>
          <SaveButton form={form} disabled={isLoading} isLoading={isLoading} />
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
