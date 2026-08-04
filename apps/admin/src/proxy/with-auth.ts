import { auth } from "@/app/auth";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { MiddlewareProxy } from "./types";
import {
  containsAdminApi,
  containsAdminAuthApi,
  containsAdminDashboard,
} from "./utils";

export const withAuth: MiddlewareProxy = (next) => {
  return async (request: NextRequest, event: NextFetchEvent) => {
    const { nextUrl } = request;
    const session = await auth.api.getSession({
      headers: request.headers,
      query: { disableCookieCache: true },
    });

    if (!session && !containsAdminAuthApi(nextUrl.pathname)) {
      if (containsAdminDashboard(nextUrl.pathname)) {
        const url = `/?callbackUrl=${encodeURIComponent(nextUrl.pathname)}`;
        return NextResponse.redirect(new URL(url, request.url));
      }

      if (containsAdminApi(nextUrl.pathname)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    request.headers.set(
      "x-organization-id",
      session?.user.organizationId || "",
    );

    const organizationSlug = session?.user.organizationSlug || "";

    request.headers.set("x-organization-slug", organizationSlug || "");

    request.headers.set(
      "x-organization-domain",
      (session?.user as { organizationDomain?: string } | undefined)
        ?.organizationDomain || organizationSlug
        ? `${organizationSlug}.${process.env.PUBLIC_DOMAIN}`
        : "",
    );

    request.headers.set("x-user-id", session?.user?.id || "");

    const sessionUser = session?.user as
      | {
          memberId?: string;
          memberStatus?: string;
          memberRole?: string;
          role?: string;
          subscriptionStatus?: string;
          subscriptionPlanTier?: string | null;
          feesExempt?: boolean;
        }
      | undefined;

    if (sessionUser?.memberStatus === "inactive") {
      if (containsAdminDashboard(nextUrl.pathname)) {
        await auth.api.signOut({ headers: request.headers });
        return NextResponse.redirect(new URL("/", request.url));
      }
      if (containsAdminApi(nextUrl.pathname)) {
        return NextResponse.json(
          { error: "Member inactive", code: "member_inactive" },
          { status: 403 },
        );
      }
    }

    request.headers.set("x-member-id", sessionUser?.memberId || "");
    request.headers.set(
      "x-member-role",
      sessionUser?.memberRole || sessionUser?.role || "",
    );

    if (sessionUser) {
      request.headers.set(
        "x-subscription-status",
        sessionUser.subscriptionStatus || "active",
      );
      if (sessionUser.feesExempt) {
        request.headers.set("x-subscription-plan-tier", "studio");
      } else if (sessionUser.subscriptionPlanTier) {
        request.headers.set(
          "x-subscription-plan-tier",
          sessionUser.subscriptionPlanTier,
        );
      }
    }

    return next(request, event);
  };
};
