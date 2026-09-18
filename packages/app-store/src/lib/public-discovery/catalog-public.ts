import type { Language } from "@hacado/i18n";
import type {
  AppointmentChoice,
  AppointmentPackage,
  BookingCatalogNode,
  Currency,
  IServicesContainer,
  PublicStaffMember,
} from "@hacado/types";
import {
  minEffectiveDuration,
  minEffectivePrice,
  summarizePackageItems,
} from "@hacado/types";
import { formatAmountWithCurrency } from "@hacado/utils";

export type PublicCatalogService = {
  kind: "service";
  id: string;
  name: string;
  description: string;
  durationType: "fixed" | "flexible";
  /** Lowest effective price (or hourly rate for flexible). */
  price: number | undefined;
  /** Lowest effective duration in minutes (fixed services only). */
  duration: number | undefined;
  /** True when more than one active specialist can deliver the service. */
  isFromPricing: boolean;
  currency: Currency;
  language: Language;
  specialistNames: string[];
};

export type PublicCatalogPackageItem = {
  optionId: string;
  name: string;
  credits: number;
  duration?: number;
};

export type PublicCatalogPackage = {
  kind: "package";
  id: string;
  name: string;
  description: string;
  price: number;
  currency: Currency;
  language: Language;
  validityMonths?: number | null;
  included: PublicCatalogPackageItem[];
};

export type PublicCatalogOffer = PublicCatalogService | PublicCatalogPackage;

export type PublicCatalogMember = {
  id: string;
  name: string;
  bio?: string | null;
  image?: string | null;
};

export type PublicCatalogSnapshot = {
  /** Catalog leaves in display order (options and packages interleaved). */
  offers: PublicCatalogOffer[];
  services: PublicCatalogService[];
  packages: PublicCatalogPackage[];
  members: PublicCatalogMember[];
};

function activeAssignmentsForOption(
  option: AppointmentChoice,
  memberIds: Set<string>,
) {
  return (option.staff || []).filter((s) => memberIds.has(s.memberId));
}

function walkCatalogLeaves(
  nodes: BookingCatalogNode[] | undefined,
): Array<{ type: "option"; id: string } | { type: "package"; id: string }> {
  const leaves: Array<
    { type: "option"; id: string } | { type: "package"; id: string }
  > = [];
  const walk = (list: BookingCatalogNode[]) => {
    for (const node of list) {
      if (node.type === "group") {
        walk(node.children ?? []);
      } else if (node.type === "option" && node.optionId) {
        leaves.push({ type: "option", id: node.optionId });
      } else if (node.type === "package" && node.packageId) {
        leaves.push({ type: "package", id: node.packageId });
      }
    }
  };
  walk(nodes ?? []);
  return leaves;
}

function buildService(
  option: AppointmentChoice,
  members: PublicStaffMember[],
  membersById: Map<string, PublicStaffMember>,
  currency: Currency,
  language: Language,
): PublicCatalogService {
  const memberIds = new Set(members.map((m) => m.id));
  const activeAssignments = activeAssignmentsForOption(option, memberIds);
  const basePrice =
    option.durationType === "fixed" ? option.price : option.pricePerHour;
  const baseDuration =
    option.durationType === "fixed" ? option.duration : undefined;
  const price = minEffectivePrice(basePrice, activeAssignments);
  const duration =
    option.durationType === "fixed"
      ? minEffectiveDuration(baseDuration, activeAssignments)
      : undefined;
  const specialistNames = activeAssignments
    .map((a) => membersById.get(a.memberId)?.name)
    .filter((name): name is string => !!name?.trim());

  return {
    kind: "service",
    id: option._id,
    name: option.name,
    description: option.description,
    durationType: option.durationType,
    price,
    duration,
    isFromPricing: activeAssignments.length > 1,
    currency,
    language,
    specialistNames,
  };
}

function buildPackage(
  pkg: AppointmentPackage,
  options: AppointmentChoice[],
  currency: Currency,
  language: Language,
): PublicCatalogPackage {
  const included = summarizePackageItems(pkg.items, options).map((item) => ({
    optionId: item.optionId,
    name: item.name,
    credits: item.credits,
    duration: item.duration,
  }));

  return {
    kind: "package",
    id: pkg._id,
    name: pkg.name,
    description: pkg.description,
    price: pkg.price,
    currency,
    language,
    validityMonths: pkg.validityMonths,
    included,
  };
}

/**
 * Catalog-visible bookable options and packages (catalog order) plus the union
 * of assigned active members. Shared by llms.txt / JSON-LD so pricing cannot drift.
 */
export async function getPublicCatalogSnapshot(
  servicesContainer: IServicesContainer,
  currency: Currency,
  language: Language,
): Promise<PublicCatalogSnapshot> {
  const response =
    await servicesContainer.bookingService.getAppointmentOptions();
  const options = response.options || [];
  const optionsById = new Map(options.map((option) => [option._id, option]));
  const packagesById = new Map(
    (response.packages || []).map((pkg) => [pkg._id, pkg]),
  );
  const members = response.members || [];
  const membersById = new Map(members.map((m) => [m.id, m]));
  const memberIds = new Set(members.map((m) => m.id));
  const offers: PublicCatalogOffer[] = [];
  const services: PublicCatalogService[] = [];
  const packages: PublicCatalogPackage[] = [];
  const assignedMemberIds = new Set<string>();

  for (const leaf of walkCatalogLeaves(response.catalog)) {
    if (leaf.type === "option") {
      const option = optionsById.get(leaf.id);
      if (!option) continue;

      const service = buildService(
        option,
        members,
        membersById,
        currency,
        language,
      );

      services.push(service);
      offers.push(service);
      for (const assignment of activeAssignmentsForOption(option, memberIds)) {
        assignedMemberIds.add(assignment.memberId);
      }

      continue;
    }

    const pkg = packagesById.get(leaf.id);
    if (!pkg) continue;

    const catalogPackage = buildPackage(pkg, options, currency, language);
    packages.push(catalogPackage);
    offers.push(catalogPackage);

    for (const memberId of pkg.eligibleMemberIds || []) {
      if (memberIds.has(memberId)) assignedMemberIds.add(memberId);
    }
  }

  const catalogMembers: PublicCatalogMember[] = members
    .filter((m) => assignedMemberIds.has(m.id))
    .map((m) => ({
      id: m.id,
      name: m.name,
      bio: m.bio,
      image: m.image,
    }));

  return { offers, services, packages, members: catalogMembers };
}

export function formatDurationMinutes(
  minutes: number | undefined,
): string | undefined {
  if (minutes == null || !Number.isFinite(minutes) || minutes <= 0) {
    return undefined;
  }

  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;

  return `${mins} min`;
}

export function formatServicePriceLabel(
  service: PublicCatalogService,
): string | undefined {
  if (service.price == null) return undefined;

  const amount = formatAmountWithCurrency(
    service.price,
    service.language,
    service.currency,
  );

  const priced =
    service.durationType === "flexible" ? `${amount}/hour` : amount;

  return service.isFromPricing ? `from ${priced}` : priced;
}

export function formatServiceDurationLabel(
  service: PublicCatalogService,
): string | undefined {
  if (service.durationType !== "fixed") return undefined;

  const duration = formatDurationMinutes(service.duration);
  if (!duration) return undefined;

  return service.isFromPricing ? `from ${duration}` : duration;
}

export function formatServiceSummary(service: PublicCatalogService): string {
  const parts = [
    formatServiceDurationLabel(service),
    formatServicePriceLabel(service),
    service.description?.trim(),
  ].filter(Boolean);

  return parts.join(". ");
}

export function formatPackagePriceLabel(
  pkg: PublicCatalogPackage,
): string | undefined {
  return formatAmountWithCurrency(pkg.price, pkg.language, pkg.currency);
}

export function formatPackageIncludedLabel(
  pkg: PublicCatalogPackage,
): string | undefined {
  if (!pkg.included.length) return undefined;

  return pkg.included
    .map((item) =>
      item.credits > 1 ? `${item.credits}× ${item.name}` : item.name,
    )
    .join(", ");
}

export function formatPackageSummary(pkg: PublicCatalogPackage): string {
  const parts = [
    formatPackagePriceLabel(pkg),
    pkg.validityMonths
      ? `valid for ${pkg.validityMonths} month${pkg.validityMonths === 1 ? "" : "s"}`
      : undefined,
    formatPackageIncludedLabel(pkg)
      ? `Includes ${formatPackageIncludedLabel(pkg)}`
      : undefined,
    pkg.description?.trim(),
  ].filter(Boolean);
  return parts.join(". ");
}

export function formatOfferSummary(offer: PublicCatalogOffer): string {
  return offer.kind === "package"
    ? formatPackageSummary(offer)
    : formatServiceSummary(offer);
}
