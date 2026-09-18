import { getServicesContainer } from "@/utils/utils";
import type {
  AppPageMetadata,
  IPageMetadataProvider,
  Page,
  PageContentEntry,
} from "@hacado/types";
import type { Metadata } from "next";

function mergeContentEntries(
  batches: (PageContentEntry[] | undefined)[],
): Map<string, string> {
  const merged = new Map<string, string>();
  for (const entries of batches) {
    if (!entries) continue;
    for (const entry of entries) {
      merged.set(entry.type, entry.value);
    }
  }
  return merged;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    !(value instanceof URL)
  );
}

/**
 * Deep-merge metadata contributions into a base object.
 * - Objects: recurse
 * - Arrays: concatenate (later apps append)
 * - Primitives / other: last write wins
 */
export function deepMergeMetadata(
  base: AppPageMetadata,
  ...patches: (AppPageMetadata | undefined)[]
): AppPageMetadata {
  let result: AppPageMetadata = { ...base };

  for (const patch of patches) {
    if (!patch) continue;
    result = mergeMetadataValue(result, patch) as AppPageMetadata;
  }

  return result;
}

function mergeMetadataValue(base: unknown, patch: unknown): unknown {
  if (patch === undefined) return base;

  if (Array.isArray(base) && Array.isArray(patch)) {
    return [...base, ...patch];
  }

  if (isPlainObject(base) && isPlainObject(patch)) {
    const out: Record<string, unknown> = { ...base };
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      out[key] = key in out ? mergeMetadataValue(out[key], value) : value;
    }
    return out;
  }

  return patch;
}

export async function collectSiteBodies(
  websiteUrl: string,
): Promise<Map<string, string>> {
  const servicesContainer = await getServicesContainer();
  const batches =
    await servicesContainer.connectedAppsService.invokeAppsByScope<
      IPageMetadataProvider,
      PageContentEntry[] | undefined
    >(
      "page-metadata-provider",
      async (appData, service) => {
        if (typeof service.provideSiteBodies !== "function") {
          return undefined;
        }
        return service.provideSiteBodies(appData, { websiteUrl });
      },
      { ignoreErrors: true },
    );

  return mergeContentEntries(batches);
}

export async function collectPageBodies(
  websiteUrl: string,
  page: Page,
  routeParams: Record<string, string>,
): Promise<Map<string, string>> {
  const servicesContainer = await getServicesContainer();
  const batches =
    await servicesContainer.connectedAppsService.invokeAppsByScope<
      IPageMetadataProvider,
      PageContentEntry[] | undefined
    >(
      "page-metadata-provider",
      async (appData, service) => {
        if (typeof service.providePageBodies !== "function") {
          return undefined;
        }

        return service.providePageBodies(appData, {
          websiteUrl,
          page,
          routeParams,
        });
      },
      { ignoreErrors: true },
    );

  return mergeContentEntries(batches);
}

export async function collectAppPageMetadata(
  websiteUrl: string,
  page: Page,
  routeParams: Record<string, string>,
): Promise<AppPageMetadata[]> {
  const servicesContainer = await getServicesContainer();
  const batches =
    await servicesContainer.connectedAppsService.invokeAppsByScope<
      IPageMetadataProvider,
      AppPageMetadata | undefined
    >(
      "page-metadata-provider",
      async (appData, service) => {
        if (typeof service.providePageMetadata !== "function") {
          return undefined;
        }
        return service.providePageMetadata(appData, {
          websiteUrl,
          page,
          routeParams,
        });
      },
      { ignoreErrors: true },
    );

  return batches.filter((part): part is AppPageMetadata => !!part);
}

export function mergeBaseAndAppMetadata(
  base: Metadata,
  appParts: AppPageMetadata[],
): Metadata {
  return deepMergeMetadata(base as AppPageMetadata, ...appParts) as Metadata;
}
