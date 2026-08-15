import { getServicesContainer } from "@/app/utils";
import {
  serviceAddonsSearchParams,
  serviceAddonsSearchParamsCache,
} from "@hacado/api-sdk";
import { DataTable } from "@hacado/ui-admin";
import { columns } from "./columns";

export const AddonsTable: React.FC = async () => {
  const page = serviceAddonsSearchParamsCache.get("page");
  const search = serviceAddonsSearchParamsCache.get("search") || undefined;
  const limit = serviceAddonsSearchParamsCache.get("limit");
  const sort = serviceAddonsSearchParamsCache.get("sort");

  const offset = (page - 1) * limit;

  const servicesContainer = await getServicesContainer();
  const res = await servicesContainer.servicesService.getAddons(
    {
      offset,
      limit,
      search,
      sort,
    },
    true,
  );

  return (
    <DataTable
      columns={columns}
      data={res.items}
      totalItems={res.total}
      sortSchemaDefault={serviceAddonsSearchParams.sort.defaultValue}
    />
  );
};
