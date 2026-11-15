import type { ServicesContainer } from "@hacado/services/container";

type CatalogItem = {
  id: string;
  name: string;
  description?: string;
  price?: number;
  duration?: number;
};

/**
 * Who can provide this catalog item.
 * - assigned: explicit service staff allowlist (empty = not bookable)
 * - services: addon inherits linked services' staff (minus unavailable)
 * - included-services: package with no eligibleMemberIds → union of included services' staff
 * - allowlist: package eligibleMemberIds ∩ included services' staff
 */
type StaffSource = "assigned" | "services" | "included-services" | "allowlist";

type CatalogService = CatalogItem & {
  addonIds?: string[];
  memberIds?: string[];
  staffSource: "assigned";
};

type CatalogAddon = CatalogItem & {
  serviceIds?: string[];
  memberIds?: string[];
  unavailableMemberIds?: string[];
  staffSource: "services";
};

type CatalogPackage = CatalogItem & {
  included?: Array<{
    serviceId: string;
    name: string;
    credits: number;
  }>;
  memberIds?: string[];
  staffSource: "included-services" | "allowlist";
};

type CatalogMember = {
  id: string;
  name: string;
  jobTitle?: string;
  bio?: string;
  image?: string;
};

function asOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function asOptionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function uniqueIds(ids: Iterable<string>): string[] {
  return [...new Set(ids)].filter(Boolean);
}

function mapCatalogRow(row: any): CatalogItem {
  const item: CatalogItem = {
    id: String(row._id ?? row.id),
    name: String(row.name ?? ""),
  };

  const description = asOptionalString(row.description);
  const price = asOptionalNumber(row.price);
  const duration =
    asOptionalNumber(row.duration) ?? asOptionalNumber(row.durationMin);

  if (description) item.description = description;
  if (price !== undefined) item.price = price;
  if (duration !== undefined) item.duration = duration;

  return item;
}

function mapMemberRow(row: any): CatalogMember {
  const member: CatalogMember = {
    id: String(row._id ?? row.id),
    name: String(row.name ?? ""),
  };

  const jobTitle = asOptionalString(row.jobTitle);
  const bio = asOptionalString(row.bio);
  const image = asOptionalString(row.image);

  if (jobTitle) member.jobTitle = jobTitle;
  if (bio) member.bio = bio;
  if (image) member.image = image;

  return member;
}

function mapServiceRow(row: any, activeMemberIds: Set<string>): CatalogService {
  const item: CatalogService = {
    ...mapCatalogRow(row),
    staffSource: "assigned",
  };

  const addonIds = Array.isArray(row.addons)
    ? row.addons
        .map((addon: { id?: unknown }) =>
          addon?.id != null ? String(addon.id) : "",
        )
        .filter(Boolean)
    : [];

  const memberIds = Array.isArray(row.staff)
    ? uniqueIds(
        row.staff.map((assignment: { memberId?: unknown }) =>
          assignment?.memberId != null ? String(assignment.memberId) : "",
        ),
      ).filter((id) => activeMemberIds.has(id))
    : [];

  if (addonIds.length) item.addonIds = addonIds;
  if (memberIds.length) item.memberIds = memberIds;

  return item;
}

function mapAddonRow(
  row: any,
  serviceIdsByAddon: Map<string, string[]>,
  servicesById: Map<string, CatalogService>,
): CatalogAddon {
  const base = mapCatalogRow(row);
  const serviceIds = serviceIdsByAddon.get(base.id) ?? [];
  const unavailableMemberIds = Array.isArray(row.staff)
    ? uniqueIds(
        row.staff
          .filter(
            (override: { unavailable?: unknown; memberId?: unknown }) =>
              override?.unavailable === true,
          )
          .map((override: { memberId?: unknown }) =>
            override?.memberId != null ? String(override.memberId) : "",
          ),
      )
    : [];

  const unavailableSet = new Set(unavailableMemberIds);
  const inheritedMemberIds = uniqueIds(
    serviceIds.flatMap(
      (serviceId) => servicesById.get(serviceId)?.memberIds ?? [],
    ),
  ).filter((id) => !unavailableSet.has(id));

  const item: CatalogAddon = {
    ...base,
    staffSource: "services",
  };

  if (serviceIds.length) item.serviceIds = serviceIds;
  if (inheritedMemberIds.length) item.memberIds = inheritedMemberIds;
  if (unavailableMemberIds.length) {
    item.unavailableMemberIds = unavailableMemberIds;
  }

  return item;
}

function mapPackageRow(
  row: any,
  servicesById: Map<string, CatalogService>,
  activeMemberIds: Set<string>,
): CatalogPackage {
  const item: CatalogPackage = {
    ...mapCatalogRow(row),
    staffSource: "included-services",
  };

  const included = Array.isArray(row.items)
    ? row.items.flatMap((entry: { serviceId?: unknown; credits?: unknown }) => {
        const serviceId =
          entry?.serviceId != null ? String(entry.serviceId) : "";

        const service = serviceId ? servicesById.get(serviceId) : undefined;
        const credits = asOptionalNumber(entry?.credits);

        if (!service || credits === undefined) return [];

        return [
          {
            serviceId: service.id,
            name: service.name,
            credits,
          },
        ];
      })
    : [];

  const includedServiceMemberIds = uniqueIds(
    included.flatMap(
      (entry) => servicesById.get(entry.serviceId)?.memberIds ?? [],
    ),
  );

  const eligibleMemberIds = Array.isArray(row.eligibleMemberIds)
    ? uniqueIds(
        row.eligibleMemberIds.map((id: unknown) =>
          id != null ? String(id) : "",
        ),
      ).filter((id) => activeMemberIds.has(id))
    : [];

  if (included.length) item.included = included;

  if (eligibleMemberIds.length) {
    const eligibleSet = new Set(eligibleMemberIds);
    const memberIds = includedServiceMemberIds.filter((id) =>
      eligibleSet.has(id),
    );

    item.staffSource = "allowlist";
    if (memberIds.length) item.memberIds = memberIds;
  } else if (includedServiceMemberIds.length) {
    item.staffSource = "included-services";
    item.memberIds = includedServiceMemberIds;
  }

  return item;
}

function asRows(result: unknown): any[] {
  if (Array.isArray(result)) return result;

  if (result && typeof result === "object") {
    const record = result as { data?: unknown[]; items?: unknown[] };

    if (Array.isArray(record.items)) return record.items;
    if (Array.isArray(record.data)) return record.data;
  }

  return [];
}

export async function loadBuilderAIBusinessContext(
  services: ServicesContainer,
) {
  const [
    general,
    brand,
    social,
    styling,
    membersList,
    servicesList,
    addonsList,
    packagesList,
  ] = await Promise.all([
    services.configurationService.getConfiguration("general"),
    services.configurationService.getConfiguration("brand"),
    services.configurationService.getConfiguration("social"),
    services.configurationService.getConfiguration("styling"),
    services.teamService.getActiveMembers().catch(() => []),
    services.catalogService.getServices({}).catch(() => ({ items: [] })),
    services.catalogService.getAddons({}).catch(() => ({ items: [] })),
    services.packagesService.getPackages({}).catch(() => ({ items: [] })),
  ]);

  const members = (
    Array.isArray(membersList) ? membersList : asRows(membersList)
  ).map(mapMemberRow);

  const activeMemberIds = new Set(members.map((member) => member.id));
  const catalogServices = asRows(servicesList).map((row) =>
    mapServiceRow(row, activeMemberIds),
  );

  const servicesById = new Map(
    catalogServices.map((service) => [service.id, service]),
  );

  const serviceIdsByAddon = new Map<string, string[]>();

  for (const service of catalogServices) {
    for (const addonId of service.addonIds ?? []) {
      const linked = serviceIdsByAddon.get(addonId) ?? [];
      linked.push(service.id);
      serviceIdsByAddon.set(addonId, linked);
    }
  }

  const catalogAddons = asRows(addonsList).map((row) =>
    mapAddonRow(row, serviceIdsByAddon, servicesById),
  );

  const catalogPackages = asRows(packagesList).map((row) =>
    mapPackageRow(row, servicesById, activeMemberIds),
  );

  return {
    general: (general as Record<string, unknown> | null) ?? null,
    brand: (brand as Record<string, unknown> | null) ?? null,
    social: (social as Record<string, unknown> | null) ?? null,
    styling: (styling as Record<string, unknown> | null) ?? null,
    members,
    services: catalogServices,
    addons: catalogAddons,
    packages: catalogPackages,
  };
}

export type {
  CatalogAddon,
  CatalogMember,
  CatalogPackage,
  CatalogService,
  StaffSource,
};
