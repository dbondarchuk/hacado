"use server";

import { auth } from "@/app/auth";
import { getActor } from "@/app/utils";
import type { InstallServiceServerSnapshot } from "@/components/install/types";
import { getLoggerFactory } from "@hacado/logger";
import { ServicesContainer } from "@hacado/services";
import { resolvePlanTierFromOrganization } from "@hacado/services/billing";
import {
  appointmentAddonSchema,
  canCreateMoreServices,
  FREE_TIER_LIMITS,
  ServiceLimitReachedError,
  type AppointmentAddonUpdateModel,
  type AppointmentOptionUpdateModel,
} from "@hacado/types";
import { headers } from "next/headers";
import * as z from "zod";
import { getDefaultBookingConfiguration } from "../default-booking";

function getFlexibleDurationBounds(baseMinutes: number): {
  durationMin: number;
  durationMax: number;
  durationStep: number;
} {
  const logger = getLoggerFactory("InstallActions")(
    "installFlexibleDurationBounds",
  );
  logger.debug({ baseMinutes }, "Calculating flexible duration bounds");
  const durationMin = Math.max(1, Math.floor(baseMinutes));
  const durationStep = 15;
  let durationMax = Math.min(
    Math.max(durationMin * 6, durationMin + 180),
    24 * 60,
  );
  if (durationMax < durationMin) {
    durationMax = durationMin;
  }
  logger.debug(
    { durationMin, durationMax, durationStep },
    "Calculated flexible duration bounds",
  );
  return { durationMin, durationMax, durationStep };
}

const serviceReplaceRowSchema = z.object({
  priceType: z.enum(["fixed", "per_hour"]),
  name: z.string().min(2).max(256),
  description: z.string().min(2).max(1024),
  duration: z.coerce.number().int().min(1),
  price: z.coerce.number().min(1).optional(),
  pricePerHour: z.coerce.number().min(1).optional(),
});

const replaceServicesInputSchema = z.array(serviceReplaceRowSchema).min(1);

export type ReplaceServicesInput = z.infer<typeof replaceServicesInputSchema>;

export async function replaceServices(
  rows: ReplaceServicesInput,
): Promise<{ ok: true; optionIds: string[] } | { ok: false; code: string }> {
  const logger = getLoggerFactory("InstallActions")("replaceServices");
  logger.debug({ count: rows.length }, "Replacing services");
  const parsed = replaceServicesInputSchema.safeParse(rows);
  if (!parsed.success) {
    logger.error({ error: parsed.error }, "Invalid replace services input");
    return { ok: false, code: "invalid_input" };
  }

  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  const organizationId = (session?.user as { organizationId?: string })
    ?.organizationId;
  const memberId = (session?.user as { memberId?: string })?.memberId;
  if (!session?.user || !organizationId || !memberId) {
    logger.error({ session, organizationId, memberId }, "Unauthorized");
    return { ok: false, code: "unauthorized" };
  }

  const source = await getActor();

  const services = ServicesContainer(organizationId, true);
  const organization = await services.organizationService.getOrganization();
  const planTier = resolvePlanTierFromOrganization(organization);
  if (!canCreateMoreServices(planTier, parsed.data.length - 1)) {
    logger.warn(
      { planTier, count: parsed.data.length, limit: FREE_TIER_LIMITS.services },
      "Service limit exceeded during install",
    );
    return { ok: false, code: "service_limit_reached" };
  }

  let booking =
    (await services.configurationService.getConfiguration("booking")) ?? null;
  if (!booking || Object.keys(booking).length === 0) {
    booking = getDefaultBookingConfiguration();
  }

  const oldIds = (booking.options ?? [])
    .map((o) => o.id)
    .filter((id): id is string => Boolean(id));

  for (const id of oldIds) {
    const opt = await services.servicesService.getOption(id);
    const addonIds = opt?.addons?.map((a) => a.id).filter(Boolean) ?? [];
    if (addonIds.length)
      await services.servicesService.deleteAddons(addonIds, source);
  }

  const staff = [{ memberId }];
  const newIds: string[] = [];
  for (const row of parsed.data) {
    const d = Math.max(1, Math.floor(row.duration));
    let option: AppointmentOptionUpdateModel;
    if (row.priceType === "fixed") {
      option = {
        name: row.name.trim().slice(0, 256),
        description: row.description.trim().slice(0, 1024),
        durationType: "fixed",
        duration: d,
        price:
          row.price !== undefined && !Number.isNaN(row.price) && row.price >= 1
            ? row.price
            : undefined,
        requireDeposit: "inherit",
        isOnline: false,
        isAutoConfirm: "inherit",
        duplicateAppointmentCheck: { enabled: false },
        cancellationPolicy: {
          withDeposit: { type: "inherit" },
          withoutDeposit: { type: "inherit" },
        },
        reschedulePolicy: { type: "inherit" },
        staff,
      };
    } else {
      const bounds = getFlexibleDurationBounds(d);
      option = {
        name: row.name.trim().slice(0, 256),
        description: row.description.trim().slice(0, 1024),
        durationType: "flexible",
        durationMin: bounds.durationMin,
        durationMax: bounds.durationMax,
        durationStep: bounds.durationStep,
        pricePerHour:
          row.pricePerHour !== undefined &&
          !Number.isNaN(row.pricePerHour) &&
          row.pricePerHour >= 1
            ? row.pricePerHour
            : undefined,
        requireDeposit: "inherit",
        isOnline: false,
        isAutoConfirm: "inherit",
        duplicateAppointmentCheck: { enabled: false },
        cancellationPolicy: {
          withDeposit: {
            type: "inherit",
          },
          withoutDeposit: {
            type: "inherit",
          },
        },
        reschedulePolicy: {
          type: "inherit",
        },
        staff,
      };
    }

    try {
      const created = await services.servicesService.createOption(
        option,
        source,
      );
      newIds.push(created._id);
    } catch (e) {
      if (newIds.length)
        await services.servicesService.deleteOptions(newIds, source);
      if (e instanceof ServiceLimitReachedError) {
        return { ok: false, code: "service_limit_reached" };
      }
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("Name already exists"))
        return { ok: false, code: "duplicate_name" };
      logger.error({ msg }, "Create failed");
      return { ok: false, code: "create_failed" };
    }
  }

  if (oldIds.length)
    await services.servicesService.deleteOptions(oldIds, source);

  const fresh =
    (await services.configurationService.getConfiguration("booking")) ?? null;
  const base =
    fresh && Object.keys(fresh).length > 0
      ? fresh
      : getDefaultBookingConfiguration();
  await services.configurationService.setConfiguration(
    "booking",
    {
      ...base,
      options: newIds.map((id) => ({ id })),
    },
    source,
  );
  logger.debug(
    { organizationId, oldCount: oldIds.length, newCount: newIds.length },
    "Replaced services",
  );
  return { ok: true, optionIds: newIds };
}

const addonsInputSchema = z.array(appointmentAddonSchema);

export async function createAddons(
  addons: AppointmentAddonUpdateModel[],
): Promise<{ ok: true; ids: string[] } | { ok: false; code: string }> {
  const logger = getLoggerFactory("InstallActions")("createAddons");
  logger.debug({ count: addons.length }, "Creating addons");
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  const organizationId = (session?.user as { organizationId?: string })
    ?.organizationId;
  if (!session?.user || !organizationId) {
    logger.error({ session, organizationId }, "Unauthorized");
    return { ok: false, code: "unauthorized" };
  }

  const source = await getActor();

  const parsedAddons = addonsInputSchema.safeParse(addons);
  if (!parsedAddons.success) {
    logger.error({ error: parsedAddons.error }, "Invalid addons input");
    return { ok: false, code: "invalid_input" };
  }

  const services = ServicesContainer(organizationId, true);
  const ids: string[] = [];
  for (const addon of parsedAddons.data) {
    const created = await services.servicesService.createAddon(addon, source);
    ids.push(created._id);
  }
  logger.debug({ organizationId, createdCount: ids.length }, "Created addons");
  return { ok: true, ids };
}

export async function replaceAddonsForOption(
  optionId: string,
  addons: AppointmentAddonUpdateModel[],
): Promise<{ ok: true; ids: string[] } | { ok: false; code: string }> {
  const logger = getLoggerFactory("InstallActions")("replaceAddonsForOption");
  logger.debug(
    { optionId, count: addons.length },
    "Replacing addons for option",
  );
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  const organizationId = (session?.user as { organizationId?: string })
    ?.organizationId;
  if (!session?.user || !organizationId) {
    logger.error({ session, organizationId }, "Unauthorized");
    return { ok: false, code: "unauthorized" };
  }

  const source = await getActor();

  const parsedAddons = addonsInputSchema.safeParse(addons);
  if (!parsedAddons.success) {
    logger.error({ error: parsedAddons.error }, "Invalid addons input");
    return { ok: false, code: "invalid_input" };
  }

  const services = ServicesContainer(organizationId, true);
  const existing = await services.servicesService.getOption(optionId);
  if (!existing) {
    logger.error({ optionId }, "Option not found");
    return { ok: false, code: "not_found" };
  }

  const oldIds = existing.addons?.map((a) => a.id).filter(Boolean) ?? [];
  if (oldIds.length)
    await services.servicesService.deleteAddons(oldIds, source);
  if (!parsedAddons.data.length) {
    logger.debug({ optionId }, "Removed addons and left option without addons");
    return { ok: true, ids: [] };
  }

  const ids: string[] = [];
  for (const addon of parsedAddons.data) {
    const created = await services.servicesService.createAddon(addon, source);
    ids.push(created._id);
  }
  logger.debug(
    { optionId, createdCount: ids.length },
    "Replaced addons for option",
  );
  return { ok: true, ids };
}

export async function getInstallServicesSnapshot(): Promise<
  InstallServiceServerSnapshot[]
> {
  const logger = getLoggerFactory("InstallActions")(
    "getInstallServicesSnapshot",
  );
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  const organizationId = (session?.user as { organizationId?: string })
    ?.organizationId;
  if (!session?.user || !organizationId) {
    logger.error({ session, organizationId }, "Unauthorized");
    return [];
  }

  const services = ServicesContainer(organizationId, true);
  const booking =
    (await services.configurationService.getConfiguration("booking")) ?? null;
  const ids = (booking?.options ?? [])
    .map((o) => o.id)
    .filter((id): id is string => Boolean(id));

  const rows: InstallServiceServerSnapshot[] = [];
  for (const id of ids) {
    const option = await services.servicesService.getOption(id);
    if (!option) continue;

    const anyOption = option as Record<string, unknown>;
    const name =
      typeof anyOption.name === "string" ? anyOption.name.trim() : "";
    const description =
      typeof anyOption.description === "string"
        ? anyOption.description.trim()
        : "";
    const durationType: "fixed" | "flexible" =
      anyOption.durationType === "flexible" ? "flexible" : "fixed";
    const priceType = durationType === "flexible" ? "per_hour" : "fixed";
    let duration = 60;
    let price: number | undefined;
    let pricePerHour: number | undefined;
    if (durationType === "flexible") {
      duration =
        typeof anyOption.durationMin === "number" ? anyOption.durationMin : 60;
      pricePerHour =
        typeof anyOption.pricePerHour === "number"
          ? anyOption.pricePerHour
          : undefined;
    } else {
      duration =
        typeof anyOption.duration === "number" ? anyOption.duration : 60;
      price = typeof anyOption.price === "number" ? anyOption.price : undefined;
    }

    rows.push({
      optionId: id,
      name,
      description,
      duration,
      priceType,
      ...(typeof price === "number" ? { price } : {}),
      ...(typeof pricePerHour === "number" ? { pricePerHour } : {}),
    });
  }
  logger.debug(
    { organizationId, count: rows.length },
    "Resolved services snapshot",
  );
  return rows;
}

export async function getInstallServiceOptionSnapshot(
  optionId: string,
): Promise<
  | {
      ok: true;
      data: {
        name: string;
        description: string;
        duration: number;
        priceType: "fixed" | "per_hour";
        price?: number;
        pricePerHour?: number;
      };
    }
  | { ok: false; code: string }
> {
  const logger = getLoggerFactory("InstallActions")(
    "getInstallServiceOptionSnapshot",
  );
  logger.debug({ optionId }, "Resolving service option snapshot");
  if (!optionId || typeof optionId !== "string") {
    logger.error({ optionId }, "Invalid option id");
    return { ok: false, code: "invalid_input" };
  }
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  const organizationId = (session?.user as { organizationId?: string })
    ?.organizationId;
  if (!session?.user || !organizationId) {
    logger.error({ session, organizationId }, "Unauthorized");
    return { ok: false, code: "unauthorized" };
  }

  const services = ServicesContainer(organizationId, true);
  const option = await services.servicesService.getOption(optionId);
  if (!option) {
    logger.error({ optionId, organizationId }, "Option not found");
    return { ok: false, code: "not_found" };
  }

  const name = typeof option.name === "string" ? option.name : "";
  const description =
    typeof option.description === "string" ? option.description : "";
  const priceType = option.durationType === "flexible" ? "per_hour" : "fixed";
  let duration = 60;
  let price: number | undefined;
  let pricePerHour: number | undefined;
  if (option.durationType === "flexible") {
    duration = typeof option.durationMin === "number" ? option.durationMin : 60;
    pricePerHour =
      typeof option.pricePerHour === "number" ? option.pricePerHour : undefined;
  } else {
    duration = typeof option.duration === "number" ? option.duration : 60;
    price = typeof option.price === "number" ? option.price : undefined;
  }

  const result = {
    ok: true,
    data: {
      name: name.trim(),
      description: description.trim(),
      duration,
      priceType,
      ...(typeof price === "number" ? { price } : {}),
      ...(typeof pricePerHour === "number" ? { pricePerHour } : {}),
    },
  } as const;
  logger.debug(
    { optionId, organizationId },
    "Resolved service option snapshot",
  );
  return result;
}
