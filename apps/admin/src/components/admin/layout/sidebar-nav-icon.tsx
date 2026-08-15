"use client";

import { useHasDashboardNotifications } from "@/app/dashboard/notifications-toast-stream";
import { cn, useSidebar } from "@hacado/ui";
import React from "react";

const NavIcon = ({
  children,
  className,
}: {
  children: React.ReactElement;
  className?: string;
}) => {
  return React.Children.map(children, (child) =>
    React.cloneElement(child, {
      ...(child?.props || {}),
      // @ts-ignore we have classname
      className,
    }),
  );
};

export const SidebarNavIcon: React.FC<{
  icon: React.ReactElement;
  notificationsCountKey?: string;
  notificationKeys?: Array<string | undefined>;
  className?: string;
}> = ({ icon, notificationsCountKey, notificationKeys, className }) => {
  const { state, isMobile } = useSidebar();
  const keys = notificationKeys ?? [notificationsCountKey];
  const hasNotification = useHasDashboardNotifications(keys);
  const showDot = !isMobile && state === "collapsed" && hasNotification;

  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <NavIcon className="size-[1.125rem] stroke-[1.5] text-primary/80">
        {icon}
      </NavIcon>
      {showDot ? (
        <span
          className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-primary ring-2 ring-sidebar"
          aria-hidden
        />
      ) : null}
    </span>
  );
};
