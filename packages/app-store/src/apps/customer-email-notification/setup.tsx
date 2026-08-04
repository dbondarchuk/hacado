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
import {
  ConnectedAppStatusMessage,
  SaveButton,
  TemplateSelector,
} from "@timelish/ui-admin";
import { useConnectedAppSetup } from "../../hooks/use-connected-app-setup";
import { CustomerEmailNotificationApp } from "./app";
import {
  CustomerEmailNotificationConfiguration,
  customerEmailNotificationConfigurationSchema,
} from "./models";
import {
  CustomerEmailNotificationAdminKeys,
  CustomerEmailNotificationAdminNamespace,
  customerEmailNotificationAdminNamespace,
} from "./translations/types";

export const CustomerEmailNotificationAppSetup: React.FC<{ appId: string }> = ({
  appId,
}) => {
  const { appStatus, form, isLoading, isDataLoading, isValid, onSubmit } =
    useConnectedAppSetup<CustomerEmailNotificationConfiguration>({
      appId,
      appName: CustomerEmailNotificationApp.name,
      schema: customerEmailNotificationConfigurationSchema,
    });

  const t = useI18n<
    CustomerEmailNotificationAdminNamespace,
    CustomerEmailNotificationAdminKeys
  >(customerEmailNotificationAdminNamespace);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4">
            <FormField
              control={form.control}
              name={`templates.pending.templateId`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("form.pending.templateId.label")}
                    <InfoTooltip>
                      {t("form.pending.templateId.description")}
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
            <FormField
              control={form.control}
              name={`templates.confirmed.templateId`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("form.confirmed.templateId.label")}
                    <InfoTooltip>
                      {t("form.confirmed.templateId.description")}
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
            <FormField
              control={form.control}
              name={`templates.declined.templateId`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("form.declined.templateId.label")}
                    <InfoTooltip>
                      {t("form.declined.templateId.description")}
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
            <FormField
              control={form.control}
              name={`templates.rescheduled.templateId`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("form.rescheduled.templateId.label")}
                    <InfoTooltip>
                      {t("form.rescheduled.templateId.description")}
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
            <FormField
              control={form.control}
              name={`event.templateId`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("form.calendarEventTemplate.templateId.label")}
                    <InfoTooltip>
                      {t("form.calendarEventTemplate.templateId.description")}
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
