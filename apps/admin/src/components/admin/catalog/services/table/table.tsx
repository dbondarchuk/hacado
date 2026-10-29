import { getServicesContainer } from "@/app/utils";
import {
  servicesSearchParams,
  servicesSearchParamsCache,
} from "@hacado/api-sdk";
import { DataTable } from "@hacado/ui-admin";
import { columns } from "./columns";

export const ServicesTable: React.FC = async () => {
  const page = servicesSearchParamsCache.get("page");
  const search = servicesSearchParamsCache.get("search") || undefined;
  const limit = servicesSearchParamsCache.get("limit");
  const sort = servicesSearchParamsCache.get("sort");

  const offset = (page - 1) * limit;

  const servicesContainer = await getServicesContainer();
  const res = await servicesContainer.catalogService.getServices({
    offset,
    limit,
    search,
    sort,
  });

  return (
    <DataTable
      columns={columns}
      data={res.items}
      totalItems={res.total}
      sortSchemaDefault={servicesSearchParams.sort.defaultValue}
    />
  );
};
