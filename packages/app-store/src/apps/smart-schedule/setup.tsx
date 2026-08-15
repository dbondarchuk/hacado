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
  Spinner,
} from "@hacado/ui";
import {
  ConnectedAppNameAndLogo,
  ConnectedAppStatusMessage,
  OptionSelector,
} from "@hacado/ui-admin";
import React from "react";
import { useConnectedAppSetup } from "../../hooks/use-connected-app-setup";
import { SmartScheduleApp } from "./app";
import {
  SmartScheduleConfiguration,
  smartScheduleConfigurationSchema,
} from "./models";
import {
  SmartScheduleAdminKeys,
  smartScheduleAdminNamespace,
  SmartScheduleAdminNamespace,
} from "./translations/types";

export const SmartScheduleAppSetup: React.FC<AppSetupProps> = ({
  onSuccess,
  onError,
  appId: existingAppId,
}) => {
  const t = useI18n<SmartScheduleAdminNamespace, SmartScheduleAdminKeys>(
    smartScheduleAdminNamespace,
  );
  const { appStatus, form, isLoading, isValid, onSubmit } =
    useConnectedAppSetup<SmartScheduleConfiguration>({
      appId: existingAppId,
      appName: SmartScheduleApp.name,
      schema: smartScheduleConfigurationSchema,
      onSuccess,
      onError,
    });

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <div className="flex flex-col items-center gap-4 w-full">
            {/* <div className="gap-2 flex flex-col md:grid md:grid-cols-2 md:gap-4 w-full"> */}
            <FormField
              control={form.control}
              name="allowSkipBreak"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>
                    {t("form.allowSkipBreak")}{" "}
                    <InfoTooltip>{t("form.allowSkipBreakTooltip")}</InfoTooltip>
                  </FormLabel>
                  <FormControl>
                    <BooleanSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="preferBackToBack"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>
                    {t("form.preferBackToBack")}{" "}
                    <InfoTooltip>
                      {t("form.preferBackToBackTooltip")}
                    </InfoTooltip>
                  </FormLabel>
                  <FormControl>
                    <BooleanSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="preferLaterStartsEarlierEnds"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>
                    {t("form.preferLaterStartsEarlierEnds")}{" "}
                    <InfoTooltip>
                      {t("form.preferLaterStartsEarlierEndsTooltip")}
                    </InfoTooltip>
                  </FormLabel>
                  <FormControl>
                    <BooleanSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="allowSmartSlotStarts"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>
                    {t("form.allowSmartSlotStarts")}{" "}
                    <InfoTooltip>
                      {t("form.allowSmartSlotStartsTooltip")}
                    </InfoTooltip>
                  </FormLabel>
                  <FormControl>
                    <BooleanSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maximizeForOption"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>
                    {t("form.preferredService")}{" "}
                    <InfoTooltip>
                      {t("form.preferredServiceTooltip")}
                    </InfoTooltip>
                  </FormLabel>
                  <FormControl>
                    <OptionSelector
                      allowClear
                      disabled={isLoading}
                      className="flex w-full font-normal text-base"
                      value={field.value}
                      onItemSelect={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              disabled={isLoading || !isValid}
              type="submit"
              variant="default"
              className="inline-flex gap-2 items-center w-full"
            >
              {isLoading && <Spinner />}
              <span className="inline-flex gap-2 items-center">
                {t.rich(existingAppId ? "form.update" : "form.add", {
                  app: () => (
                    <ConnectedAppNameAndLogo appName={SmartScheduleApp.name} />
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
