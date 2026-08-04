import { getServicesContainer, getUser } from "@/app/utils";
import {
  communicationLogsSearchParams,
  communicationLogsSearchParamsCache,
} from "@timelish/api-sdk";
import {
  canFilterCommunicationByMember,
  gateMemberIds,
} from "@timelish/utils";
import { DataTable } from "@timelish/ui-admin";
import { columns } from "./columns";

export const CommunicationLogsTable: React.FC<{
  customerId?: string;
}> = async ({ customerId }) => {
  const page = communicationLogsSearchParamsCache.get("page");
  const search = communicationLogsSearchParamsCache.get("search") || undefined;
  const limit = communicationLogsSearchParamsCache.get("limit");
  const direction = communicationLogsSearchParamsCache.get("direction");
  const participantType =
    communicationLogsSearchParamsCache.get("participantType");
  const channel = communicationLogsSearchParamsCache.get("channel");
  const start = communicationLogsSearchParamsCache.get("start") || undefined;
  const end = communicationLogsSearchParamsCache.get("end") || undefined;
  const sort = communicationLogsSearchParamsCache.get("sort");
  const customerIds =
    communicationLogsSearchParamsCache.get("customer") || undefined;
  const user = await getUser();
  const memberIds = gateMemberIds(
    user,
    communicationLogsSearchParamsCache.get("member") ?? undefined,
    { canFilter: canFilterCommunicationByMember },
  );

  const offset = (page - 1) * limit;

  const servicesContainer = await getServicesContainer();
  const res =
    await servicesContainer.communicationLogsService.getCommunicationLogs({
      range: { start, end },
      channel,
      direction,
      participantType,
      offset,
      limit,
      search,
      sort,
      customerId: customerId ?? customerIds,
      memberId: memberIds ?? undefined,
    });

  return (
    <DataTable
      columns={columns}
      data={res.items}
      totalItems={res.total}
      sortSchemaDefault={communicationLogsSearchParams.sort.defaultValue}
    />
  );
};
