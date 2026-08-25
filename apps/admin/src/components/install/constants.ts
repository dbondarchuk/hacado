import {
  DEFAULT_WEB_PRIMARY_FONT,
  DEFAULT_WEB_SECONDARY_FONT,
} from "@hacado/utils";
import { getDefaultInstallSchedule } from "./default-schedule";
import type { PersistedState } from "./types";

export const STORAGE_KEY = "hacado-install-v1";

export function newInstallServiceClientId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `svc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function normalizeSlug(raw: string) {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function defaultPriceFromTemplate(prices: number[]) {
  if (!prices?.length) return "";
  const mid = prices[Math.floor(prices.length / 2)];
  return String(mid ?? prices[0]);
}

export function defaultDurationFromTemplate(durations: number[]) {
  return durations?.[0] ?? 60;
}

export function emptyPersisted(
  seed: Pick<
    PersistedState,
    | "businessCategory"
    | "professionId"
    | "serviceTemplateId"
    | "serviceDuration"
    | "servicePrice"
  >,
): PersistedState {
  return {
    step: 1,
    businessName: "",
    address: "",
    slug: "",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    businessCategory: seed.businessCategory,
    language: "en",
    country: "US",
    currency: "USD",
    autoConfirmBookings: false,
    professionId: seed.professionId,
    serviceTemplateId: seed.serviceTemplateId,
    installServices: [],
    installSchedule: getDefaultInstallSchedule(),
    serviceOptionId: undefined,
    serviceSelectedAddonIds: [],
    serviceIsCustom: false,
    serviceCustomName: "",
    serviceCustomDescription: "",
    serviceDuration: seed.serviceDuration,
    servicePrice: seed.servicePrice,
    googleCal: false,
    appleCal: false,
    outlookCal: false,
    caldavCal: false,
    inviteMode: "none",
    inviteCalendarWriterAppId: "",
    optCustomerEmailNotifications: false,
    optCustomerPackageEmailNotifications: false,
    optCustomerTextMessageNotifications: false,
    optAppointmentNotifications: false,
    optWaitlist: false,
    optWaitlistNotifications: false,
    optBlog: false,
    optForms: false,
    optGiftCardStudio: false,
    optMyCabinet: false,
    acceptPayments: false,
    paymentStripe: false,
    paymentPaypal: false,
    depositEnabled: false,
    depositPercent: "25",
    allowCancelReschedule: true,
    primaryColorHex: "#7c8b6f",
    secondaryColorHex: "#C98A4B",
    primaryFont: DEFAULT_WEB_PRIMARY_FONT,
    secondaryFont: DEFAULT_WEB_SECONDARY_FONT,
    installLogo: "",
  };
}
