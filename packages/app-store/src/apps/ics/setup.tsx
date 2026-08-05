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
  Input,
  Spinner,
} from "@hacado/ui";
import {
  ConnectedAppNameAndLogo,
  ConnectedAppStatusMessage,
} from "@hacado/ui-admin";
import React from "react";
import { useConnectedAppSetup } from "../../hooks/use-connected-app-setup";
import { IcsApp } from "./app";
import { IcsLinkCalendarSource, icsLinkCalendarSourceSchema } from "./models";
import {
  IcsAdminKeys,
  IcsAdminNamespace,
  icsAdminNamespace,
} from "./translations/types";

export const IcsAppSetup: React.FC<AppSetupProps> = ({
  onSuccess,
  onError,
  appId: existingAppId,
}) => {
  const t = useI18n<IcsAdminNamespace, IcsAdminKeys>(icsAdminNamespace);
  const { appStatus, form, isLoading, isValid, onSubmit } =
    useConnectedAppSetup<IcsLinkCalendarSource>({
      appId: existingAppId,
      appName: IcsApp.name,
      schema: icsLinkCalendarSourceSchema,
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
              name="link"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>
                    {t("form.link.label")}{" "}
                    <InfoTooltip>{t("form.link.tooltip")}</InfoTooltip>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("form.link.placeholder")}
                      {...field}
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
              <span>{t("form.connect")}</span>
              <ConnectedAppNameAndLogo appName={IcsApp.name} />
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
