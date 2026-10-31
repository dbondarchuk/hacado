"use client";

import { AvailableApps } from "@hacado/app-store";
import { useI18n } from "@hacado/i18n/client";
import { ConnectedApp } from "@hacado/types/apps";
import {
  AppName,
  ConnectedAppAccount,
  ConnectedAppNameAndLogo,
  ConnectedAppStatusMessage,
} from "@hacado/ui-admin/connected-app-properties";
import { Button } from "@hacado/ui/button";
import { Link } from "@hacado/ui/link";
import {
  TooltipResponsive,
  TooltipResponsiveContent,
  TooltipResponsiveTrigger,
} from "@hacado/ui/tooltip-responsive";
import { RefreshCcw, Unplug } from "lucide-react";
import { AddOrUpdateAppButton } from "./add-or-update-app-dialog";
import { DeleteAppButton } from "./delete-app-button";

export type ConnectedAppRowProps = {
  app: ConnectedApp;
};

export const ConnectedAppRow: React.FC<ConnectedAppRowProps> = ({ app }) => {
  const appDescriptor = AvailableApps[app.name];
  const t = useI18n("apps");
  const updateText = t("common.updateApp");
  const statusIndicatorClass =
    app.status === "connected"
      ? "bg-green-500"
      : app.status === "pending"
        ? "bg-amber-500"
        : "bg-destructive";
  const statusIndicatorAnimation =
    app.status === "connected"
      ? "animate-pulse"
      : app.status === "pending"
        ? "animate-bounce"
        : "animate-ping";
  const statusLabel = t(`status.${app.status}`);

  return (
    <div className="w-full rounded-lg border bg-card flex flex-col">
      <div className="flex flex-row items-center justify-between gap-2 border-b px-3 py-2.5 md:px-4 md:py-3">
        <div className="flex items-center gap-2 min-w-0">
          <TooltipResponsive>
            <TooltipResponsiveTrigger>
              <span
                className={`size-2.5 shrink-0 rounded-full ${statusIndicatorClass} ${statusIndicatorAnimation}`}
              />
            </TooltipResponsiveTrigger>
            <TooltipResponsiveContent side="right">
              {statusLabel}
            </TooltipResponsiveContent>
          </TooltipResponsive>
          <TooltipResponsive>
            <TooltipResponsiveTrigger>
              <ConnectedAppNameAndLogo
                appName={app.name}
                className="min-w-0"
                logoClassName="size-4 shrink-0"
                nameClassName="text-base truncate"
              />
            </TooltipResponsiveTrigger>
            <TooltipResponsiveContent side="bottom">
              <AppName appName={app.name} />
            </TooltipResponsiveContent>
          </TooltipResponsive>
        </div>
        <div className="flex items-center gap-1.5 flex-row md:flex-wrap justify-end">
          {appDescriptor.type === "complex" && appDescriptor.settingsHref ? (
            <Link
              button
              href={`/dashboard/${appDescriptor.settingsHref}`}
              variant="secondary"
            >
              <RefreshCcw /> <span className="max-md:hidden">{updateText}</span>
            </Link>
          ) : (
            <AddOrUpdateAppButton app={app}>
              <Button variant="secondary" aria-label={updateText}>
                <RefreshCcw />{" "}
                <span className="max-md:hidden">{updateText}</span>
              </Button>
            </AddOrUpdateAppButton>
          )}
          <DeleteAppButton appId={app._id}>
            <Button
              variant="destructive"
              aria-label={t("common.disconnectApp")}
            >
              <Unplug />{" "}
              <span className="max-md:hidden">{t("common.disconnectApp")}</span>
            </Button>
          </DeleteAppButton>
        </div>
      </div>
      <div className="grid gap-2.5 px-3 py-2.5 md:px-4 md:py-3 md:grid-cols-2 flex-1">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Account
          </p>
          <ConnectedAppAccount account={app.account} className="break-all" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Status
          </p>
          <ConnectedAppStatusMessage
            status={app.status}
            statusText={app.statusText}
            className="break-all"
          />
        </div>
      </div>
    </div>
  );
};
