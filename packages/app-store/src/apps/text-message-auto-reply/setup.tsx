"use client";

import { useI18n } from "@hacado/i18n/client";
import { AppSetupProps } from "@hacado/types";
import {
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  Spinner,
  Switch,
} from "@hacado/ui";
import {
  ConnectedAppNameAndLogo,
  ConnectedAppStatusMessage,
} from "@hacado/ui-admin";
import { TextMessageBuilder } from "@hacado/ui-admin-kit";
import React from "react";
import {
  smsPreviewLanguage,
  useSmsPreviewArgs,
} from "../../components/sms-example";
import { useConnectedAppSetup } from "../../hooks/use-connected-app-setup";
import { TextMessageAutoReplyApp } from "./app";
import { getAutoReplySms } from "./messages";
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
  const { appStatus, form, isLoading, isDataLoading, isValid, onSubmit } =
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
  const previewArgs = useSmsPreviewArgs();
  const messageArgs = previewArgs
    ? {
        ...previewArgs,
        reply: {
          from: "+15555550123",
          message: "Can I come earlier?",
        },
      }
    : undefined;

  React.useEffect(() => {
    if (!previewArgs) return;
    if (appId && isDataLoading) return;

    const current = form.getValues("replyText");
    if (typeof current === "string" && current.length > 0) return;

    form.setValue(
      "replyText",
      getAutoReplySms(smsPreviewLanguage(previewArgs)),
      {
        shouldDirty: false,
        shouldValidate: true,
      },
    );
  }, [appId, form, isDataLoading, previewArgs]);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <div className="flex flex-col items-center gap-2">
            <div className="flex w-full flex-col gap-4 rounded-lg border p-4">
              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => {
                  const templateId = form.watch("autoReplyTemplateId");
                  return (
                    <FormItem className="flex flex-row items-start justify-between gap-4">
                      <div className="space-y-2">
                        <FormLabel>{t("form.autoReply.label")}</FormLabel>
                        <FormDescription>
                          {t("form.autoReply.description")}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value ?? Boolean(templateId)}
                          disabled={isLoading}
                          onCheckedChange={(value) => field.onChange(value)}
                        />
                      </FormControl>
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="replyText"
                render={({ field }) => (
                  <TextMessageBuilder args={messageArgs} field={field} />
                )}
              />
            </div>
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
