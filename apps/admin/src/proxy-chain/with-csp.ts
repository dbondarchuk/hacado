import { NextFetchEvent, NextRequest } from "next/server";
import { MiddlewareProxy } from "./types";

function buildCsp(frameAncestors: "'none'" | "'self'"): string {
  return `
    form-action 'self';
    frame-ancestors ${frameAncestors};
    upgrade-insecure-requests;
`
    .replace(/\s{2,}/g, " ")
    .trim();
}

export const withCsp: MiddlewareProxy = (next) => {
  return async (request: NextRequest, event: NextFetchEvent) => {
    if (request.nextUrl.pathname.startsWith("/_next"))
      return next(request, event);

    const allowSameOriginFrame =
      request.nextUrl.pathname.startsWith("/install/preview");
    const contentSecurityPolicyHeaderValue = buildCsp(
      allowSameOriginFrame ? "'self'" : "'none'",
    );

    const result = await next(request, event);
    result.headers.set(
      "Content-Security-Policy",
      contentSecurityPolicyHeaderValue,
    );

    if (
      !result.headers.has("Cache-Control") &&
      request.nextUrl.pathname.startsWith("/api")
    ) {
      result.headers.set("Cache-Control", "private, no-store");
    }

    return result;
  };
};
