"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { AppSetupProps, ConnectedApp } from "@hacado/types";
import {
  Button,
  Combobox,
  Label,
  Spinner,
  toast,
  toastPromise,
} from "@hacado/ui";
import {
  ConnectedAppNameAndLogo,
  ConnectedAppStatusMessage,
} from "@hacado/ui-admin";
import React from "react";
import { GoogleAnalyticsApp } from "./app";
import { DataStreamListItem, RequestAction } from "./models";
import {
  GoogleAnalyticsAdminAllKeys,
  GoogleAnalyticsAdminKeys,
  GoogleAnalyticsAdminNamespace,
  googleAnalyticsAdminNamespace,
} from "./translations/types";

const REQUIRES_DATA_STREAM =
  "app_google-analytics_admin.statusText.requires_data_stream" satisfies GoogleAnalyticsAdminAllKeys;

function streamLabel(stream: DataStreamListItem): string {
  return `${stream.propertyName} — ${stream.streamName} (${stream.measurementId})`;
}

function streamKey(stream: DataStreamListItem): string {
  return `${stream.propertyId}:${stream.streamId}`;
}

function statusTextKey(
  statusText: ConnectedApp["statusText"],
): string | undefined {
  if (typeof statusText === "string") {
    return statusText;
  }
  if (statusText && typeof statusText === "object" && "key" in statusText) {
    return statusText.key;
  }
  return undefined;
}

function isAwaitingDataStream(app: ConnectedApp): boolean {
  return (
    app.status === "pending" &&
    statusTextKey(app.statusText) === REQUIRES_DATA_STREAM
  );
}

/** OAuth in progress - not yet authorized / not ready for stream selection. */
function isAuthorizing(app: ConnectedApp): boolean {
  return app.status === "pending" && !isAwaitingDataStream(app);
}

/** Tokens already exist (or OAuth done); user can pick a stream without reconnecting. */
function canConfigureStream(app: ConnectedApp): boolean {
  return !isAuthorizing(app);
}

export const GoogleAnalyticsAppSetup: React.FC<AppSetupProps> = ({
  onSuccess,
  onError,
  appId: existingAppId,
}) => {
  const t = useI18n<GoogleAnalyticsAdminNamespace, GoogleAnalyticsAdminKeys>(
    googleAnalyticsAdminNamespace,
  );
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [isLoadingStreams, setIsLoadingStreams] = React.useState(false);
  const [isSavingStream, setIsSavingStream] = React.useState(false);
  const [app, setApp] = React.useState<ConnectedApp | undefined>(undefined);
  const [timer, setTimer] = React.useState<NodeJS.Timeout>();
  const [streams, setStreams] = React.useState<DataStreamListItem[]>([]);
  const [selectedStreamKey, setSelectedStreamKey] = React.useState<string>("");

  const showStreamPicker = !!app && canConfigureStream(app);
  const appId = showStreamPicker ? (app._id ?? existingAppId) : undefined;

  React.useEffect(() => {
    if (!appId) return;

    const fn = async () => {
      setIsLoadingStreams(true);
      try {
        const [streamList, selected] = await Promise.all([
          adminApi.apps.processRequest(appId, {
            type: "get-data-stream-list",
          } as RequestAction),
          adminApi.apps.processRequest(appId, {
            type: "get-selected-data-stream",
          } as RequestAction),
        ]);

        const list = (streamList ?? []) as DataStreamListItem[];
        setStreams(list);

        const selectedItem = selected as DataStreamListItem | undefined;
        if (selectedItem?.streamId) {
          setSelectedStreamKey(streamKey(selectedItem));
        } else if (list[0]) {
          setSelectedStreamKey(streamKey(list[0]));
        }
      } catch (e: unknown) {
        console.error(e);
        toast.error(t("toast.stream_list_error"));
      } finally {
        setIsLoadingStreams(false);
      }
    };

    void fn();
  }, [appId, t]);

  const updateSelectedStream = async (stream?: DataStreamListItem) => {
    if (!appId || !stream) return;

    setIsSavingStream(true);
    try {
      await toastPromise(
        adminApi.apps.processRequest(appId, {
          type: "set-data-stream",
          stream,
        } as RequestAction),
        {
          success: t("toast.changes_saved"),
          error: t("toast.request_error"),
        },
      );

      const status = await adminApi.apps.getAppStatus(appId);
      setApp(status);
      onSuccess(appId);
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setIsSavingStream(false);
    }
  };

  const getStatus = async (id: string) => {
    const status = await adminApi.apps.getAppStatus(id);
    setApp(() => status);

    if (isAuthorizing(status)) {
      const timeoutId = setTimeout(() => getStatus(id), 1000);
      setTimer(timeoutId);
      return;
    }

    setIsConnecting(false);

    if (status.status === "failed") {
      onSuccess(id, true);
      return;
    }

    if (status.status === "connected" || isAwaitingDataStream(status)) {
      onSuccess(id, true);
      return;
    }

    onError(status.statusText);
  };

  React.useEffect(() => {
    if (!existingAppId) {
      return;
    }
    void adminApi.apps.getAppStatus(existingAppId).then(setApp);
  }, [existingAppId]);

  React.useEffect(() => {
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [timer]);

  const connectApp = async () => {
    try {
      setIsConnecting(true);

      let id: string;
      if (app?._id || existingAppId) {
        id = (app?._id || existingAppId)!;
        await adminApi.apps.setAppStatus(id, {
          status: "pending",
          statusText:
            "app_google-analytics_admin.form.pendingAuthorization" satisfies GoogleAnalyticsAdminAllKeys,
        });
      } else {
        id = await adminApi.apps.addNewApp(GoogleAnalyticsApp.name);
      }

      const loginUrl = await adminApi.apps.getAppLoginUrl(id);

      getStatus(id);
      window.open(loginUrl, "_blank", "popup=true");
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : String(e));
      setIsConnecting(false);
    }
  };

  const streamListValues = React.useMemo(
    () =>
      streams.map((s) => ({
        value: streamKey(s),
        label: streamLabel(s),
      })),
    [streams],
  );

  const isBusy = isConnecting || isLoadingStreams || isSavingStream;

  return (
    <>
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="default"
          onClick={connectApp}
          disabled={isConnecting}
          className="inline-flex gap-2 items-center w-full"
        >
          {isConnecting && <Spinner />}
          <span className="inline-flex gap-2 items-center">
            {t.rich(existingAppId ? "form.reconnect" : "form.connect", {
              app: () => (
                <ConnectedAppNameAndLogo appName={GoogleAnalyticsApp.name} />
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
      {showStreamPicker && appId && (
        <div className="flex flex-col gap-2 w-full mt-4 border-t pt-4">
          <Label>{t("form.selectStream.label")}</Label>
          <Combobox
            values={streamListValues}
            disabled={isBusy || streams.length === 0}
            className="flex w-full font-normal text-base"
            searchLabel={t("form.selectStream.searchLabel")}
            value={selectedStreamKey}
            onItemSelect={(value) => {
              setSelectedStreamKey(value);
              updateSelectedStream(streams.find((s) => streamKey(s) === value));
            }}
          />
        </div>
      )}
    </>
  );
};
