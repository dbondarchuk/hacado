"use client";

import { authClient } from "@/app/auth-client";
import { AvailableApps } from "@hacado/app-store";
import { AppSetups } from "@hacado/app-store/setup";
import { useI18n } from "@hacado/i18n/client";
import {
  AppSetupProps,
  ConnectedApp,
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
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Label,
  Spinner,
  toast,
  toastPromise,
} from "@hacado/ui";
import { filterInstallDefaultScopesForUser } from "@hacado/utils";
import { useRouter } from "next/navigation";
import React, { useCallback, useMemo } from "react";
import { setDefaultAppByScope } from "./store/actions";

export type AddOrUpdateAppButtonProps = {
  children: React.ReactNode;
  installBlocked?: boolean;
  /** When true, a new connection only refreshes the page (install wizard); default sends users to /dashboard/apps. */
  refreshOnClose?: boolean;
  dontAskToSetDefault?: boolean;
} & (
  | {
      app: ConnectedApp;
    }
  | {
      appType: string;
    }
);

export const AddOrUpdateAppButton: React.FC<AddOrUpdateAppButtonProps> = ({
  children,
  installBlocked = false,
  refreshOnClose = false,
  dontAskToSetDefault = false,
  ...props
}) => {
  const router = useRouter();
  const t = useI18n("apps");
  const { data: session } = authClient.useSession();

  let app: ConnectedApp | undefined = undefined;
  let appType: string;

  if ("app" in props) {
    app = props.app;
    appType = props.app.name;
  } else {
    appType = props.appType;
  }

  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [pendingDefaultPrompt, setPendingDefaultPrompt] = React.useState<{
    appId: string;
    scopes: DefaultAppToInstallScope[];
  } | null>(null);
  const [selectedScopes, setSelectedScopes] = React.useState<
    DefaultAppToInstallScope[]
  >([]);
  const [settingDefault, setSettingDefault] = React.useState(false);

  const defaultScopes = useMemo(() => {
    const currentApp = AvailableApps[appType];
    if (!currentApp) return undefined;
    const intersecting = defaultAppToInstallScopes.filter((scope) =>
      currentApp.scope.includes(scope),
    );
    return filterInstallDefaultScopesForUser(
      intersecting,
      session?.user as SessionUser | undefined,
    );
  }, [appType, session?.user]);

  const openDialog = () => {
    setIsOpen(true);
  };

  const closeDialog = useCallback(
    (redirect?: boolean) => {
      setIsOpen(false);
      setIsLoading(false);
      if (app) {
        router.refresh();
      } else if (refreshOnClose) {
        router.refresh();
      } else if (redirect) {
        router.push("/dashboard/apps");
        setTimeout(() => {
          router.refresh();
        }, 300);
      }
    },
    [app, refreshOnClose, router],
  );

  const setupProps: AppSetupProps = useMemo(
    () => ({
      onSuccess: (appId: string, doNotCloseDialog?: boolean) => {
        toast.success(t("common.connectedAppSetup.success.description"));
        if (app || !defaultScopes?.length || dontAskToSetDefault) {
          if (!doNotCloseDialog) {
            closeDialog(true);
          }
          return;
        }

        if (appId) {
          setPendingDefaultPrompt({ appId, scopes: defaultScopes });
          setSelectedScopes(defaultScopes);
          setIsOpen(false);
        } else if (!doNotCloseDialog) {
          closeDialog(true);
        }
      },
      onError: (
        error: string | { key: string; args?: Record<string, any> },
      ) => {
        console.error(
          `Failed to set up app: ${typeof error === "string" ? error : error.key}`,
        );

        toast.error(t("common.connectedAppSetup.error.description"));
      },
      appId: app?._id,
    }),
    [app, app?._id, t, closeDialog, defaultScopes, dontAskToSetDefault],
  );

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
      closeDialog(true);
    }
  };

  const AppSetupElement = React.useMemo(() => {
    if (!appType) return null;

    const app = AvailableApps[appType];
    if (app.type === "complex" || app.type === "system") return null;

    return AppSetups[appType](setupProps);
  }, [appType, setupProps]);

  const onDialogOpenChange = (open: boolean) => {
    if (open && installBlocked && !app) return;
    if (open) openDialog();
    else closeDialog();
  };

  const title = app ? t("common.updateApp") : t("common.connectNewApp");

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onDialogOpenChange}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="w-full sm:max-w-lg" aria-description={title}>
          <DialogHeader className="px-1">
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="w-full overflow-y-auto max-h-[70svh] px-1">
            <div className="flex flex-col gap-4 py-4 relative w-full">
              {AppSetupElement}
              {isLoading && (
                <div className="absolute top-0 left-0 right-0 bottom-0 flex justify-center items-center bg-white opacity-50">
                  <div role="status">
                    <Spinner className="w-20 h-20" />
                    <span className="sr-only">{t("common.pleaseWait")}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="px-1">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                {t("common.close")}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={!!pendingDefaultPrompt}
        onOpenChange={(open) => {
          if (!open && !settingDefault) {
            setPendingDefaultPrompt(null);
            closeDialog(true);
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
                closeDialog(true);
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
