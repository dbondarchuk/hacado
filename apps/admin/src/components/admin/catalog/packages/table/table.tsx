import { getServicesContainer } from "@/app/utils";
import {
  packagesSearchParams,
  packagesSearchParamsCache,
} from "@hacado/api-sdk";
import { DataTable } from "@hacado/ui-admin";
import { columns } from "./columns";

export const PackagesTable: React.FC = async () => {
  const page = packagesSearchParamsCache.get("page");
  const search = packagesSearchParamsCache.get("search") || undefined;
  const limit = packagesSearchParamsCache.get("limit");
  const status = packagesSearchParamsCache.get("status");
  const sort = packagesSearchParamsCache.get("sort");
  const offset = (page - 1) * limit;

  const servicesContainer = await getServicesContainer();
  const res = await servicesContainer.packagesService.getPackages({
    status,
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
      sortSchemaDefault={packagesSearchParams.sort.defaultValue}
    />
  );
};
