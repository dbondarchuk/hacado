"use client";

import { DashboardNotificationsBadge } from "@/app/dashboard/notifications-toast-stream";
import { AllKeys, useI18n } from "@hacado/i18n/client";
import { cn, useSidebar } from "@hacado/ui";

export const SidebarNavLabel: React.FC<{
  title: AllKeys;
  notificationsCountKey?: string;
  notificationKeys?: Array<string | undefined>;
  className?: string;
}> = ({ title, notificationsCountKey, notificationKeys, className }) => {
  const t = useI18n();
  const { state, isMobile } = useSidebar();
  const showCountBadge = isMobile || state === "expanded";
  const keys = notificationKeys ?? [notificationsCountKey];
  const hasKeys = keys.some(Boolean);

  return (
    <span className={cn("flex min-w-0 flex-1 items-center gap-1", className)}>
      <span className="truncate">{t(title)}</span>
      {showCountBadge && hasKeys ? (
        <DashboardNotificationsBadge notificationKeys={keys} />
      ) : null}
    </span>
  );
};
