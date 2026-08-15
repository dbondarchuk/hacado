import { NextFetchEvent, NextRequest } from "next/server";
import { MiddlewareProxy } from "./types";

// This middleware is used to set the Origin header for Polar webhooks
// to allow the webhooks to be received by the server, as Better Auth has CSRF protection enabled.
export const withPolarWebhooks: MiddlewareProxy = (next) => {
  return async (request: NextRequest, event: NextFetchEvent) => {
    const { nextUrl } = request;
    if (nextUrl.pathname.startsWith("/api/auth/polar/webhooks")) {
      request.headers.set("Origin", "https://polar.sh");
    }

    return next(request, event);
  };
};
