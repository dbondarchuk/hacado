import { getServicesContainer, getSession } from "@/app/utils";
import { getSessionPlanTier } from "@/lib/billing/subscription-plan-access";
import { searchCoreRecords } from "@/lib/command-search/core";
import {
  isAppSearchScope,
  isCoreSearchScope,
  isRemoteSearchScope,
  parseSearchScope,
} from "@/lib/command-search/scope";
import { getLoggerFactory } from "@hacado/logger";
import { CommandSearchGroup, ICommandSearchProvider } from "@hacado/types/apps";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MIN_QUERY_LENGTH = 2;

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/search")("GET");
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ groups: [] });
  }

  const typeParam = request.nextUrl.searchParams.get("type")?.trim() ?? "";
  const scope = typeParam ? parseSearchScope(typeParam) : undefined;
  if (typeParam && (!scope || !isRemoteSearchScope(scope))) {
    return NextResponse.json({ groups: [] });
  }

  const services = await getServicesContainer();
  const user = session.user;
  const searchCore = !scope || isCoreSearchScope(scope);
  const searchApps = !scope || isAppSearchScope(scope);

  const [core, appResults] = await Promise.all([
    searchCore
      ? searchCoreRecords({
          query,
          user,
          services,
          planTier: getSessionPlanTier(session),
          scope,
        }).catch((error) => {
          logger.warn({ error }, "Core command search failed");
          return [] as CommandSearchGroup[];
        })
      : Promise.resolve([] as CommandSearchGroup[]),
    searchApps
      ? services.connectedAppsService.invokeAppsByScope<
          ICommandSearchProvider,
          CommandSearchGroup[]
        >(
          "command-search-provider",
          async (appData, service) => {
            if (typeof service.searchCommand !== "function") return [];

            return service.searchCommand(appData, {
              query,
              limit: 5,
              user,
              type: scope,
            });
          },
          { ignoreErrors: true },
        )
      : Promise.resolve([]),
  ]);

  const groups = [
    ...core,
    ...appResults.flatMap((result) => result ?? []),
  ].filter((group) => group.items.length > 0);

  return NextResponse.json({ groups });
}
