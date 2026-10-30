"use client";

import { useI18n } from "@hacado/i18n/client";
import { AppSetupProps } from "@hacado/types/apps";
import {
  BooleanSelect,
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormLabelWithRequiredIndicator,
  FormMessage,
  Input,
  Spinner,
} from "@hacado/ui";
import {
  ConnectedAppNameAndLogo,
  ConnectedAppStatusMessage,
} from "@hacado/ui-admin";
import React from "react";
import { useConnectedAppSetup } from "../../hooks/use-connected-app-setup";
import { SmtpApp } from "./app";
import { SmtpConfiguration, smtpConfigurationSchema } from "./models";
import {
  SmtpAdminKeys,
  SmtpAdminNamespace,
  smtpAdminNamespace,
} from "./translations/types";

export const SmtpAppSetup: React.FC<AppSetupProps> = ({
  onSuccess,
  onError,
  appId: existingAppId,
}) => {
  const t = useI18n<SmtpAdminNamespace, SmtpAdminKeys>(smtpAdminNamespace);
  const { appStatus, form, isLoading, isValid, onSubmit } =
    useConnectedAppSetup<SmtpConfiguration>({
      appId: existingAppId,
      appName: SmtpApp.name,
      schema: smtpConfigurationSchema,
      onSuccess,
      onError,
    });

  React.useEffect(() => {
    if (existingAppId) {
      return;
    }

    form.setValue("secure", false, { shouldValidate: true });
  }, [existingAppId, form]);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <div className="flex flex-col items-center gap-4">
            <FormField
              control={form.control}
              name="host"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabelWithRequiredIndicator required>
                    {t("form.host.label")}
                  </FormLabelWithRequiredIndicator>
                  <FormControl>
                    <Input
                      placeholder={t("form.host.placeholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="port"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabelWithRequiredIndicator required>
                    {t("form.port.label")}
                  </FormLabelWithRequiredIndicator>
                  <FormControl>
                    <Input
                      placeholder={t("form.port.placeholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="secure"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>{t("form.secure.label")}</FormLabel>
                  <FormControl>
                    <BooleanSelect
                      className="w-full"
                      {...field}
                      value={field.value ?? false}
                      trueLabel={t("form.secure.yes")}
                      falseLabel={t("form.secure.no")}
                      onValueChange={(e) => {
                        field.onChange(e);
                        field.onBlur();
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabelWithRequiredIndicator required>
                    {t("form.email.label")}
                  </FormLabelWithRequiredIndicator>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t("form.email.placeholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>{t("form.email.tooltip")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="auth.user"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>{t("form.authUser.label")}</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="new-password"
                      placeholder={t("form.authUser.placeholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("form.authUser.tooltip")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="auth.pass"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>{t("form.authPass.label")}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("form.authPass.tooltip")}
                  </FormDescription>
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
                {t.rich(existingAppId ? "form.update" : "form.connect", {
                  app: () => <ConnectedAppNameAndLogo appName={SmtpApp.name} />,
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
