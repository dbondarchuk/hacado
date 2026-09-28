import type { AllKeys } from "@hacado/i18n";
import type React from "react";

export type QuickLinkRenderItem = {
  id: string;
  /** Stable key for Redis usage ranking (survives app reinstall). */
  usageKey: string;
  labelKey: AllKeys;
  icon: React.ReactNode;
  href?: string;
  appId?: string;
  Action?: React.ComponentType<{
    appId?: string;
    label: string;
    icon: React.ReactNode;
    className?: string;
  }>;
  notificationsCountKey?: string;
};
