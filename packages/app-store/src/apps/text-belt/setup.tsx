"use client";

import { useI18n } from "@hacado/i18n/client";
import { AppSetupProps } from "@hacado/types/apps";
import {
  ConnectedAppNameAndLogo,
  ConnectedAppStatusMessage,
} from "@hacado/ui-admin/connected-app-properties";
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
import { Input } from "@hacado/ui/input";
import { Spinner } from "@hacado/ui/spinner";
import React from "react";
import { useConnectedAppSetup } from "../../hooks/use-connected-app-setup";
import { TextBeltApp } from "./app";
import { TextBeltConfiguration, textBeltConfigurationSchema } from "./models";
import {
  TextBeltAdminKeys,
  textBeltAdminNamespace,
  TextBeltAdminNamespace,
} from "./translations/types";

export const TextBeltAppSetup: React.FC<AppSetupProps> = ({
  onSuccess,

  onError,

  appId,
}) => {
  const t = useI18n<TextBeltAdminNamespace, TextBeltAdminKeys>(
    textBeltAdminNamespace,
  );
  const { appStatus, form, isLoading, isValid, onSubmit } =
    useConnectedAppSetup<TextBeltConfiguration>({
      appId,
      appName: TextBeltApp.name,
      schema: textBeltConfigurationSchema,
      onSuccess,
      onError,
    });

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <div className="flex flex-col items-center gap-2">
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabelWithRequiredIndicator required>
                    {t("form.apiKey.label")}
                  </FormLabelWithRequiredIndicator>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="off"
                      placeholder={t("form.apiKey.placeholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>{t("form.apiKey.tooltip")}</FormDescription>
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
                {t.rich("form.connect", {
                  app: () => (
                    <ConnectedAppNameAndLogo appName={TextBeltApp.name} />
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
