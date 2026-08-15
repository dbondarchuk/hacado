import { NextFetchEvent, NextRequest } from "next/server";
import { MiddlewareProxy } from "./types";

export const withLocale: MiddlewareProxy = (next) => {
  return async (request: NextRequest, event: NextFetchEvent) => {
    if (request.nextUrl.pathname.startsWith("/_next"))
      return next(request, event);

    const { nextUrl } = request;
    const locale = nextUrl.searchParams.get("lng");
    if (locale) {
      request.headers.set("x-locale", locale);
    }

    request.headers.set("x-pathname", nextUrl.pathname);

    return next(request, event);
  };
};
