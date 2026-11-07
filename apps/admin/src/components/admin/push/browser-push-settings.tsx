"use client";

import {
  disableBrowserPush,
  enableBrowserPush,
  getCurrentPushSubscription,
  getServerPushStatus,
  isBrowserPushSupported,
  needsIosHomeScreenInstall,
  registerPushServiceWorker,
} from "@/push/browser-push";
import { useI18n } from "@hacado/i18n/client";
import { Button } from "@hacado/ui/button";
import { toast } from "@hacado/ui/sonner";
import { Switch } from "@hacado/ui/switch";
import React from "react";
import { IosAddToHomeScreenDialog } from "./ios-add-to-home-screen-dialog";

export function BrowserPushSettings() {
  const t = useI18n("admin");
  const [enabled, setEnabled] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [supported, setSupported] = React.useState(false);
  const [needsInstall, setNeedsInstall] = React.useState(false);
  const [howToOpen, setHowToOpen] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const canPush = isBrowserPushSupported();
      const installRequired = needsIosHomeScreenInstall();

      if (!cancelled) {
        setSupported(canPush);
        setNeedsInstall(installRequired);
      }

      if (!canPush || installRequired) {
        if (!cancelled) {
          setLoading(false);
        }

        return;
      }

      try {
        await registerPushServiceWorker().catch(() => null);
        const subscription = await getCurrentPushSubscription();
        if (!subscription) {
          if (!cancelled) {
            setEnabled(false);
          }

          return;
        }

        const serverEnabled = await getServerPushStatus(subscription.endpoint);
        if (!cancelled) {
          setEnabled(serverEnabled);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const onToggle = async (next: boolean) => {
    setLoading(true);

    try {
      if (next) {
        await enableBrowserPush();
        setEnabled(true);
        toast.success(t("users.profile.push.enabledToast"));
      } else {
        await disableBrowserPush();
        setEnabled(false);
        toast.success(t("users.profile.push.disabledToast"));
      }
    } catch {
      toast.error(t("users.profile.push.errorToast"));
    } finally {
      setLoading(false);
    }
  };

  if (!supported && !needsInstall) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("users.profile.push.unsupported")}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">{t("users.profile.push.title")}</p>
          <p className="text-sm text-muted-foreground">
            {t("users.profile.push.description")}
          </p>
        </div>
        <Switch
          checked={enabled}
          disabled={loading || needsInstall}
          onCheckedChange={(value) => {
            void onToggle(value);
          }}
        />
      </div>
      {needsInstall ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {t("users.profile.push.iosInstallHint")}
          </p>
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 text-sm"
            onClick={() => setHowToOpen(true)}
          >
            {t("dashboard.pushPrompt.showMeHow")}
          </Button>
        </div>
      ) : null}
      <IosAddToHomeScreenDialog open={howToOpen} onOpenChange={setHowToOpen} />
    </div>
  );
}
