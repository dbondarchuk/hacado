import type { Language } from "@hacado/i18n";
import type { Country, Currency, Schedule } from "@hacado/types";

export type WizardStep = "verify" | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type InstallServicePriceType = "fixed" | "per_hour";

/** One bookable service row in the install services step (draft). */
export type InstallServiceDraftItem = {
  clientId: string;
  optionId?: string;
  name: string;
  description: string;
  duration: number;
  /** Total price when `priceType` is `fixed`. */
  price: string;
  /** Hourly rate when `priceType` is `per_hour` (stored as flexible option in DB). */
  pricePerHour: string;
  priceType: InstallServicePriceType;
  source: "template" | "custom";
  businessCategory?: string;
  professionId?: string;
  serviceTemplateId?: string;
};

/** Services already stored for the org (from booking configuration). */
export type InstallServiceServerSnapshot = {
  optionId: string;
  name: string;
  description: string;
  duration: number;
  priceType: InstallServicePriceType;
  price?: number;
  pricePerHour?: number;
};

export type PersistedState = {
  step: WizardStep;
  businessName: string;
  address: string;
  slug: string;
  timeZone: string;
  businessCategory: string;
  language: Language;
  country: Country;
  currency: Currency;
  autoConfirmBookings: boolean;
  professionId: string;
  serviceTemplateId: string;
  /** Bookable services (services step); persisted to localStorage and synced to DB on Continue. */
  installServices: InstallServiceDraftItem[];
  /** Weekly working hours (schedule step); synced to schedule configuration on Continue. */
  installSchedule: Schedule;
  serviceOptionId?: string;
  /** Catalog template add-on ids the user wants to include (subset of selected service `addons`). */
  serviceSelectedAddonIds: string[];
  /** If true, user created/edited the service manually and we should treat the DB option as "custom". */
  serviceIsCustom: boolean;
  serviceCustomName: string;
  serviceCustomDescription: string;
  serviceDuration: number;
  servicePrice: string;
  googleCal: boolean;
  appleCal: boolean;
  outlookCal: boolean;
  caldavCal: boolean;
  inviteMode: "none" | "email" | "calendar_writer";
  inviteCalendarWriterAppId: string;
  optCustomerEmailNotifications: boolean;
  optCustomerTextMessageNotifications: boolean;
  optAppointmentNotifications: boolean;
  optWaitlist: boolean;
  optWaitlistNotifications: boolean;
  optBlog: boolean;
  optForms: boolean;
  optGiftCardStudio: boolean;
  optMyCabinet: boolean;
  acceptPayments: boolean;
  paymentStripe: boolean;
  paymentPaypal: boolean;
  depositEnabled: boolean;
  depositPercent: string;
  allowCancelReschedule: boolean;
  /** Brand colors saved to styling configuration (`primary` / `secondary` tokens). */
  primaryColorHex: string;
  secondaryColorHex: string;
  primaryFont: string;
  secondaryFont: string;
  /** Same shape as general `logo` (e.g. `/assets/…` or URL). */
  installLogo: string | null | undefined;
};

/** Fields saved on the server (org + general configuration) for install step 1 hydration. */
export type InstallWorkspaceServerState = Partial<
  Pick<
    PersistedState,
    | "businessName"
    | "address"
    | "slug"
    | "timeZone"
    | "language"
    | "country"
    | "currency"
    | "primaryColorHex"
    | "secondaryColorHex"
    | "primaryFont"
    | "secondaryFont"
    | "installLogo"
  >
>;

export type InstallPreferencesServerState = Partial<
  Pick<
    PersistedState,
    | "inviteMode"
    | "inviteCalendarWriterAppId"
    | "optCustomerEmailNotifications"
    | "optCustomerTextMessageNotifications"
    | "optAppointmentNotifications"
    | "optWaitlist"
    | "optWaitlistNotifications"
    | "optBlog"
    | "optForms"
    | "optGiftCardStudio"
    | "optMyCabinet"
    | "acceptPayments"
    | "autoConfirmBookings"
    | "depositEnabled"
    | "depositPercent"
    | "allowCancelReschedule"
  >
>;

export type CatalogServiceDef = {
  id: string;
  durations: number[];
  prices?: number[];
  recommended?: boolean;
  addons?: CatalogAddonDef[];
};

export type CatalogAddonDef = {
  id: string;
  duration?: number;
  suggestedPrice?: number;
};

export type CatalogProfessionDef = {
  tags: string[];
  services: CatalogServiceDef[];
};
