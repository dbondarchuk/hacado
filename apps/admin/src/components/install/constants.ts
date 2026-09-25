import {
  DEFAULT_WEB_PRIMARY_FONT,
  DEFAULT_WEB_SECONDARY_FONT,
} from "@hacado/utils";
import { getDefaultInstallSchedule } from "./default-schedule";
import type { PersistedState } from "./types";

export const STORAGE_KEY = "hacado-install-v1";

/** Catalog “Use this template” preference — survives signup → checkout → install. */
export const PREFERRED_WEBSITE_PACK_KEY = "hacado-preferred-website-pack";

/** Query param for direct links, e.g. `/auth/signup?template=nails_c`. */
export const PREFERRED_WEBSITE_PACK_PARAM = "template";

export function preferredWebsitePackHref(path: string, packId: string): string {
  const id = packId.trim();
  if (!id) return path;
  const url = new URL(path, "http://local.invalid");
  url.searchParams.set(PREFERRED_WEBSITE_PACK_PARAM, id);
  return `${url.pathname}${url.search}`;
}

export function rememberPreferredWebsitePack(packId: string) {
  if (typeof window === "undefined") return;
  const id = packId.trim();
  if (!id) return;
  try {
    window.localStorage.setItem(PREFERRED_WEBSITE_PACK_KEY, id);
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const prev = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...prev,
        websitePackId: id,
        catalogPreferredPackId: id,
      }),
    );
  } catch {
    /* ignore quota / private mode */
  }
}

export function readPreferredWebsitePack(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const fromPreferred = window.localStorage
      .getItem(PREFERRED_WEBSITE_PACK_KEY)
      ?.trim();
    if (fromPreferred) return fromPreferred;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      catalogPreferredPackId?: unknown;
      websitePackId?: unknown;
    };
    if (
      typeof parsed.catalogPreferredPackId === "string" &&
      parsed.catalogPreferredPackId.trim()
    ) {
      return parsed.catalogPreferredPackId.trim();
    }
    if (
      typeof parsed.websitePackId === "string" &&
      parsed.websitePackId.trim()
    ) {
      return parsed.websitePackId.trim();
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function clearPreferredWebsitePack() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PREFERRED_WEBSITE_PACK_KEY);
  } catch {
    /* ignore */
  }
}

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
    industry: "",
    address: {},
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
    websitePackId: "",
    catalogPreferredPackId: "",
  };
}
