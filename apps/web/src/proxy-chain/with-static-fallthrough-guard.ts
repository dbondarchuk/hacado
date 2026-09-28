import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { MiddlewareProxy } from "./types";

/**
 * Missing `/_next/static` files (source maps, stale chunk hashes) fall through
 * to the CMS catch-all. Reject the noisy ones here before any RSC work.
 */
const FALLTHROUGH_STATIC = /^\/_next\/.+\.(?:map|txt)$/i;

export const withStaticFallthroughGuard: MiddlewareProxy = (next) => {
  return async (request: NextRequest, event: NextFetchEvent) => {
    const { pathname } = request.nextUrl;

    if (FALLTHROUGH_STATIC.test(pathname)) {
      return new NextResponse(null, { status: 404 });
    }

    return next(request, event);
  };
};
