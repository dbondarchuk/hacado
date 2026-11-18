export type BusinessContextSlice = {
  name?: string;
  industry?: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  timezone?: string;
  currency?: string;
  brandTitle?: string;
  brandDescription?: string;
  /** Raw brand logo asset name or stored URL. */
  logoAsset?: string;
  /** Absolute http(s) logo URL when resolvable from logoAsset + website. */
  logoUrl?: string;
  socialLinks?: Array<{ type: string; url: string }>;
  colors?: unknown[];
  fonts?: unknown;
  members?: Array<{
    id: string;
    name: string;
    jobTitle?: string;
    bio?: string;
    image?: string;
  }>;
  services?: Array<{
    id: string;
    name: string;
    description?: string;
    price?: number;
    duration?: number;
    /** Addon ids linked to this service. */
    addonIds?: string[];
    /** Explicit staff allowlist. Empty/missing = not bookable. */
    memberIds?: string[];
    staffSource: "assigned";
  }>;
  addons?: Array<{
    id: string;
    name: string;
    description?: string;
    price?: number;
    duration?: number;
    /** Service ids this addon can be booked with. */
    serviceIds?: string[];
    /**
     * Effective providers = union of linked services' staff, minus
     * unavailableMemberIds. Empty addon staff overrides inherit all
     * parent-service staff (`staffSource: "services"`).
     */
    memberIds?: string[];
    unavailableMemberIds?: string[];
    staffSource: "services";
  }>;
  packages?: Array<{
    id: string;
    name: string;
    description?: string;
    price?: number;
    /** Services included in the package (credits + resolved name). */
    included?: Array<{
      serviceId: string;
      name: string;
      credits: number;
    }>;
    /**
     * Effective providers. `included-services` = union of included services'
     * staff when eligibleMemberIds is empty. `allowlist` = eligible ∩ service staff.
     */
    memberIds?: string[];
    staffSource: "included-services" | "allowlist";
  }>;
};

export type BusinessContextNeed =
  | "summary"
  | "profile"
  | "contact"
  | "branding"
  | "services"
  | "addons"
  | "packages"
  | "members"
  | "social";

/** Raw org configs + catalog as loaded for AI business context. */
export type BusinessContextRaw = {
  general: Record<string, unknown> | null;
  brand: Record<string, unknown> | null;
  social: Record<string, unknown> | null;
  styling: Record<string, unknown> | null;
  members: NonNullable<BusinessContextSlice["members"]>;
  services: NonNullable<BusinessContextSlice["services"]>;
  addons: NonNullable<BusinessContextSlice["addons"]>;
  packages: NonNullable<BusinessContextSlice["packages"]>;
};
