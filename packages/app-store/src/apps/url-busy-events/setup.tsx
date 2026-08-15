"use client";

import { useI18n } from "@hacado/i18n/client";
import { I18nRichText } from "@hacado/i18n/components";
import { AppSetupProps } from "@hacado/types";
import {
  Button,
  Form,
  FormControl,
  FormDescription,
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
import { X } from "lucide-react";
import React from "react";
import { useFieldArray } from "react-hook-form";
import { useConnectedAppSetup } from "../../hooks/use-connected-app-setup";
import { UrlBusyEventsApp } from "./app";
import {
  UrlBusyEventsConfiguration,
  urlBusyEventsConfigurationSchema,
} from "./models";
import {
  UrlBusyEventsAdminKeys,
  UrlBusyEventsAdminNamespace,
  urlBusyEventsAdminNamespace,
} from "./translations/types";

export const UrlBusyEventsAppSetup: React.FC<AppSetupProps> = ({
  onSuccess,
  onError,
  appId,
}) => {
  const t = useI18n<UrlBusyEventsAdminNamespace, UrlBusyEventsAdminKeys>(
    urlBusyEventsAdminNamespace,
  );

  const { appStatus, form, isLoading, isValid, onSubmit } =
    useConnectedAppSetup<UrlBusyEventsConfiguration>({
      appId,
      appName: UrlBusyEventsApp.name,
      schema: urlBusyEventsConfigurationSchema,
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
                    <InfoTooltip>
                      <I18nRichText
                        text="form.url.tooltip"
                        namespace={urlBusyEventsAdminNamespace}
                      />
                    </InfoTooltip>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={t("form.url.placeholder")} {...field} />
                  </FormControl>
                  <FormDescription>
                    <I18nRichText
                      text="form.url.description"
                      namespace={urlBusyEventsAdminNamespace}
                    />
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="w-full space-y-2">
              <FormLabel className="flex items-center gap-2">
                {t("form.headers.label")}{" "}
                <InfoTooltip>
                  <I18nRichText
                    text="form.headers.tooltip"
                    namespace={urlBusyEventsAdminNamespace}
                  />
                </InfoTooltip>
              </FormLabel>
              <FormDescription>
                <I18nRichText
                  text="form.headers.description"
                  namespace={urlBusyEventsAdminNamespace}
                />
              </FormDescription>

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
                    <Button
                      type="button"
                      variant="ghost"
                      className="mt-9"
                      size="xs"
                      onClick={() => removeHeader(index)}
                      disabled={isLoading}
                    >
                      <X />
                    </Button>
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
                    <ConnectedAppNameAndLogo appName={UrlBusyEventsApp.name} />
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
