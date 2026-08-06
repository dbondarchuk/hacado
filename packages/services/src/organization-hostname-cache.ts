import { getLoggerFactory } from "@hacado/logger";
import type { BillingPlanTier, Organization } from "@hacado/types";
import { resolvePlanTierFromOrganization } from "./billing/subscription-entitlements";
import { getRedisClient } from "./bullmq/redis-client";
import { StaticOrganizationService } from "./organization.service";

const loggerFactory = getLoggerFactory("OrganizationHostnameCache");

export const REDIS_KEY_PREFIX = "org:hostname:";
export const REDIS_TTL_SECONDS = 60 * 60 * 24; // 24 hours
const NOT_FOUND_SENTINEL = "__NOT_FOUND__";

export type OrganizationHostnameResolution = {
  organizationId: string;
  slug: string;
  subscriptionStatus: string;
  subscriptionPlanTier: BillingPlanTier | null;
};

export function normalizeHostname(hostname: string): string {
  return hostname.split(":")[0].trim().toLowerCase();
}

function getRedisKey(hostname: string): string {
  return `${REDIS_KEY_PREFIX}${normalizeHostname(hostname)}`;
}

function toResolution(
  organization: Organization,
): OrganizationHostnameResolution {
  return {
    organizationId: organization._id,
    slug: organization.slug,
    subscriptionStatus: organization.polarSubscriptionStatus || "active",
    subscriptionPlanTier: resolvePlanTierFromOrganization(organization),
  };
}

async function lookupFromDatabase(
  hostname: string,
): Promise<OrganizationHostnameResolution | null> {
  const logger = loggerFactory("lookupFromDatabase");

  logger.debug({ hostname }, "Looking up organization by hostname in database");
  const normalized = normalizeHostname(hostname);
  const organizationService = new StaticOrganizationService();
  const publicDomain = process.env.PUBLIC_DOMAIN;

  if (publicDomain && normalized.endsWith(`.${publicDomain}`)) {
    logger.debug({ hostname }, "Looking up organization by slug in database");
    const slug = normalized.slice(0, -(publicDomain.length + 1));
    const organization = await organizationService.getOrganizationBySlug(slug);
    if (organization) {
      logger.debug({ hostname }, "Organization found by slug in database");
      return toResolution(organization);
    }

    logger.debug({ hostname }, "Organization not found by slug in database");
    return null;
  }

  logger.debug({ hostname }, "Looking up organization by domain in database");
  const organization =
    await organizationService.getOrganizationByDomain(normalized);
  if (organization) {
    logger.debug({ hostname }, "Organization found by domain in database");
    return toResolution(organization);
  }

  logger.debug({ hostname }, "Organization not found by domain in database");
  return null;
}

async function writeCache(
  hostname: string,
  resolution: OrganizationHostnameResolution | null,
): Promise<void> {
  const logger = loggerFactory("writeCache");
  logger.debug({ hostname, resolution }, "Writing cache");
  const redis = getRedisClient();
  const key = getRedisKey(hostname);
  const value = resolution ? JSON.stringify(resolution) : NOT_FOUND_SENTINEL;
  await redis.setex(key, REDIS_TTL_SECONDS, value);
  logger.debug({ hostname, resolution }, "Cache written");
}

export async function resolveOrganizationByHostname(
  hostname: string,
): Promise<OrganizationHostnameResolution | null> {
  const logger = loggerFactory("resolveOrganizationByHostname");
  logger.debug({ hostname }, "Resolving organization by hostname");
  const normalized = normalizeHostname(hostname);
  if (!normalized) {
    logger.debug({ hostname }, "Normalized hostname is empty");
    return null;
  }

  try {
    const redis = getRedisClient();
    const cached = await redis.get(getRedisKey(normalized));

    if (cached === NOT_FOUND_SENTINEL) {
      logger.debug({ hostname }, "Cache hit, but organization not found");
      return null;
    }

    if (cached) {
      logger.debug({ hostname }, "Cache hit, organization found");
      return JSON.parse(cached) as OrganizationHostnameResolution;
    }
  } catch (error) {
    logger.debug(
      { error, hostname: normalized },
      "Redis lookup failed, falling back to database",
    );

    return lookupFromDatabase(normalized);
  }

  const resolution = await lookupFromDatabase(normalized);

  try {
    logger.debug({ hostname, resolution }, "Writing cache");
    await writeCache(normalized, resolution);
  } catch (error) {
    logger.warn(
      { error, hostname: normalized },
      "Failed to write organization hostname cache",
    );
  }

  return resolution;
}

export function getOrganizationHostnames(organization: {
  slug: string;
  domain?: string | null;
}): string[] {
  const hostnames: string[] = [];
  const publicDomain = process.env.PUBLIC_DOMAIN;

  if (publicDomain && organization.slug) {
    hostnames.push(`${organization.slug}.${publicDomain}`);
  }

  if (organization.domain?.trim()) {
    hostnames.push(organization.domain);
  }

  return hostnames;
}

export async function invalidateOrganizationHostnameCacheForOrganization(organization: {
  slug: string;
  domain?: string | null;
}): Promise<void> {
  await invalidateOrganizationHostnameCache(
    ...getOrganizationHostnames(organization),
  );
}

export async function invalidateOrganizationHostnameCache(
  ...hostnames: (string | null | undefined)[]
): Promise<void> {
  const logger = loggerFactory("invalidateOrganizationHostnameCache");
  logger.debug({ hostnames }, "Invalidating organization hostname cache");
  const keys = [
    ...new Set(
      hostnames
        .filter((hostname): hostname is string => Boolean(hostname?.trim()))
        .map((hostname) => getRedisKey(hostname)),
    ),
  ];

  if (keys.length === 0) {
    logger.debug({ hostnames }, "No keys to invalidate");
    return;
  }

  try {
    logger.debug({ hostnames }, "Deleting keys from cache");
    await getRedisClient().del(...keys);
    logger.debug({ hostnames }, "Keys deleted from cache");
  } catch (error) {
    logger.warn(
      { error, keys },
      "Failed to invalidate organization hostname cache",
    );
  }
}
