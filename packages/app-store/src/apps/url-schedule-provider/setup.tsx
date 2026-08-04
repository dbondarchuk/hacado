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
  Input,
  Spinner,
} from "@timelish/ui";
import {
  ConnectedAppNameAndLogo,
  ConnectedAppStatusMessage,
} from "@timelish/ui-admin";
import React from "react";
import { useFieldArray } from "react-hook-form";
import { useConnectedAppSetup } from "../../hooks/use-connected-app-setup";
import { URL_SCHEDULE_PROVIDER_APP_NAME } from "./const";
import {
  UrlScheduleProviderConfiguration,
  urlScheduleProviderConfigurationSchema,
} from "./models";
import {
  UrlScheduleProviderAdminKeys,
  UrlScheduleProviderAdminNamespace,
  urlScheduleProviderAdminNamespace,
} from "./translations/types";

export const UrlScheduleProviderAppSetup: React.FC<AppSetupProps> = ({
  onSuccess,
  onError,
  appId,
}) => {
  const t = useI18n<
    UrlScheduleProviderAdminNamespace,
    UrlScheduleProviderAdminKeys
  >(urlScheduleProviderAdminNamespace);

  const { appStatus, form, isLoading, isValid, onSubmit } =
    useConnectedAppSetup<UrlScheduleProviderConfiguration>({
      appId,
      appName: URL_SCHEDULE_PROVIDER_APP_NAME,
      schema: urlScheduleProviderConfigurationSchema as any,
      onSuccess,
      onError,
    });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "headers",
  });

  const addHeader = () => {
    append({ key: "", value: "" });
  };

  const removeHeader = (index: number) => {
    remove(index);
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <div className="flex flex-col items-center gap-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>
                    {t("form.url.label")}{" "}
                    <InfoTooltip>{t("form.url.tooltip")}</InfoTooltip>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={t("form.url.placeholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="w-full">
              <FormLabel className="flex items-center gap-2">
                {t("form.headers.label")}{" "}
                <InfoTooltip>{t("form.headers.tooltip")}</InfoTooltip>
              </FormLabel>

              <div className="space-y-3 mt-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <FormField
                        control={form.control}
                        name={`headers.${index}.key`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">
                              {t("form.headers.keyLabel")}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t("form.headers.keyPlaceholder")}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex-1">
                      <FormField
                        control={form.control}
                        name={`headers.${index}.value`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">
                              {t("form.headers.valueLabel")}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t("form.headers.valuePlaceholder")}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="pt-6">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeHeader(index)}
                        disabled={isLoading}
                      >
                        {t("form.headers.removeButton")}
                      </Button>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addHeader}
                  disabled={isLoading}
                  className="w-full"
                >
                  {t("form.headers.addButton")}
                </Button>
              </div>
            </div>

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
                    <ConnectedAppNameAndLogo
                      appName={URL_SCHEDULE_PROVIDER_APP_NAME}
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
