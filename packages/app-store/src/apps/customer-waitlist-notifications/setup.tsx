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
  Input,
  Skeleton,
  Switch,
} from "@hacado/ui";
import {
  ConnectedAppStatusMessage,
  CustomTextTemplateSelect,
  PageSelector,
  renderBuiltInSms,
  SaveButton,
  SmsMessagePreview,
  smsPreviewLanguage,
  TemplateSelector,
  useSmsPreviewArgs,
} from "@hacado/ui-admin";
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
                <FormItem className="md:col-span-2 flex flex-row items-start justify-between gap-4 rounded-lg border p-4 w-full">
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex flex-col gap-0.5">
                      <FormLabel>
                        {t("setup.form.customerNewEntryEmail.label")}
                      </FormLabel>
                      <FormDescription>
                        {t("setup.form.customerNewEntryEmail.description")}
                      </FormDescription>
                    </div>
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
                              {t(
                                "setup.form.customerNewEntryTemplateId.tooltip",
                              )}
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

            <FormField
              control={form.control}
              name="notifyOnSlotOpened"
              render={({ field }) => (
                <FormItem className="md:col-span-2 flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="flex flex-col gap-0.5 w-full">
                    <FormLabel>
                      {t("setup.form.notifyOnSlotOpened.label")}
                    </FormLabel>
                    <FormDescription>
                      {t("setup.form.notifyOnSlotOpened.tooltip")}
                    </FormDescription>
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

            {notifyOnSlotOpened && !slotOpenedEmailOn && !smsSlotOn ? (
              <p className="text-destructive text-sm md:col-span-2">
                {t("setup.form.slotOpenedChannel.required")}
              </p>
            ) : null}
            {notifyOnSlotOpened ? (
              <>
                <FormField
                  control={form.control}
                  name="slotOpenedEmailEnabled"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2 flex flex-row items-start justify-between gap-4 rounded-lg border p-4 w-full">
                      <div className="flex flex-col gap-2 w-full">
                        <div className="flex flex-col gap-0.5">
                          <FormLabel>
                            {t("setup.form.slotOpenedEmail.label")}
                          </FormLabel>
                          <FormDescription>
                            {t("setup.form.slotOpenedEmail.description")}
                          </FormDescription>
                        </div>
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
                <FormField
                  control={form.control}
                  name="slotOpenedSmsEnabled"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2 flex flex-row items-start justify-between gap-4 rounded-lg border p-4 w-full">
                      <div className="flex flex-col gap-2 w-full">
                        <div className="flex flex-col gap-0.5">
                          <FormLabel>
                            {t("setup.form.slotOpenedSms.label")}
                          </FormLabel>
                          <FormDescription>
                            {t("setup.form.slotOpenedSms.description")}
                          </FormDescription>
                        </div>
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
                <FormField
                  control={form.control}
                  name="leaveWaitlistSmsEnabled"
                  render={({ field }) => {
                    return (
                      <FormItem className="md:col-span-2 flex flex-row items-start justify-between gap-4 rounded-lg border p-4 w-full">
                        <div className="flex flex-col gap-2 w-full">
                          <div className="flex flex-col gap-0.5">
                            <FormLabelWithRequiredIndicator
                              required={smsSlotOn}
                            >
                              {t("setup.form.leaveWaitlistSms.label")}
                            </FormLabelWithRequiredIndicator>
                            <FormDescription>
                              {t("setup.form.leaveWaitlistSms.description")}
                            </FormDescription>
                          </div>
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
                          <FormMessage />
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
                    );
                  }}
                />
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
                            onItemSelect={(value) => field.onChange(value)}
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
