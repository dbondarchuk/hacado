"use client";

import { useI18n } from "@hacado/i18n/client";
import { AppSetupProps } from "@hacado/types/apps";
import { zEmail } from "@hacado/types/utils";
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
  FormLabel,
  FormMessage,
} from "@hacado/ui/form";
import { Spinner } from "@hacado/ui/spinner";
import { TagInput } from "@hacado/ui/tag-input";
import { canProcessOtherMembersAppointments } from "@hacado/utils";
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
                  <FormLabel>{t("form.email.label")}</FormLabel>
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
                  <FormDescription>{t("form.email.tooltip")}</FormDescription>
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
