import {
  CALDAV_APP_NAME,
  GOOGLE_CALENDAR_APP_NAME,
  ICS_APP_NAME,
  OUTLOOK_APP_NAME,
} from "@hacado/app-store";
import { fontsNames, shiftsSchema, type ConnectedApp, type Schedule } from "@hacado/types";
import { getDefaultInstallSchedule } from "./default-schedule";
import {
  getCatalogProfession,
  getDefaultCatalogSeed,
  getProfessionIds,
  getServiceTemplate,
  INSTALL_CATALOG_DATA,
} from "./catalog";
import { emptyPersisted, newInstallServiceClientId } from "./constants";
import type {
  InstallPreferencesServerState,
  InstallServiceDraftItem,
  InstallServiceServerSnapshot,
  InstallWorkspaceServerState,
  PersistedState,
} from "./types";

const HEX_COLOR = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
const fontAllow = new Set(fontsNames);

export function applyInstallCalendarSnapshot(
  merged: PersistedState,
  apps: ConnectedApp[] | null | undefined,
): void {
  if (apps === undefined || apps === null) {
    return;
  }
  const map = new Map(apps.map((a) => [a.name, a]));
  const isConnected = (name: string) => map.get(name)?.status === "connected";
  merged.googleCal = isConnected(GOOGLE_CALENDAR_APP_NAME);
  merged.appleCal = isConnected(ICS_APP_NAME);
  merged.outlookCal = isConnected(OUTLOOK_APP_NAME);
  merged.caldavCal = isConnected(CALDAV_APP_NAME);
}

function normalizeInstallSchedule(raw: unknown): Schedule {
  const parsed = shiftsSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  return getDefaultInstallSchedule();
}

function normalizeInstallDraft(
  raw: Partial<InstallServiceDraftItem> & { clientId?: string },
): InstallServiceDraftItem {
  return {
    clientId:
      raw.clientId && raw.clientId.length > 0
        ? raw.clientId
        : newInstallServiceClientId(),
    optionId: raw.optionId,
    name: typeof raw.name === "string" ? raw.name : "",
    description: typeof raw.description === "string" ? raw.description : "",
    duration:
      typeof raw.duration === "number" && raw.duration >= 1 ? raw.duration : 60,
    price: typeof raw.price === "string" ? raw.price : "",
    pricePerHour: typeof raw.pricePerHour === "string" ? raw.pricePerHour : "",
    priceType: raw.priceType === "per_hour" ? "per_hour" : "fixed",
    source: raw.source === "template" ? "template" : "custom",
    businessCategory: raw.businessCategory,
    professionId: raw.professionId,
    serviceTemplateId: raw.serviceTemplateId,
  };
}

export function sanitizePersisted(
  partial: Partial<PersistedState> | undefined,
  serverWorkspace?: InstallWorkspaceServerState | null,
  serverServices?: InstallServiceServerSnapshot[] | null,
  serverCalendarApps?: ConnectedApp[] | null,
  serverPreferences?: InstallPreferencesServerState | null,
  serverSchedule?: Schedule | null,
): PersistedState {
  const seed = getDefaultCatalogSeed();
  const base = emptyPersisted(seed);

  const fromDb: Partial<PersistedState> = {};
  if (serverWorkspace) {
    const s = serverWorkspace;
    if (s.businessName) fromDb.businessName = s.businessName;
    if (typeof s.address === "string") fromDb.address = s.address;
    if (s.slug) fromDb.slug = s.slug;
    if (s.timeZone) fromDb.timeZone = s.timeZone;
    if (s.language) fromDb.language = s.language;
    if (s.country) fromDb.country = s.country;
    if (s.currency) fromDb.currency = s.currency;
    if (s.primaryColorHex && HEX_COLOR.test(s.primaryColorHex)) {
      fromDb.primaryColorHex = s.primaryColorHex;
    }
    if (s.secondaryColorHex && HEX_COLOR.test(s.secondaryColorHex)) {
      fromDb.secondaryColorHex = s.secondaryColorHex;
    }
    if (s.primaryFont && fontAllow.has(s.primaryFont)) {
      fromDb.primaryFont = s.primaryFont;
    }
    if (s.secondaryFont && fontAllow.has(s.secondaryFont)) {
      fromDb.secondaryFont = s.secondaryFont;
    }
    if (typeof s.installLogo === "string" && s.installLogo.length > 0) {
      fromDb.installLogo = s.installLogo;
    }
  }
  if (serverPreferences) {
    const s = serverPreferences;
    if (
      s.inviteMode &&
      (s.inviteMode === "none" ||
        s.inviteMode === "email" ||
        s.inviteMode === "calendar_writer")
    ) {
      fromDb.inviteMode = s.inviteMode;
    }
    if (typeof s.inviteCalendarWriterAppId === "string") {
      fromDb.inviteCalendarWriterAppId = s.inviteCalendarWriterAppId;
    }
    if (typeof s.optCustomerEmailNotifications === "boolean") {
      fromDb.optCustomerEmailNotifications = s.optCustomerEmailNotifications;
    }
    if (typeof s.optCustomerTextMessageNotifications === "boolean") {
      fromDb.optCustomerTextMessageNotifications =
        s.optCustomerTextMessageNotifications;
    }
    if (typeof s.optAppointmentNotifications === "boolean") {
      fromDb.optAppointmentNotifications = s.optAppointmentNotifications;
    }
    if (typeof s.optWaitlist === "boolean") {
      fromDb.optWaitlist = s.optWaitlist;
    }
    if (typeof s.optWaitlistNotifications === "boolean") {
      fromDb.optWaitlistNotifications = s.optWaitlistNotifications;
    }
    if (typeof s.optBlog === "boolean") {
      fromDb.optBlog = s.optBlog;
    }
    if (typeof s.optForms === "boolean") {
      fromDb.optForms = s.optForms;
    }
    if (typeof s.optGiftCardStudio === "boolean") {
      fromDb.optGiftCardStudio = s.optGiftCardStudio;
    }
    if (typeof s.optMyCabinet === "boolean") {
      fromDb.optMyCabinet = s.optMyCabinet;
    }
    if (typeof s.acceptPayments === "boolean") {
      fromDb.acceptPayments = s.acceptPayments;
    }
    if (typeof s.autoConfirmBookings === "boolean") {
      fromDb.autoConfirmBookings = s.autoConfirmBookings;
    }
    if (typeof s.depositEnabled === "boolean") {
      fromDb.depositEnabled = s.depositEnabled;
    }
    if (typeof s.depositPercent === "string" && s.depositPercent.trim()) {
      fromDb.depositPercent = s.depositPercent.trim();
    }
    if (typeof s.allowCancelReschedule === "boolean") {
      fromDb.allowCancelReschedule = s.allowCancelReschedule;
    }
  }

  const partialMerged =
    !partial || typeof partial !== "object"
      ? fromDb
      : { ...partial, ...fromDb };

  const merged: PersistedState = { ...base, ...partialMerged };

  const serverRows =
    serverServices && serverServices.length > 0 ? serverServices : null;
  const partialServices = Array.isArray(
    (partialMerged as Partial<PersistedState>).installServices,
  )
    ? ((partialMerged as Partial<PersistedState>).installServices as unknown[])
    : [];

  if (serverRows) {
    merged.installServices = serverRows.map((s) =>
      normalizeInstallDraft({
        clientId: s.optionId,
        optionId: s.optionId,
        name: s.name,
        description: s.description,
        duration: s.duration,
        priceType: s.priceType,
        price: typeof s.price === "number" ? String(s.price) : "",
        pricePerHour:
          typeof s.pricePerHour === "number" ? String(s.pricePerHour) : "",
        source: "custom",
      }),
    );
  } else if (partialServices.length > 0) {
    merged.installServices = partialServices.map((row) =>
      normalizeInstallDraft(row as Partial<InstallServiceDraftItem>),
    );
  } else if (merged.serviceOptionId) {
    merged.installServices = [
      normalizeInstallDraft({
        clientId: merged.serviceOptionId,
        optionId: merged.serviceOptionId,
        name: merged.serviceCustomName ?? "",
        description: merged.serviceCustomDescription ?? "",
        duration: merged.serviceDuration,
        priceType: "fixed",
        price: merged.servicePrice,
        pricePerHour: "",
        source: merged.serviceIsCustom ? "custom" : "template",
        ...(!merged.serviceIsCustom
          ? {
              businessCategory: merged.businessCategory,
              professionId: merged.professionId,
              serviceTemplateId: merged.serviceTemplateId,
            }
          : {}),
      }),
    ];
  } else {
    merged.installServices = [];
  }

  if (!INSTALL_CATALOG_DATA[merged.businessCategory]) {
    merged.businessCategory = seed.businessCategory;
    merged.professionId = seed.professionId;
    merged.serviceTemplateId = seed.serviceTemplateId;
  }

  let prof = getCatalogProfession(merged.businessCategory, merged.professionId);
  if (!prof) {
    const ids = getProfessionIds(merged.businessCategory);
    merged.professionId = ids[0] ?? "";
    prof = getCatalogProfession(merged.businessCategory, merged.professionId);
  }

  let tmpl = getServiceTemplate(
    merged.businessCategory,
    merged.professionId,
    merged.serviceTemplateId,
  );
  if (!tmpl && prof?.services[0]) {
    merged.serviceTemplateId = prof.services[0].id;
    tmpl = prof.services[0];
  }

  const addonIds = (tmpl?.addons ?? []).map((a) => a.id);
  const rawSel = (partialMerged as Partial<PersistedState>)
    .serviceSelectedAddonIds;
  const allowed = new Set(addonIds);
  if (rawSel === undefined) {
    merged.serviceSelectedAddonIds = [];
  } else {
    merged.serviceSelectedAddonIds = rawSel.filter((id) => allowed.has(id));
  }

  if (!HEX_COLOR.test(merged.primaryColorHex)) {
    merged.primaryColorHex = base.primaryColorHex;
  }
  if (!HEX_COLOR.test(merged.secondaryColorHex)) {
    merged.secondaryColorHex = base.secondaryColorHex;
  }
  if (!fontAllow.has(merged.primaryFont)) {
    merged.primaryFont = base.primaryFont;
  }
  if (!fontAllow.has(merged.secondaryFont)) {
    merged.secondaryFont = base.secondaryFont;
  }
  if (typeof merged.installLogo !== "string") {
    merged.installLogo = "";
  }

  // Backward compatibility with older install snapshots.
  const rawInviteMode = (partialMerged as any).inviteMode;
  if (rawInviteMode === "calendar") {
    merged.inviteMode = "calendar_writer";
  } else if (
    rawInviteMode !== "none" &&
    rawInviteMode !== "email" &&
    rawInviteMode !== "calendar_writer"
  ) {
    merged.inviteMode = base.inviteMode;
  }
  if (typeof merged.inviteCalendarWriterAppId !== "string") {
    merged.inviteCalendarWriterAppId = "";
  }
  const old = partialMerged as any;
  if (old.optReminders || old.optFollowups) {
    merged.optAppointmentNotifications = true;
  }

  applyInstallCalendarSnapshot(merged, serverCalendarApps);

  if (serverSchedule) {
    merged.installSchedule = normalizeInstallSchedule(serverSchedule);
  } else if (Array.isArray((partialMerged as Partial<PersistedState>).installSchedule)) {
    merged.installSchedule = normalizeInstallSchedule(
      (partialMerged as Partial<PersistedState>).installSchedule,
    );
  } else {
    merged.installSchedule = getDefaultInstallSchedule();
  }

  return merged;
}
