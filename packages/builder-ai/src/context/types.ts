import type {
  BuilderDocumentSettings,
  BuilderKind,
  DocumentStructureNode,
  SelectionContextPayload,
} from "../types";

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
  logoAsset?: string;
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
  | "profile"
  | "contact"
  | "branding"
  | "services"
  | "addons"
  | "packages"
  | "members"
  | "social";

export type TemplateArgsSummary = {
  paths: string[];
  sample: Record<string, unknown>;
};

export type AssembledAIContext = {
  builder: {
    kind: BuilderKind;
    blockCount: number;
  };
  document?: {
    revision: string;
    structure: DocumentStructureNode[];
    rootType: string;
  };
  selection?: SelectionContextPayload & {
    blocks?: Array<{ id: string; type: string; data: unknown }>;
    ancestors?: DocumentStructureNode[];
  };
  business?: BusinessContextSlice;
  /** Preview/template args available for Mustache variables (esp. email). */
  templateArgs?: TemplateArgsSummary;
  /** Host-form settings outside the block tree (page SEO, email subject, …). */
  documentSettings?: BuilderDocumentSettings;
  task: {
    instruction: string;
    actionId?: string;
  };
};
