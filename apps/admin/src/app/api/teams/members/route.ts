import { teamsSearchParamsLoader } from "@timelish/api-sdk";
import { NextRequest, NextResponse } from "next/server";
import { getTeamServices } from "../_utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const servicesContainer = await getTeamServices();
  const searchParams = await teamsSearchParamsLoader(request);

  const page = searchParams.page;
  const search = searchParams.search ?? undefined;
  const limit = searchParams.limit;
  const sort = searchParams.sort;
  const offset = (page - 1) * limit;
  const priorityIds = searchParams.priorityId ?? undefined;
  const status = searchParams.status ?? undefined;
  const role = searchParams.role ?? undefined;
  const start = searchParams.start ?? undefined;
  const end = searchParams.end ?? undefined;

  const res = await servicesContainer.teamService.listMembers({
    offset,
    limit,
    search,
    sort,
    priorityIds,
    status,
    role: role ?? undefined,
    start,
    end,
  });

  return NextResponse.json(res);
}
