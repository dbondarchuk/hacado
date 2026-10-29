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
  Spinner,
} from "@hacado/ui";
import {
  ConnectedAppNameAndLogo,
  ConnectedAppStatusMessage,
  OptionSelector,
  SwitchCardFormItem,
} from "@hacado/ui-admin";
import React from "react";
import { useConnectedAppSetup } from "../../hooks/use-connected-app-setup";
import { SmartScheduleApp } from "./app";
import {
  SmartScheduleConfiguration,
  SmartScheduleSetupConfiguration,
  smartScheduleSetupSchema,
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
    useConnectedAppSetup<SmartScheduleSetupConfiguration>({
      appId: existingAppId,
      appName: SmartScheduleApp.name,
      schema: smartScheduleSetupSchema,
      onSuccess,
      onError,
      processDataForSubmit: ({
        maximizeForService,
        maximizeForOption,
        ...configuration
      }): SmartScheduleConfiguration => ({
        ...configuration,
        maximizeForOption:
          maximizeForService === false
            ? undefined
            : maximizeForOption || undefined,
      }),
    });

  const maximizeForOption = form.watch("maximizeForOption");

  React.useEffect(() => {
    if (!maximizeForOption || form.getValues("maximizeForService")) {
      return;
    }

    form.setValue("maximizeForService", true);
  }, [form, maximizeForOption]);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <div className="flex flex-col items-center gap-4 w-full">
            <FormField
              control={form.control}
              name="allowSkipBreak"
              render={({ field }) => (
                <SwitchCardFormItem
                  label={t("form.allowSkipBreak")}
                  description={t("form.allowSkipBreakTooltip")}
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              )}
            />
            <FormField
              control={form.control}
              name="preferBackToBack"
              render={({ field }) => (
                <SwitchCardFormItem
                  label={t("form.preferBackToBack")}
                  description={t("form.preferBackToBackTooltip")}
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              )}
            />
            <FormField
              control={form.control}
              name="preferLaterStartsEarlierEnds"
              render={({ field }) => (
                <SwitchCardFormItem
                  label={t("form.preferLaterStartsEarlierEnds")}
                  description={t("form.preferLaterStartsEarlierEndsTooltip")}
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              )}
            />
            <FormField
              control={form.control}
              name="allowSmartSlotStarts"
              render={({ field }) => (
                <SwitchCardFormItem
                  label={t("form.allowSmartSlotStarts")}
                  description={t("form.allowSmartSlotStartsTooltip")}
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              )}
            />
            <FormField
              control={form.control}
              name="maximizeForService"
              render={({ field }) => (
                <SwitchCardFormItem
                  label={t("form.maximizeForService")}
                  description={t("form.maximizeForServiceTooltip")}
                  checked={field.value ?? false}
                  disabled={isLoading}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);

                    if (!checked) {
                      form.setValue("maximizeForOption", "", {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    } else {
                      void form.trigger("maximizeForOption");
                    }
                  }}
                >
                  {field.value && (
                    <FormField
                      control={form.control}
                      name="maximizeForOption"
                      render={({ field: optionField }) => (
                        <FormItem className="w-full">
                          <FormLabel>{t("form.preferredService")}</FormLabel>
                          <FormControl>
                            <OptionSelector
                              disabled={isLoading}
                              className="flex w-full font-normal text-base"
                              value={optionField.value}
                              onItemSelect={optionField.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </SwitchCardFormItem>
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
