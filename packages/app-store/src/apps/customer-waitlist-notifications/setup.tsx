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
  Input,
  Skeleton,
  Switch,
} from "@hacado/ui";
import {
  ConnectedAppStatusMessage,
  PageSelector,
  SaveButton,
  TemplateSelector,
} from "@hacado/ui-admin";
import { useConnectedAppSetup } from "../../hooks/use-connected-app-setup";
import { CustomerWaitlistNotificationsApp } from "./app";
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
  const slotOpenedSmsTemplateId = form.watch("slotOpenedSmsTemplateId");

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-4">
            <FormField
              control={form.control}
              name="customerNewEntryTemplateId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("setup.form.customerNewEntryTemplateId.label")}
                    <InfoTooltip>
                      {t("setup.form.customerNewEntryTemplateId.tooltip")}
                    </InfoTooltip>
                  </FormLabel>
                  <FormControl>
                    {isDataLoading ? (
                      <Skeleton className="w-full h-10" />
                    ) : (
                      <TemplateSelector
                        type="email"
                        allowClear
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

            <FormField
              control={form.control}
              name="notifyOnSlotOpened"
              render={({ field }) => (
                <FormItem className="md:col-span-2 flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>
                      {t("setup.form.notifyOnSlotOpened.label")}
                      <InfoTooltip>
                        {t("setup.form.notifyOnSlotOpened.tooltip")}
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

            {notifyOnSlotOpened ? (
              <>
                <FormField
                  control={form.control}
                  name="slotOpenedEmailTemplateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("setup.form.slotOpenedEmailTemplateId.label")}
                        <InfoTooltip>
                          {t("setup.form.slotOpenedEmailTemplateId.tooltip")}
                        </InfoTooltip>
                      </FormLabel>
                      <FormControl>
                        {isDataLoading ? (
                          <Skeleton className="w-full h-10" />
                        ) : (
                          <TemplateSelector
                            type="email"
                            allowClear
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
                <FormField
                  control={form.control}
                  name="slotOpenedSmsTemplateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("setup.form.slotOpenedSmsTemplateId.label")}
                        <InfoTooltip>
                          {t("setup.form.slotOpenedSmsTemplateId.tooltip")}
                        </InfoTooltip>
                      </FormLabel>
                      <FormControl>
                        {isDataLoading ? (
                          <Skeleton className="w-full h-10" />
                        ) : (
                          <TemplateSelector
                            type="text-message"
                            allowClear
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
                <FormField
                  control={form.control}
                  name="leaveWaitlistSmsTemplateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("setup.form.leaveWaitlistSmsTemplateId.label")}
                        <InfoTooltip>
                          {t("setup.form.leaveWaitlistSmsTemplateId.tooltip")}
                        </InfoTooltip>
                      </FormLabel>
                      <FormControl>
                        {isDataLoading ? (
                          <Skeleton className="w-full h-10" />
                        ) : (
                          <TemplateSelector
                            type="text-message"
                            allowClear
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
                <FormField
                  control={form.control}
                  name="bookingPageId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("setup.form.bookingPageId.label")}
                        <InfoTooltip>
                          {t("setup.form.bookingPageId.tooltip")}
                        </InfoTooltip>
                      </FormLabel>
                      <FormControl>
                        {isDataLoading ? (
                          <Skeleton className="w-full h-10" />
                        ) : (
                          <PageSelector
                            disabled={isLoading}
                            value={field.value}
                            allowClear
                            onItemSelect={(value) => field.onChange(value)}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cooldownMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("setup.form.cooldownMinutes.label")}
                        <InfoTooltip>
                          {t("setup.form.cooldownMinutes.tooltip")}
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
                  name="exclusiveAccessMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("setup.form.exclusiveAccessMinutes.label")}
                        <InfoTooltip>
                          {t("setup.form.exclusiveAccessMinutes.tooltip")}
                        </InfoTooltip>
                      </FormLabel>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {slotOpenedSmsTemplateId ? (
                  <FormField
                    control={form.control}
                    name="smsRemoveKeyword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("setup.form.smsRemoveKeyword.label")}
                          <InfoTooltip>
                            {t("setup.form.smsRemoveKeyword.tooltip")}
                          </InfoTooltip>
                        </FormLabel>
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
