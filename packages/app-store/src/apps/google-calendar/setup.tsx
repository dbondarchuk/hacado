import { adminApi } from "@timelish/api-sdk";
import { useI18n } from "@timelish/i18n/client";
import { AppSetupProps, ConnectedApp } from "@timelish/types";
import {
  Button,
  Combobox,
  Label,
  Spinner,
  toast,
  toastPromise,
} from "@timelish/ui";
import {
  ConnectedAppNameAndLogo,
  ConnectedAppStatusMessage,
} from "@timelish/ui-admin";
import React from "react";
import { GoogleCalendarApp } from "./app";
import { CalendarListItem, RequestAction } from "./models";
import {
  GoogleCalendarAdminAllKeys,
  GoogleCalendarAdminKeys,
  GoogleCalendarAdminNamespace,
  googleCalendarAdminNamespace,
} from "./translations/types";

export const GoogleAppSetup: React.FC<AppSetupProps> = ({
  onSuccess,
  onError,
  appId: existingAppId,
}) => {
  const t = useI18n<GoogleCalendarAdminNamespace, GoogleCalendarAdminKeys>(
    googleCalendarAdminNamespace,
  );
  const [isLoading, setIsLoading] = React.useState(false);

  const [app, setApp] = React.useState<ConnectedApp | undefined>(undefined);
  const [timer, setTimer] = React.useState<NodeJS.Timeout>();

  const appId = app?._id ?? existingAppId;
  const appStatus = app?.status;

  const primaryCalendar: CalendarListItem = {
    id: "primary",
    name: t("primaryCalendar"),
  };

  const [calendars, setCalendars] = React.useState<CalendarListItem[]>([
    primaryCalendar,
  ]);

  const [selectedCalendar, setSelectedCalendar] =
    React.useState<string>("primary");

  React.useEffect(() => {
    if (!appId || appStatus === "pending") return;

    const fn = async () => {
      setIsLoading(true);
      try {
        const [calendarList, selected] = await Promise.all([
          adminApi.apps.processRequest(appId, {
            type: "get-calendar-list",
          } as RequestAction),
          adminApi.apps.processRequest(appId, {
            type: "get-selected-calendar",
          } as RequestAction),
        ]);

        setCalendars([primaryCalendar, ...(calendarList ?? [])]);
        setSelectedCalendar(selected ?? primaryCalendar.id);
      } catch (e: any) {
        console.error(e);
        toast.error("Failed to retrieve calendar list");
      } finally {
        setIsLoading(false);
      }
    };

    fn();
  }, [appId, t, appStatus]);

  const updateCalendarObject = async (calendar?: CalendarListItem) => {
    if (!appId || !calendar) return;

    setIsLoading(true);
    try {
      await toastPromise(
        adminApi.apps.processRequest(appId, {
          type: "set-calendar",
          calendar,
        } as RequestAction),
        {
          success: t("toast.changes_saved"),
          error: t("toast.request_error"),
        },
      );
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatus = async (appId: string) => {
    const status = await adminApi.apps.getAppStatus(appId);
    setApp(() => status);

    if (status.status === "pending") {
      const id = setTimeout(() => getStatus(appId), 1000);
      setTimer(id);
      return;
    }

    setIsLoading(false);

    if (status.status === "connected") {
      onSuccess(appId);
      return;
    }

    onError(status.statusText);
  };

  React.useEffect(() => {
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [timer]);

  const connectApp = async () => {
    try {
      setIsLoading(true);

      let appId: string;
      if (app?._id || existingAppId) {
        appId = (app?._id || existingAppId)!;
        await adminApi.apps.setAppStatus(appId, {
          status: "pending",
          statusText:
            "app_google-calendar_admin.form.pendingAuthorization" satisfies GoogleCalendarAdminAllKeys,
        });
      } else {
        appId = await adminApi.apps.addNewApp(GoogleCalendarApp.name);
      }

      const loginUrl = await adminApi.apps.getAppLoginUrl(appId);

      getStatus(appId);
      window.open(loginUrl, "_blank", "popup=true");
    } catch (e: any) {
      onError(e?.message);

      setIsLoading(false);
    }
  };

  const calendarListValues = React.useMemo(
    () =>
      calendars?.map((c) => ({
        value: c.id,
        label: c.name,
      })) ?? [],
    [calendars],
  );

  return (
    <>
      {appId && (
        <div className="flex flex-col gap-2">
          <Label>{t("form.selectCalendar.label")}</Label>
          <Combobox
            values={calendarListValues}
            disabled={isLoading}
            className="flex w-full font-normal text-base"
            searchLabel={t("form.selectCalendar.searchLabel")}
            value={selectedCalendar}
            onItemSelect={(value) => {
              setSelectedCalendar(value);
              updateCalendarObject(calendars?.find((c) => c.id === value));
            }}
          />
        </div>
      )}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="default"
          onClick={connectApp}
          disabled={isLoading}
          className="inline-flex gap-2 items-center w-full"
        >
          {isLoading && <Spinner />}
          <span className="inline-flex gap-2 items-center">
            {t.rich(appId ? "form.reconnect" : "form.connect", {
              app: () => (
                <ConnectedAppNameAndLogo appName={GoogleCalendarApp.name} />
              ),
            })}
          </span>
        </Button>
      </div>
      {app && (
        <ConnectedAppStatusMessage
          status={app.status}
          statusText={app.statusText}
        />
      )}
    </>
  );
};
