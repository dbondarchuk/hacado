"use client";

import { adminApi } from "@timelish/api-sdk";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  toast,
} from "@timelish/ui";
import {
  ConnectedAppNameAndLogo,
  ConnectedAppStatusMessage,
} from "@timelish/ui-admin";
import React from "react";
import { useConnectedAppSetup } from "../../hooks/use-connected-app-setup";
import { CaldavApp } from "./app";
import { CALDAV_APP_NAME } from "./const";
import { CaldavCalendarSource, caldavCalendarSourceSchema } from "./models";
import {
  CaldavAdminKeys,
  caldavAdminNamespace,
  CaldavAdminNamespace,
} from "./translations/types";

export const CaldavAppSetup: React.FC<AppSetupProps> = ({
  onSuccess,
  onError,
  appId: existingAppId,
}) => {
  const { appStatus, form, isLoading, setIsLoading, isValid, onSubmit } =
    useConnectedAppSetup<CaldavCalendarSource>({
      appId: existingAppId,
      appName: CaldavApp.name,
      schema: caldavCalendarSourceSchema,
      onSuccess,
      onError,
      processDataForSubmit: (data) => ({
        type: "save",
        data,
      }),
    });

  const t = useI18n<CaldavAdminNamespace, CaldavAdminKeys>(
    caldavAdminNamespace,
  );

  const [calendars, setCalendars] = React.useState<string[]>([]);

  const calendarName = form.getValues("calendarName");
  React.useEffect(() => {
    if (!calendarName) return;
    setCalendars(Array.from(new Set(calendars || []).add(calendarName)));
    form.setValue("calendarName", calendarName);
  }, [calendarName]);

  const [fetchingCalendars, setFetchingCalendars] = React.useState(false);
  const fetchCalendars = async () => {
    setFetchingCalendars(true);
    try {
      const result = existingAppId
        ? await adminApi.apps.processRequest(existingAppId, {
            type: "fetchCalendars",
            data: form.getValues(),
          })
        : await adminApi.apps.processStaticRequest(CALDAV_APP_NAME, {
            ...form.getValues(),
            fetchCalendars: true,
          });

      setCalendars(result);
    } catch (error: any) {
      toast.error(
        t("toast.failedToFetchCalendars", {
          serverUrl: form.getValues("serverUrl"),
        }),
      );
      console.error(error);
    } finally {
      setFetchingCalendars(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <div className="flex flex-col items-center gap-2">
            <FormField
              control={form.control}
              name="serverUrl"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>
                    {t("form.serverUrl.label")}
                    <InfoTooltip>{t("form.serverUrl.tooltip")}</InfoTooltip>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="https://" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>
                    {t("form.username.label")}
                    <InfoTooltip>{t("form.username.tooltip")}</InfoTooltip>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>
                    {t("form.password.label")}
                    <InfoTooltip>{t("form.password.tooltip")}</InfoTooltip>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="********"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="calendarName"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>{t("form.calendar.label")}</FormLabel>
                  <div className="flex flex-row gap-2 items-center">
                    <FormControl className="flex-grow">
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          field.onBlur();
                        }}
                      >
                        <SelectTrigger className="w-full" disabled={isLoading}>
                          <SelectValue
                            placeholder={t("form.calendar.placeholder")}
                          />
                        </SelectTrigger>
                        <SelectContent side="bottom">
                          {calendars.map((calendar) => (
                            <SelectItem key={calendar} value={calendar}>
                              {calendar}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <Button
                      disabled={isLoading}
                      type="button"
                      variant="primary"
                      className="inline-flex gap-2 items-center"
                      onClick={fetchCalendars}
                    >
                      {fetchingCalendars && <Spinner />}
                      <span>{t("form.fetch")}</span>
                    </Button>
                  </div>
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
                    <ConnectedAppNameAndLogo appName={CaldavApp.name} />
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
