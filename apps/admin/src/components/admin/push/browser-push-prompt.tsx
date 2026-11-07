"use client";

import { authClient } from "@/app/auth-client";
import {
  enableBrowserPush,
  isBrowserPushSupported,
  listenForPushNotificationNavigation,
  needsIosHomeScreenInstall,
  PUSH_BOUND_MEMBER_KEY,
  rebindBrowserPushIfEnabled,
  registerPushServiceWorker,
} from "@/push/browser-push";
import { useI18n } from "@hacado/i18n/client";
import type { SessionUser } from "@hacado/types/users";
import { Button } from "@hacado/ui/button";
import { toast } from "@hacado/ui/sonner";
import { Bell, X } from "lucide-react";
import React from "react";
import { IosAddToHomeScreenDialog } from "./ios-add-to-home-screen-dialog";

function pushPromptDismissKey(memberId: string) {
  return `hacado.pushPrompt.dismissed.${memberId}`;
}

export function BrowserPushPrompt() {
  const t = useI18n("admin");
  const { data: session } = authClient.useSession();
  const sessionUser = session?.user as SessionUser | undefined;
  const memberId = sessionUser?.memberId;
  const [visible, setVisible] = React.useState(false);
  const [iosHint, setIosHint] = React.useState(false);
  const [howToOpen, setHowToOpen] = React.useState(false);
  const lastMemberId = React.useRef<string | null>(null);

  React.useLayoutEffect(() => {
    listenForPushNotificationNavigation();
  }, []);

  React.useEffect(() => {
    if (!memberId) {
      setVisible(false);
      return;
    }

    let cancelled = false;

    const setup = async () => {
      await registerPushServiceWorker().catch(() => null);

      const permissionGranted =
        typeof Notification !== "undefined" &&
        Notification.permission === "granted";

      const switchedInSession =
        Boolean(lastMemberId.current) && lastMemberId.current !== memberId;

      const boundMemberId = window.localStorage.getItem(PUSH_BOUND_MEMBER_KEY);
      const switchedAcrossSessions =
        boundMemberId !== null && boundMemberId !== memberId;

      if (permissionGranted && (switchedInSession || switchedAcrossSessions)) {
        await rebindBrowserPushIfEnabled().catch(() => undefined);
      }

      if (permissionGranted) {
        window.localStorage.setItem(PUSH_BOUND_MEMBER_KEY, memberId);
      }

      lastMemberId.current = memberId;

      if (cancelled) {
        return;
      }

      const dismissed =
        window.localStorage.getItem(pushPromptDismissKey(memberId)) === "1";

      if (dismissed) {
        setVisible(false);
        return;
      }

      // Chrome/Safari on iOS only support Web Push after Add to Home Screen.
      if (needsIosHomeScreenInstall()) {
        setIosHint(true);
        setVisible(true);
        return;
      }

      if (isBrowserPushSupported() && Notification.permission === "default") {
        setIosHint(false);
        setVisible(true);
        return;
      }

      setVisible(false);
    };

    void setup();

    return () => {
      cancelled = true;
    };
  }, [memberId]);

  const dismiss = () => {
    if (memberId) {
      window.localStorage.setItem(pushPromptDismissKey(memberId), "1");
    }

    setVisible(false);
  };

  const enable = async () => {
    try {
      await enableBrowserPush();

      if (memberId) {
        window.localStorage.setItem(pushPromptDismissKey(memberId), "1");
        window.localStorage.setItem(PUSH_BOUND_MEMBER_KEY, memberId);
      }

      setVisible(false);
      toast.success(t("users.profile.push.enabledToast"));
    } catch {
      toast.error(t("users.profile.push.errorToast"));
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <>
      <div
        className="relative mx-4 mt-4 overflow-hidden rounded-lg border border-border bg-card shadow-sm"
        role="status"
      >
        <div
          className="absolute inset-y-0 left-0 w-1.5 bg-primary"
          aria-hidden
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="absolute right-1 top-1 size-8 text-muted-foreground"
          onClick={dismiss}
          aria-label={t("dashboard.pushPrompt.dismiss")}
        >
          <X className="size-4" />
        </Button>
        <div className="flex flex-col gap-3 p-3 pl-4 pr-10 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pr-12">
          <div className="flex min-w-0 items-start gap-3 sm:items-center">
            <Bell
              className="mt-0.5 size-5 shrink-0 text-primary sm:mt-0"
              strokeWidth={2}
              aria-hidden
            />
            <div className="space-y-1">
              <p className="text-base font-medium leading-snug">
                {iosHint
                  ? t("dashboard.pushPrompt.iosTitle")
                  : t("dashboard.pushPrompt.title")}
              </p>
              <p className="text-sm text-muted-foreground">
                {iosHint
                  ? t("dashboard.pushPrompt.iosDescription")
                  : t("dashboard.pushPrompt.description")}
              </p>
            </div>
          </div>
          <div className="flex w-full shrink-0 sm:w-auto">
            {iosHint ? (
              <Button
                size="sm"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setHowToOpen(true)}
              >
                {t("dashboard.pushPrompt.showMeHow")}
              </Button>
            ) : (
              <Button
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => void enable()}
              >
                {t("dashboard.pushPrompt.enable")}
              </Button>
            )}
          </div>
        </div>
      </div>
      <IosAddToHomeScreenDialog open={howToOpen} onOpenChange={setHowToOpen} />
    </>
  );
}
