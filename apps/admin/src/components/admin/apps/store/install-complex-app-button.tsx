"use client";

import { authClient } from "@/app/auth-client";
import { AvailableApps } from "@hacado/app-store";
import { BaseAllKeys, useI18n } from "@hacado/i18n/client";
import {
  ComplexApp,
  DefaultAppToInstallScope,
  defaultAppToInstallScopes,
  type SessionUser,
} from "@hacado/types";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Checkbox,
  Label,
  Spinner,
  toastPromise,
} from "@hacado/ui";
import { filterInstallDefaultScopesForUser } from "@hacado/utils";
import React from "react";
import {
  installComplexApp,
  setAppStatus,
  setDefaultAppByScope,
} from "./actions";

export const InstallComplexAppButton: React.FC<{
  appName: string;
  installed: number;
  installBlocked?: boolean;
}> = ({ appName, installed, installBlocked = false }) => {
  const app = React.useMemo(() => AvailableApps[appName], [appName]);
  const t = useI18n("apps");
  const { data: session } = authClient.useSession();
  const [pendingDefaultPrompt, setPendingDefaultPrompt] = React.useState<{
    appId: string;
    scopes: DefaultAppToInstallScope[];
  } | null>(null);
  const [selectedScopes, setSelectedScopes] = React.useState<
    DefaultAppToInstallScope[]
  >([]);
  const [settingDefault, setSettingDefault] = React.useState(false);

  const defaultScopes = React.useMemo(() => {
    const intersecting = defaultAppToInstallScopes.filter((scope) =>
      app.scope.includes(scope),
    );
    return filterInstallDefaultScopesForUser(
      intersecting,
      session?.user as SessionUser | undefined,
    );
  }, [app.scope, session?.user]);

  const finishInstallNavigation = React.useCallback(() => {
    // Full reload so dashboard layout rebuilds sidebar menu items for the new app.
    // Soft router.refresh() is not enough after the install / default-targets dialog.
    const href =
      app.type === "complex" && app.settingsHref
        ? `/dashboard/${app.settingsHref}`
        : window.location.pathname + window.location.search;
    window.location.assign(href);
  }, [(app as ComplexApp).settingsHref, app.type]);

  const installComplex = async () => {
    if (installBlocked) return;
    if (app.type !== "complex" && app.type !== "system") return;

    const installFn = async () => {
      const appId = await installComplexApp(appName);
      if (app.type === "system") {
        await setAppStatus(appId, {
          status: "connected",
          statusText: "apps.common.statusText.installed" satisfies BaseAllKeys,
        });
      }

      if (defaultScopes.length) {
        setPendingDefaultPrompt({ appId, scopes: defaultScopes });
        setSelectedScopes(defaultScopes);
      } else {
        finishInstallNavigation();
      }
    };

    try {
      await toastPromise(installFn(), {
        success: t("common.statusText.connected"),
        error: t("common.statusText.error"),
      });
    } catch (error: any) {
      console.error(`Failed to set up app: ${error}`);
    }
  };

  const onSetDefault = async () => {
    if (!pendingDefaultPrompt) return;
    try {
      setSettingDefault(true);
      await toastPromise(
        setDefaultAppByScope(pendingDefaultPrompt.appId, selectedScopes),
        {
          success: t("common.installTargetsPrompt.toasts.setSuccess"),
          error: t("common.installTargetsPrompt.toasts.setError"),
        },
      );
    } finally {
      setSettingDefault(false);
      setPendingDefaultPrompt(null);
      finishInstallNavigation();
    }
  };

  return (
    <>
      <Button
        variant="default"
        disabled={installBlocked || (app.dontAllowMultiple && installed > 0)}
        onClick={installComplex}
      >
        {app.dontAllowMultiple && installed > 0
          ? t("common.alreadyInstalled")
          : t("common.addApp")}
      </Button>
      <AlertDialog
        open={!!pendingDefaultPrompt}
        onOpenChange={(open) => {
          if (!open && !settingDefault) {
            setPendingDefaultPrompt(null);
            finishInstallNavigation();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("common.installTargetsPrompt.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("common.installTargetsPrompt.description")}
            </AlertDialogDescription>
            <div className="flex flex-col gap-2 pt-2">
              {pendingDefaultPrompt?.scopes.map((scope) => (
                <Label
                  key={scope}
                  className="flex items-center gap-2 text-base"
                >
                  <Checkbox
                    checked={selectedScopes.includes(scope)}
                    onCheckedChange={(checked) => {
                      setSelectedScopes((prev) =>
                        checked
                          ? [...prev, scope]
                          : prev.filter((s) => s !== scope),
                      );
                    }}
                  />
                  <span>
                    {t(`common.installTargetsPrompt.targets.${scope}`)}
                  </span>
                </Label>
              ))}
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={settingDefault}
              onClick={() => {
                setPendingDefaultPrompt(null);
                finishInstallNavigation();
              }}
            >
              {t("common.installTargetsPrompt.actions.skip")}
            </AlertDialogCancel>
            <Button
              disabled={
                settingDefault ||
                !pendingDefaultPrompt ||
                !selectedScopes.length
              }
              onClick={onSetDefault}
            >
              {settingDefault && <Spinner />}
              {t("common.installTargetsPrompt.actions.apply")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
