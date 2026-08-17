"use client";

import { useI18n } from "@hacado/i18n/client";
import { AppSetupProps } from "@hacado/types";
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
} from "@hacado/ui";
import {
  ConnectedAppNameAndLogo,
  ConnectedAppStatusMessage,
  MemberSelector,
  useAuth,
} from "@hacado/ui-admin";
import { subscriptionAllowsMultipleUsers } from "@hacado/utils";
import React from "react";
import { useConnectedAppSetup } from "../../hooks/use-connected-app-setup";
import { TextMessageResenderApp } from "./app";
import {
  TextMessageResenderConfiguration,
  textMessageResenderConfigurationSchema,
} from "./models";
import {
  TextMessageResenderAdminKeys,
  TextMessageResenderAdminNamespace,
  textMessageResenderAdminNamespace,
} from "./translations/types";

export const TextMessageResenderAppSetup: React.FC<AppSetupProps> = ({
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
    useConnectedAppSetup<TextMessageResenderConfiguration>({
      appId,
      appName: TextMessageResenderApp.name,
      schema: textMessageResenderConfigurationSchema,
      onSuccess,
      onError,
    });

  const t = useI18n<
    TextMessageResenderAdminNamespace,
    TextMessageResenderAdminKeys
  >(textMessageResenderAdminNamespace);

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
                    <FormLabel>
                      {t("form.defaultMemberId.label")}
                      <InfoTooltip>
                        {t("form.defaultMemberId.tooltip")}
                      </InfoTooltip>
                    </FormLabel>
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
                      appName={TextMessageResenderApp.name}
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
