import * as z from "zod";
import { Customer } from "../customers";
import { WithDatabaseId, WithOrganizationId } from "../database";
import {
  asOptinalNumberField,
  Prettify,
  zNonEmptyString,
  zObjectId,
  zUniqueArray,
} from "../utils";
import { isRequiredOptionTypes } from "./appointment-option";

export const appointmentPackageStatuses = ["active", "inactive"] as const;
export type AppointmentPackageStatus =
  (typeof appointmentPackageStatuses)[number];

export const customerPackageStatuses = [
  "active",
  "exhausted",
  "expired",
  "cancelled",
] as const;
export type CustomerPackageStatus = (typeof customerPackageStatuses)[number];

export const packagePurchaseChannels = ["customer", "admin"] as const;
export type PackagePurchaseChannel = (typeof packagePurchaseChannels)[number];

export const packageErrorCodes = [
  "package_not_found",
  "package_inactive",
  "package_not_public",
  "customer_package_not_found",
  "customer_package_inactive",
  "customer_package_expired",
  "customer_package_exhausted",
  "customer_package_cancelled",
  "insufficient_credits",
  "option_not_included",
  "member_not_eligible",
  "purchase_limit_reached",
  "already_issued",
  "already_redeemed",
  "already_restored",
  "no_redemption_to_restore",
  "has_purchases",
  "payment_required",
] as const;
export type PackageErrorCode = (typeof packageErrorCodes)[number];

export class PackageError extends Error {
  public readonly code: PackageErrorCode;

  constructor(code: PackageErrorCode, message?: string) {
    super(message ?? code);
    this.name = "PackageError";
    this.code = code;
  }
}

export const appointmentPackageItemSchema = z.object({
  _id: zObjectId().optional(),
  optionId: zObjectId("validation.package.items.optionId.required"),
  credits: z.coerce
    .number<number>()
    .int("validation.package.items.credits.integer")
    .min(1, "validation.package.items.credits.min"),
  creditsPerRedemption: z.coerce
    .number<number>()
    .int("validation.package.items.creditsPerRedemption.integer")
    .min(1, "validation.package.items.creditsPerRedemption.min")
    .optional(),
});

export type AppointmentPackageItemInput = z.infer<
  typeof appointmentPackageItemSchema
>;

export type AppointmentPackageItem = Prettify<
  Required<
    Pick<AppointmentPackageItemInput, "_id" | "optionId" | "credits">
  > & {
    creditsPerRedemption: number;
  }
>;

export const appointmentPackageSchema = z.object({
  name: zNonEmptyString(
    "validation.package.name.required",
    2,
    256,
    "validation.package.name.max",
  ),
  description: zNonEmptyString(
    "validation.package.description.required",
    2,
    1024,
    "validation.package.description.max",
  ),
  price: z.coerce.number<number>().min(0, "validation.package.price.min"),
  items: z
    .array(appointmentPackageItemSchema)
    .min(1, "validation.package.items.min"),
  validityMonths: asOptinalNumberField(
    z.coerce
      .number<number>()
      .int("validation.package.validityMonths.integer")
      .min(1, "validation.package.validityMonths.min")
      .max(120, "validation.package.validityMonths.max"),
  ),
  isPublic: z.coerce.boolean<boolean>().optional(),
  maxPurchasesPerCustomer: asOptinalNumberField(
    z.coerce
      .number<number>()
      .int("validation.package.maxPurchasesPerCustomer.integer")
      .min(1, "validation.package.maxPurchasesPerCustomer.min"),
  ),
  eligibleMemberIds: zUniqueArray(
    z.array(zObjectId()),
    (id) => id,
    "validation.package.eligibleMemberIds.unique",
  ).optional(),
  isAutoConfirm: z.enum(isRequiredOptionTypes).default("inherit"),
});

export type AppointmentPackageUpdateModel = z.infer<
  typeof appointmentPackageSchema
>;

export type AppointmentPackage = Prettify<
  WithOrganizationId<
    WithDatabaseId<
      Omit<AppointmentPackageUpdateModel, "items" | "eligibleMemberIds"> & {
        items: AppointmentPackageItem[];
        eligibleMemberIds?: string[];
        status: AppointmentPackageStatus;
        createdAt: Date;
        updatedAt: Date;
      }
    >
  >
>;

export type AppointmentPackageListModel = Prettify<
  AppointmentPackage & {
    soldCount: number;
  }
>;

export type CustomerPackageItemSnapshot = Prettify<
  AppointmentPackageItem & {
    optionName: string;
  }
>;

export type CustomerPackage = Prettify<
  WithOrganizationId<
    WithDatabaseId<{
      customerId: string;
      packageId: string;
      name: string;
      description: string;
      price: number;
      items: CustomerPackageItemSnapshot[];
      eligibleMemberIds?: string[];
      purchasedAt: Date;
      expiresAt?: Date;
      status: CustomerPackageStatus;
      paymentId?: string;
      paymentIntentId?: string;
      channel: PackagePurchaseChannel;
      remainingByItem: Record<string, number>;
      totalCredits: number;
      remainingCredits: number;
      createdAt: Date;
      updatedAt: Date;
    }>
  >
>;

export type CustomerPackageListModel = Prettify<
  CustomerPackage & {
    customer?: Customer;
    upcomingAppointmentIds?: string[];
    usedCredits: number;
  }
>;

export type AppointmentPackageUsage = {
  customerPackageId: string;
  name: string;
  itemId: string;
  credits: number;
  restored?: boolean;
};

export function isAppointmentCoveredByPackage(appointment: {
  packageUsage?: AppointmentPackageUsage;
}): boolean {
  return !!appointment.packageUsage && !appointment.packageUsage.restored;
}

export type PackageEligibilityInput = {
  customerPackage: CustomerPackage;
  optionId: string;
  memberId: string;
  appointmentDate: Date;
  optionStaffMemberIds: string[];
  now?: Date;
};

export type PackageEligibilityResult =
  | { ok: true; item: CustomerPackageItemSnapshot; credits: number }
  | { ok: false; code: PackageErrorCode };

export type PackageItemSummary = {
  optionId: string;
  name: string;
  credits: number;
  duration?: number;
};

export function summarizePackageItems(
  items: AppointmentPackageItem[] | undefined,
  options:
    | {
        _id: string;
        name: string;
        durationType?: "fixed" | "flexible";
        duration?: number;
        durationMin?: number;
      }[]
    | undefined,
): PackageItemSummary[] {
  if (!items?.length) return [];
  const byId = new Map((options ?? []).map((option) => [option._id, option]));
  return items.flatMap((item) => {
    const option = byId.get(item.optionId);
    if (!option) return [];
    const duration =
      option.durationType === "flexible" ? option.durationMin : option.duration;
    return [
      {
        optionId: item.optionId,
        name: option.name,
        credits: item.credits,
        duration,
      },
    ];
  });
}

export function creditsPerRedemptionForItem(
  item: Pick<AppointmentPackageItem, "creditsPerRedemption">,
): number {
  return item.creditsPerRedemption > 0 ? item.creditsPerRedemption : 1;
}

export function sumRemainingCredits(
  remainingByItem: Record<string, number> | undefined,
): number {
  if (!remainingByItem) return 0;
  return Object.values(remainingByItem).reduce(
    (sum, value) => sum + (value || 0),
    0,
  );
}

export function resolveCustomerPackageStatus(
  pkg: Pick<CustomerPackage, "status" | "remainingCredits" | "expiresAt">,
  now = new Date(),
): CustomerPackageStatus {
  if (pkg.status === "cancelled") return "cancelled";
  if (pkg.expiresAt && pkg.expiresAt < now) return "expired";
  if (pkg.remainingCredits <= 0) return "exhausted";
  return "active";
}

export function canUsePackageForAppointment(
  input: PackageEligibilityInput,
): PackageEligibilityResult {
  const now = input.now ?? new Date();
  const status = resolveCustomerPackageStatus(input.customerPackage, now);

  if (status === "cancelled") {
    return { ok: false, code: "customer_package_cancelled" };
  }
  if (status === "expired") {
    return { ok: false, code: "customer_package_expired" };
  }
  if (status === "exhausted") {
    return { ok: false, code: "customer_package_exhausted" };
  }

  const item = input.customerPackage.items.find(
    (entry) => entry.optionId === input.optionId,
  );
  if (!item) {
    return { ok: false, code: "option_not_included" };
  }

  const credits = creditsPerRedemptionForItem(item);
  const remaining = input.customerPackage.remainingByItem[item._id] ?? 0;
  if (remaining < credits) {
    return { ok: false, code: "insufficient_credits" };
  }

  const allowlist = input.customerPackage.eligibleMemberIds;
  if (allowlist?.length) {
    if (!allowlist.includes(input.memberId)) {
      return { ok: false, code: "member_not_eligible" };
    }
  }

  if (!input.optionStaffMemberIds.includes(input.memberId)) {
    return { ok: false, code: "member_not_eligible" };
  }

  return { ok: true, item, credits };
}

export function pickDefaultCustomerPackage(
  packages: CustomerPackage[],
): CustomerPackage | undefined {
  if (!packages.length) return undefined;
  return [...packages].sort((a, b) => {
    const aExp = a.expiresAt?.getTime() ?? Number.POSITIVE_INFINITY;
    const bExp = b.expiresAt?.getTime() ?? Number.POSITIVE_INFINITY;
    if (aExp !== bExp) return aExp - bExp;
    return a.purchasedAt.getTime() - b.purchasedAt.getTime();
  })[0];
}

export const packageAdjustRequestSchema = z.object({
  itemId: zObjectId().optional(),
  delta: z.coerce.number<number>().int().optional(),
  expiresAt: z.coerce.date<Date>().optional().nullable(),
  cancel: z.coerce.boolean<boolean>().optional(),
  reactivate: z.coerce.boolean<boolean>().optional(),
  reason: z.string().max(1024).optional(),
});

export type PackageAdjustRequest = z.infer<typeof packageAdjustRequestSchema>;
