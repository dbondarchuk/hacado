import type { BusinessContextSlice } from "../context/types";

/** Compact catalog index for the runtime context message. */
export function buildCatalogSummary(
  business: BusinessContextSlice | undefined,
) {
  if (!business) {
    return {
      members: 0,
      services: 0,
      addons: 0,
      packages: 0,
    };
  }

  const names = (items: Array<{ name: string }> | undefined, limit = 12) =>
    (items ?? []).slice(0, limit).map((item) => item.name);

  return {
    members: business.members?.length ?? 0,
    services: business.services?.length ?? 0,
    addons: business.addons?.length ?? 0,
    packages: business.packages?.length ?? 0,
    memberNames: names(business.members),
    serviceNames: names(business.services),
    addonNames: names(business.addons),
    packageNames: names(business.packages),
  };
}
