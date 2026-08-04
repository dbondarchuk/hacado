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
  Spinner,
} from "@timelish/ui";
import {
  ConnectedAppNameAndLogo,
  ConnectedAppStatusMessage,
  TemplateSelector,
} from "@timelish/ui-admin";
import React from "react";
import { useConnectedAppSetup } from "../../hooks/use-connected-app-setup";
import { TextMessageAutoReplyApp } from "./app";
import {
  TextMessageAutoReplyConfiguration,
  textMessageAutoReplyConfigurationSchema,
} from "./models";
import {
  TextMessageAutoReplyAdminKeys,
  TextMessageAutoReplyAdminNamespace,
  textMessageAutoReplyAdminNamespace,
} from "./translations/types";

export const TextMessageAutoReplyAppSetup: React.FC<AppSetupProps> = ({
  onSuccess,

  onError,

  appId,
}) => {
  const { appStatus, form, isLoading, isValid, onSubmit } =
    useConnectedAppSetup<TextMessageAutoReplyConfiguration>({
      appId,
      appName: TextMessageAutoReplyApp.name,
      schema: textMessageAutoReplyConfigurationSchema,
      onSuccess,
      onError,
    });

  const t = useI18n<
    TextMessageAutoReplyAdminNamespace,
    TextMessageAutoReplyAdminKeys
  >(textMessageAutoReplyAdminNamespace);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <div className="flex flex-col items-center gap-2">
            <FormField
              control={form.control}
              name="autoReplyTemplateId"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>
                    {t("form.autoReplyTemplate.label")}
                    <InfoTooltip>
                      {t("form.autoReplyTemplate.tooltip")}
                    </InfoTooltip>
                  </FormLabel>
                  <FormControl>
                    <TemplateSelector
                      type="text-message"
                      disabled={isLoading}
                      value={field.value}
                      onItemSelect={(value) => field.onChange(value)}
                      allowClear
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
                {t.rich("form.connectWith", {
                  app: () => (
                    <ConnectedAppNameAndLogo
                      appName={TextMessageAutoReplyApp.name}
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
