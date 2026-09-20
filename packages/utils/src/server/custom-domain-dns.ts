import dns from "node:dns/promises";

const DEFAULT_TIMEOUT_MS = 8_000;

export type CustomDomainDnsResolver = {
  resolve4(hostname: string): Promise<string[]>;
  resolveCname(hostname: string): Promise<string[]>;
};

export type ValidateCustomDomainDnsOptions = {
  domain: string;
  /** Expected A-record IP from CUSTOM_DOMAIN_A_RECORD_IP */
  expectedARecordIp?: string;
  /** Platform host, e.g. slug.PUBLIC_DOMAIN — CNAME / ALIAS target */
  expectedCnameHost?: string;
  resolver?: CustomDomainDnsResolver;
  timeoutMs?: number;
};

export type ValidateCustomDomainDnsResult = {
  ok: boolean;
  /** True when neither expected IP nor platform host was configured — check skipped */
  skipped?: boolean;
};

export function normalizeDnsHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.$/, "");
}

const defaultResolver: CustomDomainDnsResolver = {
  resolve4: (hostname) => dns.resolve4(hostname),
  resolveCname: (hostname) => dns.resolveCname(hostname),
};

async function resolveSafe(promise: Promise<string[]>): Promise<string[]> {
  try {
    return await promise;
  } catch {
    return [];
  }
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error("dns_lookup_timeout")),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Checks whether a custom domain's public DNS points at Hacado.
 * Accepts A → expected IP, CNAME → platform host, or A overlap with the
 * platform host (ALIAS / ANAME / CNAME flattening).
 * Returns ok without looking up when neither expected target is configured.
 */
export async function validateCustomDomainDns(
  options: ValidateCustomDomainDnsOptions,
): Promise<ValidateCustomDomainDnsResult> {
  const expectedIp = options.expectedARecordIp?.trim() || undefined;
  const expectedCname = options.expectedCnameHost
    ? normalizeDnsHostname(options.expectedCnameHost)
    : undefined;

  if (!expectedIp && !expectedCname) {
    return { ok: true, skipped: true };
  }

  const domain = normalizeDnsHostname(options.domain);
  if (!domain) {
    return { ok: false };
  }

  const resolver = options.resolver ?? defaultResolver;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  try {
    const [aRecords, cnameRecords] = await withTimeout(
      Promise.all([
        resolveSafe(resolver.resolve4(domain)),
        resolveSafe(resolver.resolveCname(domain)),
      ]),
      timeoutMs,
    );

    if (expectedIp && aRecords.includes(expectedIp)) {
      return { ok: true };
    }

    if (
      expectedCname &&
      cnameRecords.some(
        (target) => normalizeDnsHostname(target) === expectedCname,
      )
    ) {
      return { ok: true };
    }

    // ALIAS / ANAME / flattened CNAME: compare A records against platform host
    if (expectedCname && aRecords.length > 0) {
      const platformARecords = await withTimeout(
        resolveSafe(resolver.resolve4(expectedCname)),
        timeoutMs,
      );
      if (platformARecords.some((ip) => aRecords.includes(ip))) {
        return { ok: true };
      }
    }

    return { ok: false };
  } catch {
    return { ok: false };
  }
}
