export const BillingPlanTier = {
  Free: "free",
  Solo: "solo",
  Studio: "studio",
} as const;

export type BillingPlanTier =
  (typeof BillingPlanTier)[keyof typeof BillingPlanTier];

export const DEFAULT_MINIMUM_PLAN_TIER = BillingPlanTier.Free;

const PLAN_TIER_RANK: Record<BillingPlanTier, number> = {
  [BillingPlanTier.Free]: 0,
  [BillingPlanTier.Solo]: 1,
  [BillingPlanTier.Studio]: 2,
};

export function meetsMinimumPlanTier(
  currentTier: BillingPlanTier | null,
  requiredTier: BillingPlanTier,
): boolean {
  if (!currentTier) return true;
  return PLAN_TIER_RANK[currentTier] >= PLAN_TIER_RANK[requiredTier];
}

export function getMinimumPlanTierForApp(
  app: { minimumPlanTier?: BillingPlanTier } | null | undefined,
): BillingPlanTier {
  return app?.minimumPlanTier ?? DEFAULT_MINIMUM_PLAN_TIER;
}

export type FreeTierEntitlement =
  | "appointments"
  | "services"
  | "pages"
  | "assetsTotalSize";

export const FREE_TIER_LIMITS = {
  appointments: 15,
  services: 1,
  pages: 10,
  assetsTotalSize: 536_870_912, // 512 MB
} as const satisfies Record<FreeTierEntitlement, number>;

export function canCreateMoreServices(
  planTier: BillingPlanTier | null,
  currentCount: number,
): boolean {
  if (!planTier || planTier !== BillingPlanTier.Free) return true;
  return currentCount < FREE_TIER_LIMITS.services;
}

export function canCreateMorePages(
  planTier: BillingPlanTier | null,
  currentCount: number,
): boolean {
  if (!planTier || planTier !== BillingPlanTier.Free) return true;
  return currentCount < FREE_TIER_LIMITS.pages;
}

export type SubscriptionFeature =
  | "financials"
  | "discounts"
  | "giftCards"
  | "packages"
  | "customDomain"
  | "sms"
  | "waitlist"
  | "scripts"
  | "payments";

export const FREE_TIER_DISABLED_FEATURES: ReadonlySet<SubscriptionFeature> =
  new Set([
    "financials",
    "discounts",
    "giftCards",
    "packages",
    "customDomain",
    "waitlist",
    "scripts",
    "payments",
  ]);

export class AppointmentLimitReachedError extends Error {
  public readonly code = "appointment_limit_reached" as const;
  public readonly limit: number;

  constructor(limit: number) {
    super(`Appointment limit of ${limit} per billing cycle reached`);
    this.name = "AppointmentLimitReachedError";
    this.limit = limit;
  }
}

export class ServiceLimitReachedError extends Error {
  public readonly code = "service_limit_reached" as const;
  public readonly limit: number;

  constructor(limit: number) {
    super(`Service limit of ${limit} reached on the Free plan`);
    this.name = "ServiceLimitReachedError";
    this.limit = limit;
  }
}

export class PageLimitReachedError extends Error {
  public readonly code = "page_limit_reached" as const;
  public readonly limit: number;

  constructor(limit: number) {
    super(`Page limit of ${limit} reached on the Free plan`);
    this.name = "PageLimitReachedError";
    this.limit = limit;
  }
}

export class AssetTotalSizeLimitReachedError extends Error {
  public readonly code = "asset_total_size_limit_reached" as const;
  public readonly limitBytes: number;

  constructor(limitBytes: number) {
    super("Max total asset size was reached.");
    this.name = "AssetTotalSizeLimitReachedError";
    this.limitBytes = limitBytes;
  }
}

export class SubscriptionUpgradeRequiredError extends Error {
  public readonly code = "subscription_upgrade_required" as const;
  public readonly feature?: SubscriptionFeature;
  public readonly appSlug?: string;

  constructor(
    message: string,
    options?: { feature?: SubscriptionFeature; appSlug?: string },
  ) {
    super(message);
    this.name = "SubscriptionUpgradeRequiredError";
    this.feature = options?.feature;
    this.appSlug = options?.appSlug;
  }
}
