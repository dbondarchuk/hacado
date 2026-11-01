import {
  defaultDurationFromTemplate,
  defaultPriceFromTemplate,
} from "./constants";
import raw from "./data/_catalog-data.json";
import type { CatalogProfessionDef } from "./types";

export const INSTALL_CATALOG_DATA = raw as unknown as Record<
  string,
  Record<string, CatalogProfessionDef>
>;

export const INSTALL_CATEGORY_IDS = Object.keys(INSTALL_CATALOG_DATA).sort();

export function getCatalogProfession(
  categoryId: string,
  professionId: string,
): CatalogProfessionDef | undefined {
  return INSTALL_CATALOG_DATA[categoryId]?.[professionId];
}

export function getProfessionIds(categoryId: string): string[] {
  return Object.keys(INSTALL_CATALOG_DATA[categoryId] ?? {}).sort();
}

export function getServiceTemplate(
  categoryId: string,
  professionId: string,
  serviceId: string,
) {
  const prof = getCatalogProfession(categoryId, professionId);
  return prof?.services.find((s) => s.id === serviceId);
}

export function catalogCategoryLabelKey(categoryId: string) {
  return `catalog.categories.${categoryId}` as const;
}

export function catalogProfessionLabelKey(
  categoryId: string,
  professionId: string,
) {
  return `catalog.${categoryId}.${professionId}.label` as const;
}

export function catalogTagLabelKey(tagSlug: string) {
  return `catalog.tags.${tagSlug}` as const;
}

export function catalogServiceNameKey(
  categoryId: string,
  professionId: string,
  serviceId: string,
) {
  return `catalog.${categoryId}.${professionId}.services.${serviceId}.name` as const;
}

export function catalogServiceDescriptionKey(
  categoryId: string,
  professionId: string,
  serviceId: string,
) {
  return `catalog.${categoryId}.${professionId}.services.${serviceId}.description` as const;
}

export function catalogAddonNameKey(
  categoryId: string,
  professionId: string,
  serviceId: string,
  addonId: string,
) {
  return `catalog.${categoryId}.${professionId}.services.${serviceId}.addons.${addonId}.name` as const;
}

export function catalogAddonDescriptionKey(
  categoryId: string,
  professionId: string,
  serviceId: string,
  addonId: string,
) {
  return `catalog.${categoryId}.${professionId}.services.${serviceId}.addons.${addonId}.description` as const;
}

export function professionMatchesSearch(
  t: (key: any) => string,
  categoryId: string,
  professionId: string,
  query: string,
) {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const label = t(
    catalogProfessionLabelKey(categoryId, professionId),
  ).toLowerCase();

  const catLabel = t(catalogCategoryLabelKey(categoryId)).toLowerCase();
  const prof = getCatalogProfession(categoryId, professionId);
  const tagMatch =
    prof?.tags.some((tag) => {
      const tagText = t(catalogTagLabelKey(tag)).toLowerCase();
      return tagText.includes(q) || tag.includes(q);
    }) ?? false;

  return (
    label.includes(q) ||
    catLabel.includes(q) ||
    tagMatch ||
    professionId.toLowerCase().includes(q)
  );
}

export function getDefaultCatalogSeed() {
  const businessCategory = INSTALL_CATEGORY_IDS[0];
  const professionIds = getProfessionIds(businessCategory);
  const professionId = professionIds[0] ?? "";
  const prof = getCatalogProfession(businessCategory, professionId);
  const firstSvc = prof?.services[0];
  const serviceTemplateId = firstSvc?.id ?? "";
  return {
    businessCategory,
    professionId,
    serviceTemplateId,
    serviceDuration: defaultDurationFromTemplate(firstSvc?.durations ?? []),
    servicePrice: defaultPriceFromTemplate(firstSvc?.prices ?? []),
  };
}
