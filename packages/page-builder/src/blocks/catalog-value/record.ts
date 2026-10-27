import type { CatalogSource } from "./properties";

/** Fields the block can display. One fetch fills every property of the item. */
export type CatalogRecord = {
  name?: string | null;
  description?: string | null;
  bio?: string | null;
  jobTitle?: string | null;
  email?: string | null;
  phone?: string | null;
  price?: number | null;
  duration?: number | null;
};

const toRecord: Record<CatalogSource, (entity: any) => CatalogRecord> = {
  service: (entity) => {
    const flexible = entity.durationType === "flexible";
    return {
      name: entity.name,
      description: entity.description,
      price: flexible ? entity.pricePerHour : entity.price,
      duration: flexible ? entity.durationMin : entity.duration,
    };
  },
  addon: (entity) => ({
    name: entity.name,
    description: entity.description,
    price: entity.price,
    duration: entity.duration,
  }),
  member: (entity) => ({
    name: entity.name,
    jobTitle: entity.jobTitle,
    bio: entity.bio,
    email: entity.email,
    phone: entity.phone,
  }),
  package: (entity) => ({
    name: entity.name,
    description: entity.description,
    price: entity.price,
  }),
};

export function toCatalogRecord(
  source: CatalogSource,
  entity: any,
): CatalogRecord | null {
  if (!entity) return null;

  return toRecord[source](entity);
}
