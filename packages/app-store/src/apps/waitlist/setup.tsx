"use client";

import { useI18n } from "@timelish/i18n/client";
import { AppSetupProps } from "@timelish/types";
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
  Spinner,
} from "@timelish/ui";
import {
  ConnectedAppNameAndLogo,
  ConnectedAppStatusMessage,
} from "@timelish/ui-admin";
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
      initialData: {},
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
