"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { AppSetupProps } from "@hacado/types";
import {
  Badge,
  Button,
  Combobox,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  InfoTooltip,
  Input,
  Spinner,
  TooltipResponsive,
  TooltipResponsiveContent,
  TooltipResponsiveTrigger,
} from "@hacado/ui";
import {
  ConnectedAppNameAndLogo,
  ConnectedAppStatusMessage,
} from "@hacado/ui-admin";
import { X } from "lucide-react";
import React, { useEffect, useState } from "react";
import * as z from "zod";
import { useConnectedAppSetup } from "../../hooks/use-connected-app-setup";
import { webhooksApp } from "./app";
import {
  LIST_SELECTABLE_EVENT_TYPES_REQUEST_TYPE,
  MASKED_SECRET,
  webhooksConfigurationSchema,
} from "./models";
import {
  WebhooksAdminKeys,
  WebhooksAdminNamespace,
  webhooksAdminNamespace,
} from "./translations/types";

export const WebhooksAppSetup: React.FC<AppSetupProps> = ({
  onSuccess,
  onError,
  appId,
}) => {
  const t = useI18n<WebhooksAdminNamespace, WebhooksAdminKeys>(
    webhooksAdminNamespace,
  );

  const [isEditingSecret, setIsEditingSecret] = useState(false);
  const [selectableEventTypes, setSelectableEventTypes] = useState<string[]>(
    [],
  );
  const [eventTypesLoading, setEventTypesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await adminApi.apps.processStaticRequest<{
          eventTypes: string[];
        }>("webhooks", { type: LIST_SELECTABLE_EVENT_TYPES_REQUEST_TYPE });
        if (
          cancelled ||
          !res ||
          typeof res !== "object" ||
          !Array.isArray((res as { eventTypes?: string[] }).eventTypes)
        ) {
          return;
        }
        setSelectableEventTypes(
          (res as { eventTypes: string[] }).eventTypes ?? [],
        );
      } catch {
        if (!cancelled) {
          setSelectableEventTypes([]);
        }
      } finally {
        if (!cancelled) {
          setEventTypesLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { appStatus, form, isLoading, isValid, onSubmit } =
    useConnectedAppSetup<z.infer<typeof webhooksConfigurationSchema>>({
      appId,
      appName: webhooksApp.name,
      schema: webhooksConfigurationSchema,
      onSuccess,
      onError,
      processDataForSubmit: (data) => {
        // Handle secret masking for editing
        if (data.secret === MASKED_SECRET) {
          return { ...data, secret: MASKED_SECRET };
        }
        return data;
      },
    });

  const secretInputType = isEditingSecret || !appId ? "text" : "password";

  return (
    <div className="max-h-[80vh]">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col items-center gap-4 w-full h-full"
        >
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
          <FormField
            control={form.control}
            name="secret"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>
                  {t("form.secret.label")}{" "}
                  <InfoTooltip>{t("form.secret.tooltip")}</InfoTooltip>
                </FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <Input
                      type={secretInputType}
                      placeholder={t("form.secret.placeholder")}
                      disabled={
                        !isEditingSecret && field.value === MASKED_SECRET
                      }
                      {...field}
                      value={field.value}
                    />
                    {field.value === MASKED_SECRET && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingSecret(true)}
                      >
                        {t("form.secret.editButton")}
                      </Button>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="eventTypes"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>
                  {t("form.eventTypes.label")}{" "}
                  <InfoTooltip>{t("form.eventTypes.tooltip")}</InfoTooltip>
                </FormLabel>
                <FormControl>
                  <div className="flex flex-col gap-4">
                    <Combobox
                      values={selectableEventTypes
                        .filter(
                          (eventType) => !field.value?.includes(eventType),
                        )
                        .map((eventType) => ({
                          value: eventType,
                          shortLabel: eventType,
                          label: (
                            <span className="font-mono text-sm">
                              {eventType}
                            </span>
                          ),
                        }))}
                      value={""}
                      placeholder={
                        eventTypesLoading
                          ? t("form.eventTypes.loading")
                          : t("form.eventTypes.placeholder")
                      }
                      disabled={eventTypesLoading}
                      onItemSelect={(item) => {
                        field.onChange([...(field.value || []), item]);
                      }}
                    />
                    <div className="flex flex-row flex-wrap gap-2">
                      {field.value?.map((eventType) => (
                        <Badge
                          key={eventType}
                          variant="secondary"
                          className="flex flex-row items-center gap-2"
                        >
                          <span className="font-mono text-sm">{eventType}</span>
                          <TooltipResponsive>
                            <TooltipResponsiveTrigger>
                              <Button
                                variant="ghost-destructive"
                                size="xs"
                                className="p-0 hover:bg-transparent"
                                onClick={() =>
                                  field.onChange(
                                    field.value?.filter(
                                      (et) => et !== eventType,
                                    ),
                                  )
                                }
                              >
                                <X className="size-2" />
                              </Button>
                            </TooltipResponsiveTrigger>
                            <TooltipResponsiveContent>
                              {t("form.unselectEvent")}
                            </TooltipResponsiveContent>
                          </TooltipResponsive>
                        </Badge>
                      ))}
                    </div>
                  </div>
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
              {t.rich("form.connect", {
                app: () => (
                  <ConnectedAppNameAndLogo appName={webhooksApp.name} />
                ),
              })}
            </span>
          </Button>
        </form>
      </Form>
      {appStatus && (
        <ConnectedAppStatusMessage
          status={appStatus.status}
          statusText={appStatus.statusText}
        />
      )}
    </div>
  );
};

export default WebhooksAppSetup;
