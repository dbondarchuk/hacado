import { DashboardTabInjectorApp } from "@hacado/types";
import { WAITLIST_APP_NAME } from "../apps/waitlist/const";
import { WaitlistNotificationDashboardTabInjector } from "../apps/waitlist/dashboard-tab-injector";

export const DashboardTabInjectorApps: Record<string, DashboardTabInjectorApp> =
  {
    [WAITLIST_APP_NAME]: WaitlistNotificationDashboardTabInjector,
  };
