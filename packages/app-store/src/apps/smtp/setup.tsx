"use client";

import { useI18n } from "@timelish/i18n/client";
import {
  AutoSkeleton,
  BooleanSelect,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  InfoTooltip,
  Input,
} from "@timelish/ui";
import { ConnectedAppStatusMessage, SaveButton } from "@timelish/ui-admin";
import React from "react";
import { useConnectedAppSetup } from "../../hooks/use-connected-app-setup";
import { SmtpApp } from "./app";
import { SmtpConfiguration, smtpConfigurationSchema } from "./models";
import {
  SmtpAdminKeys,
  SmtpAdminNamespace,
  smtpAdminNamespace,
} from "./translations/types";

export const SmtpAppSetup: React.FC<{ appId: string }> = ({ appId }) => {
  const t = useI18n<SmtpAdminNamespace, SmtpAdminKeys>(smtpAdminNamespace);

  const { appStatus, form, isLoading, isDataLoading, isValid, onSubmit } =
    useConnectedAppSetup<SmtpConfiguration>({
      appId,
      appName: SmtpApp.name,
      schema: smtpConfigurationSchema,
    });

  return (
    <AutoSkeleton loading={isDataLoading}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <div className="flex flex-col items-center gap-4">
            <div className="w-full gap-2 flex flex-col md:grid md:grid-cols-2 md:gap-4">
              <FormField
                control={form.control}
                name="host"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.host.label")}</FormLabel>
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
                  <FormItem>
                    <FormLabel>{t("form.port.label")}</FormLabel>
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
                  <FormItem>
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
                  <FormItem>
                    <FormLabel>
                      <span>{t("form.email.label")}</span>{" "}
                      <InfoTooltip>{t("form.email.tooltip")}</InfoTooltip>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t("form.email.placeholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="auth.user"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <span>{t("form.authUser.label")}</span>
                      <InfoTooltip>{t("form.authUser.tooltip")}</InfoTooltip>
                    </FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="new-password"
                        placeholder={t("form.authUser.placeholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="auth.pass"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <span>{t("form.authPass.label")}</span>
                      <InfoTooltip>{t("form.authPass.tooltip")}</InfoTooltip>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <SaveButton
              form={form}
              disabled={isLoading}
              isLoading={isLoading}
            />
          </div>
        </form>
      </Form>
      {appStatus && (
        <ConnectedAppStatusMessage
          status={appStatus.status}
          statusText={appStatus.statusText}
        />
      )}
    </AutoSkeleton>
  );
};
