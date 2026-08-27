"use client";

import { useI18n } from "@hacado/i18n/client";
import { AppSetupProps } from "@hacado/types";
import {
  BooleanSelect,
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  InfoTooltip,
  Spinner,
  Switch,
} from "@hacado/ui";
import {
  ConnectedAppNameAndLogo,
  ConnectedAppStatusMessage,
} from "@hacado/ui-admin";
import React from "react";
import { useConnectedAppSetup } from "../../hooks/use-connected-app-setup";
import { WaitlistApp } from "./app";
import { WaitlistConfiguration, waitlistConfigurationSchema } from "./models";
import {
  WaitlistAdminKeys,
  WaitlistAdminNamespace,
  waitlistAdminNamespace,
} from "./translations/types";

export const WaitlistAppSetup: React.FC<AppSetupProps> = ({
  onSuccess,
  onError,
  appId: existingAppId,
}) => {
  const { appStatus, form, isLoading, isValid, onSubmit } =
    useConnectedAppSetup<WaitlistConfiguration>({
      appId: existingAppId,
      appName: WaitlistApp.name,
      schema: waitlistConfigurationSchema,
      onSuccess,
      onError,
      initialData: {
        notifyMemberOnNewEntry: true,
        notifyCoordinatorsOnNewEntry: false,
      },
      processDataForSubmit: (data) => ({
        type: "set-configuration",
        configuration: data,
      }),
    });

  const t = useI18n<WaitlistAdminNamespace, WaitlistAdminKeys>(
    waitlistAdminNamespace,
  );

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <div className="flex flex-col items-center gap-4 w-full">
            <FormField
              control={form.control}
              name="notifyMemberOnNewEntry"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 w-full">
                  <div className="space-y-0.5">
                    <FormLabel>
                      {t("setup.form.notifyMemberOnNewEntry.label")}
                    </FormLabel>
                    <FormDescription>
                      {t("setup.form.notifyMemberOnNewEntry.description")}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notifyCoordinatorsOnNewEntry"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 w-full">
                  <div className="space-y-0.5">
                    <FormLabel>
                      {t("setup.form.notifyCoordinatorsOnNewEntry.label")}
                    </FormLabel>
                    <FormDescription>
                      {t("setup.form.notifyCoordinatorsOnNewEntry.description")}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dontDismissWaitlistOnAppointmentCreate"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>
                    {t(
                      "setup.form.dontDismissWaitlistOnAppointmentCreate.label",
                    )}
                    <InfoTooltip>
                      {t(
                        "setup.form.dontDismissWaitlistOnAppointmentCreate.tooltip",
                      )}
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
            <Button
              type="submit"
              variant="default"
              disabled={isLoading || !isValid}
              className="inline-flex gap-2 items-center w-full"
            >
              {isLoading && <Spinner />}
              <span className="inline-flex gap-2 items-center">
                {t.rich("setup.update", {
                  app: () => (
                    <ConnectedAppNameAndLogo
                      appName={WaitlistApp.name}
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
