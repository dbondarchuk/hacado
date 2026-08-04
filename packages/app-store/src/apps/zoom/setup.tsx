import { adminApi } from "@timelish/api-sdk";
import { useI18n } from "@timelish/i18n/client";
import { AppSetupProps, ConnectedApp } from "@timelish/types";
import { Button, Spinner } from "@timelish/ui";
import {
  ConnectedAppNameAndLogo,
  ConnectedAppStatusMessage,
} from "@timelish/ui-admin";
import React from "react";
import { ZoomApp } from "./app";
import {
  ZoomAdminAllKeys,
  ZoomAdminKeys,
  zoomAdminNamespace,
  ZoomAdminNamespace,
} from "./translations/types";

export const ZoomAppSetup: React.FC<AppSetupProps> = ({
  onSuccess,
  onError,
  appId: existingAppId,
}) => {
  const t = useI18n<ZoomAdminNamespace, ZoomAdminKeys>(zoomAdminNamespace);
  const [isLoading, setIsLoading] = React.useState(false);

  const [app, setApp] = React.useState<ConnectedApp | undefined>(undefined);
  const [timer, setTimer] = React.useState<NodeJS.Timeout>();

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
            "app_zoom_admin.form.pendingAuthorization" satisfies ZoomAdminAllKeys,
        });
      } else {
        appId = await adminApi.apps.addNewApp(ZoomApp.name);
      }

      const loginUrl = await adminApi.apps.getAppLoginUrl(appId);

      getStatus(appId);
      window.open(loginUrl, "_blank", "popup=true");
    } catch (e: any) {
      onError(e?.message);

      setIsLoading(false);
    }
  };

  return (
    <>
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
            {t.rich(existingAppId ? "form.reconnect" : "form.connect", {
              app: () => <ConnectedAppNameAndLogo appName={ZoomApp.name} />,
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
