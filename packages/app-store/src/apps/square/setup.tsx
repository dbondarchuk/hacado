"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { AppSetupProps, ConnectedApp } from "@hacado/types";
import {
  Button,
  Checkbox,
  DurationInput,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Spinner,
} from "@hacado/ui";
import {
  ConnectedAppNameAndLogo,
  ConnectedAppStatusMessage,
} from "@hacado/ui-admin";
import React from "react";
import { useConnectedAppSetup } from "../../hooks/use-connected-app-setup";
import { SquareApp } from "./app";
import { squareSyncSettingsRequestSchema } from "./models";
import {
  SquareAdminAllKeys,
  SquareAdminKeys,
  squareAdminNamespace,
  SquareAdminNamespace,
} from "./translations/types";

export const SquareAppSetup: React.FC<AppSetupProps> = ({
  onSuccess,
  onError,
  appId: existingAppId,
}) => {
  const t = useI18n<SquareAdminNamespace, SquareAdminKeys>(
    squareAdminNamespace,
  );
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [app, setApp] = React.useState<ConnectedApp | undefined>(undefined);
  const [timer, setTimer] = React.useState<NodeJS.Timeout>();

  const connectedAppId =
    app?.status === "connected" ? (app._id ?? existingAppId) : existingAppId;

  const {
    form,
    isLoading: isSavingSync,
    isValid,
    onSubmit,
    appStatus: syncSaveStatus,
  } = useConnectedAppSetup({
    appId: connectedAppId,
    appName: SquareApp.name,
    schema: squareSyncSettingsRequestSchema,
    successText: t("form.inStoreSync.saveSuccess"),
    errorText: t("form.inStoreSync.saveError"),
    onSuccess,
    onError,
  });

  const isInStoreSyncEnabled = form.watch("enableInStoreSync");

  const getStatus = async (appId: string) => {
    const status = await adminApi.apps.getAppStatus(appId);
    setApp(() => status);

    if (status.status === "pending") {
      const id = setTimeout(() => getStatus(appId), 1000);
      setTimer(id);
      return;
    }

    setIsConnecting(false);

    if (status.status === "connected") {
      onSuccess(appId);
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
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [timer]);

  const connectApp = async () => {
    try {
      setIsConnecting(true);

      let appId: string;
      if (app?._id || existingAppId) {
        appId = (app?._id || existingAppId)!;
        await adminApi.apps.setAppStatus(appId, {
          status: "pending",
          statusText:
            "app_square_admin.form.pendingAuthorization" satisfies SquareAdminAllKeys,
        });
      } else {
        appId = await adminApi.apps.addNewApp(SquareApp.name);
      }

      const loginUrl = await adminApi.apps.getAppLoginUrl(appId);

      getStatus(appId);
      window.open(loginUrl, "_blank", "popup=true");
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : String(e));
      setIsConnecting(false);
    }
  };

  const isConnected = app?.status === "connected";

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
              app: () => <ConnectedAppNameAndLogo appName={SquareApp.name} />,
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
      {isConnected && connectedAppId && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full mt-4 border-t pt-4"
          >
            <div className="flex flex-col items-center gap-4">
              <FormField
                control={form.control}
                name="enableInStoreSync"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox
                          id="squareEnableInStoreSync"
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel
                        className="cursor-pointer"
                        htmlFor="squareEnableInStoreSync"
                      >
                        {t("form.inStoreSync.label")}
                      </FormLabel>
                    </div>
                    <FormDescription>
                      {t("form.inStoreSync.description")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isInStoreSyncEnabled && (
                <FormField
                  control={form.control}
                  name="matchWindowMinutes"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>{t("form.matchWindow.label")}</FormLabel>
                      <FormControl>
                        <DurationInput
                          type="hours-minutes"
                          value={field.value ?? 0}
                          disabled={isSavingSync}
                          placeholderHours="2"
                          placeholderMinutes="0"
                          onBlur={field.onBlur}
                          onChange={(val) => {
                            field.onChange(val ?? 0);
                            field.onBlur();
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        {t("form.matchWindow.description")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <Button
                disabled={isSavingSync || !isValid}
                type="submit"
                variant="default"
                className="inline-flex gap-2 items-center w-full"
              >
                {isSavingSync && <Spinner />}
                {t("form.inStoreSync.save")}
              </Button>
            </div>
          </form>
        </Form>
      )}
      {syncSaveStatus && (
        <ConnectedAppStatusMessage
          status={syncSaveStatus.status}
          statusText={syncSaveStatus.statusText}
        />
      )}
    </>
  );
};
