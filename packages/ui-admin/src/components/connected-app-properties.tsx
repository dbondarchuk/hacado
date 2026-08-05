"use client";
import { appStatusTextClasses, AvailableApps } from "@hacado/app-store";
import { useI18n } from "@hacado/i18n/client";
import { ConnectedApp } from "@hacado/types";
import { cn } from "@hacado/ui";

export const ConnectedAppAccount: React.FC<{
  account: ConnectedApp["account"];
  className?: string;
}> = ({ account, className }) => {
  if (account && "targetAppName" in account) {
    return (
      <ConnectedAppNameAndLogo
        appName={account.targetAppName}
        nameClassName={cn("text-xs text-muted-foreground", className)}
      />
    );
  }

  const parts = [
    (account as any)?.serverUrl,
    account?.username,
    account?.additional,
  ].filter((p) => !!p);

  return parts.length > 0 ? (
    <span className={cn("text-xs text-muted-foreground", className)}>
      {parts.join(" / ")}
    </span>
  ) : (
    <span />
  );
};

export const ConnectedAppStatusMessage: React.FC<{
  status: ConnectedApp["status"];
  statusText: ConnectedApp["statusText"];
  className?: string;
}> = ({ status, statusText, className }) => {
  const tApps = useI18n("apps");
  const t = useI18n();
  return (
    <div
      className={cn(
        "break-all text-xs",
        appStatusTextClasses[status],
        className,
      )}
    >
      {tApps("common.statusMessage", {
        status: tApps(`status.${status}`),
        statusText:
          typeof statusText === "string"
            ? t.has(statusText)
              ? t(statusText)
              : statusText
            : t(statusText.key, statusText.args),
      })}
    </div>
  );
};

export const ConnectedAppNameAndLogo: React.FC<{
  appName: ConnectedApp["name"];
  className?: string;
  logoClassName?: string;
  nameClassName?: string;
}> = ({ appName, className, logoClassName, nameClassName }) => {
  const App = AvailableApps[appName];
  const t = useI18n();
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <App.Logo className={cn("size-3.5", logoClassName)} />
      <span className={cn("text-xs", nameClassName)}>{t(App.displayName)}</span>
    </div>
  );
};
