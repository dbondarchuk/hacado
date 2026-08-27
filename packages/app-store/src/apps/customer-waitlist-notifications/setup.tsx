"use client";

import { useI18n } from "@hacado/i18n/client";
import { AppSetupProps } from "@hacado/types";
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  InfoTooltip,
  Spinner,
} from "@hacado/ui";
import {
  ConnectedAppNameAndLogo,
  ConnectedAppStatusMessage,
  TemplateSelector,
} from "@hacado/ui-admin";
import React from "react";
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

export const CustomerWaitlistNotificationsAppSetup: React.FC<AppSetupProps> = ({
  onSuccess,
  onError,
  appId: existingAppId,
}) => {
  const { appStatus, form, isLoading, isValid, onSubmit } =
    useConnectedAppSetup<CustomerWaitlistNotificationsConfiguration>({
      appId: existingAppId,
      appName: CustomerWaitlistNotificationsApp.name,
      schema: customerWaitlistNotificationsConfigurationSchema,
      onSuccess,
      onError,
    });

  const t = useI18n<
    CustomerWaitlistNotificationsAdminNamespace,
    CustomerWaitlistNotificationsAdminKeys
  >(customerWaitlistNotificationsAdminNamespace);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <div className="flex flex-col items-center gap-4 w-full">
            <FormField
              control={form.control}
              name="customerNewEntryTemplateId"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>
                    {t("setup.form.customerNewEntryTemplateId.label")}
                    <InfoTooltip>
                      {t("setup.form.customerNewEntryTemplateId.tooltip")}
                    </InfoTooltip>
                  </FormLabel>
                  <FormControl>
                    <TemplateSelector
                      type="email"
                      allowClear
                      disabled={isLoading}
                      value={field.value}
                      onItemSelect={(value) => {
                        field.onChange(value);
                        field.onBlur();
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              variant="default"
              disabled={isLoading || !isValid}
              className="inline-flex gap-2 items-center w-full"
            >
              {isLoading && <Spinner />}
              <span className="inline-flex gap-2 items-center">
                {t.rich(existingAppId ? "setup.update" : "setup.add", {
                  app: () => (
                    <ConnectedAppNameAndLogo
                      appName={CustomerWaitlistNotificationsApp.name}
                      logoClassName="w-4 h-4"
                    />
                  ),
                })}
              </span>
            </Button>
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
