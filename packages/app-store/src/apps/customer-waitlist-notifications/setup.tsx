"use client";

import { useI18n } from "@hacado/i18n/client";
import { ConnectedAppStatusMessage } from "@hacado/ui-admin/connected-app-properties";
import { PageSelector } from "@hacado/ui-admin/page-selector";
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
import { Input } from "@hacado/ui/input";
import { Skeleton } from "@hacado/ui/skeleton";
import React from "react";
import { useConnectedAppSetup } from "../../hooks/use-connected-app-setup";
import { useSmsMessagingAccess } from "../../hooks/use-sms-messaging-access";
import { CustomerWaitlistNotificationsApp } from "./app";
import { getWaitlistSmsBodies } from "./messages";
import {
  CustomerWaitlistNotificationsConfiguration,
  customerWaitlistNotificationsConfigurationSchema,
} from "./models";
import {
  CustomerWaitlistNotificationsAdminKeys,
  CustomerWaitlistNotificationsAdminNamespace,
  customerWaitlistNotificationsAdminNamespace,
} from "./translations/types";

export const CustomerWaitlistNotificationsAppSetup: React.FC<{
  appId: string;
}> = ({ appId }) => {
  const { appStatus, form, isLoading, isDataLoading, onSubmit } =
    useConnectedAppSetup<CustomerWaitlistNotificationsConfiguration>({
      appId,
      appName: CustomerWaitlistNotificationsApp.name,
      schema: customerWaitlistNotificationsConfigurationSchema,
    });

  const t = useI18n<
    CustomerWaitlistNotificationsAdminNamespace,
    CustomerWaitlistNotificationsAdminKeys
  >(customerWaitlistNotificationsAdminNamespace);

  const notifyOnSlotOpened = !!form.watch("notifyOnSlotOpened");
  const newEntryEmailOn = form.watch("customerNewEntryEmailEnabled") === true;
  const slotOpenedEmailOn = form.watch("slotOpenedEmailEnabled") === true;
  const slotOpenedSmsEnabled = form.watch("slotOpenedSmsEnabled");
  const slotOpenedSmsTemplateId = form.watch("slotOpenedSmsTemplateId");
  const leaveWaitlistSmsTemplateId = form.watch("leaveWaitlistSmsTemplateId");
  const smsSlotOn = slotOpenedSmsEnabled === true;

  React.useEffect(() => {
    if (isDataLoading) return;

    const values = form.getValues();
    if (typeof values.customerNewEntryEmailEnabled !== "boolean") {
      form.setValue(
        "customerNewEntryEmailEnabled",
        Boolean(values.customerNewEntryTemplateId),
        { shouldDirty: false, shouldValidate: false },
      );
    }

    if (typeof values.slotOpenedEmailEnabled !== "boolean") {
      form.setValue(
        "slotOpenedEmailEnabled",
        Boolean(
          values.notifyOnSlotOpened !== false &&
            values.slotOpenedEmailTemplateId,
        ),
        { shouldDirty: false, shouldValidate: false },
      );
    }
  }, [form, isDataLoading]);

  const previewArgs = useSmsPreviewArgs();
  const { allowCustom, sharedPool } = useSmsMessagingAccess();
  const waitlistSms = getWaitlistSmsBodies(smsPreviewLanguage(previewArgs));
  const slotOpenedExample = renderBuiltInSms(
    waitlistSms.slotOpened,
    previewArgs,
    sharedPool,
  );

  const leaveExample = renderBuiltInSms(
    waitlistSms.leaveConfirm,
    previewArgs,
    sharedPool,
  );

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-4">
            <FormField
              control={form.control}
              name="customerNewEntryEmailEnabled"
              render={({ field }) => (
                <SwitchCardFormItem
                  alwaysItemsStart
                  className="md:col-span-2"
                  label={t("setup.form.customerNewEntryEmail.label")}
                  description={t(
                    "setup.form.customerNewEntryEmail.description",
                  )}
                  checked={field.value === true}
                  disabled={isLoading}
                  loading={isDataLoading}
                  onCheckedChange={field.onChange}
                >
                  {newEntryEmailOn ? (
                    <FormField
                      control={form.control}
                      name="customerNewEntryTemplateId"
                      render={({ field: templateField }) => (
                        <FormItem>
                          <FormLabelWithRequiredIndicator required>
                            {t("setup.form.customerNewEntryTemplateId.label")}
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
                            {t("setup.form.customerNewEntryTemplateId.tooltip")}
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
              name="notifyOnSlotOpened"
              render={({ field }) => (
                <SwitchCardFormItem
                  alwaysItemsStart
                  className="md:col-span-2"
                  label={t("setup.form.notifyOnSlotOpened.label")}
                  description={t("setup.form.notifyOnSlotOpened.tooltip")}
                  checked={!!field.value}
                  disabled={isLoading}
                  loading={isDataLoading}
                  onCheckedChange={field.onChange}
                >
                  {notifyOnSlotOpened ? (
                    <div className="flex flex-col gap-2">
                      <FormField
                        control={form.control}
                        name="slotOpenedEmailEnabled"
                        render={({ field }) => (
                          <SwitchCardFormItem
                            noCard="borderTop"
                            alwaysItemsStart
                            className="md:col-span-2"
                            label={t("setup.form.slotOpenedEmail.label")}
                            description={t(
                              "setup.form.slotOpenedEmail.description",
                            )}
                            checked={field.value === true}
                            disabled={isLoading}
                            loading={isDataLoading}
                            onCheckedChange={field.onChange}
                          >
                            {slotOpenedEmailOn ? (
                              <FormField
                                control={form.control}
                                name="slotOpenedEmailTemplateId"
                                render={({ field: templateField }) => (
                                  <FormItem>
                                    <FormLabelWithRequiredIndicator required>
                                      {t(
                                        "setup.form.slotOpenedEmailTemplateId.label",
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
                                        "setup.form.slotOpenedEmailTemplateId.tooltip",
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
                      <FormField
                        control={form.control}
                        name="slotOpenedSmsEnabled"
                        render={({ field }) => (
                          <SwitchCardFormItem
                            alwaysItemsStart
                            noCard="borderTop"
                            className="md:col-span-2"
                            label={t("setup.form.slotOpenedSms.label")}
                            description={t(
                              "setup.form.slotOpenedSms.description",
                            )}
                            checked={field.value === true}
                            disabled={isLoading}
                            loading={isDataLoading}
                            onCheckedChange={(value) => {
                              field.onChange(value);
                              form.trigger("slotOpenedEmailEnabled");
                            }}
                          >
                            {field.value === true ? (
                              <div className="flex flex-col gap-2">
                                {allowCustom ? (
                                  <FormField
                                    control={form.control}
                                    name="slotOpenedSmsTemplateId"
                                    render={({ field: templateField }) => (
                                      <CustomTextTemplateSelect
                                        loading={isDataLoading}
                                        disabled={isLoading}
                                        value={templateField.value}
                                        onChange={templateField.onChange}
                                      />
                                    )}
                                  />
                                ) : null}
                                <SmsMessagePreview
                                  templateId={slotOpenedSmsTemplateId}
                                  allowCustom={allowCustom}
                                  args={previewArgs}
                                  fallback={slotOpenedExample}
                                />
                              </div>
                            ) : null}
                          </SwitchCardFormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="leaveWaitlistSmsEnabled"
                        render={({ field }) => {
                          return (
                            <SwitchCardFormItem
                              alwaysItemsStart
                              noCard="borderTop"
                              className="md:col-span-2"
                              label={
                                <FormLabelWithRequiredIndicator
                                  required={smsSlotOn}
                                >
                                  {t("setup.form.leaveWaitlistSms.label")}
                                </FormLabelWithRequiredIndicator>
                              }
                              description={t(
                                "setup.form.leaveWaitlistSms.description",
                              )}
                              checked={field.value === true}
                              disabled={isLoading}
                              loading={isDataLoading}
                              onCheckedChange={field.onChange}
                            >
                              {field.value === true ? (
                                <div className="flex flex-col gap-2">
                                  {allowCustom ? (
                                    <FormField
                                      control={form.control}
                                      name="leaveWaitlistSmsTemplateId"
                                      render={({ field: templateField }) => (
                                        <CustomTextTemplateSelect
                                          loading={isDataLoading}
                                          disabled={isLoading}
                                          value={templateField.value}
                                          onChange={templateField.onChange}
                                        />
                                      )}
                                    />
                                  ) : null}
                                  <SmsMessagePreview
                                    templateId={leaveWaitlistSmsTemplateId}
                                    allowCustom={allowCustom}
                                    args={previewArgs}
                                    fallback={leaveExample}
                                  />
                                </div>
                              ) : null}
                            </SwitchCardFormItem>
                          );
                        }}
                      />
                      <div className="h-px bg-border mb-4" />
                      <p className="text-sm font-medium uppercase text-muted-foreground">
                        {t("setup.form.offerSettings")}
                      </p>
                      <FormField
                        control={form.control}
                        name="bookingPageId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabelWithRequiredIndicator required>
                              {t("setup.form.bookingPageId.label")}
                            </FormLabelWithRequiredIndicator>
                            <FormControl>
                              {isDataLoading ? (
                                <Skeleton className="w-full h-10" />
                              ) : (
                                <PageSelector
                                  disabled={isLoading}
                                  value={field.value}
                                  onItemSelect={(value) =>
                                    field.onChange(value)
                                  }
                                />
                              )}
                            </FormControl>
                            <FormDescription>
                              {t("setup.form.bookingPageId.tooltip")}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cooldownMinutes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabelWithRequiredIndicator required>
                              {t("setup.form.cooldownMinutes.label")}
                            </FormLabelWithRequiredIndicator>
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
                            <FormDescription>
                              {t("setup.form.cooldownMinutes.tooltip")}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="exclusiveAccessMinutes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabelWithRequiredIndicator required>
                              {t("setup.form.exclusiveAccessMinutes.label")}
                            </FormLabelWithRequiredIndicator>
                            <FormControl>
                              {isDataLoading ? (
                                <Skeleton className="w-full h-10" />
                              ) : (
                                <DurationInput
                                  type="hours-minutes"
                                  disabled={isLoading}
                                  value={field.value}
                                  onChange={(value) =>
                                    field.onChange(value ?? undefined)
                                  }
                                />
                              )}
                            </FormControl>
                            <FormDescription>
                              {t("setup.form.exclusiveAccessMinutes.tooltip")}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {smsSlotOn ? (
                        <FormField
                          control={form.control}
                          name="smsRemoveKeyword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabelWithRequiredIndicator required>
                                {t("setup.form.smsRemoveKeyword.label")}
                              </FormLabelWithRequiredIndicator>
                              <FormControl>
                                {isDataLoading ? (
                                  <Skeleton className="w-full h-10" />
                                ) : (
                                  <Input
                                    disabled={isLoading}
                                    placeholder={t(
                                      "setup.form.smsRemoveKeyword.placeholder",
                                    )}
                                    value={field.value ?? ""}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                  />
                                )}
                              </FormControl>
                              <FormDescription>
                                {t("setup.form.smsRemoveKeyword.tooltip")}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : null}
                    </div>
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
