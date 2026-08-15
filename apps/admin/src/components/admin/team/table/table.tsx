import { getServicesContainer } from "@/app/utils";
import { teamsSearchParams, teamsSearchParamsCache } from "@hacado/api-sdk";
import type { MemberStatus, UserRole } from "@hacado/types";
import { DataTable } from "@hacado/ui-admin";
import { columns } from "./columns";

export const TeamMembersTable: React.FC = async () => {
  const page = teamsSearchParamsCache.get("page");
  const search = teamsSearchParamsCache.get("search") || undefined;
  const limit = teamsSearchParamsCache.get("limit");
  const status = teamsSearchParamsCache.get("status") as MemberStatus[];
  const role = teamsSearchParamsCache.get("role") as UserRole[] | null;
  const start = teamsSearchParamsCache.get("start") || undefined;
  const end = teamsSearchParamsCache.get("end") || undefined;
  const sort = teamsSearchParamsCache.get("sort");

  const services = await getServicesContainer();
  const { items, total } = await services.teamService.listMembers({
    offset: (page - 1) * limit,
    limit,
    search,
    sort,
    status,
    role: role ?? undefined,
    start,
    end,
  });

  return (
    <DataTable
      columns={columns}
      data={items}
      totalItems={total}
      sortSchemaDefault={teamsSearchParams.sort.defaultValue}
    />
  );
};
