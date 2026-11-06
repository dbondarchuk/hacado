"use client";

import { useI18n } from "@hacado/i18n/client";
import { AppSetupProps } from "@hacado/types/apps";
import {
  ConnectedAppNameAndLogo,
  ConnectedAppStatusMessage,
} from "@hacado/ui-admin/connected-app-properties";
import { useAuth } from "@hacado/ui-admin/context";
import { MemberSelector } from "@hacado/ui-admin/member-selector";
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
import { subscriptionAllowsMultipleUsers } from "@hacado/utils/permissions";
import React from "react";
import { useConnectedAppSetup } from "../../hooks/use-connected-app-setup";
import { TextMessageForwardingApp } from "./app";
import {
  TextMessageForwardingConfiguration,
  textMessageForwardingConfigurationSchema,
} from "./models";
import {
  TextMessageForwardingAdminKeys,
  TextMessageForwardingAdminNamespace,
  textMessageForwardingAdminNamespace,
} from "./translations/types";

export const TextMessageForwardingAppSetup: React.FC<AppSetupProps> = ({
  onSuccess,
  onError,
  appId,
}) => {
  const { user } = useAuth();
  const allowsMultipleUsers = subscriptionAllowsMultipleUsers(
    user?.availableUsers,
    user?.feesExempt,
  );

  const { appStatus, form, isLoading, isValid, onSubmit } =
    useConnectedAppSetup<TextMessageForwardingConfiguration>({
      appId,
      appName: TextMessageForwardingApp.name,
      schema: textMessageForwardingConfigurationSchema,
      onSuccess,
      onError,
    });

  const t = useI18n<
    TextMessageForwardingAdminNamespace,
    TextMessageForwardingAdminKeys
  >(textMessageForwardingAdminNamespace);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <div className="flex flex-col items-center gap-2">
            {allowsMultipleUsers && (
              <FormField
                control={form.control}
                name="defaultMemberId"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>{t("form.defaultMemberId.label")}</FormLabel>
                    <FormControl>
                      <MemberSelector
                        value={field.value}
                        disabled={isLoading}
                        allowClear
                        placeholder={t("form.defaultMemberId.placeholder")}
                        onItemSelect={(value) => {
                          field.onChange(value);
                          field.onBlur();
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("form.defaultMemberId.tooltip")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
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
                      appName={TextMessageForwardingApp.name}
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
