import { NextFetchEvent, NextRequest } from "next/server";
import { MiddlewareProxy } from "./types";

export const withCsp: MiddlewareProxy = (next) => {
  return async (request: NextRequest, event: NextFetchEvent) => {
    if (request.nextUrl.pathname.startsWith("/_next"))
      return next(request, event);

    const cspHeader = `
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
`;

    // Replace newline characters and spaces
    const contentSecurityPolicyHeaderValue = cspHeader
      .replace(/\s{2,}/g, " ")
      .trim();

    const requestHeaders = new Headers(request.headers);

    requestHeaders.set(
      "Content-Security-Policy",
      contentSecurityPolicyHeaderValue,
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
