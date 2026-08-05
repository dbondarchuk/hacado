"use client";

import { useI18n } from "@hacado/i18n/client";
import { AppSetupProps } from "@hacado/types";
import {
  BooleanSelect,
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  InfoTooltip,
  Input,
  Spinner,
} from "@hacado/ui";
import {
  ConnectedAppNameAndLogo,
  ConnectedAppStatusMessage,
  TemplateSelector,
} from "@hacado/ui-admin";
import React from "react";
import { useConnectedAppSetup } from "../../hooks/use-connected-app-setup";
import { WaitlistNotificationsApp } from "./app";
import {
  WaitlistNotificationsConfiguration,
  waitlistNotificationsConfigurationSchema,
} from "./models";
import {
  WaitlistNotificationsAdminKeys,
  WaitlistNotificationsAdminNamespace,
  waitlistNotificationsAdminNamespace,
} from "./translations/types";

export const WaitlistNotificationsAppSetup: React.FC<AppSetupProps> = ({
  onSuccess,
  onError,
  appId: existingAppId,
}) => {
  const { appStatus, form, isLoading, isValid, onSubmit } =
    useConnectedAppSetup<WaitlistNotificationsConfiguration>({
      appId: existingAppId,
      appName: WaitlistNotificationsApp.name,
      schema: waitlistNotificationsConfigurationSchema,
      onSuccess,
      onError,
    });

  const t = useI18n<
    WaitlistNotificationsAdminNamespace,
    WaitlistNotificationsAdminKeys
  >(waitlistNotificationsAdminNamespace);
  const enableCustomerNotification = form.watch("notifyCustomerOnNewEntry");
  const enableNewEntryNotification = form.watch("notifyOnNewEntry");

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <div className="flex flex-col items-center gap-4 w-full">
            <FormField
              control={form.control}
              name="notifyOnNewEntry"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>
                    {t("setup.form.notifyOnNewEntry.label")}
                    <InfoTooltip>
                      {t("setup.form.notifyOnNewEntry.tooltip")}
                    </InfoTooltip>
                  </FormLabel>
                  <FormControl>
                    <BooleanSelect
                      disabled={isLoading}
                      value={field.value}
                      onValueChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {enableNewEntryNotification && (
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>
                      {t("setup.form.email.label")}
                      <InfoTooltip>{t("setup.form.email.tooltip")}</InfoTooltip>
                    </FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        type="email"
                        placeholder={t("setup.form.email.placeholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="notifyCustomerOnNewEntry"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>
                    {t("setup.form.notifyCustomerOnNewEntry.label")}
                    <InfoTooltip>
                      {t("setup.form.notifyCustomerOnNewEntry.tooltip")}
                    </InfoTooltip>
                  </FormLabel>
                  <FormControl>
                    <BooleanSelect
                      disabled={isLoading}
                      value={field.value}
                      onValueChange={(val) => {
                        field.onChange(val);
                        field.onBlur();

                        form.trigger("customerNewEntryTemplateId");
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {enableCustomerNotification && (
              <>
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
                          disabled={isLoading}
                          value={field.value}
                          onItemSelect={(value) => {
                            field.onChange(value);
                            field.onBlur();
                            form.trigger("notifyCustomerOnNewEntry");
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
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
                      appName={WaitlistNotificationsApp.name}
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
