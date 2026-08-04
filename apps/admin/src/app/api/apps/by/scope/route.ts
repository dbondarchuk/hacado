import { getServicesContainer, getUser } from "@/app/utils";
import { getOwnerMemberIds } from "@/lib/auth/app-access";
import { withCatalogTarget } from "@timelish/app-store/utils";
import { getLoggerFactory } from "@timelish/logger";
import { AppScope, getAppScopeUsage } from "@timelish/types";
import {
  canViewCompanyApps,
  filterConnectedAppsForUser,
} from "@timelish/utils";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const fetchCache = "force-cache";
export const revalidate = 3;

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/apps/by/scope")("GET");
  const servicesContainer = await getServicesContainer();
  logger.debug(
    {
      url: request.url,
      method: request.method,
      searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
    },
    "Processing apps by scope API request",
  );

  const scopeParams = request.nextUrl.searchParams.getAll("scope");

  if (scopeParams.length === 0) {
    logger.warn({ scopeParams }, "Missing required scope parameters");
    return NextResponse.json(
      {
        success: false,
        error: "At least one scope is required",
        code: "missing_scope_parameter",
      },
      { status: 400 },
    );
  }

  const scopes = scopeParams as AppScope[];
  const usages = new Set(
    scopes.map((scope) => getAppScopeUsage(scope)).filter(Boolean),
  );
  const hasCompanyUsage = usages.has("company");
  const hasMemberUsage = usages.has("member");

  if (hasCompanyUsage && hasMemberUsage) {
    logger.warn({ scopes }, "Mixed company/member scope usage in one request");
    return NextResponse.json(
      {
        success: false,
        error: "Cannot mix company and member usage scopes in one request",
        code: "mixed_scope_usage",
      },
      { status: 400 },
    );
  }

  logger.debug({ scope: scopes, usages: [...usages] }, "Getting apps by scope");

  try {
    const user = await getUser();
    const installed =
      await servicesContainer.connectedAppsService.getAppsByScope(...scopes);

    if (hasCompanyUsage) {
      if (!canViewCompanyApps(user)) {
        logger.warn(
          { userId: user.id, scopes },
          "Forbidden: company apps permission required",
        );
        return NextResponse.json(
          {
            success: false,
            error: "Forbidden",
            code: "forbidden",
          },
          { status: 403 },
        );
      }

      logger.debug(
        { scope: scopes, count: installed.length },
        "Company-usage apps by scope (org-wide)",
      );
      return NextResponse.json(installed);
    }

    if (hasMemberUsage) {
      const own = installed.filter((app) => app.memberId === user.memberId);
      logger.debug(
        { scope: scopes, count: own.length },
        "Member-usage apps by scope (own installs)",
      );
      return NextResponse.json(own);
    }

    const ownerMemberIds = await getOwnerMemberIds();
    const apps = filterConnectedAppsForUser(
      user,
      installed.map(withCatalogTarget),
      ownerMemberIds,
    );

    logger.debug(
      { scope: scopes, count: apps.length },
      "Neutral-usage apps by scope",
    );

    return NextResponse.json(apps);
  } catch (error: any) {
    logger.error(
      {
        scope: scopes,
        error: error?.message || error?.toString(),
      },
      "Failed to get apps by scope",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to get apps by scope",
        code: "get_apps_by_scope_failed",
      },
      { status: 500 },
    );
  }
}
