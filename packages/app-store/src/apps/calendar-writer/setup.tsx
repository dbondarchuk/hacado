"use client";

import { useI18n } from "@hacado/i18n/client";
import { AppSetupProps } from "@hacado/types/apps";
import { AppSelector } from "@hacado/ui-admin/app-selector";
import {
  ConnectedAppNameAndLogo,
  ConnectedAppStatusMessage,
} from "@hacado/ui-admin/connected-app-properties";
import { useAuth } from "@hacado/ui-admin/context";
import { Button } from "@hacado/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabelWithRequiredIndicator,
  FormMessage,
} from "@hacado/ui/form";
import { Spinner } from "@hacado/ui/spinner";
import { canProcessOtherMembersAppointments } from "@hacado/utils/permissions";
import React from "react";
import { ProcessOtherMembersAppointmentsField } from "../../components/process-other-members-appointments-field";
import { useConnectedAppSetup } from "../../hooks/use-connected-app-setup";
import { CalendarWriterApp } from "./app";
import {
  CalendarWriterConfiguration,
  calendarWriterConfigurationSchema,
} from "./models";
import {
  CalendarWriterAdminKeys,
  calendarWriterAdminNamespace,
  CalendarWriterAdminNamespace,
} from "./translations/types";

export const CalendarWriterAppSetup: React.FC<AppSetupProps> = ({
  onSuccess,
  onError,
  appId: existingAppId,
}) => {
  const { user } = useAuth();
  const canProcessOthers = canProcessOtherMembersAppointments(user);
  const { appStatus, form, isLoading, isValid, onSubmit } =
    useConnectedAppSetup<CalendarWriterConfiguration>({
      appId: existingAppId,
      appName: CalendarWriterApp.name,
      schema: calendarWriterConfigurationSchema,
      onSuccess,
      onError,
    });

  const t = useI18n<CalendarWriterAdminNamespace, CalendarWriterAdminKeys>(
    calendarWriterAdminNamespace,
  );

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <div className="flex flex-col items-center gap-4 w-full">
            <FormField
              control={form.control}
              name="appId"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabelWithRequiredIndicator required>
                    {t("form.calendarStorage.label")}
                  </FormLabelWithRequiredIndicator>
                  <FormControl>
                    <AppSelector
                      disabled={isLoading}
                      className="w-full"
                      scope="calendar-write"
                      value={field.value}
                      onItemSelect={(value) => {
                        field.onChange(value);
                        field.onBlur();
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("form.calendarStorage.tooltip")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {canProcessOthers && (
              <ProcessOtherMembersAppointmentsField
                control={form.control}
                label={t("form.processOtherMembersAppointments.label")}
                description={t(
                  "form.processOtherMembersAppointments.description",
                )}
                isLoading={isLoading}
              />
            )}
            <Button
              type="submit"
              variant="default"
              disabled={isLoading || !isValid}
              className="inline-flex gap-2 items-center w-full"
            >
              {isLoading && <Spinner />}
              <span className="inline-flex gap-2 items-center">
                {t.rich(existingAppId ? "form.update" : "form.add", {
                  app: () => (
                    <ConnectedAppNameAndLogo appName={CalendarWriterApp.name} />
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
