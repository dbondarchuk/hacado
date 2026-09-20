import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizeDnsHostname,
  validateCustomDomainDns,
  type CustomDomainDnsResolver,
} from "./custom-domain-dns";

function mockResolver(map: {
  a?: Record<string, string[]>;
  cname?: Record<string, string[]>;
}): CustomDomainDnsResolver {
  return {
    resolve4: async (hostname) => {
      const records = map.a?.[normalizeDnsHostname(hostname)];
      if (!records) {
        throw Object.assign(new Error("ENOTFOUND"), { code: "ENOTFOUND" });
      }
      return records;
    },
    resolveCname: async (hostname) => {
      const records = map.cname?.[normalizeDnsHostname(hostname)];
      if (!records) {
        throw Object.assign(new Error("ENODATA"), { code: "ENODATA" });
      }
      return records;
    },
  };
}

describe("normalizeDnsHostname", () => {
  it("lowercases and strips trailing dot", () => {
    assert.equal(
      normalizeDnsHostname("  WWW.Example.COM. "),
      "www.example.com",
    );
  });
});

describe("validateCustomDomainDns", () => {
  it("skips when neither expected IP nor CNAME host is configured", async () => {
    const result = await validateCustomDomainDns({
      domain: "shop.example.com",
      resolver: mockResolver({}),
    });
    assert.deepEqual(result, { ok: true, skipped: true });
  });

  it("accepts A record matching expected IP", async () => {
    const result = await validateCustomDomainDns({
      domain: "shop.example.com",
      expectedARecordIp: "1.2.3.4",
      expectedCnameHost: "slug.hacado.me",
      resolver: mockResolver({
        a: { "shop.example.com": ["1.2.3.4"] },
      }),
    });
    assert.deepEqual(result, { ok: true });
  });

  it("accepts CNAME pointing at platform host", async () => {
    const result = await validateCustomDomainDns({
      domain: "shop.example.com",
      expectedARecordIp: "1.2.3.4",
      expectedCnameHost: "slug.hacado.me",
      resolver: mockResolver({
        cname: { "shop.example.com": ["slug.hacado.me."] },
      }),
    });
    assert.deepEqual(result, { ok: true });
  });

  it("accepts ALIAS-style A overlap with platform host", async () => {
    const result = await validateCustomDomainDns({
      domain: "example.com",
      expectedARecordIp: "9.9.9.9",
      expectedCnameHost: "slug.hacado.me",
      resolver: mockResolver({
        a: {
          "example.com": ["5.5.5.5", "6.6.6.6"],
          "slug.hacado.me": ["6.6.6.6"],
        },
      }),
    });
    assert.deepEqual(result, { ok: true });
  });

  it("rejects when records do not point at Hacado", async () => {
    const result = await validateCustomDomainDns({
      domain: "shop.example.com",
      expectedARecordIp: "1.2.3.4",
      expectedCnameHost: "slug.hacado.me",
      resolver: mockResolver({
        a: {
          "shop.example.com": ["8.8.8.8"],
          "slug.hacado.me": ["1.2.3.4"],
        },
        cname: { "shop.example.com": ["other.example.net"] },
      }),
    });
    assert.deepEqual(result, { ok: false });
  });

  it("rejects when DNS has no records", async () => {
    const result = await validateCustomDomainDns({
      domain: "missing.example.com",
      expectedARecordIp: "1.2.3.4",
      expectedCnameHost: "slug.hacado.me",
      resolver: mockResolver({}),
    });
    assert.deepEqual(result, { ok: false });
  });
});
