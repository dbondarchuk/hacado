"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { AppSetupProps, ConnectedApp } from "@hacado/types";
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
import { ResendApp } from "./app";
import { ResendFromSettings, resendFromSettingsSchema } from "./models";
import {
  ResendAdminAllKeys,
  ResendAdminKeys,
  resendAdminNamespace,
  ResendAdminNamespace,
} from "./translations/types";

const REQUIRES_SENDER_SETTINGS =
  "app_resend_admin.statusText.requires_sender_settings" satisfies ResendAdminAllKeys;

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

function isAwaitingSenderSettings(app: ConnectedApp): boolean {
  return (
    app.status === "pending" &&
    statusTextKey(app.statusText) === REQUIRES_SENDER_SETTINGS
  );
}

/** OAuth in progress - not yet authorized / not ready for From settings. */
function isAuthorizing(app: ConnectedApp): boolean {
  return app.status === "pending" && !isAwaitingSenderSettings(app);
}

/** Tokens already exist (or OAuth done); user can edit From without reconnecting. */
function canConfigureSender(app: ConnectedApp): boolean {
  return !isAuthorizing(app);
}

export const ResendAppSetup: React.FC<AppSetupProps> = ({
  onSuccess,
  onError,
  appId: existingAppId,
}) => {
  const t = useI18n<ResendAdminNamespace, ResendAdminKeys>(
    resendAdminNamespace,
  );
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [app, setApp] = React.useState<ConnectedApp | undefined>(undefined);
  const [timer, setTimer] = React.useState<NodeJS.Timeout>();

  const showSenderSettings = !!app && canConfigureSender(app);
  const formAppId = showSenderSettings ? (app._id ?? existingAppId) : undefined;

  const {
    form,
    isLoading: isSaving,
    isValid,
    onSubmit,
    appStatus: saveStatus,
  } = useConnectedAppSetup<ResendFromSettings>({
    appId: formAppId,
    appName: ResendApp.name,
    schema: resendFromSettingsSchema,
    successText: t("form.saveSuccess"),
    errorText: t("form.saveError"),
    onSuccess,
    onError,
  });

  const getStatus = async (appId: string) => {
    const status = await adminApi.apps.getAppStatus(appId);
    setApp(() => status);

    if (isAuthorizing(status)) {
      const id = setTimeout(() => getStatus(appId), 1000);
      setTimer(id);
      return;
    }

    setIsConnecting(false);

    if (status.status === "failed") {
      // OAuth tokens are present; keep the dialog open so the user can fix From settings.
      onSuccess(appId, true);
      return;
    }

    if (status.status === "connected" || isAwaitingSenderSettings(status)) {
      onSuccess(appId, true);
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
            "app_resend_admin.form.pendingAuthorization" satisfies ResendAdminAllKeys,
        });
      } else {
        appId = await adminApi.apps.addNewApp(ResendApp.name);
      }

      const loginUrl = await adminApi.apps.getAppLoginUrl(appId);
      getStatus(appId);
      window.open(loginUrl, "_blank", "popup=true");
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : String(e));
      setIsConnecting(false);
    }
  };

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
              app: () => <ConnectedAppNameAndLogo appName={ResendApp.name} />,
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
      {showSenderSettings && formAppId && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full mt-4 border-t pt-4"
          >
            <div className="flex flex-col items-center gap-4">
              <FormField
                control={form.control}
                name="fromEmail"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>
                      {t("form.fromEmail.label")}
                      <InfoTooltip>{t("form.fromEmail.tooltip")}</InfoTooltip>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("form.fromEmail.placeholder")}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fromName"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>
                      {t("form.fromName.label")}
                      <InfoTooltip>{t("form.fromName.tooltip")}</InfoTooltip>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("form.fromName.placeholder")}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                disabled={isSaving || !isValid}
                type="submit"
                variant="default"
                className="inline-flex gap-2 items-center w-full"
              >
                {isSaving && <Spinner />}
                {t("form.save")}
              </Button>
            </div>
          </form>
        </Form>
      )}
      {saveStatus && (
        <ConnectedAppStatusMessage
          status={saveStatus.status}
          statusText={saveStatus.statusText}
        />
      )}
    </>
  );
};
