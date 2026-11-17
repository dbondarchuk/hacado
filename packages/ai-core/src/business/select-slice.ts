import type { BusinessContextNeed, BusinessContextSlice } from "./types";

export function selectBusinessSlice(
  raw: {
    general?: Record<string, unknown> | null;
    brand?: Record<string, unknown> | null;
    social?: Record<string, unknown> | null;
    styling?: Record<string, unknown> | null;
    services?: BusinessContextSlice["services"];
    addons?: BusinessContextSlice["addons"];
    packages?: BusinessContextSlice["packages"];
    members?: BusinessContextSlice["members"];
  },
  needs: BusinessContextNeed[] = ["profile", "branding"],
): BusinessContextSlice {
  const slice: BusinessContextSlice = {};

  if (needs.includes("profile") || needs.includes("contact")) {
    slice.name = raw.general?.name as string | undefined;
    slice.industry = raw.general?.industry as string | undefined;
    slice.timezone = raw.general?.timeZone as string | undefined;
    slice.currency = raw.general?.currency as string | undefined;
  }

  if (needs.includes("contact")) {
    slice.email = raw.general?.email as string | undefined;
    slice.phone = raw.general?.phone as string | undefined;
    slice.address = raw.general?.address as string | undefined;
  }

  if (needs.includes("branding")) {
    slice.brandTitle = raw.brand?.title as string | undefined;
    slice.brandDescription = raw.brand?.description as string | undefined;
    slice.logoAsset = raw.brand?.logo as string | undefined;
    slice.colors = raw.styling?.colors as unknown[] | undefined;
    slice.fonts = raw.styling?.fonts;
    slice.description = slice.brandDescription;
  }

  if (needs.includes("social")) {
    slice.socialLinks = raw.social?.links as
      | Array<{ type: string; url: string }>
      | undefined;
  }

  if (needs.includes("members")) {
    slice.members = raw.members;
  }

  if (needs.includes("services")) {
    slice.services = raw.services;
  }

  if (needs.includes("addons")) {
    slice.addons = raw.addons;
  }

  if (needs.includes("packages")) {
    slice.packages = raw.packages;
  }

  return slice;
}
