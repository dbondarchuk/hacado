import { DashboardQuickLinkInjectorApp } from "@hacado/types";
import { BLOG_APP_NAME } from "../apps/blog/const";
import { BlogQuickLinkInjector } from "../apps/blog/quick-link-injector";
import { FORMS_APP_NAME } from "../apps/forms/const";
import { FormsQuickLinkInjector } from "../apps/forms/quick-link-injector";
import { GIFT_CARD_STUDIO_APP_NAME } from "../apps/gift-card-studio/const";
import { GiftCardStudioQuickLinkInjector } from "../apps/gift-card-studio/quick-link-injector";
import { WAITLIST_APP_NAME } from "../apps/waitlist/const";
import { WaitlistQuickLinkInjector } from "../apps/waitlist/quick-link-injector";
import { WEEKLY_SCHEDULE_APP_NAME } from "../apps/weekly-schedule/const";
import { WeeklyScheduleQuickLinkInjector } from "../apps/weekly-schedule/quick-link-injector";

export const DashboardQuickLinkInjectorApps: Record<
  string,
  DashboardQuickLinkInjectorApp
> = {
  [BLOG_APP_NAME]: BlogQuickLinkInjector,
  [FORMS_APP_NAME]: FormsQuickLinkInjector,
  [GIFT_CARD_STUDIO_APP_NAME]: GiftCardStudioQuickLinkInjector,
  [WAITLIST_APP_NAME]: WaitlistQuickLinkInjector,
  [WEEKLY_SCHEDULE_APP_NAME]: WeeklyScheduleQuickLinkInjector,
};
