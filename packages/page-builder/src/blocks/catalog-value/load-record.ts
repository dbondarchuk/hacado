import type { Language } from "@hacado/i18n";
import type { Currency } from "@hacado/types";
import { cache } from "react";
import type { CatalogSource } from "./properties";
import { type CatalogRecord, toCatalogRecord } from "./record";

const inflightRecords = new Map<string, Promise<CatalogRecord | null>>();

const recordKey = (
  organizationId: string,
  source: CatalogSource,
  itemId: string,
) => `${organizationId}:${source}:${itemId}`;

const loadEntity: Record<
  CatalogSource,
  (services: any, itemId: string) => Promise<any>
> = {
  service: (services, itemId) => services.servicesService.getOption(itemId),
  addon: (services, itemId) => services.servicesService.getAddon(itemId),
  member: (services, itemId) => services.teamService.getMemberById(itemId),
  package: (services, itemId) => services.packagesService.getPackage(itemId),
};

async function fetchCatalogRecord(
  organizationId: string,
  source: CatalogSource,
  itemId: string,
): Promise<CatalogRecord | null> {
  const { ServicesContainer } = await import("@hacado/services");
  const services = ServicesContainer(organizationId);
  const entity = await loadEntity[source](services, itemId);

  return toCatalogRecord(source, entity);
}

async function loadCatalogRecord(
  organizationId: string,
  source: CatalogSource,
  itemId: string,
) {
  const key = recordKey(organizationId, source, itemId);
  const pending = inflightRecords.get(key);
  if (pending) return pending;

  const promise = fetchCatalogRecord(organizationId, source, itemId);
  inflightRecords.set(key, promise);

  try {
    return await promise;
  } finally {
    if (inflightRecords.get(key) === promise) {
      inflightRecords.delete(key);
    }
  }
}

/** Cached per request. Concurrent blocks for the same item share one lookup. */
export const getCatalogRecord = cache(loadCatalogRecord);

async function fetchFormatContext(organizationId: string) {
  const { ServicesContainer } = await import("@hacado/services");
  const services = ServicesContainer(organizationId);
  const [general, brand] = await Promise.all([
    services.configurationService.getConfiguration("general"),
    services.configurationService.getConfiguration("brand"),
  ]);

  return {
    currency: general.currency as Currency,
    language: brand.language as Language,
  };
}

export const getCatalogFormatContext = cache(fetchFormatContext);
