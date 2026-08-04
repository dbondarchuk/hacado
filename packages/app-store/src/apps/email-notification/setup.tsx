"use client";

import { useI18n } from "@timelish/i18n/client";
import { AppSetupProps, zEmail } from "@timelish/types";
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
  TagInput,
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
import { EmailNotificationApp } from "./app";
import {
  EmailNotificationConfiguration,
  emailNotificationConfigurationSchema,
} from "./models";
import {
  EmailNotificationAdminKeys,
  EmailNotificationAdminNamespace,
  emailNotificationAdminNamespace,
} from "./translations/types";

export const EmailNotificationAppSetup: React.FC<AppSetupProps> = ({
  onSuccess,
  onError,
  appId: existingAppId,
}) => {
  const { user } = useAuth();
  const canProcessOthers = canProcessOtherMembersAppointments(user);
  const { appStatus, form, isLoading, isValid, onSubmit } =
    useConnectedAppSetup<EmailNotificationConfiguration>({
      appId: existingAppId,
      appName: EmailNotificationApp.name,
      schema: emailNotificationConfigurationSchema,
      onSuccess,
      onError,
    });

  const t = useI18n<
    EmailNotificationAdminNamespace,
    EmailNotificationAdminKeys
  >(emailNotificationAdminNamespace);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <div className="flex flex-col items-center gap-4 w-full">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>
                    {t("form.email.label")}
                    <InfoTooltip>{t("form.email.tooltip")}</InfoTooltip>
                  </FormLabel>
                  <FormControl>
                    <TagInput
                      {...field}
                      value={
                        field.value && !Array.isArray(field.value)
                          ? [field.value]
                          : (field.value as readonly string[])
                      }
                      disabled={isLoading}
                      placeholder={t("form.email.placeholder")}
                      tagValidator={zEmail}
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
                      appName={EmailNotificationApp.name}
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
