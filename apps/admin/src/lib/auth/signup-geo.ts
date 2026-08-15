import { getLoggerFactory } from "@hacado/logger";
import { lookup as lookupGeoIp } from "geoip-lite";
import { isAllowedSignupCountry } from "./signup-regions";

const IP_HEADERS = ["x-forwarded-for", "x-real-ip"] as const;

function stripIpv6Mapped(ip: string): string {
  return ip.replace(/^::ffff:/i, "");
}

export function getClientIp(headersList: Headers): {
  ip: string | null;
  header: string | null;
} {
  for (const key of IP_HEADERS) {
    const value = headersList.get(key);
    if (!value) continue;
    const ip = stripIpv6Mapped(value.split(",")[0]?.trim() ?? "");
    if (ip) return { ip, header: key };
  }
  return { ip: null, header: null };
}

export function isPrivateOrLoopbackIp(ip: string): boolean {
  const v4 = stripIpv6Mapped(ip);
  if (v4 === "::1" || v4 === "localhost") return true;
  if (v4.startsWith("127.")) return true;
  if (v4.startsWith("10.")) return true;
  if (v4.startsWith("192.168.")) return true;
  const match = /^172\.(\d+)\./.exec(v4);
  if (match) {
    const octet = Number(match[1]);
    if (octet >= 16 && octet <= 31) return true;
  }
  return false;
}

export function lookupCountry(ip: string): string | null {
  const result = lookupGeoIp(ip);
  const country = result?.country?.trim();
  return country || null;
}

export function isPublicSignupAllowed(
  ip: string | null,
  {
    isDev,
    source,
    ipHeader,
  }: {
    isDev: boolean;
    source: string;
    ipHeader?: string | null;
  },
): boolean {
  const logger = getLoggerFactory("SignupGeo")("isPublicSignupAllowed");
  const isPrivate = ip ? isPrivateOrLoopbackIp(ip) : false;

  if (!ip || isPrivate) {
    if (isDev) {
      logger.info(
        { source, ip, ipHeader, isPrivate, isDev },
        "Public signup allowed: development private or missing IP",
      );
      return true;
    }
    logger.warn(
      { source, ip, ipHeader, isPrivate, isDev },
      "Public signup blocked: missing or private client IP",
    );
    return false;
  }

  const country = lookupCountry(ip);
  const allowed = isAllowedSignupCountry(country);
  const payload = { source, ip, ipHeader, country, isDev, allowed };

  if (!allowed) {
    logger.warn(payload, "Public signup blocked: country not on allowlist");
    return false;
  }

  logger.info(payload, "Public signup allowed: country on allowlist");
  return true;
}

export function isSignupGeoBlockingEnabled(): boolean {
  return process.env.SIGNUP_GEO_BLOCKING_ENABLED === "true";
}

export function isPublicSignupAllowedFromHeaders(
  headersList: Headers,
  source: string,
): boolean {
  const logger = getLoggerFactory("SignupGeo")("isPublicSignupAllowed");

  if (!isSignupGeoBlockingEnabled()) {
    logger.debug({ source }, "Public signup geo blocking disabled");
    return true;
  }

  const { ip, header } = getClientIp(headersList);
  return isPublicSignupAllowed(ip, {
    isDev: process.env.NODE_ENV !== "production",
    source,
    ipHeader: header,
  });
}
