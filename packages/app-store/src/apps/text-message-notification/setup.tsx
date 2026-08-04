"use client";

import { useI18n } from "@timelish/i18n/client";
import { AppSetupProps } from "@timelish/types";
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  InfoTooltip,
  PhoneInput,
  Spinner,
} from "@timelish/ui";
import {
  ConnectedAppNameAndLogo,
  ConnectedAppStatusMessage,
  useAuth,
} from "@timelish/ui-admin";
import { canProcessOtherMembersAppointments } from "@timelish/utils";
import React from "react";
import { ProcessOtherMembersAppointmentsField } from "../../components/process-other-members-appointments-field";
import { useConnectedAppSetup } from "../../hooks/use-connected-app-setup";
import { TextMessageNotificationApp } from "./app";
import {
  TextMessageNotificationConfiguration,
  textMessageNotificationConfigurationSchema,
} from "./models";
import {
  TextMessageNotificationAdminKeys,
  textMessageNotificationAdminNamespace,
  TextMessageNotificationAdminNamespace,
} from "./translations/types";

export const TextMessageNotificationAppSetup: React.FC<AppSetupProps> = ({
  onSuccess,
  onError,
  appId: existingAppId,
}) => {
  const { user } = useAuth();
  const canProcessOthers = canProcessOtherMembersAppointments(user);
  const { appStatus, form, isLoading, isValid, onSubmit } =
    useConnectedAppSetup<TextMessageNotificationConfiguration>({
      appId: existingAppId,
      appName: TextMessageNotificationApp.name,
      schema: textMessageNotificationConfigurationSchema,
      onSuccess,
      onError,
    });

  const t = useI18n<
    TextMessageNotificationAdminNamespace,
    TextMessageNotificationAdminKeys
  >(textMessageNotificationAdminNamespace);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <div className="flex flex-col items-center gap-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>
                    {t("form.phone.label")}
                    <InfoTooltip>{t("form.phone.tooltip")}</InfoTooltip>
                  </FormLabel>
                  <FormControl>
                    <PhoneInput
                      {...field}
                      label={t("form.phone.placeholder")}
                    />
                  </FormControl>
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
                    <ConnectedAppNameAndLogo
                      appName={TextMessageNotificationApp.name}
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
